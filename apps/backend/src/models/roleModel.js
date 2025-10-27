import pool from '../config/db.js';

/**
 * User Organization Roles Model
 * Manages user roles within organizations (multi-tenant role system)
 */

/**
 * Role Hierarchy (from highest to lowest)
 * - super_admin: System-wide admin (can access all organizations)
 * - org_owner: Created the organization (full control)
 * - org_admin: Organization administrator (full control within org)
 * - manager: Team manager (can manage users and resources)
 * - user: Regular user (standard access)
 * - viewer: Read-only access
 */

/**
 * Assign role to user in an organization
 */
export const assignRoleToUser = async (
  userId,
  orgId,
  role,
  assignedBy = null
) => {
  const result = await pool.query(
    `INSERT INTO user_organization_roles (user_id, org_id, role, assigned_by, is_active)
     VALUES ($1, $2, $3, $4, TRUE)
     ON CONFLICT (user_id, org_id) 
     DO UPDATE SET 
       role = EXCLUDED.role,
       assigned_by = EXCLUDED.assigned_by,
       is_active = TRUE,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, orgId, role, assignedBy]
  );
  return result.rows[0];
};

/**
 * Get user's role in a specific organization
 */
export const getUserRoleInOrg = async (userId, orgId) => {
  const result = await pool.query(
    `SELECT uor.*, u.system_role
     FROM user_organization_roles uor
     JOIN users u ON u.id = uor.user_id
     WHERE uor.user_id = $1 AND uor.org_id = $2 AND uor.is_active = TRUE`,
    [userId, orgId]
  );
  return result.rows[0];
};

/**
 * Alias for getUserRoleInOrg (for consistency)
 */
export const getUserRoleInOrganization = getUserRoleInOrg;

/**
 * Get all organizations where user has access
 */
export const getUserOrganizations = async userId => {
  const result = await pool.query(
    `SELECT 
       uor.org_id,
       uor.role,
       o.org_name,
       o.email,
       o.phone,
       o.address,
       o.is_active as org_active,
       uor.is_active as role_active,
       uor.assigned_at
     FROM user_organization_roles uor
     JOIN organizations o ON o.org_id = uor.org_id
     WHERE uor.user_id = $1 AND uor.is_active = TRUE
     ORDER BY uor.assigned_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Get all users in an organization with their roles
 */
export const getOrganizationUsers = async orgId => {
  const result = await pool.query(
    `SELECT 
       u.id as user_id,
       u.email,
       u.system_role,
       uor.role as org_role,
       uor.is_active,
       uor.assigned_at,
       uor.assigned_by,
       assigner.email as assigned_by_email
     FROM user_organization_roles uor
     JOIN users u ON u.id = uor.user_id
     LEFT JOIN users assigner ON assigner.id = uor.assigned_by
     WHERE uor.org_id = $1
     ORDER BY 
       CASE uor.role
         WHEN 'org_owner' THEN 1
         WHEN 'org_admin' THEN 2
         WHEN 'manager' THEN 3
         WHEN 'user' THEN 4
         WHEN 'viewer' THEN 5
       END,
       u.email`,
    [orgId]
  );
  return result.rows;
};

/**
 * Check if user has specific role or higher in organization
 */
export const userHasRole = async (userId, orgId, requiredRole) => {
  const result = await pool.query(
    'SELECT user_has_permission($1, $2, $3) as has_permission',
    [userId, orgId, requiredRole]
  );
  return result.rows[0]?.has_permission || false;
};

/**
 * REMOVED: Super admin concept eliminated for security
 * All users are bound to organizations with specific roles
 */
export const isSuperAdmin = _userId => {
  return false; // No more super admins - full tenant isolation
};

/**
 * Remove user's role from organization (soft delete)
 */
export const removeUserFromOrg = async (userId, orgId) => {
  const result = await pool.query(
    `UPDATE user_organization_roles 
     SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND org_id = $2
     RETURNING *`,
    [userId, orgId]
  );
  return result.rows[0];
};

/**
 * Hard delete user's role from organization
 */
export const deleteUserFromOrg = async (userId, orgId) => {
  const result = await pool.query(
    'DELETE FROM user_organization_roles WHERE user_id = $1 AND org_id = $2 RETURNING *',
    [userId, orgId]
  );
  return result.rows[0];
};

/**
 * Update user's role in organization
 */
export const updateUserRole = async (
  userId,
  orgId,
  newRole,
  updatedBy = null
) => {
  const result = await pool.query(
    `UPDATE user_organization_roles 
     SET role = $3, assigned_by = $4, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND org_id = $2 AND is_active = TRUE
     RETURNING *`,
    [userId, orgId, newRole, updatedBy]
  );
  return result.rows[0];
};

/**
 * Get user's permissions in organization
 */
export const getUserPermissions = async (userId, orgId) => {
  const result = await pool.query(
    `SELECT 
       uor.role,
       uor.permissions,
       u.system_role,
       CASE 
         WHEN u.system_role = 'super_admin' THEN 100
         WHEN uor.role = 'org_owner' THEN 80
         WHEN uor.role = 'org_admin' THEN 60
         WHEN uor.role = 'manager' THEN 40
         WHEN uor.role = 'user' THEN 20
         WHEN uor.role = 'viewer' THEN 10
         ELSE 0
       END as permission_level
     FROM user_organization_roles uor
     JOIN users u ON u.id = uor.user_id
     WHERE uor.user_id = $1 AND uor.org_id = $2 AND uor.is_active = TRUE`,
    [userId, orgId]
  );
  return result.rows[0];
};

/**
 * Bulk assign roles to multiple users
 */
export const bulkAssignRoles = async assignments => {
  // assignments: [{ userId, orgId, role, assignedBy }]
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const results = [];
    for (const assignment of assignments) {
      const result = await client.query(
        `INSERT INTO user_organization_roles (user_id, org_id, role, assigned_by, is_active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (user_id, org_id) 
         DO UPDATE SET 
           role = EXCLUDED.role,
           assigned_by = EXCLUDED.assigned_by,
           is_active = TRUE,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          assignment.userId,
          assignment.orgId,
          assignment.role,
          assignment.assignedBy,
        ]
      );
      results.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Check if user owns the organization
 */
export const isOrganizationOwner = async (userId, orgId) => {
  const result = await pool.query(
    `SELECT role FROM user_organization_roles 
     WHERE user_id = $1 AND org_id = $2 AND role = 'org_owner' AND is_active = TRUE`,
    [userId, orgId]
  );
  return result.rows.length > 0;
};

/**
 * Get organization owner
 */
export const getOrganizationOwner = async orgId => {
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, uor.assigned_at
     FROM user_organization_roles uor
     JOIN users u ON u.id = uor.user_id
     WHERE uor.org_id = $1 AND uor.role = 'org_owner' AND uor.is_active = TRUE
     LIMIT 1`,
    [orgId]
  );
  return result.rows[0];
};

/**
 * Transfer organization ownership
 */
export const transferOwnership = async (
  orgId,
  fromUserId,
  toUserId,
  transferredBy = null
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Demote current owner to org_admin
    await client.query(
      `UPDATE user_organization_roles 
       SET role = 'org_admin', updated_at = CURRENT_TIMESTAMP
       WHERE org_id = $1 AND user_id = $2 AND role = 'org_owner'`,
      [orgId, fromUserId]
    );

    // Promote new owner
    await client.query(
      `UPDATE user_organization_roles 
       SET role = 'org_owner', assigned_by = $3, updated_at = CURRENT_TIMESTAMP
       WHERE org_id = $1 AND user_id = $2`,
      [orgId, toUserId, transferredBy]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  assignRoleToUser,
  getUserRoleInOrg,
  getUserRoleInOrganization,
  getUserOrganizations,
  getOrganizationUsers,
  userHasRole,
  isSuperAdmin,
  removeUserFromOrg,
  deleteUserFromOrg,
  updateUserRole,
  getUserPermissions,
  bulkAssignRoles,
  isOrganizationOwner,
  getOrganizationOwner,
  transferOwnership,
};

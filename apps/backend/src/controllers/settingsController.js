import pool from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Settings Controller - Professional ERP/CRM Settings Management
 * Handles both user profile settings and organization settings
 * Enterprise-grade security with tenant isolation
 */

/**
 * GET /api/v1/settings/profile
 * Get current user's profile settings
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        id,
        email,
        name,
        is_active,
        created_at,
        updated_at
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message,
    });
  }
};

/**
 * PUT /api/v1/settings/profile
 * Update current user's profile settings
 */
export const updateUserProfile = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    await client.query('BEGIN');

    // Validate input
    if (!name || name.trim().length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    // If email is being changed, check for uniqueness
    if (email) {
      const emailNormalized = email.toLowerCase().trim();
      const emailCheck = await client.query(
        'SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2',
        [emailNormalized, userId]
      );

      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account',
        });
      }

      // Update with email
      const result = await client.query(
        `UPDATE users 
        SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, email, name, is_active, created_at, updated_at`,
        [name.trim(), emailNormalized, userId]
      );

      await logAudit({
        userId,
        userEmail: emailNormalized,
        action: 'UPDATE',
        resourceType: 'user_profile',
        resourceId: userId,
        newValue: { name, email: emailNormalized },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestPath: req.path,
        requestMethod: req.method,
      });

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result.rows[0],
      });
    } else {
      // Update name only
      const result = await client.query(
        `UPDATE users 
        SET name = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, name, is_active, created_at, updated_at`,
        [name.trim(), userId]
      );

      await logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'user_profile',
        entityId: userId,
        changes: { name },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result.rows[0],
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/v1/settings/password
 * Update user password (requires current password)
 */
export const updatePassword = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    await client.query('BEGIN');

    // Verify current password
    const userResult = await client.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const argon2 = (await import('argon2')).default;
    const isValid = await argon2.verify(
      userResult.rows[0].password_hash,
      currentPassword
    );

    if (!isValid) {
      await client.query('ROLLBACK');
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const newPasswordHash = await argon2.hash(newPassword);

    // Update password
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Revoke all refresh tokens (force re-login on all devices for security)
    await client.query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
      [userId]
    );

    await logAudit({
      userId,
      action: 'UPDATE',
      resourceType: 'user_password',
      resourceId: userId,
      metadata: { password_changed: true, tokens_revoked: true },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestPath: req.path,
      requestMethod: req.method,
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      message:
        'Password updated successfully. Please log in again on all devices.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * GET /api/v1/settings/organization/:orgId
 * Get organization settings (org_owner or org_admin only)
 */
export const getOrganizationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const orgId = Number.parseInt(req.params.orgId);

    // Check if user has admin access to this organization
    const roleCheck = await pool.query(
      `SELECT role FROM user_organization_roles 
       WHERE user_id = $1 AND org_id = $2 AND is_active = TRUE`,
      [userId, orgId]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization',
      });
    }

    const userRole = roleCheck.rows[0].role;
    const roleHierarchy = {
      org_owner: 80,
      org_admin: 60,
      manager: 40,
      user: 20,
      viewer: 10,
    };

    // Manager and above can view settings
    if (roleHierarchy[userRole] < roleHierarchy.manager) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view organization settings',
      });
    }

    // Fetch organization settings
    const result = await pool.query(
      `SELECT 
        org_id,
        org_name,
        industry,
        phone,
        email,
        address,
        city,
        country,
        tax_number,
        is_active,
        created_at,
        updated_at
      FROM organizations 
      WHERE org_id = $1`,
      [orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        userRole,
      },
    });
  } catch (error) {
    console.error('❌ Get organization settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization settings',
      error: error.message,
    });
  }
};

/**
 * PUT /api/v1/settings/organization/:orgId
 * Update organization settings (org_owner or org_admin only)
 */
export const updateOrganizationSettings = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const orgId = Number.parseInt(req.params.orgId);
    const {
      org_name,
      industry,
      phone,
      email,
      address,
      city,
      country,
      tax_number,
    } = req.body;

    await client.query('BEGIN');

    // Check if user has admin access to this organization
    const roleCheck = await client.query(
      `SELECT role FROM user_organization_roles 
       WHERE user_id = $1 AND org_id = $2 AND is_active = TRUE`,
      [userId, orgId]
    );

    if (roleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization',
      });
    }

    const userRole = roleCheck.rows[0].role;
    const roleHierarchy = {
      org_owner: 80,
      org_admin: 60,
      manager: 40,
      user: 20,
      viewer: 10,
    };

    // Only org_owner and org_admin can update settings
    if (roleHierarchy[userRole] < roleHierarchy.org_admin) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Only organization owners and admins can update settings',
      });
    }

    // Validate org_name
    if (!org_name || org_name.trim().length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Organization name is required',
      });
    }

    // Update organization
    const result = await client.query(
      `UPDATE organizations 
      SET 
        org_name = $1,
        industry = $2,
        phone = $3,
        email = $4,
        address = $5,
        city = $6,
        country = $7,
        tax_number = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE org_id = $9
      RETURNING 
        org_id,
        org_name,
        industry,
        phone,
        email,
        address,
        city,
        country,
        tax_number,
        is_active,
        created_at,
        updated_at`,
      [
        org_name.trim(),
        industry || null,
        phone || null,
        email || null,
        address || null,
        city || null,
        country || 'Turkey',
        tax_number || null,
        orgId,
      ]
    );

    await logAudit({
      orgId,
      userId,
      action: 'UPDATE',
      resourceType: 'organization_settings',
      resourceId: orgId,
      newValue: {
        org_name,
        industry,
        phone,
        email,
        address,
        city,
        country,
        tax_number,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestPath: req.path,
      requestMethod: req.method,
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Organization settings updated successfully',
      data: {
        ...result.rows[0],
        userRole,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Update organization settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization settings',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * GET /api/v1/settings/organization/:orgId/users
 * Get organization team members (manager+ only)
 */
export const getOrganizationTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const orgId = Number.parseInt(req.params.orgId);

    // Check user's role in organization
    const roleCheck = await pool.query(
      `SELECT role FROM user_organization_roles 
       WHERE user_id = $1 AND org_id = $2 AND is_active = TRUE`,
      [userId, orgId]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization',
      });
    }

    const userRole = roleCheck.rows[0].role;
    const roleHierarchy = {
      org_owner: 80,
      org_admin: 60,
      manager: 40,
      user: 20,
      viewer: 10,
    };

    // Only manager+ can view team
    if (roleHierarchy[userRole] < roleHierarchy.manager) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view team members',
      });
    }

    // Fetch team members
    const result = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.is_active,
        uor.role,
        uor.is_active as role_active,
        uor.assigned_at,
        assigner.name as assigned_by_name
      FROM users u
      INNER JOIN user_organization_roles uor ON u.id = uor.user_id
      LEFT JOIN users assigner ON uor.assigned_by = assigner.id
      WHERE uor.org_id = $1
      ORDER BY 
        CASE uor.role
          WHEN 'org_owner' THEN 1
          WHEN 'org_admin' THEN 2
          WHEN 'manager' THEN 3
          WHEN 'user' THEN 4
          WHEN 'viewer' THEN 5
        END,
        u.name`,
      [orgId]
    );

    res.json({
      success: true,
      data: {
        team: result.rows,
        userRole,
      },
    });
  } catch (error) {
    console.error('❌ Get organization team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members',
      error: error.message,
    });
  }
};

/**
 * PUT /api/v1/settings/organization/:orgId/users/:userId/role
 * Update user role in organization (org_owner and org_admin only)
 */
export const updateUserRole = async (req, res) => {
  const client = await pool.connect();

  try {
    const currentUserId = req.user.id;
    const orgId = Number.parseInt(req.params.orgId);
    const targetUserId = Number.parseInt(req.params.userId);
    const { role } = req.body;

    // Validate role
    const validRoles = ['org_owner', 'org_admin', 'manager', 'user', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    await client.query('BEGIN');

    // Check current user's role
    const currentUserRole = await client.query(
      `SELECT role FROM user_organization_roles 
       WHERE user_id = $1 AND org_id = $2 AND is_active = TRUE`,
      [currentUserId, orgId]
    );

    if (currentUserRole.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization',
      });
    }

    const roleHierarchy = {
      org_owner: 80,
      org_admin: 60,
      manager: 40,
      user: 20,
      viewer: 10,
    };

    const currentRole = currentUserRole.rows[0].role;

    // Only org_admin and org_owner can change roles
    if (roleHierarchy[currentRole] < roleHierarchy.org_admin) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Only organization owners and admins can change user roles',
      });
    }

    // Check target user exists in organization
    const targetUser = await client.query(
      `SELECT role FROM user_organization_roles 
       WHERE user_id = $1 AND org_id = $2 AND is_active = TRUE`,
      [targetUserId, orgId]
    );

    if (targetUser.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'User not found in this organization',
      });
    }

    const oldRole = targetUser.rows[0].role;

    // Prevent users from changing their own role
    if (currentUserId === targetUserId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    // org_admin cannot change org_owner role or assign org_owner
    if (currentRole === 'org_admin') {
      if (oldRole === 'org_owner' || role === 'org_owner') {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'Only organization owners can manage owner roles',
        });
      }
    }

    // Update role
    await client.query(
      `UPDATE user_organization_roles 
       SET role = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND org_id = $3`,
      [role, targetUserId, orgId]
    );

    await logAudit({
      userId: currentUserId,
      orgId,
      action: 'UPDATE',
      resourceType: 'user_role',
      resourceId: targetUserId,
      oldValue: { role: oldRole },
      newValue: { role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestPath: req.path,
      requestMethod: req.method,
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'User role updated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/v1/settings/organization/:orgId/users/:userId/status
 * Activate/deactivate user in organization (org_owner and org_admin only)
 */
export const updateUserStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const currentUserId = req.user.id;
    const orgId = Number.parseInt(req.params.orgId);
    const targetUserId = Number.parseInt(req.params.userId);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean',
      });
    }

    await client.query('BEGIN');

    // Check current user's role
    const currentUserRole = await client.query(
      `SELECT role FROM user_organization_roles 
       WHERE user_id = $1 AND org_id = $2 AND is_active = TRUE`,
      [currentUserId, orgId]
    );

    if (currentUserRole.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization',
      });
    }

    const roleHierarchy = {
      org_owner: 80,
      org_admin: 60,
      manager: 40,
      user: 20,
      viewer: 10,
    };

    const currentRole = currentUserRole.rows[0].role;

    // Only org_admin and org_owner can change user status
    if (roleHierarchy[currentRole] < roleHierarchy.org_admin) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Only organization owners and admins can change user status',
      });
    }

    // Prevent users from deactivating themselves
    if (currentUserId === targetUserId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own status',
      });
    }

    // Check target user exists
    const targetUser = await client.query(
      `SELECT role, is_active FROM user_organization_roles 
       WHERE user_id = $1 AND org_id = $2`,
      [targetUserId, orgId]
    );

    if (targetUser.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'User not found in this organization',
      });
    }

    const targetRole = targetUser.rows[0].role;
    const oldStatus = targetUser.rows[0].is_active;

    // org_admin cannot deactivate org_owner
    if (currentRole === 'org_admin' && targetRole === 'org_owner') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Only organization owners can manage owner accounts',
      });
    }

    // Update status
    await client.query(
      `UPDATE user_organization_roles 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND org_id = $3`,
      [is_active, targetUserId, orgId]
    );

    await logAudit({
      userId: currentUserId,
      orgId,
      action: 'UPDATE',
      resourceType: 'user_status',
      resourceId: targetUserId,
      oldValue: { is_active: oldStatus },
      newValue: { is_active },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestPath: req.path,
      requestMethod: req.method,
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/v1/settings/organization/:orgId/users/:userId
 * Remove user from organization (org_owner and org_admin only)
 */
export const removeUserFromOrganization = async (req, res) => {
  const client = await pool.connect();

  try {
    const currentUserId = req.user.id;
    const orgId = Number.parseInt(req.params.orgId);
    const targetUserId = Number.parseInt(req.params.userId);

    await client.query('BEGIN');

    // Check current user's role
    const currentUserRole = await client.query(
      `SELECT role FROM user_organization_roles 
       WHERE user_id = $1 AND org_id = $2 AND is_active = TRUE`,
      [currentUserId, orgId]
    );

    if (currentUserRole.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization',
      });
    }

    const roleHierarchy = {
      org_owner: 80,
      org_admin: 60,
      manager: 40,
      user: 20,
      viewer: 10,
    };

    const currentRole = currentUserRole.rows[0].role;

    // Only org_admin and org_owner can remove users
    if (roleHierarchy[currentRole] < roleHierarchy.org_admin) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Only organization owners and admins can remove users',
      });
    }

    // Prevent users from removing themselves
    if (currentUserId === targetUserId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You cannot remove yourself from the organization',
      });
    }

    // Check target user exists
    const targetUser = await client.query(
      `SELECT role FROM user_organization_roles 
       WHERE user_id = $1 AND org_id = $2`,
      [targetUserId, orgId]
    );

    if (targetUser.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'User not found in this organization',
      });
    }

    const targetRole = targetUser.rows[0].role;

    // org_admin cannot remove org_owner
    if (currentRole === 'org_admin' && targetRole === 'org_owner') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Only organization owners can remove owner accounts',
      });
    }

    // Check if this is the last org_owner
    if (targetRole === 'org_owner') {
      const ownerCount = await client.query(
        `SELECT COUNT(*) as count FROM user_organization_roles 
         WHERE org_id = $1 AND role = 'org_owner' AND is_active = TRUE`,
        [orgId]
      );

      if (Number.parseInt(ownerCount.rows[0].count) <= 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last organization owner',
        });
      }
    }

    // Delete user from organization (CASCADE will handle related data)
    await client.query(
      `DELETE FROM user_organization_roles 
       WHERE user_id = $1 AND org_id = $2`,
      [targetUserId, orgId]
    );

    await logAudit({
      userId: currentUserId,
      orgId,
      action: 'DELETE',
      resourceType: 'organization_user',
      resourceId: targetUserId,
      metadata: { removed_role: targetRole },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestPath: req.path,
      requestMethod: req.method,
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'User removed from organization successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Remove user from organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove user from organization',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

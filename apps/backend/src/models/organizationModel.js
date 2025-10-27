import pool from '../config/db.js';

/**
 * Organization Model
 * Handles all database operations for organizations
 */

/**
 * Get all organizations (admin only, or user's organization)
 * @param {number} userId - User ID for filtering
 * @param {boolean} isAdmin - Is user admin?
 * @returns {Promise<Array>} Array of organizations
 */
export const getAllOrganizations = async (userId = null, isAdmin = false) => {
  try {
    if (isAdmin) {
      // Admin can see all organizations
      const result = await pool.query(
        'SELECT * FROM organizations ORDER BY created_at DESC'
      );
      return result.rows;
    }

    // Regular user can only see their organization
    const result = await pool.query(
      `SELECT o.* FROM organizations o
       JOIN users u ON o.org_id = u.org_id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getAllOrganizations:', error);
    throw error;
  }
};

/**
 * Get organization by ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<object|null>} Organization object or null
 */
export const getOrganizationById = async orgId => {
  try {
    const result = await pool.query(
      'SELECT * FROM organizations WHERE org_id = $1',
      [orgId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getOrganizationById:', error);
    throw error;
  }
};

/**
 * Create a new organization
 * @param {object} orgData - Organization data
 * @returns {Promise<object>} Created organization
 */
export const createOrganization = async orgData => {
  try {
    const {
      org_name,
      industry,
      phone,
      email,
      address,
      city,
      country,
      tax_number,
    } = orgData;

    const result = await pool.query(
      `INSERT INTO organizations (
        org_name, industry, phone, email, address, city, country, tax_number, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        org_name,
        industry || null,
        phone || null,
        email || null,
        address || null,
        city || null,
        country || 'Turkey',
        tax_number || null,
        true,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error in createOrganization:', error);
    throw error;
  }
};

/**
 * Update an organization
 * @param {number} orgId - Organization ID
 * @param {object} orgData - Updated organization data
 * @returns {Promise<object|null>} Updated organization or null
 */
export const updateOrganization = async (orgId, orgData) => {
  try {
    const {
      org_name,
      industry,
      phone,
      email,
      address,
      city,
      country,
      tax_number,
      is_active,
    } = orgData;

    const result = await pool.query(
      `UPDATE organizations SET
        org_name = COALESCE($1, org_name),
        industry = COALESCE($2, industry),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        address = COALESCE($5, address),
        city = COALESCE($6, city),
        country = COALESCE($7, country),
        tax_number = COALESCE($8, tax_number),
        is_active = COALESCE($9, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE org_id = $10
      RETURNING *`,
      [
        org_name,
        industry,
        phone,
        email,
        address,
        city,
        country,
        tax_number,
        is_active,
        orgId,
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in updateOrganization:', error);
    throw error;
  }
};

/**
 * Delete an organization (soft delete)
 * @param {number} orgId - Organization ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteOrganization = async orgId => {
  try {
    const result = await pool.query(
      'UPDATE organizations SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE org_id = $1',
      [orgId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error in deleteOrganization:', error);
    throw error;
  }
};

/**
 * Get organization statistics
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Organization statistics
 */
export const getOrganizationStats = async orgId => {
  try {
    const result = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE org_id = $1) as total_users,
        (SELECT COUNT(*) FROM customers WHERE org_id = $1) as total_customers,
        (SELECT COUNT(*) FROM customers WHERE org_id = $1 AND is_active = true) as active_customers,
        (SELECT SUM(credit_limit) FROM customers WHERE org_id = $1) as total_credit_limit
      `,
      [orgId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error in getOrganizationStats:', error);
    throw error;
  }
};

export default {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationStats,
};

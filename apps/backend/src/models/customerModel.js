import pool from '../config/db.js';

/**
 * Customer Model
 * Handles all database operations for customers with org_id filtering
 */

/**
 * Get all customers for a specific organization
 * @param {number} orgId - Organization ID
 * @param {object} filters - Optional filters (city, segment, is_active, search)
 * @param {object} pagination - Optional pagination (limit, offset)
 * @returns {Promise<Array>} Array of customers
 */
export const getAllCustomers = async (orgId, filters = {}, pagination = {}) => {
  try {
    let query = `
      SELECT 
        c.*,
        u.email as assigned_user_email,
        cu.email as creator_email
      FROM customers c
      LEFT JOIN users u ON c.assigned_user_id = u.id
      LEFT JOIN users cu ON c.created_by = cu.id
      WHERE c.org_id = $1
    `;

    const params = [orgId];
    let paramCount = 1;

    // Add filters
    if (filters.city) {
      paramCount++;
      query += ` AND LOWER(c.city) = LOWER($${paramCount})`;
      params.push(filters.city);
    }

    if (filters.segment) {
      paramCount++;
      query += ` AND c.segment = $${paramCount}`;
      params.push(filters.segment);
    }

    if (filters.customer_type) {
      paramCount++;
      query += ` AND c.customer_type = $${paramCount}`;
      params.push(filters.customer_type);
    }

    if (filters.is_active !== undefined) {
      paramCount++;
      query += ` AND c.is_active = $${paramCount}`;
      params.push(filters.is_active);
    }

    // Search by name, email, or customer code
    if (filters.search) {
      paramCount++;
      query += ` AND (
        LOWER(c.name) LIKE LOWER($${paramCount}) OR 
        LOWER(c.email) LIKE LOWER($${paramCount}) OR 
        LOWER(c.customer_code) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${filters.search}%`);
    }

    // Order by
    query += ` ORDER BY c.created_at DESC`;

    // Pagination
    if (pagination.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(pagination.limit);
    }

    if (pagination.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(pagination.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    throw error;
  }
};

/**
 * Get total count of customers for an organization
 * @param {number} orgId - Organization ID
 * @param {object} filters - Optional filters
 * @returns {Promise<number>} Total count
 */
export const getCustomersCount = async (orgId, filters = {}) => {
  try {
    let query = 'SELECT COUNT(*) as total FROM customers WHERE org_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (filters.city) {
      paramCount++;
      query += ` AND LOWER(city) = LOWER($${paramCount})`;
      params.push(filters.city);
    }

    if (filters.segment) {
      paramCount++;
      query += ` AND segment = $${paramCount}`;
      params.push(filters.segment);
    }

    if (filters.customer_type) {
      paramCount++;
      query += ` AND customer_type = $${paramCount}`;
      params.push(filters.customer_type);
    }

    if (filters.is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.is_active);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (
        LOWER(name) LIKE LOWER($${paramCount}) OR 
        LOWER(email) LIKE LOWER($${paramCount}) OR 
        LOWER(customer_code) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${filters.search}%`);
    }

    const result = await pool.query(query, params);
    return Number.parseInt(result.rows[0].total);
  } catch (error) {
    console.error('Error in getCustomersCount:', error);
    throw error;
  }
};

/**
 * Get a single customer by ID (with org_id validation)
 * @param {number} customerId - Customer ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<object|null>} Customer object or null
 */
export const getCustomerById = async (customerId, orgId) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.*,
        u.email as assigned_user_email,
        cu.email as creator_email
      FROM customers c
      LEFT JOIN users u ON c.assigned_user_id = u.id
      LEFT JOIN users cu ON c.created_by = cu.id
      WHERE c.customer_id = $1 AND c.org_id = $2`,
      [customerId, orgId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    throw error;
  }
};

/**
 * Create a new customer
 * @param {object} customerData - Customer data
 * @param {number} orgId - Organization ID
 * @param {number} userId - User ID (creator)
 * @returns {Promise<object>} Created customer
 */
export const createCustomer = async (customerData, orgId, userId) => {
  try {
    const {
      customer_code,
      name,
      email,
      phone,
      mobile,
      city,
      country,
      address,
      postal_code,
      tax_number,
      tax_office,
      segment,
      customer_type,
      payment_terms,
      credit_limit,
      notes,
      assigned_user_id,
    } = customerData;

    const result = await pool.query(
      `INSERT INTO customers (
        org_id, customer_code, name, email, phone, mobile, city, country,
        address, postal_code, tax_number, tax_office, segment, customer_type,
        payment_terms, credit_limit, notes, assigned_user_id, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        orgId,
        customer_code,
        name,
        email || null,
        phone || null,
        mobile || null,
        city || null,
        country || 'Turkey',
        address || null,
        postal_code || null,
        tax_number || null,
        tax_office || null,
        segment || 'Standard',
        customer_type || 'Individual',
        payment_terms || 30,
        credit_limit || 0,
        notes || null,
        assigned_user_id || null,
        userId,
        true,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error in createCustomer:', error);
    throw error;
  }
};

/**
 * Update a customer (with org_id validation)
 * @param {number} customerId - Customer ID
 * @param {object} customerData - Updated customer data
 * @param {number} orgId - Organization ID
 * @returns {Promise<object|null>} Updated customer or null
 */
export const updateCustomer = async (customerId, customerData, orgId) => {
  try {
    const {
      name,
      email,
      phone,
      mobile,
      city,
      country,
      address,
      postal_code,
      tax_number,
      tax_office,
      segment,
      customer_type,
      payment_terms,
      credit_limit,
      notes,
      assigned_user_id,
      is_active,
    } = customerData;

    const result = await pool.query(
      `UPDATE customers SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        mobile = COALESCE($4, mobile),
        city = COALESCE($5, city),
        country = COALESCE($6, country),
        address = COALESCE($7, address),
        postal_code = COALESCE($8, postal_code),
        tax_number = COALESCE($9, tax_number),
        tax_office = COALESCE($10, tax_office),
        segment = COALESCE($11, segment),
        customer_type = COALESCE($12, customer_type),
        payment_terms = COALESCE($13, payment_terms),
        credit_limit = COALESCE($14, credit_limit),
        notes = COALESCE($15, notes),
        assigned_user_id = COALESCE($16, assigned_user_id),
        is_active = COALESCE($17, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $18 AND org_id = $19
      RETURNING *`,
      [
        name,
        email,
        phone,
        mobile,
        city,
        country,
        address,
        postal_code,
        tax_number,
        tax_office,
        segment,
        customer_type,
        payment_terms,
        credit_limit,
        notes,
        assigned_user_id,
        is_active,
        customerId,
        orgId,
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    throw error;
  }
};

/**
 * Delete a customer (soft delete - set is_active to false)
 * @param {number} customerId - Customer ID
 * @param {number} orgId - Organization ID
 * @param {boolean} hardDelete - If true, permanently delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteCustomer = async (customerId, orgId, hardDelete = false) => {
  try {
    if (hardDelete) {
      const result = await pool.query(
        'DELETE FROM customers WHERE customer_id = $1 AND org_id = $2',
        [customerId, orgId]
      );
      return result.rowCount > 0;
    }

    // Soft delete
    const result = await pool.query(
      'UPDATE customers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE customer_id = $1 AND org_id = $2',
      [customerId, orgId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    throw error;
  }
};

/**
 * Get customer statistics by city for an organization
 * @param {number} orgId - Organization ID
 * @returns {Promise<Array>} City statistics
 */
export const getCustomerStatsByCity = async orgId => {
  try {
    const result = await pool.query(
      `SELECT 
        city,
        COUNT(*) as customer_count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
        COUNT(CASE WHEN segment = 'VIP' THEN 1 END) as vip_count,
        COUNT(CASE WHEN segment = 'Premium' THEN 1 END) as premium_count,
        COUNT(CASE WHEN segment = 'Standard' THEN 1 END) as standard_count,
        COUNT(CASE WHEN segment = 'Basic' THEN 1 END) as basic_count,
        COUNT(CASE WHEN customer_type = 'Corporate' THEN 1 END) as corporate_count,
        COUNT(CASE WHEN customer_type = 'Individual' THEN 1 END) as individual_count
      FROM customers
      WHERE org_id = $1 AND city IS NOT NULL
      GROUP BY city
      ORDER BY customer_count DESC`,
      [orgId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getCustomerStatsByCity:', error);
    throw error;
  }
};

/**
 * Get general customer statistics for an organization
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Statistics object
 */
export const getCustomerGeneralStats = async orgId => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_customers,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_customers,
        COUNT(CASE WHEN segment = 'VIP' THEN 1 END) as vip_customers,
        COUNT(CASE WHEN segment = 'Premium' THEN 1 END) as premium_customers,
        COUNT(CASE WHEN segment = 'Standard' THEN 1 END) as standard_customers,
        COUNT(CASE WHEN segment = 'Basic' THEN 1 END) as basic_customers,
        COUNT(CASE WHEN customer_type = 'Corporate' THEN 1 END) as corporate_customers,
        COUNT(CASE WHEN customer_type = 'Individual' THEN 1 END) as individual_customers,
        COUNT(DISTINCT city) as unique_cities,
        SUM(credit_limit) as total_credit_limit
      FROM customers
      WHERE org_id = $1`,
      [orgId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error in getCustomerGeneralStats:', error);
    throw error;
  }
};

/**
 * Check if customer code exists for an organization
 * @param {string} customerCode - Customer code
 * @param {number} orgId - Organization ID
 * @param {number} excludeCustomerId - Customer ID to exclude (for updates)
 * @returns {Promise<boolean>} True if exists
 */
export const customerCodeExists = async (
  customerCode,
  orgId,
  excludeCustomerId = null
) => {
  try {
    let query =
      'SELECT customer_id FROM customers WHERE customer_code = $1 AND org_id = $2';
    const params = [customerCode, orgId];

    if (excludeCustomerId) {
      query += ' AND customer_id != $3';
      params.push(excludeCustomerId);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error in customerCodeExists:', error);
    throw error;
  }
};

export default {
  getAllCustomers,
  getCustomersCount,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStatsByCity,
  getCustomerGeneralStats,
  customerCodeExists,
};

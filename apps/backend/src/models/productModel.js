import pool from '../config/db.js';

/**
 * Product Model
 * Handles all database operations for products with inventory management
 */

/**
 * Get all products for a specific organization
 * @param {number} orgId - Organization ID
 * @param {object} filters - Optional filters (category, is_active, search, min_price, max_price, include_deleted)
 * @param {object} pagination - Optional pagination (limit, offset)
 * @returns {Promise<Array>} Array of products
 */
export const getAllProducts = async (orgId, filters = {}, pagination = {}) => {
  try {
    let query = `
      SELECT 
        p.*,
        u.email as creator_email
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.org_id = $1
    `;

    const params = [orgId];
    let paramCount = 1;

    // Varsayılan olarak silinmiş ürünleri gösterme (soft delete)
    if (!filters.include_deleted) {
      query += ` AND p.deleted_at IS NULL`;
    }

    // Add filters
    if (filters.category) {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(filters.category);
    }

    if (filters.is_active !== undefined) {
      paramCount++;
      query += ` AND p.is_active = $${paramCount}`;
      params.push(filters.is_active);
    }

    if (filters.low_stock) {
      query += ` AND p.stock_quantity <= p.low_stock_threshold`;
    }

    // Price range
    if (filters.min_price) {
      paramCount++;
      query += ` AND p.price >= $${paramCount}`;
      params.push(filters.min_price);
    }

    if (filters.max_price) {
      paramCount++;
      query += ` AND p.price <= $${paramCount}`;
      params.push(filters.max_price);
    }

    // Search by name, SKU, or barcode
    if (filters.search) {
      paramCount++;
      query += ` AND (
        LOWER(p.name) LIKE LOWER($${paramCount}) OR 
        LOWER(p.sku) LIKE LOWER($${paramCount}) OR 
        LOWER(p.barcode) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${filters.search}%`);
    }

    // Order by
    query += ` ORDER BY p.created_at DESC`;

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
    console.error('Error in getAllProducts:', error);
    throw error;
  }
};

/**
 * Get product by ID
 * @param {number} productId - Product ID
 * @param {number} orgId - Organization ID
 * @param {boolean} includeDeleted - Include soft-deleted products
 * @returns {Promise<object|null>} Product object or null
 */
export const getProductById = async (
  productId,
  orgId,
  includeDeleted = false
) => {
  try {
    let query = `SELECT p.*, u.email as creator_email
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1 AND p.org_id = $2`;

    if (!includeDeleted) {
      query += ` AND p.deleted_at IS NULL`;
    }

    const result = await pool.query(query, [productId, orgId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getProductById:', error);
    throw error;
  }
};

/**
 * Get product by SKU
 * @param {string} sku - Product SKU
 * @param {number} orgId - Organization ID
 * @returns {Promise<object|null>} Product object or null
 */
export const getProductBySKU = async (sku, orgId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE sku = $1 AND org_id = $2 AND deleted_at IS NULL',
      [sku, orgId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getProductBySKU:', error);
    throw error;
  }
};

/**
 * Create a new product
 * @param {object} productData - Product data
 * @param {number} orgId - Organization ID
 * @param {number} userId - User ID (creator)
 * @returns {Promise<object>} Created product
 */
export const createProduct = async (productData, orgId, userId) => {
  try {
    const {
      name,
      description,
      sku,
      barcode,
      category,
      base_price,
      cost_price,
      tax_rate,
      stock_quantity,
      low_stock_threshold,
      unit,
      is_active = true,
    } = productData;

    // Calculate price including VAT
    const price = base_price * (1 + tax_rate / 100);

    const result = await pool.query(
      `INSERT INTO products (
        org_id, name, description, sku, barcode, category, base_price, price, cost_price,
        tax_rate, stock_quantity, low_stock_threshold, unit, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        orgId,
        name,
        description,
        sku,
        barcode,
        category,
        base_price,
        price,
        cost_price,
        tax_rate,
        stock_quantity,
        low_stock_threshold,
        unit,
        is_active,
        userId,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in createProduct:', error);
    throw error;
  }
};

/**
 * Update a product
 * @param {number} productId - Product ID
 * @param {object} productData - Updated product data
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Updated product
 */
export const updateProduct = async (productId, productData, orgId) => {
  try {
    const {
      name,
      description,
      sku,
      barcode,
      category,
      base_price,
      cost_price,
      tax_rate,
      stock_quantity,
      low_stock_threshold,
      unit,
      is_active,
    } = productData;

    // Calculate price including VAT
    const price = base_price * (1 + tax_rate / 100);

    const result = await pool.query(
      `UPDATE products SET
        name = $1,
        description = $2,
        sku = $3,
        barcode = $4,
        category = $5,
        base_price = $6,
        price = $7,
        cost_price = $8,
        tax_rate = $9,
        stock_quantity = $10,
        low_stock_threshold = $11,
        unit = $12,
        is_active = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 AND org_id = $15
      RETURNING *`,
      [
        name,
        description,
        sku,
        barcode,
        category,
        base_price,
        price,
        cost_price,
        tax_rate,
        stock_quantity,
        low_stock_threshold,
        unit,
        is_active,
        productId,
        orgId,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in updateProduct:', error);
    throw error;
  }
};

/**
 * Update product stock quantity
 * @param {number} productId - Product ID
 * @param {number} quantity - Quantity to add (positive) or subtract (negative)
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Updated product
 */
export const updateProductStock = async (productId, quantity, orgId) => {
  try {
    const result = await pool.query(
      `UPDATE products 
       SET stock_quantity = stock_quantity + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [quantity, productId, orgId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in updateProductStock:', error);
    throw error;
  }
};

/**
 * Check if product is used in any orders
 * @param {number} productId - Product ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<boolean>} True if product has orders
 */
export const hasProductOrders = async (productId, orgId) => {
  try {
    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = $1 AND o.org_id = $2
      ) as has_orders`,
      [productId, orgId]
    );
    return result.rows[0].has_orders;
  } catch (error) {
    console.error('Error in hasProductOrders:', error);
    throw error;
  }
};

/**
 * Soft delete a product (endüstri standardı)
 * Ürün silinmez, deleted_at alanı set edilir
 * Siparişlerdeki snapshot veriler korunur
 * @param {number} productId - Product ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Deleted product
 */
export const deleteProduct = async (productId, orgId) => {
  try {
    const result = await pool.query(
      `UPDATE products 
       SET deleted_at = CURRENT_TIMESTAMP, 
           is_active = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND org_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [productId, orgId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    throw error;
  }
};

/**
 * Permanently delete a product (hard delete)
 * DİKKAT: Sadece siparişi olmayan ürünler için kullanın!
 * @param {number} productId - Product ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Deleted product
 */
export const hardDeleteProduct = async (productId, orgId) => {
  try {
    const result = await pool.query(
      `DELETE FROM products 
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [productId, orgId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in hardDeleteProduct:', error);
    throw error;
  }
};

/**
 * Restore a soft-deleted product
 * @param {number} productId - Product ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Restored product
 */
export const restoreProduct = async (productId, orgId) => {
  try {
    const result = await pool.query(
      `UPDATE products 
       SET deleted_at = NULL, 
           is_active = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND org_id = $2 AND deleted_at IS NOT NULL
       RETURNING *`,
      [productId, orgId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in restoreProduct:', error);
    throw error;
  }
};

/**
 * Get products count for an organization
 * @param {number} orgId - Organization ID
 * @param {object} filters - Optional filters
 * @returns {Promise<number>} Total count
 */
export const getProductsCount = async (orgId, filters = {}) => {
  try {
    let query = 'SELECT COUNT(*) as total FROM products WHERE org_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (filters.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
    }

    if (filters.is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.is_active);
    }

    const result = await pool.query(query, params);
    return Number.parseInt(result.rows[0].total, 10);
  } catch (error) {
    console.error('Error in getProductsCount:', error);
    throw error;
  }
};

/**
 * Get low stock products
 * @param {number} orgId - Organization ID
 * @returns {Promise<Array>} Array of low stock products
 */
export const getLowStockProducts = async orgId => {
  try {
    const result = await pool.query(
      `SELECT * FROM products 
       WHERE org_id = $1 
       AND is_active = true
       AND stock_quantity <= low_stock_threshold
       ORDER BY stock_quantity ASC`,
      [orgId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getLowStockProducts:', error);
    throw error;
  }
};

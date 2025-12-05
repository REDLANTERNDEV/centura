import pool from '../config/db.js';

/**
 * Order Model
 * Handles all database operations for orders with full workflow management
 */

/**
 * Get all orders for a specific organization
 * @param {number} orgId - Organization ID
 * @param {object} filters - Optional filters (status, payment_status, customer_id, start_date, end_date)
 * @param {object} pagination - Optional pagination (limit, offset)
 * @returns {Promise<Array>} Array of orders with items
 */
export const getAllOrders = async (orgId, filters = {}, pagination = {}) => {
  try {
    // DEBUG: Log incoming parameters
    console.log('🔍 orderModel.getAllOrders called with:', {
      orgId,
      orgId_type: typeof orgId,
      filters,
      pagination,
    });

    let query = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.customer_code,
        u.email as creator_email,
        COUNT(oi.id) as items_count,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'product_sku', p.sku,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'tax_rate', oi.tax_rate,
            'discount_amount', oi.discount_amount,
            'subtotal', oi.subtotal,
            'tax_amount', oi.tax_amount,
            'total', oi.total
          ) ORDER BY oi.id
        ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.org_id = $1
    `;

    const params = [orgId];
    let paramCount = 1;

    // Add filters
    if (filters.status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.payment_status) {
      paramCount++;
      query += ` AND o.payment_status = $${paramCount}`;
      params.push(filters.payment_status);
    }

    if (filters.customer_id) {
      paramCount++;
      query += ` AND o.customer_id = $${paramCount}`;
      params.push(filters.customer_id);
    }

    // Date range filtering
    if (filters.start_date) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(filters.end_date);
    }

    // Search by order number or customer
    if (filters.search) {
      paramCount++;
      query += ` AND (
        LOWER(o.order_number) LIKE LOWER($${paramCount}) OR 
        LOWER(c.name) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${filters.search}%`);
    }

    // Group by
    query += ` GROUP BY o.id, c.customer_id, c.name, c.email, c.customer_code, u.email`;

    // Order by
    query += ` ORDER BY o.order_date DESC, o.created_at DESC`;

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

    // DEBUG: Log final query and params
    console.log('🔍 Executing SQL query:', {
      params,
      query_snippet: `${query.substring(0, 200)}...`,
    });

    const result = await pool.query(query, params);

    console.log('✅ Query result:', {
      rows_count: result.rows.length,
      first_order_org_id: result.rows[0]?.org_id,
      first_order_number: result.rows[0]?.order_number,
    });

    return result.rows;
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    throw error;
  }
};

/**
 * Get order by ID with all details
 * @param {number} orderId - Order ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<object|null>} Order object with items or null
 */
export const getOrderById = async (orderId, orgId) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.customer_code,
        c.address as customer_address,
        c.city as customer_city,
        c.tax_number as customer_tax_number,
        u.email as creator_email,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'product_sku', p.sku,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'tax_rate', oi.tax_rate,
            'discount_amount', oi.discount_amount,
            'subtotal', oi.subtotal,
            'tax_amount', oi.tax_amount,
            'total', oi.total
          ) ORDER BY oi.id
        ) as items
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.customer_id
       LEFT JOIN users u ON o.created_by = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1 AND o.org_id = $2
       GROUP BY o.id, c.customer_id, c.name, c.email, c.phone, c.customer_code, c.address, c.city, c.tax_number, u.email`,
      [orderId, orgId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getOrderById:', error);
    throw error;
  }
};

/**
 * Get order by order number
 * @param {string} orderNumber - Order number
 * @param {number} orgId - Organization ID
 * @returns {Promise<object|null>} Order object or null
 */
export const getOrderByNumber = async (orderNumber, orgId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE order_number = $1 AND org_id = $2',
      [orderNumber, orgId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getOrderByNumber:', error);
    throw error;
  }
};

/**
 * Generate unique order number (thread-safe version with FOR UPDATE lock per org)
 * @param {number} orgId - Organization ID
 * @param {object} client - Database client (for use within transaction)
 * @returns {Promise<string>} Generated order number
 */
export const generateOrderNumber = async (orgId, client = null) => {
  const db = client || pool;
  try {
    const prefix = 'ORD';
    const year = new Date().getFullYear();

    // First, lock the organization row to prevent race conditions across all orgs
    // This ensures only one request can generate order numbers for this org at a time
    await db.query(
      'SELECT org_id FROM organizations WHERE org_id = $1 FOR UPDATE',
      [orgId]
    );

    // Now safely get the latest order number for this org
    const result = await db.query(
      `SELECT order_number FROM orders 
       WHERE org_id = $1 
       AND order_number LIKE $2
       ORDER BY order_number DESC 
       LIMIT 1`,
      [orgId, `${prefix}${year}%`]
    );

    let sequence = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].order_number;
      const lastSequence = Number.parseInt(lastNumber.slice(-6));
      sequence = lastSequence + 1;
    }

    // Format: ORD-OrgID-2025-000001 (e.g., ORD-1-2025-000001)
    // This makes it unique per organization
    const orderNumber = `${prefix}-${orgId}-${year}-${sequence.toString().padStart(6, '0')}`;
    return orderNumber;
  } catch (error) {
    console.error('Error in generateOrderNumber:', error);
    throw error;
  }
};

/**
 * Create a new order with items
 * @param {object} orderData - Order data with items
 * @param {number} orgId - Organization ID
 * @param {number} userId - User ID (creator)
 * @returns {Promise<object>} Created order with items
 */
export const createOrder = async (orderData, orgId, userId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      customer_id,
      order_date,
      expected_delivery_date,
      status = 'draft',
      payment_status = 'pending',
      payment_method,
      shipping_address,
      shipping_city,
      billing_address,
      billing_city,
      notes,
      discount_percentage = 0,
      discount_amount = 0,
      items = [],
    } = orderData;

    // Generate order number (pass client for thread-safety within transaction)
    const orderNumber = await generateOrderNumber(orgId, client);

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        org_id, customer_id, order_number, order_date, expected_delivery_date,
        status, payment_status, payment_method, shipping_address, shipping_city,
        billing_address, billing_city, notes, discount_percentage, discount_amount,
        subtotal, tax_amount, total, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        orgId,
        customer_id,
        orderNumber,
        order_date || new Date(),
        expected_delivery_date,
        status,
        payment_status,
        payment_method,
        shipping_address,
        shipping_city,
        billing_address,
        billing_city,
        notes,
        discount_percentage,
        0, // discount_amount will be calculated
        0, // subtotal will be calculated
        0, // tax_amount will be calculated
        0, // total will be calculated
        userId,
      ]
    );

    const order = orderResult.rows[0];
    const createdItems = [];

    // Create order items and update stock
    for (const item of items) {
      const {
        product_id,
        quantity,
        unit_price,
        tax_rate = 0,
        discount_amount = 0,
      } = item;

      // Get product to check stock
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND org_id = $2',
        [product_id, orgId]
      );

      if (!productResult.rows[0]) {
        throw new Error(`Product with ID ${product_id} not found`);
      }

      const product = productResult.rows[0];

      // Check stock availability
      if (product.stock_quantity < quantity) {
        throw new Error(
          `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${quantity}`
        );
      }

      // Calculate item totals
      const itemSubtotal = quantity * unit_price;
      const itemTaxAmount = (itemSubtotal - discount_amount) * (tax_rate / 100);
      const itemTotal = itemSubtotal - discount_amount + itemTaxAmount;

      // Create order item
      const itemResult = await client.query(
        `INSERT INTO order_items (
          order_id, product_id, quantity, unit_price, tax_rate,
          discount_amount, subtotal, tax_amount, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          order.id,
          product_id,
          quantity,
          unit_price,
          tax_rate,
          discount_amount,
          itemSubtotal,
          itemTaxAmount,
          itemTotal,
        ]
      );

      createdItems.push(itemResult.rows[0]);

      // Update product stock (reduce quantity)
      await client.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND org_id = $3`,
        [quantity, product_id, orgId]
      );

      subtotal += itemSubtotal;
      totalTax += itemTaxAmount;
    }

    // Calculate order-level discount
    let orderDiscountAmount = discount_amount;
    if (discount_percentage > 0) {
      orderDiscountAmount = subtotal * (discount_percentage / 100);
    }

    // Calculate final total
    const total = subtotal - orderDiscountAmount + totalTax;

    // Update order with calculated totals
    const updatedOrderResult = await client.query(
      `UPDATE orders 
       SET subtotal = $1,
           discount_amount = $2,
           tax_amount = $3,
           total = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [subtotal, orderDiscountAmount, totalTax, total, order.id]
    );

    await client.query('COMMIT');

    return {
      ...updatedOrderResult.rows[0],
      items: createdItems,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createOrder:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update order status
 * @param {number} orderId - Order ID
 * @param {string} status - New status
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Updated order
 */
export const updateOrderStatus = async (orderId, status, orgId) => {
  try {
    const result = await pool.query(
      `UPDATE orders 
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [status, orderId, orgId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    throw error;
  }
};

/**
 * Update payment status
 * @param {number} orderId - Order ID
 * @param {string} paymentStatus - New payment status
 * @param {number} paidAmount - Amount paid
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Updated order
 */
export const updatePaymentStatus = async (
  orderId,
  paymentStatus,
  paidAmount,
  orgId
) => {
  try {
    const result = await pool.query(
      `UPDATE orders 
       SET payment_status = $1,
           paid_amount = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND org_id = $4
       RETURNING *`,
      [paymentStatus, paidAmount, orderId, orgId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    throw error;
  }
};

/**
 * Cancel order and restore stock
 * @param {number} orderId - Order ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Cancelled order
 */
export const cancelOrder = async (orderId, orgId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get order items
    const itemsResult = await client.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );

    // Restore stock for each item
    for (const item of itemsResult.rows) {
      await client.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND org_id = $3`,
        [item.quantity, item.product_id, orgId]
      );
    }

    // Update order status
    const orderResult = await client.query(
      `UPDATE orders 
       SET status = 'cancelled',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [orderId, orgId]
    );

    await client.query('COMMIT');

    return orderResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in cancelOrder:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete order items
 * @param {number} orderId - Order ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<void>}
 */
export const deleteOrderItems = async (orderId, orgId) => {
  await pool.query(
    'DELETE FROM order_items WHERE order_id = $1 AND order_id IN (SELECT id FROM orders WHERE org_id = $2)',
    [orderId, orgId]
  );
};

/**
 * Add order item
 * @param {object} itemData - Item data
 * @returns {Promise<object>} Created item
 */
export const addOrderItem = async itemData => {
  const {
    order_id,
    product_id,
    quantity,
    unit_price,
    tax_rate = 0,
    discount_amount = 0,
  } = itemData;

  // Calculate item totals
  const itemSubtotal = quantity * unit_price;
  const itemTaxAmount = (itemSubtotal - discount_amount) * (tax_rate / 100);
  const itemTotal = itemSubtotal - discount_amount + itemTaxAmount;

  const result = await pool.query(
    `INSERT INTO order_items (
      order_id, product_id, quantity, unit_price, tax_rate,
      discount_amount, subtotal, tax_amount, total
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      order_id,
      product_id,
      quantity,
      unit_price,
      tax_rate,
      discount_amount,
      itemSubtotal,
      itemTaxAmount,
      itemTotal,
    ]
  );

  return result.rows[0];
};

/**
 * Update order total
 * @param {number} orderId - Order ID
 * @param {number} total - New total amount
 * @param {number} orgId - Organization ID
 * @returns {Promise<void>}
 */
export const updateOrderTotal = async (orderId, total, orgId) => {
  await pool.query(
    'UPDATE orders SET total = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND org_id = $3',
    [total, orderId, orgId]
  );
};

/**
 * Update order fields
 * @param {number} orderId - Order ID
 * @param {object} updateData - Fields to update
 * @param {number} orgId - Organization ID
 * @returns {Promise<void>}
 */
export const updateOrderFields = async (orderId, updateData, orgId) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updateData)) {
    fields.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(orderId, orgId);

  const query = `
    UPDATE orders 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
  `;

  await pool.query(query, values);
};

/**
 * Delete order (soft delete) and restore stock
 * @param {number} orderId - Order ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<object>} Deleted order
 */
export const deleteOrder = async (orderId, orgId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get order to check status
    const orderCheck = await client.query(
      'SELECT status FROM orders WHERE id = $1 AND org_id = $2',
      [orderId, orgId]
    );

    if (!orderCheck.rows[0]) {
      throw new Error('Order not found');
    }

    // If order is not cancelled, restore stock
    if (orderCheck.rows[0].status !== 'cancelled') {
      const itemsResult = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [orderId]
      );

      for (const item of itemsResult.rows) {
        await client.query(
          `UPDATE products 
           SET stock_quantity = stock_quantity + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND org_id = $3`,
          [item.quantity, item.product_id, orgId]
        );
      }
    }

    // Soft delete order items
    await client.query('DELETE FROM order_items WHERE order_id = $1', [
      orderId,
    ]);

    // Soft delete order
    const result = await client.query(
      'DELETE FROM orders WHERE id = $1 AND org_id = $2 RETURNING *',
      [orderId, orgId]
    );

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in deleteOrder:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get orders count for an organization
 * @param {number} orgId - Organization ID
 * @param {object} filters - Optional filters
 * @returns {Promise<number>} Total count
 */
export const getOrdersCount = async (orgId, filters = {}) => {
  try {
    let query = 'SELECT COUNT(*) as total FROM orders WHERE org_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.payment_status) {
      paramCount++;
      query += ` AND payment_status = $${paramCount}`;
      params.push(filters.payment_status);
    }

    const result = await pool.query(query, params);
    return Number.parseInt(result.rows[0].total);
  } catch (error) {
    console.error('Error in getOrdersCount:', error);
    throw error;
  }
};

/**
 * Get sales statistics
 * @param {number} orgId - Organization ID
 * @param {object} dateRange - Optional date range (start_date, end_date)
 * @returns {Promise<object>} Sales statistics
 */
export const getSalesStatistics = async (orgId, dateRange = {}) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0) as paid_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN total ELSE 0 END), 0) as pending_revenue,
        COALESCE(AVG(total), 0) as average_order_value
      FROM orders 
      WHERE org_id = $1
    `;

    const params = [orgId];
    let paramCount = 1;

    if (dateRange.start_date) {
      paramCount++;
      query += ` AND order_date >= $${paramCount}`;
      params.push(dateRange.start_date);
    }

    if (dateRange.end_date) {
      paramCount++;
      query += ` AND order_date <= $${paramCount}`;
      params.push(dateRange.end_date);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error('Error in getSalesStatistics:', error);
    throw error;
  }
};

/**
 * Get top selling products
 * @param {number} orgId - Organization ID
 * @param {number} limit - Limit results
 * @param {object} dateRange - Optional date range
 * @returns {Promise<Array>} Top selling products
 */
export const getTopSellingProducts = async (
  orgId,
  limit = 10,
  dateRange = {}
) => {
  try {
    let query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.org_id = $1
    `;

    const params = [orgId];
    let paramCount = 1;

    if (dateRange.start_date) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(dateRange.start_date);
    }

    if (dateRange.end_date) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(dateRange.end_date);
    }

    query += ` GROUP BY p.id, p.name, p.sku, p.category
               ORDER BY total_quantity DESC
               LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error in getTopSellingProducts:', error);
    throw error;
  }
};

/**
 * Get customer orders
 * @param {number} customerId - Customer ID
 * @param {number} orgId - Organization ID
 * @returns {Promise<Array>} Customer orders
 */
export const getCustomerOrders = async (customerId, orgId) => {
  try {
    const result = await pool.query(
      `SELECT o.*,
              COUNT(oi.id) as items_count,
              SUM(oi.total) as calculated_total
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.customer_id = $1 AND o.org_id = $2
       GROUP BY o.id
       ORDER BY o.order_date DESC`,
      [customerId, orgId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getCustomerOrders:', error);
    throw error;
  }
};

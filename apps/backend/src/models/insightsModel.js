import pool from '../config/db.js';

/**
 * Insights Model
 * Advanced analytics and business intelligence for CRM/ERP
 * Provides aggregated metrics following industry standards
 */

/**
 * Get comprehensive insights for an organization
 * @param {number} orgId - Organization ID
 * @param {object} options - Optional filters (startDate, endDate, compareWithPrevious)
 * @returns {Promise<Object>} Comprehensive insights data
 */
export const getComprehensiveInsights = async (orgId, options = {}) => {
  const { startDate, endDate } = options;

  try {
    const [
      topCustomers,
      monthlySales,
      topProducts,
      categoryPerformance,
      customerSegmentAnalysis,
      revenueMetrics,
      orderMetrics,
      inventoryHealth,
      growthMetrics,
      paymentAnalysis,
    ] = await Promise.all([
      getTopCustomers(orgId, { startDate, endDate }),
      getMonthlySales(orgId, { startDate, endDate }),
      getTopProducts(orgId, { startDate, endDate }),
      getCategoryPerformance(orgId, { startDate, endDate }),
      getCustomerSegmentAnalysis(orgId),
      getRevenueMetrics(orgId, { startDate, endDate }),
      getOrderMetrics(orgId, { startDate, endDate }),
      getInventoryHealth(orgId),
      getGrowthMetrics(orgId),
      getPaymentAnalysis(orgId, { startDate, endDate }),
    ]);

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
        generatedAt: new Date().toISOString(),
      },
      salesPerformance: {
        topCustomers,
        monthlySales,
        topProducts,
        categoryPerformance,
      },
      customerAnalytics: customerSegmentAnalysis,
      revenueAnalytics: revenueMetrics,
      orderAnalytics: orderMetrics,
      inventoryInsights: inventoryHealth,
      growthMetrics,
      paymentAnalysis,
    };
  } catch (error) {
    console.error('Error getting comprehensive insights:', error);
    throw error;
  }
};

/**
 * Get top customers by total sales (Revenue)
 * Industry Standard: Customer Lifetime Value (CLV) ranking
 */
export const getTopCustomers = async (orgId, options = {}) => {
  const { startDate, endDate, limit = 10 } = options;

  try {
    let query = `
      SELECT 
        c.customer_id,
        c.name,
        c.customer_code,
        c.email,
        c.segment,
        c.customer_type,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_sales,
        COALESCE(AVG(o.total), 0) as average_order_value,
        MAX(o.order_date) as last_order_date,
        MIN(o.order_date) as first_order_date,
        EXTRACT(DAYS FROM (MAX(o.order_date) - MIN(o.order_date))) as customer_lifetime_days
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id 
        AND o.org_id = $1
        AND o.status != 'cancelled'
    `;

    const params = [orgId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += `
      WHERE c.org_id = $1
      GROUP BY c.customer_id, c.name, c.customer_code, c.email, c.segment, c.customer_type
      HAVING COUNT(DISTINCT o.id) > 0
      ORDER BY total_sales DESC
      LIMIT $${paramCount + 1}
    `;

    params.push(limit);

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      customerId: row.id,
      name: row.name,
      customerCode: row.customer_code,
      email: row.email,
      segment: row.segment,
      customerType: row.customer_type,
      totalSales: Number.parseFloat(row.total_sales),
      totalOrders: Number.parseInt(row.total_orders),
      averageOrderValue: Number.parseFloat(row.average_order_value),
      lastOrderDate: row.last_order_date,
      firstOrderDate: row.first_order_date,
      customerLifetimeDays: Number.parseInt(row.customer_lifetime_days) || 0,
    }));
  } catch (error) {
    console.error('Error getting top customers:', error);
    throw error;
  }
};

/**
 * Get monthly sales data
 * Industry Standard: Time-series revenue analysis
 */
export const getMonthlySales = async (orgId, options = {}) => {
  const { startDate, endDate } = options;

  try {
    let query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', o.order_date), 'YYYY-MM') as month,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_sales,
        COALESCE(AVG(o.total), 0) as average_order_value,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN o.payment_status = 'pending' THEN o.total ELSE 0 END), 0) as pending_amount
      FROM orders o
      WHERE o.org_id = $1
        AND o.status != 'cancelled'
    `;

    const params = [orgId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += `
      GROUP BY DATE_TRUNC('month', o.order_date)
      ORDER BY month DESC
    `;

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      month: row.month,
      totalSales: Number.parseFloat(row.total_sales),
      totalOrders: Number.parseInt(row.total_orders),
      averageOrderValue: Number.parseFloat(row.average_order_value),
      uniqueCustomers: Number.parseInt(row.unique_customers),
      paidAmount: Number.parseFloat(row.paid_amount),
      pendingAmount: Number.parseFloat(row.pending_amount),
      collectionRate:
        row.total_sales > 0
          ? (
              (Number.parseFloat(row.paid_amount) /
                Number.parseFloat(row.total_sales)) *
              100
            ).toFixed(2)
          : 0,
    }));
  } catch (error) {
    console.error('Error getting monthly sales:', error);
    throw error;
  }
};

/**
 * Get top selling products
 * Industry Standard: Product performance ranking
 */
export const getTopProducts = async (orgId, options = {}) => {
  const { startDate, endDate, limit = 10 } = options;

  try {
    let query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        p.price as current_price,
        p.stock_quantity as current_stock,
        COUNT(DISTINCT oi.order_id) as times_ordered,
        COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
        COALESCE(SUM(oi.total), 0) as total_revenue,
        COALESCE(AVG(oi.unit_price), 0) as average_selling_price
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
    `;

    const params = [orgId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += `
      WHERE p.org_id = $1
      GROUP BY p.id, p.name, p.sku, p.category, p.price, p.stock_quantity
      HAVING COUNT(DISTINCT oi.order_id) > 0
      ORDER BY total_revenue DESC
      LIMIT $${paramCount + 1}
    `;

    params.push(limit);

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      productId: row.id,
      name: row.name,
      sku: row.sku,
      category: row.category,
      currentPrice: Number.parseFloat(row.current_price),
      currentStock: Number.parseInt(row.current_stock),
      timesOrdered: Number.parseInt(row.times_ordered),
      totalQuantitySold: Number.parseInt(row.total_quantity_sold),
      totalRevenue: Number.parseFloat(row.total_revenue),
      averageSellingPrice: Number.parseFloat(row.average_selling_price),
    }));
  } catch (error) {
    console.error('Error getting top products:', error);
    throw error;
  }
};

/**
 * Get category performance analysis
 * Industry Standard: Category-level revenue analysis
 */
export const getCategoryPerformance = async (orgId, options = {}) => {
  const { startDate, endDate } = options;

  try {
    let query = `
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT oi.order_id) as total_orders,
        COALESCE(SUM(oi.quantity), 0) as total_units_sold,
        COALESCE(SUM(oi.total), 0) as total_revenue,
        COALESCE(AVG(oi.unit_price), 0) as average_price,
        COALESCE(SUM(p.stock_quantity), 0) as total_stock_value
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
    `;

    const params = [orgId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += `
      WHERE p.org_id = $1
      GROUP BY p.category
      ORDER BY total_revenue DESC
    `;

    const result = await pool.query(query, params);

    const totalRevenue = result.rows.reduce(
      (sum, row) => sum + Number.parseFloat(row.total_revenue),
      0
    );

    return result.rows.map(row => ({
      category: row.category,
      totalProducts: Number.parseInt(row.total_products),
      totalOrders: Number.parseInt(row.total_orders),
      totalUnitsSold: Number.parseInt(row.total_units_sold),
      totalRevenue: Number.parseFloat(row.total_revenue),
      averagePrice: Number.parseFloat(row.average_price),
      totalStockValue: Number.parseInt(row.total_stock_value),
      revenueShare:
        totalRevenue > 0
          ? (
              (Number.parseFloat(row.total_revenue) / totalRevenue) *
              100
            ).toFixed(2)
          : 0,
    }));
  } catch (error) {
    console.error('Error getting category performance:', error);
    throw error;
  }
};

/**
 * Get customer segment analysis
 * Industry Standard: Customer segmentation metrics
 */
export const getCustomerSegmentAnalysis = async orgId => {
  try {
    const query = `
      SELECT 
        c.segment,
        c.customer_type,
        COUNT(DISTINCT c.customer_id) as customer_count,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_revenue,
        COALESCE(AVG(o.total), 0) as average_order_value,
        COUNT(DISTINCT CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '30 days' THEN c.customer_id END) as active_last_30_days
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status != 'cancelled'
      WHERE c.org_id = $1
      GROUP BY c.segment, c.customer_type
      ORDER BY total_revenue DESC
    `;

    const result = await pool.query(query, [orgId]);

    const totalCustomers = result.rows.reduce(
      (sum, row) => sum + Number.parseInt(row.customer_count),
      0
    );
    const totalRevenue = result.rows.reduce(
      (sum, row) => sum + Number.parseFloat(row.total_revenue),
      0
    );

    return {
      segments: result.rows.map(row => ({
        segment: row.segment,
        customerType: row.customer_type,
        customerCount: Number.parseInt(row.customer_count),
        totalOrders: Number.parseInt(row.total_orders),
        totalRevenue: Number.parseFloat(row.total_revenue),
        averageOrderValue: Number.parseFloat(row.average_order_value),
        activeLast30Days: Number.parseInt(row.active_last_30_days),
        customerShare:
          totalCustomers > 0
            ? (
                (Number.parseInt(row.customer_count) / totalCustomers) *
                100
              ).toFixed(2)
            : 0,
        revenueShare:
          totalRevenue > 0
            ? (
                (Number.parseFloat(row.total_revenue) / totalRevenue) *
                100
              ).toFixed(2)
            : 0,
      })),
      summary: {
        totalCustomers,
        totalRevenue,
      },
    };
  } catch (error) {
    console.error('Error getting customer segment analysis:', error);
    throw error;
  }
};

/**
 * Get revenue metrics
 * Industry Standard: Financial KPIs
 */
export const getRevenueMetrics = async (orgId, options = {}) => {
  const { startDate, endDate } = options;

  try {
    let query = `
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_revenue,
        COALESCE(SUM(o.subtotal), 0) as subtotal_revenue,
        COALESCE(SUM(o.tax_amount), 0) as total_tax,
        COALESCE(SUM(o.discount_amount), 0) as total_discounts,
        COALESCE(AVG(o.total), 0) as average_order_value,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END), 0) as collected_revenue,
        COALESCE(SUM(CASE WHEN o.payment_status = 'pending' THEN o.total ELSE 0 END), 0) as pending_revenue,
        COALESCE(SUM(CASE WHEN o.payment_status = 'overdue' THEN o.total ELSE 0 END), 0) as overdue_revenue,
        COUNT(DISTINCT o.customer_id) as unique_customers
      FROM orders o
      WHERE o.org_id = $1
        AND o.status != 'cancelled'
    `;

    const params = [orgId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(endDate);
    }

    const result = await pool.query(query, params);
    const row = result.rows[0];

    const totalRevenue = Number.parseFloat(row.total_revenue);
    const collectedRevenue = Number.parseFloat(row.collected_revenue);

    return {
      totalOrders: Number.parseInt(row.total_orders),
      totalRevenue,
      subtotalRevenue: Number.parseFloat(row.subtotal_revenue),
      totalTax: Number.parseFloat(row.total_tax),
      totalDiscounts: Number.parseFloat(row.total_discounts),
      averageOrderValue: Number.parseFloat(row.average_order_value),
      collectedRevenue,
      pendingRevenue: Number.parseFloat(row.pending_revenue),
      overdueRevenue: Number.parseFloat(row.overdue_revenue),
      uniqueCustomers: Number.parseInt(row.unique_customers),
      collectionRate:
        totalRevenue > 0
          ? ((collectedRevenue / totalRevenue) * 100).toFixed(2)
          : 0,
      discountRate:
        totalRevenue > 0
          ? (
              (Number.parseFloat(row.total_discounts) / totalRevenue) *
              100
            ).toFixed(2)
          : 0,
    };
  } catch (error) {
    console.error('Error getting revenue metrics:', error);
    throw error;
  }
};

/**
 * Get order metrics
 * Industry Standard: Order fulfillment KPIs
 */
export const getOrderMetrics = async (orgId, options = {}) => {
  const { startDate, endDate } = options;

  try {
    let query = `
      SELECT 
        o.status,
        o.payment_status,
        COUNT(*) as count,
        COALESCE(SUM(o.total), 0) as total_value
      FROM orders o
      WHERE o.org_id = $1
    `;

    const params = [orgId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += `
      GROUP BY o.status, o.payment_status
      ORDER BY o.status, o.payment_status
    `;

    const result = await pool.query(query, params);

    const byStatus = {};
    const byPaymentStatus = {};

    for (const row of result.rows) {
      // Group by status
      if (!byStatus[row.status]) {
        byStatus[row.status] = {
          status: row.status,
          count: 0,
          totalValue: 0,
        };
      }
      byStatus[row.status].count += Number.parseInt(row.count);
      byStatus[row.status].totalValue += Number.parseFloat(row.total_value);

      // Group by payment status
      if (!byPaymentStatus[row.payment_status]) {
        byPaymentStatus[row.payment_status] = {
          paymentStatus: row.payment_status,
          count: 0,
          totalValue: 0,
        };
      }
      byPaymentStatus[row.payment_status].count += Number.parseInt(row.count);
      byPaymentStatus[row.payment_status].totalValue += Number.parseFloat(
        row.total_value
      );
    }

    return {
      byStatus: Object.values(byStatus),
      byPaymentStatus: Object.values(byPaymentStatus),
    };
  } catch (error) {
    console.error('Error getting order metrics:', error);
    throw error;
  }
};

/**
 * Get inventory health metrics
 * Industry Standard: Inventory management KPIs
 */
export const getInventoryHealth = async orgId => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
        COUNT(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 END) as low_stock_products,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_products,
        COALESCE(SUM(stock_quantity * price), 0) as total_inventory_value,
        COALESCE(AVG(stock_quantity), 0) as average_stock_level,
        COALESCE(SUM(stock_quantity), 0) as total_units_in_stock
      FROM products
      WHERE org_id = $1
    `;

    const result = await pool.query(query, [orgId]);
    const row = result.rows[0];

    const totalProducts = Number.parseInt(row.total_products);

    return {
      totalProducts,
      activeProducts: Number.parseInt(row.active_products),
      lowStockProducts: Number.parseInt(row.low_stock_products),
      outOfStockProducts: Number.parseInt(row.out_of_stock_products),
      totalInventoryValue: Number.parseFloat(row.total_inventory_value),
      averageStockLevel: Number.parseFloat(row.average_stock_level),
      totalUnitsInStock: Number.parseInt(row.total_units_in_stock),
      stockHealthRate:
        totalProducts > 0
          ? (
              ((totalProducts - Number.parseInt(row.low_stock_products)) /
                totalProducts) *
              100
            ).toFixed(2)
          : 0,
      stockoutRate:
        totalProducts > 0
          ? (
              (Number.parseInt(row.out_of_stock_products) / totalProducts) *
              100
            ).toFixed(2)
          : 0,
    };
  } catch (error) {
    console.error('Error getting inventory health:', error);
    throw error;
  }
};

/**
 * Get growth metrics (MoM, QoQ comparisons)
 * Industry Standard: Growth rate analysis
 */
export const getGrowthMetrics = async orgId => {
  try {
    // Current month vs previous month
    const currentMonthQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(o.total), 0) as revenue,
        COUNT(DISTINCT o.customer_id) as customers
      FROM orders o
      WHERE o.org_id = $1
        AND o.status != 'cancelled'
        AND o.order_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND o.order_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `;

    const previousMonthQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(o.total), 0) as revenue,
        COUNT(DISTINCT o.customer_id) as customers
      FROM orders o
      WHERE o.org_id = $1
        AND o.status != 'cancelled'
        AND o.order_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
        AND o.order_date < DATE_TRUNC('month', CURRENT_DATE)
    `;

    const [currentMonth, previousMonth] = await Promise.all([
      pool.query(currentMonthQuery, [orgId]),
      pool.query(previousMonthQuery, [orgId]),
    ]);

    const current = currentMonth.rows[0];
    const previous = previousMonth.rows[0];

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(2);
    };

    return {
      monthOverMonth: {
        revenue: {
          current: Number.parseFloat(current.revenue),
          previous: Number.parseFloat(previous.revenue),
          growthRate: calculateGrowth(
            Number.parseFloat(current.revenue),
            Number.parseFloat(previous.revenue)
          ),
        },
        orders: {
          current: Number.parseInt(current.orders),
          previous: Number.parseInt(previous.orders),
          growthRate: calculateGrowth(
            Number.parseInt(current.orders),
            Number.parseInt(previous.orders)
          ),
        },
        customers: {
          current: Number.parseInt(current.customers),
          previous: Number.parseInt(previous.customers),
          growthRate: calculateGrowth(
            Number.parseInt(current.customers),
            Number.parseInt(previous.customers)
          ),
        },
      },
    };
  } catch (error) {
    console.error('Error getting growth metrics:', error);
    throw error;
  }
};

/**
 * Get payment analysis
 * Industry Standard: Accounts receivable metrics
 */
export const getPaymentAnalysis = async (orgId, options = {}) => {
  const { startDate, endDate } = options;

  try {
    let query = `
      SELECT 
        o.payment_status,
        o.payment_method,
        COUNT(*) as count,
        COALESCE(SUM(o.total), 0) as total_amount,
        0 as avg_days_to_payment
      FROM orders o
      WHERE o.org_id = $1
        AND o.status != 'cancelled'
    `;

    const params = [orgId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += `
      GROUP BY o.payment_status, o.payment_method
      ORDER BY total_amount DESC
    `;

    const result = await pool.query(query, params);

    const totalAmount = result.rows.reduce(
      (sum, row) => sum + Number.parseFloat(row.total_amount),
      0
    );

    return {
      breakdown: result.rows.map(row => ({
        paymentStatus: row.payment_status,
        paymentMethod: row.payment_method,
        count: Number.parseInt(row.count),
        totalAmount: Number.parseFloat(row.total_amount),
        percentage:
          totalAmount > 0
            ? (
                (Number.parseFloat(row.total_amount) / totalAmount) *
                100
              ).toFixed(2)
            : 0,
        averageDaysToPayment: Number.parseFloat(
          row.avg_days_to_payment
        ).toFixed(2),
      })),
      summary: {
        totalAmount,
        totalTransactions: result.rows.reduce(
          (sum, row) => sum + Number.parseInt(row.count),
          0
        ),
      },
    };
  } catch (error) {
    console.error('Error getting payment analysis:', error);
    throw error;
  }
};

export default {
  getComprehensiveInsights,
  getTopCustomers,
  getMonthlySales,
  getTopProducts,
  getCategoryPerformance,
  getCustomerSegmentAnalysis,
  getRevenueMetrics,
  getOrderMetrics,
  getInventoryHealth,
  getGrowthMetrics,
  getPaymentAnalysis,
};

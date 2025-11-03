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
      retentionRate,
      churnRate,
      dsoMetrics,
      inventoryTurnover,
      grossMargin,
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
      getCustomerRetentionRate(orgId, 30).catch(() => ({ retentionRate: 0 })),
      getChurnRate(orgId, 90).catch(() => ({ churnRate: 0 })),
      getDaysSalesOutstanding(orgId, { startDate, endDate }).catch(() => ({
        averageDSO: 0,
      })),
      getInventoryTurnover(orgId, { startDate, endDate }).catch(() => ({
        turnoverRatio: 0,
      })),
      getGrossMargin(orgId, { startDate, endDate }).catch(() => ({
        grossMarginPercentage: 0,
      })),
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
      customerAnalytics: {
        ...customerSegmentAnalysis,
        retentionRate: Number.parseFloat(retentionRate.retentionRate || 0),
        churnRate: Number.parseFloat(churnRate.churnRate || 0),
      },
      revenueAnalytics: {
        ...revenueMetrics,
        grossMarginPercentage: Number.parseFloat(
          grossMargin.grossMarginPercentage || 0
        ),
        grossProfit: grossMargin.grossProfit || 0,
      },
      orderAnalytics: {
        ...orderMetrics,
        averageDSO: Number.parseFloat(dsoMetrics.averageDSO || 0),
      },
      inventoryInsights: {
        ...inventoryHealth,
        turnoverRatio: Number.parseFloat(inventoryTurnover.turnoverRatio || 0),
      },
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

/**
 * Get Customer Retention Rate
 * Industry Standard: (Customers at End - New Customers) / Customers at Start × 100
 */
export const getCustomerRetentionRate = async (orgId, days = 30) => {
  try {
    const query = `
      WITH period_start AS (
        SELECT COUNT(DISTINCT customer_id) as count
        FROM orders
        WHERE org_id = $1
          AND order_date < CURRENT_DATE - INTERVAL '${days} days'
          AND status != 'cancelled'
      ),
      period_end AS (
        SELECT COUNT(DISTINCT customer_id) as count
        FROM orders
        WHERE org_id = $1
          AND order_date >= CURRENT_DATE - INTERVAL '${days} days'
          AND status != 'cancelled'
      ),
      new_customers AS (
        SELECT COUNT(DISTINCT customer_id) as count
        FROM orders
        WHERE org_id = $1
          AND order_date >= CURRENT_DATE - INTERVAL '${days} days'
          AND status != 'cancelled'
          AND customer_id NOT IN (
            SELECT DISTINCT customer_id
            FROM orders
            WHERE org_id = $1
              AND order_date < CURRENT_DATE - INTERVAL '${days} days'
              AND status != 'cancelled'
          )
      )
      SELECT 
        (SELECT count FROM period_start) as customers_at_start,
        (SELECT count FROM period_end) as customers_at_end,
        (SELECT count FROM new_customers) as new_customers,
        CASE 
          WHEN (SELECT count FROM period_start) > 0
          THEN (((SELECT count FROM period_end) - (SELECT count FROM new_customers)) * 100.0 / 
                (SELECT count FROM period_start))
          ELSE 0
        END as retention_rate
    `;

    const result = await pool.query(query, [orgId]);
    const row = result.rows[0];

    return {
      customersAtStart: Number.parseInt(row.customers_at_start) || 0,
      customersAtEnd: Number.parseInt(row.customers_at_end) || 0,
      newCustomers: Number.parseInt(row.new_customers) || 0,
      retentionRate: Number.parseFloat(row.retention_rate).toFixed(2),
      periodDays: days,
    };
  } catch (error) {
    console.error('Error getting customer retention rate:', error);
    throw error;
  }
};

/**
 * Get Churn Rate
 * Industry Standard: Lost Customers / Total Customers at Start × 100
 */
export const getChurnRate = async (orgId, days = 90) => {
  try {
    const query = `
      WITH start_customers AS (
        SELECT DISTINCT customer_id
        FROM orders
        WHERE org_id = $1
          AND order_date < CURRENT_DATE - INTERVAL '${days} days'
          AND status != 'cancelled'
      ),
      churned_customers AS (
        SELECT sc.customer_id
        FROM start_customers sc
        WHERE NOT EXISTS (
          SELECT 1 FROM orders o
          WHERE o.customer_id = sc.customer_id
            AND o.org_id = $1
            AND o.order_date >= CURRENT_DATE - INTERVAL '${days} days'
            AND o.status != 'cancelled'
        )
      )
      SELECT 
        (SELECT COUNT(*) FROM start_customers) as start_count,
        (SELECT COUNT(*) FROM churned_customers) as churned_count,
        CASE 
          WHEN (SELECT COUNT(*) FROM start_customers) > 0
          THEN (SELECT COUNT(*) FROM churned_customers) * 100.0 / (SELECT COUNT(*) FROM start_customers)
          ELSE 0
        END as churn_rate
    `;

    const result = await pool.query(query, [orgId]);
    const row = result.rows[0];

    return {
      customersAtStart: Number.parseInt(row.start_count) || 0,
      churnedCustomers: Number.parseInt(row.churned_count) || 0,
      churnRate: Number.parseFloat(row.churn_rate).toFixed(2),
      periodDays: days,
    };
  } catch (error) {
    console.error('Error getting churn rate:', error);
    throw error;
  }
};

/**
 * Get Days Sales Outstanding (DSO)
 * Industry Standard: Average days to collect payment
 */
export const getDaysSalesOutstanding = async (orgId, options = {}) => {
  const { startDate, endDate } = options;

  try {
    let query = `
      SELECT 
        AVG(EXTRACT(DAYS FROM (paid_at - order_date))) as average_dso,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(DAYS FROM (paid_at - order_date))) as median_dso,
        MAX(EXTRACT(DAYS FROM (paid_at - order_date))) as max_dso,
        MIN(EXTRACT(DAYS FROM (paid_at - order_date))) as min_dso,
        COUNT(*) as total_paid_orders
      FROM orders
      WHERE org_id = $1
        AND payment_status = 'paid'
        AND paid_at IS NOT NULL
        AND order_date IS NOT NULL
        AND status != 'cancelled'
    `;

    const params = [orgId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND order_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND order_date <= $${paramCount}`;
      params.push(endDate);
    }

    const result = await pool.query(query, params);
    const row = result.rows[0];

    return {
      averageDSO: Number.parseFloat(row.average_dso).toFixed(2) || 0,
      medianDSO: Number.parseFloat(row.median_dso).toFixed(2) || 0,
      maxDSO: Number.parseFloat(row.max_dso).toFixed(2) || 0,
      minDSO: Number.parseFloat(row.min_dso).toFixed(2) || 0,
      totalPaidOrders: Number.parseInt(row.total_paid_orders) || 0,
    };
  } catch (error) {
    console.error('Error getting DSO:', error);
    throw error;
  }
};

/**
 * Get Inventory Turnover Ratio
 * Industry Standard: COGS / Average Inventory Value
 */
export const getInventoryTurnover = async (orgId, options = {}) => {
  const { startDate, endDate } = options;

  try {
    let query = `
      WITH period_sales AS (
        SELECT 
          COALESCE(SUM(oi.quantity * p.cost_price), 0) as cogs
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
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
      ),
      avg_inventory AS (
        SELECT 
          AVG(stock_quantity * COALESCE(cost_price, price)) as avg_value
        FROM products
        WHERE org_id = $1
          AND is_active = TRUE
      )
      SELECT 
        (SELECT cogs FROM period_sales) as total_cogs,
        (SELECT avg_value FROM avg_inventory) as avg_inventory_value,
        CASE 
          WHEN (SELECT avg_value FROM avg_inventory) > 0
          THEN (SELECT cogs FROM period_sales) / (SELECT avg_value FROM avg_inventory)
          ELSE 0
        END as turnover_ratio
    `;

    const result = await pool.query(query, params);
    const row = result.rows[0];

    return {
      costOfGoodsSold: Number.parseFloat(row.total_cogs).toFixed(2),
      averageInventoryValue: Number.parseFloat(row.avg_inventory_value).toFixed(
        2
      ),
      turnoverRatio: Number.parseFloat(row.turnover_ratio).toFixed(2),
    };
  } catch (error) {
    console.error('Error getting inventory turnover:', error);
    throw error;
  }
};

/**
 * Get Gross Margin
 * Industry Standard: (Revenue - COGS) / Revenue × 100
 */
export const getGrossMargin = async (orgId, options = {}) => {
  const { startDate, endDate } = options;

  try {
    let query = `
      SELECT 
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue,
        COALESCE(SUM(oi.quantity * COALESCE(p.cost_price, 0)), 0) as total_cogs,
        COALESCE(SUM(oi.quantity * oi.unit_price) - SUM(oi.quantity * COALESCE(p.cost_price, 0)), 0) as gross_profit,
        CASE 
          WHEN SUM(oi.quantity * oi.unit_price) > 0
          THEN ((SUM(oi.quantity * oi.unit_price) - SUM(oi.quantity * COALESCE(p.cost_price, 0))) / 
                SUM(oi.quantity * oi.unit_price)) * 100
          ELSE 0
        END as gross_margin_percentage
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
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

    return {
      totalRevenue: Number.parseFloat(row.total_revenue),
      totalCOGS: Number.parseFloat(row.total_cogs),
      grossProfit: Number.parseFloat(row.gross_profit),
      grossMarginPercentage: Number.parseFloat(
        row.gross_margin_percentage
      ).toFixed(2),
    };
  } catch (error) {
    console.error('Error getting gross margin:', error);
    throw error;
  }
};

/**
 * Get RFM Analysis (Recency, Frequency, Monetary)
 * Industry Standard: Customer segmentation based on purchase behavior
 */
export const getRFMAnalysis = async orgId => {
  try {
    const query = `
      SELECT * FROM calculate_rfm_scores($1)
    `;

    const result = await pool.query(query, [orgId]);

    // Group by segment
    const segmentSummary = {};
    for (const row of result.rows) {
      const segment = row.rfm_segment;
      if (!segmentSummary[segment]) {
        segmentSummary[segment] = {
          segment,
          count: 0,
          avgRecency: 0,
          avgFrequency: 0,
          avgMonetary: 0,
          totalRecency: 0,
          totalFrequency: 0,
          totalMonetary: 0,
        };
      }

      segmentSummary[segment].count++;
      segmentSummary[segment].totalRecency += Number.parseInt(row.recency);
      segmentSummary[segment].totalFrequency += Number.parseInt(row.frequency);
      segmentSummary[segment].totalMonetary += Number.parseFloat(row.monetary);
    }

    // Calculate averages
    const segments = Object.values(segmentSummary).map(seg => ({
      segment: seg.segment,
      count: seg.count,
      percentage: ((seg.count / result.rows.length) * 100).toFixed(2),
      avgRecency: (seg.totalRecency / seg.count).toFixed(2),
      avgFrequency: (seg.totalFrequency / seg.count).toFixed(2),
      avgMonetary: (seg.totalMonetary / seg.count).toFixed(2),
    }));

    return {
      totalCustomers: result.rows.length,
      segments: segments.sort((a, b) => b.count - a.count),
      customers: result.rows.map(row => ({
        customerId: row.customer_id,
        recency: Number.parseInt(row.recency),
        frequency: Number.parseInt(row.frequency),
        monetary: Number.parseFloat(row.monetary),
        rScore: row.r_score,
        fScore: row.f_score,
        mScore: row.m_score,
        rfmScore: row.rfm_score,
        segment: row.rfm_segment,
      })),
    };
  } catch (error) {
    console.error('Error getting RFM analysis:', error);
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
  getCustomerRetentionRate,
  getChurnRate,
  getDaysSalesOutstanding,
  getInventoryTurnover,
  getGrossMargin,
  getRFMAnalysis,
};

import * as InsightsModel from '../models/insightsModel.js';

/**
 * Insights Controller
 * Handles all business intelligence and analytics requests
 */

/**
 * @route GET /api/v1/insights
 * @desc Get comprehensive insights and analytics
 * @access Private (requires authentication and organization membership)
 */
export const getInsights = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const { startDate, endDate, compareWithPrevious } = req.query;

    // Validate organization access
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;
    if (compareWithPrevious)
      options.compareWithPrevious = compareWithPrevious === 'true';

    const insights = await InsightsModel.getComprehensiveInsights(
      orgId,
      options
    );

    return res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error in getInsights:', error);
    next(error);
  }
};

/**
 * @route GET /api/v1/insights/customers/top
 * @desc Get top customers by revenue
 * @access Private
 */
export const getTopCustomers = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const { startDate, endDate, limit } = req.query;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;
    if (limit) options.limit = Number.parseInt(limit, 10);

    const topCustomers = await InsightsModel.getTopCustomers(orgId, options);

    return res.status(200).json({
      success: true,
      data: topCustomers,
    });
  } catch (error) {
    console.error('Error in getTopCustomers:', error);
    next(error);
  }
};

/**
 * @route GET /api/v1/insights/sales/monthly
 * @desc Get monthly sales data
 * @access Private
 */
export const getMonthlySales = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const { startDate, endDate } = req.query;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const monthlySales = await InsightsModel.getMonthlySales(orgId, options);

    return res.status(200).json({
      success: true,
      data: monthlySales,
    });
  } catch (error) {
    console.error('Error in getMonthlySales:', error);
    next(error);
  }
};

/**
 * @route GET /api/v1/insights/products/top
 * @desc Get top selling products
 * @access Private
 */
export const getTopProducts = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const { startDate, endDate, limit } = req.query;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;
    if (limit) options.limit = Number.parseInt(limit, 10);

    const topProducts = await InsightsModel.getTopProducts(orgId, options);

    return res.status(200).json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    next(error);
  }
};

/**
 * @route GET /api/v1/insights/categories/performance
 * @desc Get category performance analysis
 * @access Private
 */
export const getCategoryPerformance = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const { startDate, endDate } = req.query;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const categoryPerformance = await InsightsModel.getCategoryPerformance(
      orgId,
      options
    );

    return res.status(200).json({
      success: true,
      data: categoryPerformance,
    });
  } catch (error) {
    console.error('Error in getCategoryPerformance:', error);
    next(error);
  }
};

/**
 * @route GET /api/v1/insights/customers/segments
 * @desc Get customer segment analysis
 * @access Private
 */
export const getCustomerSegmentAnalysis = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const segmentAnalysis =
      await InsightsModel.getCustomerSegmentAnalysis(orgId);

    return res.status(200).json({
      success: true,
      data: segmentAnalysis,
    });
  } catch (error) {
    console.error('Error in getCustomerSegmentAnalysis:', error);
    next(error);
  }
};

/**
 * @route GET /api/v1/insights/revenue/metrics
 * @desc Get revenue metrics and KPIs
 * @access Private
 */
export const getRevenueMetrics = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const { startDate, endDate } = req.query;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const revenueMetrics = await InsightsModel.getRevenueMetrics(
      orgId,
      options
    );

    return res.status(200).json({
      success: true,
      data: revenueMetrics,
    });
  } catch (error) {
    console.error('Error in getRevenueMetrics:', error);
    next(error);
  }
};

/**
 * @route GET /api/v1/insights/orders/metrics
 * @desc Get order metrics and fulfillment KPIs
 * @access Private
 */
export const getOrderMetrics = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const { startDate, endDate } = req.query;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const orderMetrics = await InsightsModel.getOrderMetrics(orgId, options);

    return res.status(200).json({
      success: true,
      data: orderMetrics,
    });
  } catch (error) {
    console.error('Error in getOrderMetrics:', error);
    next(error);
  }
};

/**
 * @route GET /api/v1/insights/inventory/health
 * @desc Get inventory health metrics
 * @access Private
 */
export const getInventoryHealth = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const inventoryHealth = await InsightsModel.getInventoryHealth(orgId);

    return res.status(200).json({
      success: true,
      data: inventoryHealth,
    });
  } catch (error) {
    console.error('Error in getInventoryHealth:', error);
    next(error);
  }
};

/**
 * @route GET /api/v1/insights/growth/metrics
 * @desc Get growth metrics (MoM, QoQ)
 * @access Private
 */
export const getGrowthMetrics = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const growthMetrics = await InsightsModel.getGrowthMetrics(orgId);

    return res.status(200).json({
      success: true,
      data: growthMetrics,
    });
  } catch (error) {
    console.error('Error in getGrowthMetrics:', error);
    next(error);
  }
};

/**
 * @route GET /api/v1/insights/payments/analysis
 * @desc Get payment and accounts receivable analysis
 * @access Private
 */
export const getPaymentAnalysis = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const { startDate, endDate } = req.query;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'No organization selected',
      });
    }

    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const paymentAnalysis = await InsightsModel.getPaymentAnalysis(
      orgId,
      options
    );

    return res.status(200).json({
      success: true,
      data: paymentAnalysis,
    });
  } catch (error) {
    console.error('Error in getPaymentAnalysis:', error);
    next(error);
  }
};

export default {
  getInsights,
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

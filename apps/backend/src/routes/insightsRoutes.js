import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as insightsController from '../controllers/insightsController.js';

const router = express.Router();

/**
 * All insights routes require authentication
 */
router.use(verifyToken);

/**
 * @route GET /api/v1/insights
 * @desc Get comprehensive insights dashboard
 * @query startDate - Optional start date (YYYY-MM-DD)
 * @query endDate - Optional end date (YYYY-MM-DD)
 * @query compareWithPrevious - Optional boolean for period comparison
 */
router.get('/', insightsController.getInsights);

/**
 * Customer Analytics
 */
router.get('/customers/top', insightsController.getTopCustomers);
router.get(
  '/customers/segments',
  insightsController.getCustomerSegmentAnalysis
);

/**
 * Sales Analytics
 */
router.get('/sales/monthly', insightsController.getMonthlySales);

/**
 * Product Analytics
 */
router.get('/products/top', insightsController.getTopProducts);
router.get(
  '/categories/performance',
  insightsController.getCategoryPerformance
);

/**
 * Financial Analytics
 */
router.get('/revenue/metrics', insightsController.getRevenueMetrics);
router.get('/payments/analysis', insightsController.getPaymentAnalysis);

/**
 * Operational Analytics
 */
router.get('/orders/metrics', insightsController.getOrderMetrics);
router.get('/inventory/health', insightsController.getInventoryHealth);

/**
 * Growth Analytics
 */
router.get('/growth/metrics', insightsController.getGrowthMetrics);

export default router;

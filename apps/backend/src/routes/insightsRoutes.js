import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { validateOrgContext } from '../middleware/orgContext.js';
import * as insightsController from '../controllers/insightsController.js';

const router = express.Router();

/**
 * All insights routes require authentication and organization context
 */
router.use(verifyToken);
router.use(validateOrgContext);

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
router.get('/customers/retention', insightsController.getCustomerRetention);
router.get('/customers/churn', insightsController.getChurnRate);
router.get('/customers/rfm', insightsController.getRFMAnalysis);

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
router.get('/revenue/gross-margin', insightsController.getGrossMargin);
router.get('/payments/analysis', insightsController.getPaymentAnalysis);
router.get('/payments/dso', insightsController.getDSO);

/**
 * Operational Analytics
 */
router.get('/orders/metrics', insightsController.getOrderMetrics);
router.get('/inventory/health', insightsController.getInventoryHealth);
router.get('/inventory/turnover', insightsController.getInventoryTurnover);

/**
 * Growth Analytics
 */
router.get('/growth/metrics', insightsController.getGrowthMetrics);

export default router;

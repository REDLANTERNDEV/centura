import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { flexibleOrgContext } from '../middleware/orgContext.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

/**
 * @route   GET /api/orders
 * @desc    Get all orders for organization
 * @access  Private
 * @query   ?status=confirmed&payment_status=paid&customer_id=1&start=2025-01-01&end=2025-12-31&page=1&limit=50
 */
router.get('/', verifyToken, flexibleOrgContext, orderController.getAllOrders);

/**
 * @route   GET /api/orders/statistics
 * @desc    Get sales statistics
 * @access  Private
 * @query   ?start_date=2025-01-01&end_date=2025-12-31
 */
router.get(
  '/statistics',
  verifyToken,
  flexibleOrgContext,
  orderController.getSalesStatistics
);

/**
 * @route   GET /api/orders/top-products
 * @desc    Get top selling products
 * @access  Private
 * @query   ?start_date=2025-01-01&end_date=2025-12-31&limit=10
 */
router.get(
  '/top-products',
  verifyToken,
  flexibleOrgContext,
  orderController.getTopSellingProducts
);

/**
 * @route   GET /api/orders/customer/:customerId
 * @desc    Get orders for a specific customer
 * @access  Private
 */
router.get(
  '/customer/:customerId',
  verifyToken,
  flexibleOrgContext,
  orderController.getCustomerOrders
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID with all details
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  flexibleOrgContext,
  orderController.getOrderById
);

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
router.post('/', verifyToken, flexibleOrgContext, orderController.createOrder);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private
 * @body    { status: 'confirmed' }
 */
router.patch(
  '/:id/status',
  verifyToken,
  flexibleOrgContext,
  orderController.updateOrderStatus
);

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order (full update)
 * @access  Private
 * @body    { status, payment_status, paid_amount, notes, items }
 */
router.put(
  '/:id',
  verifyToken,
  flexibleOrgContext,
  orderController.updateOrder
);

/**
 * @route   PATCH /api/orders/:id/payment
 * @desc    Update payment status
 * @access  Private
 * @body    { payment_status: 'paid', paid_amount: 1000 }
 */
router.patch(
  '/:id/payment',
  verifyToken,
  flexibleOrgContext,
  orderController.updatePaymentStatus
);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel order and restore stock
 * @access  Private
 */
router.patch(
  '/:id/cancel',
  verifyToken,
  flexibleOrgContext,
  orderController.cancelOrder
);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete order
 * @access  Private
 */
router.delete(
  '/:id',
  verifyToken,
  flexibleOrgContext,
  orderController.deleteOrder
);

export default router;

import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

/**
 * @route   GET /api/orders
 * @desc    Get all orders for organization
 * @access  Private
 * @query   ?status=confirmed&payment_status=paid&customer_id=1&start=2025-01-01&end=2025-12-31&page=1&limit=50
 */
router.get('/', verifyToken, orderController.getAllOrders);

/**
 * @route   GET /api/orders/statistics
 * @desc    Get sales statistics
 * @access  Private
 * @query   ?start_date=2025-01-01&end_date=2025-12-31
 */
router.get('/statistics', verifyToken, orderController.getSalesStatistics);

/**
 * @route   GET /api/orders/top-products
 * @desc    Get top selling products
 * @access  Private
 * @query   ?start_date=2025-01-01&end_date=2025-12-31&limit=10
 */
router.get('/top-products', verifyToken, orderController.getTopSellingProducts);

/**
 * @route   GET /api/orders/customer/:customerId
 * @desc    Get orders for a specific customer
 * @access  Private
 */
router.get(
  '/customer/:customerId',
  verifyToken,
  orderController.getCustomerOrders
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID with all details
 * @access  Private
 */
router.get('/:id', verifyToken, orderController.getOrderById);

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
router.post('/', verifyToken, orderController.createOrder);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private
 * @body    { status: 'confirmed' }
 */
router.patch('/:id/status', verifyToken, orderController.updateOrderStatus);

/**
 * @route   PATCH /api/orders/:id/payment
 * @desc    Update payment status
 * @access  Private
 * @body    { payment_status: 'paid', paid_amount: 1000 }
 */
router.patch('/:id/payment', verifyToken, orderController.updatePaymentStatus);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel order and restore stock
 * @access  Private
 */
router.patch('/:id/cancel', verifyToken, orderController.cancelOrder);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete order
 * @access  Private
 */
router.delete('/:id', verifyToken, orderController.deleteOrder);

export default router;

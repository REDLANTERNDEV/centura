import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { flexibleOrgContext } from '../middleware/orgContext.js';
import * as productController from '../controllers/productController.js';

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products for organization
 * @access  Private
 * @query   ?category=Electronics&is_active=true&low_stock=true&search=laptop&page=1&limit=50
 */
router.get(
  '/',
  verifyToken,
  flexibleOrgContext,
  productController.getAllProducts
);

/**
 * @route   GET /api/products/low-stock
 * @desc    Get low stock products
 * @access  Private
 */
router.get(
  '/low-stock',
  verifyToken,
  flexibleOrgContext,
  productController.getLowStockProducts
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  flexibleOrgContext,
  productController.getProductById
);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private
 */
router.post(
  '/',
  verifyToken,
  flexibleOrgContext,
  productController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private
 */
router.put(
  '/:id',
  verifyToken,
  flexibleOrgContext,
  productController.updateProduct
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock quantity
 * @access  Private
 * @body    { quantity: 10, type: 'add' } or { quantity: 5, type: 'subtract' }
 */
router.patch(
  '/:id/stock',
  verifyToken,
  flexibleOrgContext,
  productController.updateProductStock
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Soft delete product (arşivle)
 * @access  Private
 */
router.delete(
  '/:id',
  verifyToken,
  flexibleOrgContext,
  productController.deleteProduct
);

/**
 * @route   POST /api/products/:id/restore
 * @desc    Restore a soft-deleted product
 * @access  Private
 */
router.post(
  '/:id/restore',
  verifyToken,
  flexibleOrgContext,
  productController.restoreProduct
);

export default router;

import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getCustomers,
  getCustomer,
  createNewCustomer,
  updateExistingCustomer,
  deleteExistingCustomer,
  getCustomerStats,
} from '../controllers/customerController.js';
import {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCustomerQuery,
} from '../validators/customerValidator.js';

const router = express.Router();

/**
 * Customer Routes
 * All routes require authentication and automatically filter by user's org_id
 */

// GET /api/customers/stats - Get customer statistics (must be before /:id route)
router.get('/stats', verifyToken, getCustomerStats);

// GET /api/customers - Get all customers with pagination and filtering
router.get('/', verifyToken, validateCustomerQuery, getCustomers);

// GET /api/customers/:id - Get a single customer
router.get('/:id', verifyToken, getCustomer);

// POST /api/customers - Create a new customer
router.post('/', verifyToken, validateCreateCustomer, createNewCustomer);

// PUT /api/customers/:id - Update a customer
router.put('/:id', verifyToken, validateUpdateCustomer, updateExistingCustomer);

// DELETE /api/customers/:id - Delete a customer
router.delete('/:id', verifyToken, deleteExistingCustomer);

export default router;

import {
  getAllCustomers,
  getCustomersCount,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStatsByCity,
  getCustomerGeneralStats,
  customerCodeExists,
} from '../models/customerModel.js';

/**
 * Customer Controller
 * Handles all customer-related HTTP requests with org_id filtering
 */

/**
 * Get all customers for the authenticated user's organization
 * GET /api/customers
 * Query params: city, segment, customer_type, is_active, search, limit, offset, page
 */
export const getCustomers = async (req, res, next) => {
  try {
    // Get org_id from authenticated user
    const orgId = req.user.org_id;

    if (!orgId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any organization',
      });
    }

    // Get validated query parameters
    const { city, segment, customer_type, is_active, search, limit, page } =
      req.validatedQuery || req.query;

    // Calculate offset from page
    const offset = (page - 1) * limit;

    // Build filters
    const filters = {};
    if (city) filters.city = city;
    if (segment) filters.segment = segment;
    if (customer_type) filters.customer_type = customer_type;
    if (is_active !== undefined)
      filters.is_active = is_active === 'true' || is_active === true;
    if (search) filters.search = search;

    // Get customers and total count
    const [customers, totalCount] = await Promise.all([
      getAllCustomers(orgId, filters, { limit, offset }),
      getCustomersCount(orgId, filters),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: customers,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: filters,
    });
  } catch (error) {
    console.error('Error in getCustomers controller:', error);
    return next(error);
  }
};

/**
 * Get a single customer by ID
 * GET /api/customers/:id
 */
export const getCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const orgId = req.user.org_id;

    if (!orgId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any organization',
      });
    }

    const customer = await getCustomerById(customerId, orgId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or does not belong to your organization',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer retrieved successfully',
      data: customer,
    });
  } catch (error) {
    console.error('Error in getCustomer controller:', error);
    return next(error);
  }
};

/**
 * Create a new customer
 * POST /api/customers
 */
export const createNewCustomer = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.id;

    if (!orgId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any organization',
      });
    }

    // Get validated data
    const customerData = req.validatedData || req.body;

    // Check if customer code already exists in this organization
    const codeExists = await customerCodeExists(
      customerData.customer_code,
      orgId
    );
    if (codeExists) {
      return res.status(409).json({
        success: false,
        message: 'Customer code already exists in your organization',
        field: 'customer_code',
      });
    }

    // Create customer
    const newCustomer = await createCustomer(customerData, orgId, userId);

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer,
    });
  } catch (error) {
    console.error('Error in createNewCustomer controller:', error);

    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Customer code already exists',
      });
    }

    return next(error);
  }
};

/**
 * Update an existing customer
 * PUT /api/customers/:id
 */
export const updateExistingCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const orgId = req.user.org_id;

    if (!orgId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any organization',
      });
    }

    // Get validated data
    const customerData = req.validatedData || req.body;

    // Check if customer exists and belongs to organization
    const existingCustomer = await getCustomerById(customerId, orgId);
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or does not belong to your organization',
      });
    }

    // Update customer
    const updatedCustomer = await updateCustomer(
      customerId,
      customerData,
      orgId
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update customer',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer,
    });
  } catch (error) {
    console.error('Error in updateExistingCustomer controller:', error);
    return next(error);
  }
};

/**
 * Delete a customer (soft delete by default)
 * DELETE /api/customers/:id
 * Query param: hard_delete=true for permanent deletion
 */
export const deleteExistingCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const orgId = req.user.org_id;
    const hardDelete = req.query.hard_delete === 'true';

    if (!orgId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any organization',
      });
    }

    // Check if customer exists and belongs to organization
    const existingCustomer = await getCustomerById(customerId, orgId);
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or does not belong to your organization',
      });
    }

    // Delete customer
    const deleted = await deleteCustomer(customerId, orgId, hardDelete);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete customer',
      });
    }

    return res.status(200).json({
      success: true,
      message: hardDelete
        ? 'Customer permanently deleted'
        : 'Customer deactivated successfully',
      deletionType: hardDelete ? 'permanent' : 'soft',
    });
  } catch (error) {
    console.error('Error in deleteExistingCustomer controller:', error);
    return next(error);
  }
};

/**
 * Get customer statistics
 * GET /api/customers/stats
 */
export const getCustomerStats = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;

    if (!orgId) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any organization',
      });
    }

    // Get both city stats and general stats
    const [cityStats, generalStats] = await Promise.all([
      getCustomerStatsByCity(orgId),
      getCustomerGeneralStats(orgId),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Customer statistics retrieved successfully',
      data: {
        general: generalStats,
        byCity: cityStats,
      },
    });
  } catch (error) {
    console.error('Error in getCustomerStats controller:', error);
    return next(error);
  }
};

export default {
  getCustomers,
  getCustomer,
  createNewCustomer,
  updateExistingCustomer,
  deleteExistingCustomer,
  getCustomerStats,
};

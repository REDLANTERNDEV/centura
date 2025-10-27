import * as orderModel from '../models/orderModel.js';
import * as productModel from '../models/productModel.js';
import * as customerModel from '../models/customerModel.js';
import {
  validateOrderCreate,
  validateOrderStatusUpdate,
  validatePaymentUpdate,
  validateDateRange,
} from '../validators/orderValidator.js';

/**
 * Get all orders for organization
 */
export const getAllOrders = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const {
      status,
      payment_status,
      customer_id,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (payment_status) filters.payment_status = payment_status;
    if (customer_id) filters.customer_id = Number.parseInt(customer_id);
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (search) filters.search = search;

    // Validate date range if provided
    if (start_date || end_date) {
      const dateValidation = validateDateRange({ start_date, end_date });
      if (!dateValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date range',
          errors: dateValidation.errors,
        });
      }
    }

    // Pagination
    const pageNum = Number.parseInt(page);
    const limitNum = Number.parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const orders = await orderModel.getAllOrders(orgId, filters, {
      limit: limitNum,
      offset,
    });

    const total = await orderModel.getOrdersCount(orgId, filters);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in getAllOrders controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving orders',
      error: error.message,
    });
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const order = await orderModel.getOrderById(id, orgId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error in getOrderById controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving order',
      error: error.message,
    });
  }
};

/**
 * Create new order
 */
export const createOrder = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.id;

    // Validate request body
    const validation = validateOrderCreate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Check if customer exists
    const customer = await customerModel.getCustomerById(
      req.body.customer_id,
      orgId
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Validate products and get their current prices
    const validatedItems = [];
    for (const item of req.body.items) {
      const product = await productModel.getProductById(item.product_id, orgId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product_id} not found`,
        });
      }

      if (!product.is_active) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not active`,
        });
      }

      // Use current product price if not provided
      const unitPrice = item.unit_price || product.price;
      const taxRate =
        item.tax_rate === undefined ? product.tax_rate || 0 : item.tax_rate;

      validatedItems.push({
        ...item,
        unit_price: unitPrice,
        tax_rate: taxRate,
      });
    }

    // Create order with validated items
    const orderData = {
      ...req.body,
      items: validatedItems,
    };

    const order = await orderModel.createOrder(orderData, orgId, userId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error in createOrder controller:', error);

    // Handle specific errors
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    // Validate request body
    const validation = validateOrderStatusUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Check if order exists
    const existingOrder = await orderModel.getOrderById(id, orgId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Prevent status change if order is cancelled
    if (existingOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a cancelled order',
      });
    }

    const order = await orderModel.updateOrderStatus(
      id,
      req.body.status,
      orgId
    );

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error in updateOrderStatus controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message,
    });
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    // Validate request body
    const validation = validatePaymentUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Check if order exists
    const existingOrder = await orderModel.getOrderById(id, orgId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const { payment_status, paid_amount } = req.body;
    const paidAmountValue =
      paid_amount === undefined ? existingOrder.total : paid_amount;

    // Validate paid amount doesn't exceed total
    if (paidAmountValue > existingOrder.total) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot exceed order total',
      });
    }

    const order = await orderModel.updatePaymentStatus(
      id,
      payment_status,
      paidAmountValue,
      orgId
    );

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error in updatePaymentStatus controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message,
    });
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    // Check if order exists
    const existingOrder = await orderModel.getOrderById(id, orgId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order is already cancelled
    if (existingOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    // Prevent cancellation of delivered orders
    if (existingOrder.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message:
          'Cannot cancel a delivered order. Please create a return instead.',
      });
    }

    const order = await orderModel.cancelOrder(id, orgId);

    res.json({
      success: true,
      message: 'Order cancelled successfully. Stock has been restored.',
      data: order,
    });
  } catch (error) {
    console.error('Error in cancelOrder controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message,
    });
  }
};

/**
 * Delete order
 */
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    // Check if order exists
    const existingOrder = await orderModel.getOrderById(id, orgId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const order = await orderModel.deleteOrder(id, orgId);

    res.json({
      success: true,
      message: 'Order deleted successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error in deleteOrder controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message,
    });
  }
};

/**
 * Get sales statistics
 */
export const getSalesStatistics = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { start_date, end_date } = req.query;

    // Validate date range if provided
    if (start_date || end_date) {
      const dateValidation = validateDateRange({ start_date, end_date });
      if (!dateValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date range',
          errors: dateValidation.errors,
        });
      }
    }

    const statistics = await orderModel.getSalesStatistics(orgId, {
      start_date,
      end_date,
    });

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error in getSalesStatistics controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving sales statistics',
      error: error.message,
    });
  }
};

/**
 * Get top selling products
 */
export const getTopSellingProducts = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { start_date, end_date, limit = 10 } = req.query;

    // Validate date range if provided
    if (start_date || end_date) {
      const dateValidation = validateDateRange({ start_date, end_date });
      if (!dateValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date range',
          errors: dateValidation.errors,
        });
      }
    }

    const products = await orderModel.getTopSellingProducts(
      orgId,
      Number.parseInt(limit),
      { start_date, end_date }
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error in getTopSellingProducts controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving top selling products',
      error: error.message,
    });
  }
};

/**
 * Get customer orders
 */
export const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    const orgId = req.user.org_id;

    // Check if customer exists
    const customer = await customerModel.getCustomerById(customerId, orgId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const orders = await orderModel.getCustomerOrders(customerId, orgId);

    res.json({
      success: true,
      data: orders,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error('Error in getCustomerOrders controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving customer orders',
      error: error.message,
    });
  }
};

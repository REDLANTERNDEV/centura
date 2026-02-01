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
 * Helper: Get organization ID from validated context
 * SECURITY: Prioritizes organization context from header over JWT token
 * This ensures proper multi-tenant isolation when users switch organizations
 */
const getOrgId = req => {
  return req.organization?.id || req.user.org_id;
};

/**
 * Get all orders for organization
 * SECURITY: Uses validated organization context from X-Organization-ID header
 */
export const getAllOrders = async (req, res) => {
  try {
    const orgId = getOrgId(req);

    // DEBUG: Log organization context
    console.log('📦 getAllOrders - Organization Context:', {
      org_id: orgId,
      from_header: req.organization?.id,
      from_jwt: req.user.org_id,
      user_email: req.user.email,
      header_value: req.headers['x-organization-id'],
    });

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
    const orgId = getOrgId(req);

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
    const orgId = getOrgId(req);
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

      // Use base_price (KDV hariç) for order calculations
      // unit_price should be the base price, VAT is calculated separately
      const unitPrice = item.unit_price || product.base_price;
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
    const orgId = getOrgId(req);

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
    const orgId = getOrgId(req);

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
 * Update order (full update with items, notes, etc.)
 */
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = getOrgId(req);

    // Check if order exists
    const existingOrder = await orderModel.getOrderById(id, orgId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Prevent editing fully delivered and paid orders or cancelled orders (business rule)
    // Allow editing if delivered but payment not complete
    if (
      existingOrder.status === 'delivered' &&
      existingOrder.payment_status === 'paid'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit fully delivered and paid orders',
      });
    }

    if (existingOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit cancelled orders',
      });
    }

    const { status, payment_status, paid_amount, notes, items } = req.body;

    // If items are provided, update them
    if (items && items.length > 0) {
      // Validate all products exist
      for (const item of items) {
        const product = await productModel.getProductById(
          item.product_id,
          orgId
        );
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product not found: ${item.product_id}`,
          });
        }
      }

      // Delete old items and add new ones
      await orderModel.deleteOrderItems(id, orgId);

      let total = 0;
      for (const item of items) {
        const product = await productModel.getProductById(
          item.product_id,
          orgId
        );
        // Use base_price for calculations, VAT calculated separately
        const itemSubtotal = product.base_price * item.quantity;
        const itemTax = itemSubtotal * (product.tax_rate / 100);
        const itemTotal = itemSubtotal + itemTax;
        total += itemTotal;

        // Pass product snapshot to preserve product info at order time
        await orderModel.addOrderItem(
          {
            order_id: id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: product.base_price,
            tax_rate: product.tax_rate,
          },
          {
            product_name: product.name,
            product_sku: product.sku,
            product_category: product.category_id,
          }
        );
      }

      // Update order total
      await orderModel.updateOrderTotal(id, total, orgId);
    }

    // Update order fields
    const updateData = {};
    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;
    if (paid_amount !== undefined) updateData.paid_amount = paid_amount;
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length > 0) {
      await orderModel.updateOrderFields(id, updateData, orgId);
    }

    // Get updated order
    const updatedOrder = await orderModel.getOrderById(id, orgId);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error in updateOrder controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
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
    const orgId = getOrgId(req);

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
    const orgId = getOrgId(req);

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
    const orgId = getOrgId(req);
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
    const orgId = getOrgId(req);
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
    const orgId = getOrgId(req);

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

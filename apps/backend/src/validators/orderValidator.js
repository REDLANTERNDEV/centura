/**
 * Order Validator
 * Validates order-related requests
 */

/**
 * Validate order creation data
 * @param {object} data - Order data to validate
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateOrderCreate = data => {
  const errors = [];
  const { customer_id, items, order_date } = data;

  // Required fields
  if (!customer_id) {
    errors.push('Customer ID is required');
  } else if (!Number.isInteger(customer_id) || customer_id <= 0) {
    errors.push('Customer ID must be a positive integer');
  }

  // Items validation
  if (!items || !Array.isArray(items)) {
    errors.push('Items array is required');
  } else if (items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    // Validate each item
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const itemErrors = [];

      if (!item.product_id) {
        itemErrors.push('Product ID is required');
      } else if (!Number.isInteger(item.product_id) || item.product_id <= 0) {
        itemErrors.push('Product ID must be a positive integer');
      }

      if (!item.quantity) {
        itemErrors.push('Quantity is required');
      } else if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        itemErrors.push('Quantity must be a positive integer');
      }

      if (item.unit_price === undefined || item.unit_price === null) {
        itemErrors.push('Unit price is required');
      } else if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
        itemErrors.push('Unit price must be a positive number');
      }

      if (item.tax_rate !== undefined && item.tax_rate !== null) {
        if (
          typeof item.tax_rate !== 'number' ||
          item.tax_rate < 0 ||
          item.tax_rate > 100
        ) {
          itemErrors.push('Tax rate must be between 0 and 100');
        }
      }

      if (item.discount_amount !== undefined && item.discount_amount !== null) {
        if (
          typeof item.discount_amount !== 'number' ||
          item.discount_amount < 0
        ) {
          itemErrors.push('Discount amount must be a positive number');
        }
      }

      if (itemErrors.length > 0) {
        errors.push(`Item ${index + 1}: ${itemErrors.join(', ')}`);
      }
    }
  }

  // Order date validation (optional)
  if (order_date !== undefined && order_date !== null) {
    const date = new Date(order_date);
    if (Number.isNaN(date.getTime())) {
      errors.push('Invalid order date format');
    }
  }

  // Expected delivery date validation (optional)
  if (
    data.expected_delivery_date !== undefined &&
    data.expected_delivery_date !== null
  ) {
    const date = new Date(data.expected_delivery_date);
    if (Number.isNaN(date.getTime())) {
      errors.push('Invalid expected delivery date format');
    }
  }

  // Status validation (optional)
  const validStatuses = [
    'draft',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Payment status validation (optional)
  const validPaymentStatuses = ['pending', 'partial', 'paid', 'refunded'];
  if (
    data.payment_status &&
    !validPaymentStatuses.includes(data.payment_status)
  ) {
    errors.push(
      `Payment status must be one of: ${validPaymentStatuses.join(', ')}`
    );
  }

  // Discount validation (optional)
  if (
    data.discount_percentage !== undefined &&
    data.discount_percentage !== null
  ) {
    if (
      typeof data.discount_percentage !== 'number' ||
      data.discount_percentage < 0 ||
      data.discount_percentage > 100
    ) {
      errors.push('Discount percentage must be between 0 and 100');
    }
  }

  if (data.discount_amount !== undefined && data.discount_amount !== null) {
    if (typeof data.discount_amount !== 'number' || data.discount_amount < 0) {
      errors.push('Discount amount must be a positive number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate order status update
 * @param {object} data - Status update data
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateOrderStatusUpdate = data => {
  const errors = [];
  const { status } = data;

  const validStatuses = [
    'draft',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  if (!status) {
    errors.push('Status is required');
  } else if (!validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate payment update
 * @param {object} data - Payment update data
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validatePaymentUpdate = data => {
  const errors = [];
  const { payment_status, paid_amount } = data;

  const validPaymentStatuses = ['pending', 'partial', 'paid', 'refunded'];

  if (!payment_status) {
    errors.push('Payment status is required');
  } else if (!validPaymentStatuses.includes(payment_status)) {
    errors.push(
      `Payment status must be one of: ${validPaymentStatuses.join(', ')}`
    );
  }

  if (paid_amount !== undefined && paid_amount !== null) {
    if (typeof paid_amount !== 'number' || paid_amount < 0) {
      errors.push('Paid amount must be a positive number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate date range filters
 * @param {object} data - Date range data
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateDateRange = data => {
  const errors = [];
  const { start_date, end_date } = data;

  if (start_date) {
    const startDate = new Date(start_date);
    if (Number.isNaN(startDate.getTime())) {
      errors.push('Invalid start date format');
    }
  }

  if (end_date) {
    const endDate = new Date(end_date);
    if (Number.isNaN(endDate.getTime())) {
      errors.push('Invalid end date format');
    }
  }

  if (start_date && end_date) {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate > endDate) {
      errors.push('Start date must be before or equal to end date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

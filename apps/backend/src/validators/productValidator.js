/**
 * Product Validator
 * Validates product-related requests
 */

/**
 * Validate product creation data
 * @param {object} data - Product data to validate
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateProductCreate = data => {
  const errors = [];
  const { name, sku, category, base_price, cost_price, stock_quantity, unit } =
    data;

  // Required fields
  if (!name || name.trim().length === 0) {
    errors.push('Product name is required');
  } else if (name.length > 255) {
    errors.push('Product name must be less than 255 characters');
  }

  if (!sku || sku.trim().length === 0) {
    errors.push('SKU is required');
  } else if (sku.length > 100) {
    errors.push('SKU must be less than 100 characters');
  }

  if (!category || category.trim().length === 0) {
    errors.push('Category is required');
  }

  // Base price validation (price without tax)
  if (base_price === undefined || base_price === null) {
    errors.push('Base price is required');
  } else if (typeof base_price !== 'number' || base_price < 0) {
    errors.push('Base price must be a positive number');
  }

  // Cost price validation (optional but must be valid if provided)
  if (cost_price !== undefined && cost_price !== null) {
    if (typeof cost_price !== 'number' || cost_price < 0) {
      errors.push('Cost price must be a positive number');
    }
  }

  // Stock quantity validation
  if (stock_quantity === undefined || stock_quantity === null) {
    errors.push('Stock quantity is required');
  } else if (!Number.isInteger(stock_quantity) || stock_quantity < 0) {
    errors.push('Stock quantity must be a positive integer');
  }

  // Unit validation
  if (!unit || unit.trim().length === 0) {
    errors.push('Unit is required (e.g., pcs, kg, liter)');
  }

  // Tax rate validation (optional)
  if (data.tax_rate !== undefined && data.tax_rate !== null) {
    if (
      typeof data.tax_rate !== 'number' ||
      data.tax_rate < 0 ||
      data.tax_rate > 100
    ) {
      errors.push('Tax rate must be between 0 and 100');
    }
  }

  // Low stock threshold validation (optional)
  if (
    data.low_stock_threshold !== undefined &&
    data.low_stock_threshold !== null
  ) {
    if (
      !Number.isInteger(data.low_stock_threshold) ||
      data.low_stock_threshold < 0
    ) {
      errors.push('Low stock threshold must be a positive integer');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate product update data
 * @param {object} data - Product data to validate
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateProductUpdate = data => {
  const errors = [];

  // At least one field must be provided
  const allowedFields = new Set([
    'name',
    'description',
    'sku',
    'barcode',
    'category',
    'base_price',
    'cost_price',
    'tax_rate',
    'stock_quantity',
    'low_stock_threshold',
    'unit',
    'is_active',
  ]);

  const providedFields = Object.keys(data).filter(key =>
    allowedFields.has(key)
  );

  if (providedFields.length === 0) {
    errors.push('At least one field must be provided for update');
    return { isValid: false, errors };
  }

  // Validate each provided field
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name cannot be empty');
    } else if (data.name.length > 255) {
      errors.push('Product name must be less than 255 characters');
    }
  }

  if (data.sku !== undefined) {
    if (!data.sku || data.sku.trim().length === 0) {
      errors.push('SKU cannot be empty');
    } else if (data.sku.length > 100) {
      errors.push('SKU must be less than 100 characters');
    }
  }

  if (data.category !== undefined) {
    if (!data.category || data.category.trim().length === 0) {
      errors.push('Category cannot be empty');
    }
  }

  if (data.base_price !== undefined) {
    if (typeof data.base_price !== 'number' || data.base_price < 0) {
      errors.push('Base price must be a positive number');
    }
  }

  if (data.cost_price !== undefined && data.cost_price !== null) {
    if (typeof data.cost_price !== 'number' || data.cost_price < 0) {
      errors.push('Cost price must be a positive number');
    }
  }

  if (data.stock_quantity !== undefined) {
    if (!Number.isInteger(data.stock_quantity) || data.stock_quantity < 0) {
      errors.push('Stock quantity must be a positive integer');
    }
  }

  if (data.tax_rate !== undefined && data.tax_rate !== null) {
    if (
      typeof data.tax_rate !== 'number' ||
      data.tax_rate < 0 ||
      data.tax_rate > 100
    ) {
      errors.push('Tax rate must be between 0 and 100');
    }
  }

  if (
    data.low_stock_threshold !== undefined &&
    data.low_stock_threshold !== null
  ) {
    if (
      !Number.isInteger(data.low_stock_threshold) ||
      data.low_stock_threshold < 0
    ) {
      errors.push('Low stock threshold must be a positive integer');
    }
  }

  if (data.unit !== undefined) {
    if (!data.unit || data.unit.trim().length === 0) {
      errors.push('Unit cannot be empty');
    }
  }

  if (data.is_active !== undefined) {
    if (typeof data.is_active !== 'boolean') {
      errors.push('is_active must be a boolean');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate stock update data
 * @param {object} data - Stock update data
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateStockUpdate = data => {
  const errors = [];
  const { quantity, type } = data;

  if (quantity === undefined || quantity === null) {
    errors.push('Quantity is required');
  } else if (!Number.isInteger(quantity) || quantity === 0) {
    errors.push('Quantity must be a non-zero integer');
  }

  if (type && !['add', 'subtract'].includes(type)) {
    errors.push('Type must be either "add" or "subtract"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

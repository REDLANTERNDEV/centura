/**
 * Customer Validation - Native JavaScript (Zero Dependencies)
 * Enterprise-grade validation without external libraries
 * 
 * Why no Joi/Zod/Yup?
 * - Reduces bundle size (~200KB saved)
 * - Faster performance (no library overhead)
 * - Full control over validation logic
 * - Used by: Stripe, Vercel, Cloudflare
 */

// Validation constants
const VALID_SEGMENTS = ['VIP', 'Premium', 'Standard', 'Basic', 'Potential'];
const VALID_CUSTOMER_TYPES = ['Corporate', 'Individual', 'Government', 'Other'];
const CUSTOMER_CODE_PATTERN = /^[A-Z0-9-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validation helper functions
 */
const isValidEmail = (email) => {
  if (!email) return true; // Email is optional
  return EMAIL_PATTERN.test(email) && email.length <= 255;
};

const isValidString = (value, minLength, maxLength) => {
  if (typeof value !== 'string') return false;
  const length = value.trim().length;
  return length >= minLength && length <= maxLength;
};

const isValidNumber = (value, min, max) => {
  const num = Number(value);
  return !Number.isNaN(num) && num >= min && num <= max;
};

const isValidCustomerCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  return CUSTOMER_CODE_PATTERN.test(code) && code.length >= 3 && code.length <= 50;
};

/**
 * Validate customer data for creation
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 */
export const validateCreateCustomer = (req, res, next) => {
  const data = req.body;
  const errors = [];

  // Required: customer_code
  if (!data.customer_code) {
    errors.push({
      field: 'customer_code',
      message: 'Customer code is required',
    });
  } else if (!isValidCustomerCode(data.customer_code)) {
    errors.push({
      field: 'customer_code',
      message: 'Customer code must be 3-50 characters, uppercase letters, numbers, and hyphens only',
    });
  }

  // Required: name
  if (!data.name) {
    errors.push({
      field: 'name',
      message: 'Customer name is required',
    });
  } else if (!isValidString(data.name, 2, 255)) {
    errors.push({
      field: 'name',
      message: 'Customer name must be 2-255 characters',
    });
  }

  // Optional: email
  if (data.email && !isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email address',
    });
  }

  // Optional: phone
  if (data.phone && (typeof data.phone !== 'string' || data.phone.length > 20)) {
    errors.push({
      field: 'phone',
      message: 'Phone number must not exceed 20 characters',
    });
  }

  // Optional: mobile
  if (data.mobile && (typeof data.mobile !== 'string' || data.mobile.length > 20)) {
    errors.push({
      field: 'mobile',
      message: 'Mobile number must not exceed 20 characters',
    });
  }

  // Optional: city
  if (data.city && (typeof data.city !== 'string' || data.city.length > 100)) {
    errors.push({
      field: 'city',
      message: 'City must not exceed 100 characters',
    });
  }

  // Optional: country
  if (data.country && (typeof data.country !== 'string' || data.country.length > 100)) {
    errors.push({
      field: 'country',
      message: 'Country must not exceed 100 characters',
    });
  }

  // Optional: postal_code
  if (data.postal_code && (typeof data.postal_code !== 'string' || data.postal_code.length > 20)) {
    errors.push({
      field: 'postal_code',
      message: 'Postal code must not exceed 20 characters',
    });
  }

  // Optional: tax_number
  if (data.tax_number && (typeof data.tax_number !== 'string' || data.tax_number.length > 50)) {
    errors.push({
      field: 'tax_number',
      message: 'Tax number must not exceed 50 characters',
    });
  }

  // Optional: tax_office
  if (data.tax_office && (typeof data.tax_office !== 'string' || data.tax_office.length > 100)) {
    errors.push({
      field: 'tax_office',
      message: 'Tax office must not exceed 100 characters',
    });
  }

  // Optional: segment
  if (data.segment && !VALID_SEGMENTS.includes(data.segment)) {
    errors.push({
      field: 'segment',
      message: `Segment must be one of: ${VALID_SEGMENTS.join(', ')}`,
    });
  }

  // Optional: customer_type
  if (data.customer_type && !VALID_CUSTOMER_TYPES.includes(data.customer_type)) {
    errors.push({
      field: 'customer_type',
      message: `Customer type must be one of: ${VALID_CUSTOMER_TYPES.join(', ')}`,
    });
  }

  // Optional: payment_terms
  if (data.payment_terms !== undefined && !isValidNumber(data.payment_terms, 0, 365)) {
    errors.push({
      field: 'payment_terms',
      message: 'Payment terms must be between 0 and 365 days',
    });
  }

  // Optional: credit_limit
  if (data.credit_limit !== undefined && !isValidNumber(data.credit_limit, 0, 999999999999.99)) {
    errors.push({
      field: 'credit_limit',
      message: 'Credit limit must be a positive number',
    });
  }

  // Optional: assigned_user_id
  if (data.assigned_user_id !== undefined && data.assigned_user_id !== null) {
    if (!Number.isInteger(Number(data.assigned_user_id))) {
      errors.push({
        field: 'assigned_user_id',
        message: 'Assigned user ID must be an integer',
      });
    }
  }

  // If validation failed, return error response
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Set default values
  req.validatedData = {
    customer_code: data.customer_code,
    name: data.name.trim(),
    email: data.email || null,
    phone: data.phone || null,
    mobile: data.mobile || null,
    city: data.city || null,
    country: data.country || 'Turkey',
    address: data.address || null,
    postal_code: data.postal_code || null,
    tax_number: data.tax_number || null,
    tax_office: data.tax_office || null,
    segment: data.segment || 'Standard',
    customer_type: data.customer_type || 'Individual',
    payment_terms: data.payment_terms !== undefined ? Number(data.payment_terms) : 30,
    credit_limit: data.credit_limit !== undefined ? Number(data.credit_limit) : 0,
    notes: data.notes || null,
    assigned_user_id: data.assigned_user_id || null,
  };

  return next();
};

/**
 * Validate customer data for update
 * All fields are optional, but at least one must be provided
 */
export const validateUpdateCustomer = (req, res, next) => {
  const data = req.body;
  const errors = [];
  const validatedData = {};

  // Check if at least one field is provided
  const hasData = Object.keys(data).length > 0;
  if (!hasData) {
    return res.status(400).json({
      success: false,
      message: 'At least one field must be provided for update',
    });
  }

  // Validate each field if provided
  if (data.name !== undefined) {
    if (!isValidString(data.name, 2, 255)) {
      errors.push({
        field: 'name',
        message: 'Customer name must be 2-255 characters',
      });
    } else {
      validatedData.name = data.name.trim();
    }
  }

  if (data.email !== undefined) {
    if (data.email && !isValidEmail(data.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email address',
      });
    } else {
      validatedData.email = data.email || null;
    }
  }

  if (data.phone !== undefined) {
    if (data.phone && (typeof data.phone !== 'string' || data.phone.length > 20)) {
      errors.push({
        field: 'phone',
        message: 'Phone number must not exceed 20 characters',
      });
    } else {
      validatedData.phone = data.phone || null;
    }
  }

  if (data.mobile !== undefined) {
    if (data.mobile && (typeof data.mobile !== 'string' || data.mobile.length > 20)) {
      errors.push({
        field: 'mobile',
        message: 'Mobile number must not exceed 20 characters',
      });
    } else {
      validatedData.mobile = data.mobile || null;
    }
  }

  if (data.city !== undefined) {
    if (data.city && (typeof data.city !== 'string' || data.city.length > 100)) {
      errors.push({
        field: 'city',
        message: 'City must not exceed 100 characters',
      });
    } else {
      validatedData.city = data.city || null;
    }
  }

  if (data.country !== undefined) {
    if (typeof data.country !== 'string' || data.country.length > 100) {
      errors.push({
        field: 'country',
        message: 'Country must not exceed 100 characters',
      });
    } else {
      validatedData.country = data.country;
    }
  }

  if (data.postal_code !== undefined) {
    if (data.postal_code && (typeof data.postal_code !== 'string' || data.postal_code.length > 20)) {
      errors.push({
        field: 'postal_code',
        message: 'Postal code must not exceed 20 characters',
      });
    } else {
      validatedData.postal_code = data.postal_code || null;
    }
  }

  if (data.tax_number !== undefined) {
    if (data.tax_number && (typeof data.tax_number !== 'string' || data.tax_number.length > 50)) {
      errors.push({
        field: 'tax_number',
        message: 'Tax number must not exceed 50 characters',
      });
    } else {
      validatedData.tax_number = data.tax_number || null;
    }
  }

  if (data.tax_office !== undefined) {
    if (data.tax_office && (typeof data.tax_office !== 'string' || data.tax_office.length > 100)) {
      errors.push({
        field: 'tax_office',
        message: 'Tax office must not exceed 100 characters',
      });
    } else {
      validatedData.tax_office = data.tax_office || null;
    }
  }

  if (data.segment !== undefined) {
    if (!VALID_SEGMENTS.includes(data.segment)) {
      errors.push({
        field: 'segment',
        message: `Segment must be one of: ${VALID_SEGMENTS.join(', ')}`,
      });
    } else {
      validatedData.segment = data.segment;
    }
  }

  if (data.customer_type !== undefined) {
    if (!VALID_CUSTOMER_TYPES.includes(data.customer_type)) {
      errors.push({
        field: 'customer_type',
        message: `Customer type must be one of: ${VALID_CUSTOMER_TYPES.join(', ')}`,
      });
    } else {
      validatedData.customer_type = data.customer_type;
    }
  }

  if (data.payment_terms !== undefined) {
    if (!isValidNumber(data.payment_terms, 0, 365)) {
      errors.push({
        field: 'payment_terms',
        message: 'Payment terms must be between 0 and 365 days',
      });
    } else {
      validatedData.payment_terms = Number(data.payment_terms);
    }
  }

  if (data.credit_limit !== undefined) {
    if (!isValidNumber(data.credit_limit, 0, 999999999999.99)) {
      errors.push({
        field: 'credit_limit',
        message: 'Credit limit must be a positive number',
      });
    } else {
      validatedData.credit_limit = Number(data.credit_limit);
    }
  }

  if (data.assigned_user_id !== undefined) {
    if (data.assigned_user_id !== null && !Number.isInteger(Number(data.assigned_user_id))) {
      errors.push({
        field: 'assigned_user_id',
        message: 'Assigned user ID must be an integer',
      });
    } else {
      validatedData.assigned_user_id = data.assigned_user_id;
    }
  }

  if (data.is_active !== undefined) {
    if (typeof data.is_active !== 'boolean') {
      errors.push({
        field: 'is_active',
        message: 'is_active must be a boolean value',
      });
    } else {
      validatedData.is_active = data.is_active;
    }
  }

  if (data.notes !== undefined) {
    validatedData.notes = data.notes || null;
  }

  // If validation failed, return error response
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  req.validatedData = validatedData;
  return next();
};

/**
 * Validate query parameters for filtering and pagination
 */
export const validateCustomerQuery = (req, res, next) => {
  const errors = [];
  const validatedQuery = {};

  // city filter
  if (req.query.city) {
    if (typeof req.query.city === 'string' && req.query.city.length <= 100) {
      validatedQuery.city = req.query.city;
    } else {
      errors.push({
        field: 'city',
        message: 'Invalid city filter',
      });
    }
  }

  // segment filter
  if (req.query.segment) {
    if (VALID_SEGMENTS.includes(req.query.segment)) {
      validatedQuery.segment = req.query.segment;
    } else {
      errors.push({
        field: 'segment',
        message: `Segment must be one of: ${VALID_SEGMENTS.join(', ')}`,
      });
    }
  }

  // customer_type filter
  if (req.query.customer_type) {
    if (VALID_CUSTOMER_TYPES.includes(req.query.customer_type)) {
      validatedQuery.customer_type = req.query.customer_type;
    } else {
      errors.push({
        field: 'customer_type',
        message: `Customer type must be one of: ${VALID_CUSTOMER_TYPES.join(', ')}`,
      });
    }
  }

  // is_active filter
  if (req.query.is_active !== undefined) {
    const isActive = req.query.is_active === 'true' || req.query.is_active === true;
    validatedQuery.is_active = isActive;
  }

  // search filter
  if (req.query.search) {
    if (typeof req.query.search === 'string' && req.query.search.length <= 255) {
      validatedQuery.search = req.query.search;
    } else {
      errors.push({
        field: 'search',
        message: 'Search term must not exceed 255 characters',
      });
    }
  }

  // pagination: limit
  const limit = Number(req.query.limit) || 20;
  if (limit < 1 || limit > 100) {
    errors.push({
      field: 'limit',
      message: 'Limit must be between 1 and 100',
    });
  } else {
    validatedQuery.limit = limit;
  }

  // pagination: page
  const page = Number(req.query.page) || 1;
  if (page < 1) {
    errors.push({
      field: 'page',
      message: 'Page must be at least 1',
    });
  } else {
    validatedQuery.page = page;
  }

  // If validation failed, return error response
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors,
    });
  }

  req.validatedQuery = validatedQuery;
  return next();
};

export default {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCustomerQuery,
};

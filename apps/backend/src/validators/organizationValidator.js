/**
 * Organization Validation - Native JavaScript
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate organization data for creation
 */
export const validateCreateOrganization = (req, res, next) => {
  const data = req.body;
  const errors = [];

  // Required: org_name
  if (!data.org_name) {
    errors.push({
      field: 'org_name',
      message: 'Organization name is required',
    });
  } else if (
    typeof data.org_name !== 'string' ||
    data.org_name.trim().length < 2 ||
    data.org_name.trim().length > 255
  ) {
    errors.push({
      field: 'org_name',
      message: 'Organization name must be 2-255 characters',
    });
  }

  // Optional: email
  if (
    data.email &&
    (!EMAIL_PATTERN.test(data.email) || data.email.length > 255)
  ) {
    errors.push({
      field: 'email',
      message: 'Invalid email address',
    });
  }

  // Optional: phone
  if (
    data.phone &&
    (typeof data.phone !== 'string' || data.phone.length > 20)
  ) {
    errors.push({
      field: 'phone',
      message: 'Phone number must not exceed 20 characters',
    });
  }

  // Optional: industry
  if (
    data.industry &&
    (typeof data.industry !== 'string' || data.industry.length > 100)
  ) {
    errors.push({
      field: 'industry',
      message: 'Industry must not exceed 100 characters',
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
  if (
    data.country &&
    (typeof data.country !== 'string' || data.country.length > 100)
  ) {
    errors.push({
      field: 'country',
      message: 'Country must not exceed 100 characters',
    });
  }

  // Optional: tax_number
  if (
    data.tax_number &&
    (typeof data.tax_number !== 'string' || data.tax_number.length > 50)
  ) {
    errors.push({
      field: 'tax_number',
      message: 'Tax number must not exceed 50 characters',
    });
  }

  // If validation failed, return error response
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Set validated data
  req.validatedData = {
    org_name: data.org_name.trim(),
    industry: data.industry || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    city: data.city || null,
    country: data.country || 'Turkey',
    tax_number: data.tax_number || null,
  };

  return next();
};

/**
 * Validate organization data for update
 */
export const validateUpdateOrganization = (req, res, next) => {
  const data = req.body;
  const errors = [];
  const validatedData = {};

  // Check if at least one field is provided
  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one field must be provided for update',
    });
  }

  // Validate each field if provided
  if (data.org_name !== undefined) {
    if (
      typeof data.org_name !== 'string' ||
      data.org_name.trim().length < 2 ||
      data.org_name.trim().length > 255
    ) {
      errors.push({
        field: 'org_name',
        message: 'Organization name must be 2-255 characters',
      });
    } else {
      validatedData.org_name = data.org_name.trim();
    }
  }

  if (data.email !== undefined) {
    if (
      data.email &&
      (!EMAIL_PATTERN.test(data.email) || data.email.length > 255)
    ) {
      errors.push({
        field: 'email',
        message: 'Invalid email address',
      });
    } else {
      validatedData.email = data.email || null;
    }
  }

  if (data.phone !== undefined) {
    if (
      data.phone &&
      (typeof data.phone !== 'string' || data.phone.length > 20)
    ) {
      errors.push({
        field: 'phone',
        message: 'Phone number must not exceed 20 characters',
      });
    } else {
      validatedData.phone = data.phone || null;
    }
  }

  if (data.industry !== undefined) {
    if (
      data.industry &&
      (typeof data.industry !== 'string' || data.industry.length > 100)
    ) {
      errors.push({
        field: 'industry',
        message: 'Industry must not exceed 100 characters',
      });
    } else {
      validatedData.industry = data.industry || null;
    }
  }

  if (data.city !== undefined) {
    if (
      data.city &&
      (typeof data.city !== 'string' || data.city.length > 100)
    ) {
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

  if (data.tax_number !== undefined) {
    if (
      data.tax_number &&
      (typeof data.tax_number !== 'string' || data.tax_number.length > 50)
    ) {
      errors.push({
        field: 'tax_number',
        message: 'Tax number must not exceed 50 characters',
      });
    } else {
      validatedData.tax_number = data.tax_number || null;
    }
  }

  if (data.address !== undefined) {
    validatedData.address = data.address || null;
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

export default {
  validateCreateOrganization,
  validateUpdateOrganization,
};

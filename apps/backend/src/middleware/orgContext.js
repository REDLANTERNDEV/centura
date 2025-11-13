/**
 * Organization Context Middleware
 *
 * SECURITY: Validates that the user has access to the organization
 * specified in the X-Organization-ID header
 *
 * Industry Standard Pattern (Slack, Salesforce, Linear):
 * 1. Frontend sends X-Organization-ID header with every request
 * 2. Backend validates user has access to that organization
 * 3. All queries are scoped to that organization
 *
 * This prevents:
 * - Cross-organization data leaks
 * - Unauthorized access to other orgs
 * - Client-side manipulation of org context
 */

import { getMessage } from '../config/messages.js';

/**
 * Validates organization context from request header
 * Should be used AFTER verifyToken middleware
 * Supports both UUID (industry standard) and numeric ID (backward compatibility)
 */
export const validateOrgContext = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: getMessage('AUTH.NOT_AUTHENTICATED'),
      });
    }

    // Get organization ID from header
    const orgIdentifier = req.headers['x-organization-id'];

    console.log('🔍 Organization Context Debug:', {
      url: req.url,
      method: req.method,
      headers: {
        'x-organization-id': orgIdentifier,
        'content-type': req.headers['content-type'],
      },
      user: req.user?.email,
    });

    if (!orgIdentifier) {
      console.warn('⚠️ Missing X-Organization-ID header');
      return res.status(400).json({
        success: false,
        message:
          'Organization context is required. Please select an organization.',
        code: 'ORG_CONTEXT_REQUIRED',
      });
    }

    // Determine if identifier is UUID or numeric ID
    const isUUID =
      typeof orgIdentifier === 'string' && orgIdentifier.includes('-');

    // Validate UUID format if it looks like a UUID
    if (isUUID) {
      const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!UUID_REGEX.test(orgIdentifier)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid UUID format',
          code: 'INVALID_UUID_FORMAT',
        });
      }
    }

    // Convert to number if it's numeric
    const orgId = isUUID ? null : Number.parseInt(orgIdentifier);

    if (!isUUID && Number.isNaN(orgId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID format',
        code: 'INVALID_ORG_ID',
      });
    }

    // Get organization by UUID or ID
    const organizationModel = await import('../models/organizationModel.js');
    const organization = await organizationModel.getOrganizationById(
      isUUID ? orgIdentifier : orgId
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORG_NOT_FOUND',
      });
    }

    // SECURITY: Verify user has access to this organization
    const roleModel = await import('../models/roleModel.js');
    const userRole = await roleModel.getUserRoleInOrganization(
      req.user.id,
      organization.org_id // Always use numeric ID for role lookup
    );

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this organization.',
        code: 'ORG_ACCESS_DENIED',
      });
    }

    // Check if user's role is active
    if (!userRole.role_active) {
      return res.status(403).json({
        success: false,
        message: 'Your access to this organization has been deactivated.',
        code: 'ORG_ROLE_INACTIVE',
      });
    }

    // Check if organization is active
    if (!userRole.org_active) {
      return res.status(403).json({
        success: false,
        message: 'This organization is currently inactive.',
        code: 'ORG_INACTIVE',
      });
    }

    // Add validated organization context to request
    req.organization = {
      id: organization.org_id, // Internal numeric ID
      uuid: organization.org_uuid, // Public UUID
      role: userRole.role,
      name: userRole.org_name,
    };

    console.log('✅ Organization context validated:', {
      user_id: req.user.id,
      org_id: organization.org_id,
      org_uuid: organization.org_uuid,
      role: userRole.role,
    });

    return next();
  } catch (error) {
    console.error('Organization context validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate organization context',
      code: 'ORG_VALIDATION_ERROR',
    });
  }
};

/**
 * Optional organization context - validates if header is present
 * Use for endpoints that can work with or without org context
 */
export const optionalOrgContext = async (req, res, next) => {
  const orgIdHeader = req.headers['x-organization-id'];

  if (!orgIdHeader) {
    // No org context, continue without it
    return next();
  }

  // If header is present, validate it
  return validateOrgContext(req, res, next);
};

/**
 * Flexible organization context - tries header first, falls back to JWT token
 * RECOMMENDED for gradual migration from token-based to header-based org context
 */
export const flexibleOrgContext = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: getMessage('AUTH.NOT_AUTHENTICATED'),
      });
    }

    // Try to get organization ID from header first
    const orgIdHeader = req.headers['x-organization-id'];

    console.log('🔍 flexibleOrgContext check:', {
      has_header: Boolean(orgIdHeader),
      header_value: orgIdHeader,
      user_org_id: req.user.org_id,
      user_email: req.user.email,
      url: req.url,
      method: req.method,
    });

    if (orgIdHeader) {
      // Header present, validate it fully
      const orgId = Number.parseInt(orgIdHeader);

      if (!Number.isNaN(orgId)) {
        // SECURITY: Verify user has access to this organization
        const roleModel = await import('../models/roleModel.js');
        const userRole = await roleModel.getUserRoleInOrganization(
          req.user.id,
          orgId
        );

        console.log('🔍 User role check for org_id:', {
          org_id: orgId,
          user_id: req.user.id,
          user_email: req.user.email,
          userRole: userRole,
          has_access: Boolean(userRole),
          role_active: userRole?.role_active,
          org_active: userRole?.org_active,
          role_name: userRole?.role,
        });

        if (userRole && userRole.role_active && userRole.org_active) {
          // Valid header-based context
          req.organization = {
            id: orgId,
            role: userRole.role,
            name: userRole.org_name,
          };
          console.log('✅ Organization context from header:', {
            org_id: orgId,
            user: req.user.email,
            role: userRole.role,
          });
          return next();
        }

        // Determine reason for access denial
        let denialReason = 'Unknown';
        if (!userRole) {
          denialReason = 'No role found';
        } else if (!userRole.role_active) {
          denialReason = 'Role inactive';
        } else if (!userRole.org_active) {
          denialReason = 'Org inactive';
        }

        console.error('❌ User does not have access to org_id:', {
          org_id: orgId,
          user_id: req.user.id,
          user_email: req.user.email,
          userRole,
          reason: denialReason,
        });

        // Don't fallback if header was explicitly provided but invalid
        return res.status(403).json({
          success: false,
          message:
            'Access denied. You do not have access to this organization.',
          code: 'ORG_ACCESS_DENIED',
        });
      }
    }

    // Fallback to JWT token org_id ONLY if no header was provided
    if (req.user.org_id) {
      req.organization = {
        id: req.user.org_id,
        role: null, // Role not available from token
        name: null,
      };
      console.log('⚠️ Organization context from JWT token (fallback):', {
        org_id: req.user.org_id,
        user: req.user.email,
      });
      return next();
    }

    // No organization context available
    return res.status(400).json({
      success: false,
      message:
        'Organization context is required. Please select an organization.',
      code: 'ORG_CONTEXT_REQUIRED',
    });
  } catch (error) {
    console.error('Flexible organization context error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate organization context',
      code: 'ORG_VALIDATION_ERROR',
    });
  }
};

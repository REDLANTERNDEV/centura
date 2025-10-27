import {
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationStats,
} from '../models/organizationModel.js';

/**
 * Organization Controller
 * Handles all organization-related HTTP requests
 */

/**
 * Helper: Check if user has access to organization with specific role
 * @param {number} userId - User ID
 * @param {number} orgId - Organization ID
 * @param {string[]} requiredRoles - Array of allowed roles (e.g., ['org_owner', 'org_admin'])
 * @returns {Promise<object|null>} User's role info or null if no access
 */
const checkUserOrgAccess = async (userId, orgId, requiredRoles = []) => {
  const roleModel = await import('../models/roleModel.js');
  const userRole = await roleModel.getUserRoleInOrganization(userId, orgId);

  console.log('🔍 checkUserOrgAccess DEBUG:', {
    userId,
    orgId,
    requiredRoles,
    userRole,
    hasAccess: Boolean(userRole),
  });

  if (!userRole) {
    return null;
  }

  // If requiredRoles is empty, just check if user has any role
  if (requiredRoles.length === 0) {
    return userRole;
  }

  // Check if user's role is in the required roles
  if (requiredRoles.includes(userRole.role)) {
    return userRole;
  }

  return null;
};

/**
 * Get current user's organizations (all organizations where user has access)
 * GET /api/v1/organizations/me
 */
export const getMyOrganization = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all organizations where user has access via user_organization_roles
    const roleModel = await import('../models/roleModel.js');
    const userOrganizations = await roleModel.getUserOrganizations(userId);

    if (!userOrganizations || userOrganizations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User is not associated with any organization',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Organizations retrieved successfully',
      data: userOrganizations,
      count: userOrganizations.length,
    });
  } catch (error) {
    console.error('Error in getMyOrganization controller:', error);
    return next(error);
  }
};

/**
 * Get all organizations
 * GET /api/v1/organizations
 * Returns all organizations where user has access (via user_organization_roles)
 */
export const getOrganizations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all organizations where user has access
    const roleModel = await import('../models/roleModel.js');
    const userOrganizations = await roleModel.getUserOrganizations(userId);

    return res.status(200).json({
      success: true,
      message: 'Organizations retrieved successfully',
      data: userOrganizations,
      count: userOrganizations.length,
    });
  } catch (error) {
    console.error('Error in getOrganizations controller:', error);
    return next(error);
  }
};

/**
 * Get organization by ID
 * GET /api/v1/organizations/:id
 */
export const getOrganization = async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.id;

    // Check if user has access to this organization (any role)
    const userAccess = await checkUserOrgAccess(userId, orgId);

    if (!userAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this organization',
      });
    }

    const organization = await getOrganizationById(orgId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Organization retrieved successfully',
      data: {
        ...organization,
        your_role: userAccess.role,
      },
    });
  } catch (error) {
    console.error('Error in getOrganization controller:', error);
    return next(error);
  }
};

/**
 * Create a new organization
 * POST /api/v1/organizations
 * User who creates the organization becomes org_owner automatically
 */
export const createNewOrganization = async (req, res, next) => {
  try {
    const orgData = req.validatedData || req.body;
    const userId = req.user.id;

    // Create organization
    const newOrganization = await createOrganization(orgData);

    // Automatically assign creator as org_owner
    const roleModel = await import('../models/roleModel.js');
    await roleModel.default.assignRoleToUser(
      userId,
      newOrganization.org_id,
      'org_owner',
      null // No assigner for initial owner
    );

    return res.status(201).json({
      success: true,
      message:
        'Organization created successfully. You are now the organization owner.',
      data: {
        ...newOrganization,
        your_role: 'org_owner',
      },
    });
  } catch (error) {
    console.error('Error in createNewOrganization controller:', error);

    // Handle unique constraint violations (if any)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Organization name already exists',
      });
    }

    return next(error);
  }
};

/**
 * Update an organization
 * PUT /api/v1/organizations/:id
 * Only org_owner and org_admin can update
 */
export const updateExistingOrganization = async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.id;

    // Check if user has admin access (org_owner or org_admin)
    const userAccess = await checkUserOrgAccess(userId, orgId, [
      'org_owner',
      'org_admin',
    ]);

    if (!userAccess) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied. Only organization owners and admins can update the organization',
      });
    }

    const orgData = req.validatedData || req.body;

    // Check if organization exists
    const existingOrg = await getOrganizationById(orgId);
    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Update organization
    const updatedOrganization = await updateOrganization(orgId, orgData);

    if (!updatedOrganization) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update organization',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: updatedOrganization,
    });
  } catch (error) {
    console.error('Error in updateExistingOrganization controller:', error);
    return next(error);
  }
};

/**
 * Delete an organization (soft delete)
 * DELETE /api/v1/organizations/:id
 * Only org_owner can delete their organization
 */
export const deleteExistingOrganization = async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.id;

    // Only org_owner can delete organization
    const userAccess = await checkUserOrgAccess(userId, orgId, ['org_owner']);

    if (!userAccess) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied. Only the organization owner can delete the organization',
      });
    }

    // Check if organization exists
    const existingOrg = await getOrganizationById(orgId);
    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Soft delete organization
    const deleted = await deleteOrganization(orgId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete organization',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Organization deactivated successfully',
    });
  } catch (error) {
    console.error('Error in deleteExistingOrganization controller:', error);
    return next(error);
  }
};

/**
 * Get organization statistics
 * GET /api/v1/organizations/:id/stats
 */
export const getOrgStats = async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.id;

    // Check if user has access to this organization (any role)
    const userAccess = await checkUserOrgAccess(userId, orgId);

    if (!userAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this organization',
      });
    }

    const stats = await getOrganizationStats(orgId);

    return res.status(200).json({
      success: true,
      message: 'Organization statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Error in getOrgStats controller:', error);
    return next(error);
  }
};

/**
 * Get all users in an organization with their roles
 * Requires: org_owner or org_admin role
 * GET /api/v1/organizations/:id/users
 */
export const getOrganizationUsers = async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.id;

    // Check if user has admin access (org_owner or org_admin only)
    const userAccess = await checkUserOrgAccess(userId, orgId, [
      'org_owner',
      'org_admin',
    ]);

    if (!userAccess) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied. Only organization owners and admins can view user list',
      });
    }

    // Import roleModel to get organization users
    const roleModel = await import('../models/roleModel.js');
    const users = await roleModel.getOrganizationUsers(orgId);

    // Get organization info
    const organization = await getOrganizationById(orgId);

    return res.status(200).json({
      success: true,
      message: 'Organization users retrieved successfully',
      organization: {
        org_id: organization.org_id,
        org_name: organization.org_name,
      },
      users: users,
      total: users.length,
    });
  } catch (error) {
    console.error('Error in getOrganizationUsers controller:', error);
    return next(error);
  }
};

export default {
  getMyOrganization,
  getOrganizations,
  getOrganization,
  createNewOrganization,
  updateExistingOrganization,
  deleteExistingOrganization,
  getOrgStats,
  getOrganizationUsers,
};

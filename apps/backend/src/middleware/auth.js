import jwt from 'jsonwebtoken';
import { COOKIE_NAMES } from '../config/cookies.js';

/**
 * JWT Authentication Middleware - Cookie-based with Multi-Tenant Role Support
 * Verifies access tokens from HTTP-only cookies and adds user information to the request object
 */
export const verifyToken = (req, res, next) => {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication cookie provided.',
        code: 'NO_AUTH_COOKIE',
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify token type
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token type.',
        code: 'INVALID_TOKEN_TYPE',
      });
    }

    // Add user information to request object
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      org_id: decoded.orgId, // Current/default organization
      // org_role will be populated by requireOrgRole middleware if needed
    };

    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid authentication cookie.',
        code: 'INVALID_TOKEN',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication cookie has expired.',
        code: 'TOKEN_EXPIRED',
      });
    }

    console.error('Cookie token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Organization-based role authorization middleware
 * Checks if user has required role in the organization from route params or request body
 * FULL TENANT ISOLATION - No cross-organization access allowed
 */
export const requireOrgRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not authenticated.',
        });
      }

      // Get org_id from route params, body, or user's default org
      const orgId = Number.parseInt(
        req.params.id || req.params.org_id || req.body.org_id || req.user.org_id
      );

      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: 'Organization ID is required.',
        });
      }

      // Get user's role in this organization
      const roleModel = await import('../models/roleModel.js');
      const userRole = await roleModel.default.getUserRoleInOrg(
        req.user.id,
        orgId
      );

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied. You do not have access to this organization.',
        });
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(userRole.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole.role}`,
        });
      }

      // Add organization role to request
      req.user.org_role = userRole.role;
      req.user.org_permissions = userRole.permissions;

      return next();
    } catch (error) {
      console.error('Organization role verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during role verification.',
      });
    }
  };
};

/**
 * Check if user has minimum permission level in organization
 * FULL TENANT ISOLATION - No cross-organization access
 */
export const requireOrgPermission = minPermissionLevel => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not authenticated.',
        });
      }

      const orgId = Number.parseInt(
        req.params.id || req.params.org_id || req.body.org_id || req.user.org_id
      );

      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: 'Organization ID is required.',
        });
      }

      // Get user's permissions
      const roleModel = await import('../models/roleModel.js');
      const permissions = await roleModel.default.getUserPermissions(
        req.user.id,
        orgId
      );

      if (!permissions) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied. You do not have access to this organization.',
        });
      }

      if (permissions.permission_level < minPermissionLevel) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
        });
      }

      req.user.org_role = permissions.role;
      req.user.permission_level = permissions.permission_level;

      return next();
    } catch (error) {
      console.error('Permission verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during permission verification.',
      });
    }
  };
};

/**
 * REMOVED: Super Admin concept eliminated for security
 * Use organization-based roles instead (org_owner, org_admin)
 * For infrastructure access, use separate platform_admin system
 */
export const requireSuperAdmin = (req, res, _next) => {
  return res.status(403).json({
    success: false,
    message:
      'Super admin access has been removed for security. Use organization-based roles.',
    code: 'SUPER_ADMIN_DEPRECATED',
  });
};

/**
 * Organization owner or admin middleware
 */
export const requireOrgAdmin = requireOrgRole('org_owner', 'org_admin');

/**
 * Organization owner only middleware
 */
export const requireOrgOwner = requireOrgRole('org_owner');

/**
 * Manager or higher middleware
 */
export const requireManager = requireOrgRole(
  'org_owner',
  'org_admin',
  'manager'
);

/**
 * DEPRECATED: Old role-based authorization middleware
 * Use requireOrgRole or requireOrgPermission instead
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not authenticated.',
        });
      }

      const userRole = req.user.system_role || req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
        });
      }

      return next();
    } catch (error) {
      console.error('Role verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during role verification.',
      });
    }
  };
};

/**
 * Protected route middleware
 * Combines token verification for protected routes
 */
export const protect = verifyToken;

/**
 * DEPRECATED: Old system-wide admin check - REMOVED for security
 * Use requireOrgRole('org_owner', 'org_admin') instead
 */
export const adminOnly = [verifyToken, requireSuperAdmin];

/**
 * DEPRECATED: Use requireOrgRole instead for organization-specific access
 */
export const userOrAdmin = [verifyToken];

/**
 * Optional authentication middleware - Cookie-based
 * Adds user info to request if authentication cookie is provided, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify token type
    if (decoded.type === 'access') {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        org_id: decoded.orgId,
      };
    }

    return next();
  } catch (error) {
    // If token is invalid, continue without user info
    console.error('Optional cookie auth error:', error);
    return next();
  }
};

/**
 * Refresh token verification middleware
 * Specifically for refresh token operations using HTTP-only cookies
 */
export const verifyRefreshToken = (req, res, next) => {
  try {
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No refresh cookie provided.',
        code: 'NO_REFRESH_COOKIE',
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Verify token type
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid refresh token type.',
        code: 'INVALID_REFRESH_TOKEN_TYPE',
      });
    }

    // Add refresh token info to request
    req.refreshToken = {
      token: refreshToken,
      userId: decoded.userId,
      decoded: decoded,
    };

    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid refresh cookie.',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Refresh cookie has expired.',
        code: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    console.error('Refresh token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during refresh token verification.',
      code: 'REFRESH_AUTH_ERROR',
    });
  }
};

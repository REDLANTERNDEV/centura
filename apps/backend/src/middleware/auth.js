import jwt from 'jsonwebtoken';
import { COOKIE_NAMES } from '../config/cookies.js';

/**
 * JWT Authentication Middleware - Cookie-based
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
      role: decoded.role || 'user',
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
 * Role-based authorization middleware
 * Checks if the authenticated user has the required role(s)
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

      const userRole = req.user.role;

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
 * Admin only middleware
 * Ensures only admin users can access the route
 */
export const adminOnly = [verifyToken, requireRole('admin')];

/**
 * User or Admin middleware
 * Allows both regular users and admins to access the route
 */
export const userOrAdmin = [verifyToken, requireRole('user', 'admin')];

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
        role: decoded.role || 'user',
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

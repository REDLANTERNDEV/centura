import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { COOKIE_NAMES, csrfTokenCookieConfig } from '../config/cookies.js';

/**
 * Security Headers Middleware
 * Implements comprehensive security headers using Helmet
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Cross Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // Additional security headers
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Rate Limiting Configuration
 * Professional rate limiting for different endpoint types
 */

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60, // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Permissive limiter for lightweight verification endpoints used by middleware
export const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // allow many verification calls from the same IP (middleware can be chatty)
  message: {
    error: 'Too many verification requests, please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // We intentionally do NOT skip successful requests because middleware may cause
  // many successful verifies; choose a high limit instead to avoid false 429s.
});

// Health check rate limiter (prevents health check abuse)
export const healthCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute (1 per second)
  message: {
    error: 'Too many health check requests.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Password reset/sensitive operations limiter
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 sensitive operations per hour
  message: {
    error: 'Too many sensitive operations attempted, please try again later.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing operations
 */
export const generateCSRFToken = (req, res, next) => {
  try {
    // Generate a random CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Store CSRF token in session/memory (you might want to use Redis in production)
    if (!req.session) req.session = {};
    req.session.csrfToken = csrfToken;

    // Set CSRF token as a cookie (not HTTP-only so client can read it)
    res.cookie(COOKIE_NAMES.CSRF_TOKEN, csrfToken, csrfTokenCookieConfig);

    next();
  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during CSRF token generation',
    });
  }
};

/**
 * CSRF Token Validation Middleware
 * Validates CSRF tokens for state-changing operations (POST, PUT, PATCH, DELETE)
 */
export const validateCSRFToken = (req, res, next) => {
  try {
    // Skip CSRF validation for GET and HEAD requests
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next();
    }

    // Skip CSRF validation for login endpoint (chicken-and-egg problem)
    if (req.path === '/api/auth/login' || req.path === '/api/auth/signup') {
      return next();
    }

    const csrfTokenFromHeader = req.headers['x-csrf-token'];
    const csrfTokenFromSession = req.session?.csrfToken;

    if (!csrfTokenFromHeader) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token required in X-CSRF-Token header',
      });
    }

    if (!csrfTokenFromSession) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token session not found',
      });
    }

    // Verify tokens match
    if (csrfTokenFromHeader !== csrfTokenFromSession) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token',
      });
    }

    return next();
  } catch (error) {
    console.error('CSRF validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during CSRF validation',
    });
  }
};

/**
 * Cookie Security Middleware
 * Additional security checks for cookies
 */
export const cookieSecurity = (req, res, next) => {
  try {
    // Ensure secure cookies in production
    if (process.env.NODE_ENV === 'production') {
      // Override res.cookie to ensure secure flag is set
      const originalCookie = res.cookie;
      res.cookie = function (name, value, options = {}) {
        options.secure = true;
        options.sameSite = options.sameSite || 'strict';
        return originalCookie.call(this, name, value, options);
      };
    }

    // Add security headers specifically for cookie handling
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    next();
  } catch (error) {
    console.error('Cookie security middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in cookie security middleware',
    });
  }
};

/**
 * Request logging middleware with security context
 */
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log security-relevant request information
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    hasAuthCookie: req.cookies
      ? Boolean(req.cookies[COOKIE_NAMES.ACCESS_TOKEN])
      : false,
    hasRefreshCookie: req.cookies
      ? Boolean(req.cookies[COOKIE_NAMES.REFRESH_TOKEN])
      : false,
  };

  console.log('Security Request:', JSON.stringify(logData));

  // Log response information
  const originalSend = res.send;
  res.send = function (body) {
    const responseTime = Date.now() - startTime;
    console.log(
      `Security Response: ${req.method} ${req.url} - ${res.statusCode} (${responseTime}ms)`
    );
    return originalSend.call(this, body);
  };

  next();
};

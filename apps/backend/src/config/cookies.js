/**
 * Professional Cookie Configuration
 * Implements secure HTTP-only cookies following industry best practices
 */

/**
 * Cookie configuration constants
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CSRF_TOKEN: 'csrf_token',
};

/**
 * Cookie duration constants (in milliseconds)
 */
export const COOKIE_DURATIONS = {
  ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
  CSRF_TOKEN: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Base cookie configuration for maximum security
 */
const baseCookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // TEMPORARY: Using 'lax' for testing (change back to 'none' after SSL is confirmed)
  // Use 'none' for cross-domain cookies (requires HTTPS)
  // Use 'lax' for same-site or testing
  sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
  path: '/',
  domain:
    process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN
      : undefined,
};
/**
 * Access token cookie configuration
 * Short-lived, HTTP-only, secure cookie for access tokens
 */
export const accessTokenCookieConfig = {
  ...baseCookieConfig,
  maxAge: COOKIE_DURATIONS.ACCESS_TOKEN,
  // Use baseCookieConfig's sameSite (none for production cross-domain)
  // sameSite: 'strict' would block cross-subdomain cookies
};

/**
 * Refresh token cookie configuration
 * Longer-lived, HTTP-only, secure cookie for refresh tokens
 * Path set to '/' to ensure it's sent with refresh requests from frontend
 */
export const refreshTokenCookieConfig = {
  ...baseCookieConfig,
  maxAge: COOKIE_DURATIONS.REFRESH_TOKEN,
  // Changed from '/api/auth' to '/' for better frontend compatibility
  path: '/',
};

/**
 * CSRF token cookie configuration
 * Not HTTP-only (needs to be accessible to JavaScript for CSRF protection)
 */
export const csrfTokenCookieConfig = {
  ...baseCookieConfig,
  httpOnly: false, // CSRF tokens need to be readable by client-side JavaScript
  maxAge: COOKIE_DURATIONS.CSRF_TOKEN,
};

/**
 * Cookie clearing configuration
 * Used when logging out or clearing cookies
 * MUST match the sameSite setting used when setting cookies
 */
export const clearCookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax', // Match baseCookieConfig (temporarily lax)
  path: '/',
  domain:
    process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN
      : undefined,
  expires: new Date(0), // Set to past date to clear
};

/**
 * Refresh token clearing configuration
 * Updated to match the refresh token path
 */
export const clearRefreshCookieConfig = {
  ...clearCookieConfig,
  path: '/',
};

/**
 * Utility function to get cookie configuration based on type
 * @param {string} type - The type of cookie ('access', 'refresh', 'csrf')
 * @returns {object} Cookie configuration object
 */
export const getCookieConfig = type => {
  switch (type) {
    case 'access':
      return accessTokenCookieConfig;
    case 'refresh':
      return refreshTokenCookieConfig;
    case 'csrf':
      return csrfTokenCookieConfig;
    default:
      return baseCookieConfig;
  }
};

/**
 * Utility function to get clear cookie configuration
 * @param {string} type - The type of cookie to clear ('access', 'refresh', 'csrf')
 * @returns {object} Clear cookie configuration object
 */
export const getClearCookieConfig = type => {
  if (type === 'refresh') {
    return clearRefreshCookieConfig;
  }
  return clearCookieConfig;
};

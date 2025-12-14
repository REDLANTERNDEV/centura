import pool from '../config/db.js';
import argon2 from 'argon2';

/**
 * Create a new user - Modern approach
 * @param {string} email - User email
 * @param {string} hashedPassword - Argon2 hashed password
 * @param {string} name - User's full name
 * @param {number|null} orgId - Optional organization ID (null for new users)
 * @returns {Promise<object>} Created user object
 */
const createUser = async (email, hashedPassword, name, orgId = null) => {
  // Normalize email to lowercase for case-insensitive storage
  const normalizedEmail = email?.trim().toLowerCase();

  const result = await pool.query(
    'INSERT INTO users (email, password_hash, name, org_id) VALUES ($1, $2, $3, $4) RETURNING id, email, name, org_id',
    [normalizedEmail, hashedPassword, name.trim(), orgId]
  );
  return result.rows[0];
};

const loginUser = async email => {
  // Normalize email to lowercase for case-insensitive lookup
  const normalizedEmail = email?.trim().toLowerCase();

  const result = await pool.query(
    'SELECT id, email, password_hash, org_id FROM users WHERE email = $1',
    [normalizedEmail]
  );
  return result.rows[0];
};

const findUserByEmail = async email => {
  // Normalize email to lowercase for case-insensitive lookup
  const normalizedEmail = email?.trim().toLowerCase();

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [
    normalizedEmail,
  ]);
  return result.rows[0];
};

/**
 * Store a new refresh token with token family support for multi-session
 * Industry Standard: Each login creates a new session (token family)
 * Multiple concurrent sessions are allowed per user
 *
 * @param {number} userId - User ID
 * @param {string} token - Raw refresh token
 * @param {Date} expiresAt - Token expiration date
 * @param {string|null} tokenFamily - Token family UUID (null = new session, existing = rotation)
 * @param {string|null} deviceInfo - Device/browser info for session identification
 * @returns {Promise<object>} Created token record with id and token_family
 */
const storeRefreshToken = async (
  userId,
  token,
  expiresAt,
  tokenFamily = null,
  deviceInfo = null
) => {
  // Hash the refresh token before storing it
  const tokenHash = await argon2.hash(token, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  // If no token family provided, create a new session (new login)
  // If token family is provided, this is a token rotation within the same session
  const result = await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, token_family, device_info, session_name) 
     VALUES ($1, $2, $3, COALESCE($4, gen_random_uuid()), $5, $6) 
     RETURNING id, token_family`,
    [
      userId,
      tokenHash,
      expiresAt,
      tokenFamily,
      deviceInfo,
      deviceInfo
        ? `Session from ${deviceInfo.substring(0, 50)}`
        : 'Web Session',
    ]
  );
  return result.rows[0];
};

/**
 * Validate a refresh token and return user/session info
 * Industry Standard: Supports multiple concurrent sessions per user
 * Only validates tokens that belong to active, non-revoked sessions
 *
 * @param {string} token - Raw refresh token to validate
 * @returns {Promise<object|null>} Token data with user info and token_family, or null if invalid
 */
const validateRefreshToken = async token => {
  // OPTIMIZED: Query active tokens for validation
  // We need to check against hashed tokens, but we limit the search scope
  const result = await pool.query(
    `SELECT rt.id, rt.token_hash, rt.token_family, rt.user_id, rt.device_info,
            u.email, u.org_id, u.name as user_name
     FROM refresh_tokens rt 
     JOIN users u ON rt.user_id = u.id 
     WHERE rt.expires_at > NOW() 
       AND rt.is_revoked = FALSE
     ORDER BY rt.last_used_at DESC NULLS LAST, rt.created_at DESC
     LIMIT 100`,
    []
  );

  // Check each token hash against the provided token
  for (const row of result.rows) {
    try {
      const isValid = await argon2.verify(row.token_hash, token);
      if (isValid) {
        // Update last_used_at for session activity tracking
        await pool.query(
          'UPDATE refresh_tokens SET last_used_at = NOW() WHERE id = $1',
          [row.id]
        );
        return row;
      }
    } catch (error) {
      // Continue checking other tokens if verification fails
      console.error('Token verification error:', error);
    }
  }

  return null;
};

/**
 * Revoke a specific refresh token
 * Industry Standard: Only revokes the specific token, not other sessions
 *
 * @param {string} token - Raw refresh token to revoke
 * @returns {Promise<boolean>} True if token was revoked
 */
const revokeRefreshToken = async token => {
  // Query active tokens to find the matching one
  const result = await pool.query(
    `SELECT id, token_hash 
     FROM refresh_tokens 
     WHERE expires_at > NOW() 
       AND is_revoked = FALSE
     ORDER BY last_used_at DESC NULLS LAST, created_at DESC
     LIMIT 100`,
    []
  );

  for (const row of result.rows) {
    try {
      const isValid = await argon2.verify(row.token_hash, token);
      if (isValid) {
        // Revoke this specific token only
        const revokeResult = await pool.query(
          'UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1',
          [row.id]
        );
        return revokeResult.rowCount > 0;
      }
    } catch (error) {
      console.error('Token verification error during revocation:', error);
    }
  }

  return false;
};

/**
 * Revoke all tokens in a specific token family (same session/device)
 * Used during token rotation to invalidate old tokens in the same session
 * Industry Standard: Token rotation only affects the current session, not other devices
 *
 * @param {string} tokenFamily - UUID of the token family to revoke
 * @returns {Promise<number>} Number of tokens revoked
 */
const revokeTokenFamily = async tokenFamily => {
  const result = await pool.query(
    'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_family = $1 AND is_revoked = FALSE',
    [tokenFamily]
  );
  return result.rowCount;
};

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 * Industry Standard: Used for "Sign out everywhere" functionality
 *
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of tokens revoked
 */
const revokeAllUserTokens = async userId => {
  const result = await pool.query(
    'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE',
    [userId]
  );
  return result.rowCount;
};

/**
 * Get all active sessions for a user
 * Industry Standard: Allows users to see and manage their active sessions
 *
 * @param {number} userId - User ID
 * @returns {Promise<Array>} List of active sessions
 */
const getUserActiveSessions = async userId => {
  const result = await pool.query(
    `SELECT token_family, device_info, session_name, created_at, last_used_at, expires_at
     FROM refresh_tokens 
     WHERE user_id = $1 
       AND is_revoked = FALSE 
       AND expires_at > NOW()
     ORDER BY last_used_at DESC NULLS LAST`,
    [userId]
  );
  return result.rows;
};

/**
 * Revoke a specific session by token family
 * Industry Standard: Allows users to sign out from specific devices
 *
 * @param {number} userId - User ID (for security verification)
 * @param {string} tokenFamily - Token family UUID to revoke
 * @returns {Promise<boolean>} True if session was revoked
 */
const revokeUserSession = async (userId, tokenFamily) => {
  const result = await pool.query(
    'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 AND token_family = $2 AND is_revoked = FALSE',
    [userId, tokenFamily]
  );
  return result.rowCount > 0;
};

/**
 * Delete expired and revoked tokens (cleanup job)
 * Should be run periodically via cron job
 *
 * @returns {Promise<number>} Number of tokens deleted
 */
const deleteExpiredTokens = async () => {
  const result = await pool.query(
    'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE'
  );
  return result.rowCount;
};

export default {
  createUser,
  findUserByEmail,
  loginUser,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeTokenFamily,
  revokeAllUserTokens,
  getUserActiveSessions,
  revokeUserSession,
  deleteExpiredTokens,
};

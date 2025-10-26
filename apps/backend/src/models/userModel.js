import pool from '../config/db.js';
import argon2 from 'argon2';

const createUser = async (email, hashedPassword) => {
  // Normalize email to lowercase for case-insensitive storage
  const normalizedEmail = email?.trim().toLowerCase();

  const result = await pool.query(
    'INSERT INTO users (email, password_hash, org_id, role) VALUES ($1, $2, $3, $4) RETURNING id, email',
    [normalizedEmail, hashedPassword, 1, 'user']
  );
  return result.rows[0];
};

const loginUser = async email => {
  // Normalize email to lowercase for case-insensitive lookup
  const normalizedEmail = email?.trim().toLowerCase();

  const result = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
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

const storeRefreshToken = async (userId, token, expiresAt) => {
  // Hash the refresh token before storing it
  const tokenHash = await argon2.hash(token, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  const result = await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING id',
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
};

const validateRefreshToken = async token => {
  // Get all non-expired, non-revoked tokens for validation
  const result = await pool.query(
    'SELECT rt.*, u.id as user_id, u.email FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.expires_at > NOW() AND rt.is_revoked = FALSE',
    []
  );

  // Check each token hash against the provided token
  for (const row of result.rows) {
    try {
      const isValid = await argon2.verify(row.token_hash, token);
      if (isValid) {
        return row;
      }
    } catch (error) {
      // Continue checking other tokens if verification fails
      console.error('Token verification error:', error);
    }
  }

  return null;
};

const revokeRefreshToken = async token => {
  // First find the token by comparing hashes
  const result = await pool.query(
    'SELECT id, token_hash FROM refresh_tokens WHERE expires_at > NOW() AND is_revoked = FALSE',
    []
  );

  for (const row of result.rows) {
    try {
      const isValid = await argon2.verify(row.token_hash, token);
      if (isValid) {
        // Revoke this specific token
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

const revokeAllUserTokens = async userId => {
  const result = await pool.query(
    'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE',
    [userId]
  );
  return result.rowCount;
};

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
  revokeAllUserTokens,
  deleteExpiredTokens,
};

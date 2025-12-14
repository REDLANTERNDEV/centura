import argon2 from 'argon2';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import {
  COOKIE_NAMES,
  accessTokenCookieConfig,
  refreshTokenCookieConfig,
  getClearCookieConfig,
  csrfTokenCookieConfig,
} from '../config/cookies.js';
import { getMessage } from '../config/messages.js';

/**
 * User Registration - Simple & Modern Approach
 * Only requires: email, password, name
 * Organization setup is optional and done after login
 * User can also join via invitation link
 */
const signup = async (req, res) => {
  const { password, name, inviteToken } = req.body;
  let { email } = req.body;

  // Normalize email to lowercase to ensure case-insensitive handling
  email = email?.trim().toLowerCase();

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: getMessage('AUTH.EMAIL_PASSWORD_REQUIRED'),
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: getMessage('AUTH.PASSWORD_TOO_SHORT'),
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: getMessage('VALIDATION.FIELD_TOO_SHORT', { field: 'Ad', min: 2 }),
    });
  }

  try {
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: getMessage('AUTH.EMAIL_ALREADY_EXISTS'),
      });
    }

    // Hash password with Argon2
    const hashPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // Create user without organization (org_id will be null)
    const newUser = await userModel.createUser(email, hashPassword, name);

    // If inviteToken is provided, join the organization automatically
    const organization = null;
    if (inviteToken) {
      // Invite token functionality will be implemented separately
      // For now, users create organizations after login
      console.log('Invite token provided:', inviteToken);
    }

    return res.status(201).json({
      success: true,
      message: getMessage('AUTH.SIGNUP_SUCCESS'),
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      // Guide user on next steps
      nextSteps: organization
        ? 'Organizasyona katıldınız. Devam etmek için lütfen giriş yapın.'
        : 'Giriş yaptıktan sonra organizasyonunuzu oluşturabilir veya davet ile katılabilirsiniz.',
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({
      success: false,
      error: getMessage('ERROR.SERVER_ERROR'),
    });
  }
};

const login = async (req, res) => {
  const { password } = req.body;
  let { email } = req.body;

  // Normalize email to lowercase to ensure case-insensitive handling
  email = email?.trim().toLowerCase();

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: getMessage('AUTH.EMAIL_PASSWORD_REQUIRED'),
    });
  }
  try {
    const user = await userModel.loginUser(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: getMessage('AUTH.INVALID_CREDENTIALS'),
      });
    }
    const isValidPassword = await argon2.verify(user.password_hash, password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: getMessage('AUTH.INVALID_CREDENTIALS'),
      });
    }

    // Create JWT tokens with organization-based access only
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        orgId: user.org_id, // Default/current organization
        type: 'access',
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    const refreshExpiryMs =
      process.env.JWT_REFRESH_EXPIRES_IN === '7d'
        ? 7 * 24 * 60 * 60 * 1000
        : Number.parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 1000;

    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    // Get device info from user-agent for session identification
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';

    // Store refresh token in database with new token family (new session)
    // Industry Standard: Each login creates a NEW session, doesn't affect other sessions
    // This allows multiple concurrent logins from different devices/browsers
    await userModel.storeRefreshToken(
      user.id,
      refreshToken,
      expiresAt,
      null,
      deviceInfo
    );

    // Generate CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Set secure HTTP-only cookies
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessTokenCookieConfig);
    res.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      refreshTokenCookieConfig
    );
    // Set CSRF token cookie (not HTTP-only so client can read it)
    res.cookie(COOKIE_NAMES.CSRF_TOKEN, csrfToken, csrfTokenCookieConfig);

    return res.status(200).json({
      success: true,
      message: getMessage('AUTH.LOGIN_SUCCESS'),
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: getMessage('ERROR.SERVER_ERROR'),
    });
  }
};

const logout = async (req, res) => {
  try {
    // Get refresh token from HTTP-only cookie
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (refreshToken) {
      // Revoke the refresh token in database
      await userModel.revokeRefreshToken(refreshToken);
    }

    // Clear all auth-related cookies
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieConfig('access'));
    res.clearCookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      getClearCookieConfig('refresh')
    );
    res.clearCookie(COOKIE_NAMES.CSRF_TOKEN, getClearCookieConfig('csrf'));

    return res.status(200).json({
      success: true,
      message: getMessage('AUTH.LOGOUT_SUCCESS'),
    });
  } catch (err) {
    console.error('Logout error:', err);

    // Even if there's an error, clear the cookies
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieConfig('access'));
    res.clearCookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      getClearCookieConfig('refresh')
    );
    res.clearCookie(COOKIE_NAMES.CSRF_TOKEN, getClearCookieConfig('csrf'));

    return res.status(500).json({
      success: false,
      error: getMessage('ERROR.SERVER_ERROR'),
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    // Get refresh token from HTTP-only cookie
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: getMessage('AUTH.REFRESH_TOKEN_EXPIRED'),
      });
    }

    // Validate the refresh token (checks against hashed tokens in database)
    const tokenData = await userModel.validateRefreshToken(refreshToken);

    if (!tokenData) {
      // Clear invalid cookies
      res.clearCookie(
        COOKIE_NAMES.ACCESS_TOKEN,
        getClearCookieConfig('access')
      );
      res.clearCookie(
        COOKIE_NAMES.REFRESH_TOKEN,
        getClearCookieConfig('refresh')
      );

      return res.status(401).json({
        success: false,
        error: getMessage('AUTH.INVALID_REFRESH_TOKEN'),
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: tokenData.user_id,
        email: tokenData.email,
        orgId: tokenData.org_id,
        type: 'access',
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    // Generate new refresh token for token rotation (enhanced security)
    const newRefreshToken = jwt.sign(
      {
        userId: tokenData.user_id,
        type: 'refresh',
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Calculate new expiry
    const refreshExpiryMs =
      process.env.JWT_REFRESH_EXPIRES_IN === '7d'
        ? 7 * 24 * 60 * 60 * 1000
        : Number.parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 1000;

    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    // Industry Standard Token Rotation:
    // 1. Revoke ALL tokens in this token family (same session/device)
    // 2. Store new token with the SAME token family (maintains session identity)
    // This ensures token rotation only affects the current session, not other devices
    const tokenFamily = tokenData.token_family;
    await userModel.revokeTokenFamily(tokenFamily);
    await userModel.storeRefreshToken(
      tokenData.user_id,
      newRefreshToken,
      expiresAt,
      tokenFamily, // Keep the same token family for this session
      tokenData.device_info
    );

    // Generate new CSRF token
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Set new secure HTTP-only cookies
    res.cookie(
      COOKIE_NAMES.ACCESS_TOKEN,
      newAccessToken,
      accessTokenCookieConfig
    );
    res.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      newRefreshToken,
      refreshTokenCookieConfig
    );
    // Set CSRF token cookie (not HTTP-only so client can read it)
    res.cookie(COOKIE_NAMES.CSRF_TOKEN, csrfToken, csrfTokenCookieConfig);

    return res.status(200).json({
      success: true,
      message: getMessage('AUTH.TOKEN_REFRESH_SUCCESS'),
      user: {
        id: tokenData.user_id,
        email: tokenData.email,
        role: tokenData.role || 'user',
      },
    });
  } catch (err) {
    console.error('Token refresh error:', err);

    // Clear potentially invalid cookies
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieConfig('access'));
    res.clearCookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      getClearCookieConfig('refresh')
    );

    return res.status(500).json({
      success: false,
      error: getMessage('ERROR.SERVER_ERROR'),
    });
  }
};

export default { signup, login, logout, refreshToken };

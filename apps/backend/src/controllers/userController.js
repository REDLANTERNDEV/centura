import argon2 from 'argon2';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import {
  COOKIE_NAMES,
  accessTokenCookieConfig,
  refreshTokenCookieConfig,
  getClearCookieConfig,
} from '../config/cookies.js';

const signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password is too short. It must be at least 8 characters.',
    });
  }

  try {
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res
        .status(409)
        .json({ error: 'This email is already registered' });
    }

    const hashPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
    const newUser = await userModel.createUser(email, hashPassword);
    return res
      .status(201)
      .json({ message: 'Register successful', user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await userModel.loginUser(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValidPassword = await argon2.verify(user.password_hash, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT tokens with proper payload
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role || 'user',
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
        : parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 1000;

    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    // Store refresh token in database (automatically hashed in userModel.storeRefreshToken)
    await userModel.storeRefreshToken(user.id, refreshToken, expiresAt);

    // Set secure HTTP-only cookies
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessTokenCookieConfig);
    res.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      refreshTokenCookieConfig
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
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

    // Clear both access and refresh token cookies
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieConfig('access'));
    res.clearCookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      getClearCookieConfig('refresh')
    );

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (err) {
    console.error('Logout error:', err);

    // Even if there's an error, clear the cookies
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieConfig('access'));
    res.clearCookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      getClearCookieConfig('refresh')
    );

    return res.status(500).json({
      success: false,
      error: 'Server error during logout',
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
        error: 'Refresh token not found in cookies',
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
        error: 'Invalid or expired refresh token',
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: tokenData.user_id,
        email: tokenData.email,
        role: tokenData.role || 'user',
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
        : parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 1000;

    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    // Revoke old token and store new one (token rotation for security)
    await userModel.revokeRefreshToken(refreshToken);
    await userModel.storeRefreshToken(
      tokenData.user_id,
      newRefreshToken,
      expiresAt
    );

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

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
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
      error: 'Server error during token refresh',
    });
  }
};

export default { signup, login, logout, refreshToken };

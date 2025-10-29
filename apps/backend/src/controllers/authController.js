import jwt from 'jsonwebtoken';

/**
 * Verify the refresh token from cookies.
 * Returns 200 + user info when valid, otherwise 401/403.
 */
export const verifyRefreshToken = (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is missing' });
    }

    // Note: tokens are signed with process.env.JWT_SECRET in login/refresh flow
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ message: 'Invalid or expired refresh token' });
      }

      // Ensure token type is refresh
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ message: 'Invalid token type' });
      }

      // Token is valid, return user details
      return res.status(200).json({ message: 'Token is valid', user: decoded });
    });
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

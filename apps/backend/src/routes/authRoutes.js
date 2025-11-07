import express from 'express';
import userController from '../controllers/userController.js';
import {
  authLimiter,
  verifyLimiter,
  generateCSRFToken,
} from '../middleware/security.js';
import {
  verifyRefreshToken as verifyRefreshMiddleware,
  verifyToken as verifyAccessMiddleware,
} from '../middleware/auth.js';
import { verifyRefreshToken as verifyRefreshController } from '../controllers/authController.js';

const router = express.Router();

// Auth routes with rate limiting
router.post('/signup', authLimiter, userController.signup);
router.post('/login', authLimiter, generateCSRFToken, userController.login);

// Logout - requires refresh token verification (but handles missing gracefully in controller)
router.post('/logout', userController.logout);

// Refresh token - requires valid refresh token cookie
router.post(
  '/refresh-token',
  verifyRefreshMiddleware,
  generateCSRFToken,
  userController.refreshToken
);

// Verify refresh token endpoint (used by middleware fallback)
router.get('/verify-token', verifyLimiter, verifyRefreshController);

// Verify access token endpoint (validates access token cookie via middleware)
router.get(
  '/verify-access',
  verifyLimiter,
  verifyAccessMiddleware,
  (req, res) => {
    // If middleware passed, req.user is populated
    return res.status(200).json({ success: true, user: req.user });
  }
);

export default router;

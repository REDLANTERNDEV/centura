import express from 'express';
import userController from '../controllers/userController.js';
import { authLimiter } from '../middleware/security.js';
import { verifyRefreshToken } from '../middleware/auth.js';

const router = express.Router();

// Auth routes with rate limiting
router.post('/signup', authLimiter, userController.signup);

router.post('/login', authLimiter, userController.login);

// Logout - requires refresh token verification (but handles missing gracefully in controller)
router.post('/logout', userController.logout);

// Refresh token - requires valid refresh token cookie
router.post('/refresh-token', verifyRefreshToken, userController.refreshToken);

export default router;

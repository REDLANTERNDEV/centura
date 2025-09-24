import express from 'express';
import authRoutes from './authRoutes.js';

const router = express.Router();

// API versioning
router.use('/v1/auth', authRoutes);

// Health check
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'mini-saas-backend',
  });
});

export default router;

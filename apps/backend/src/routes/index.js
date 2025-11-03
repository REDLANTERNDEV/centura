import express from 'express';
import authRoutes from './authRoutes.js';
import customerRoutes from './customerRoutes.js';
import organizationRoutes from './organizationRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import insightsRoutes from './insightsRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = express.Router();

// API versioning
router.use('/v1/auth', authRoutes);
router.use('/v1/customers', customerRoutes);
router.use('/v1/organizations', organizationRoutes);
router.use('/v1/products', productRoutes);
router.use('/v1/orders', orderRoutes);
router.use('/v1/insights', insightsRoutes);
router.use('/v1/settings', settingsRoutes);

// Health check
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'mini-saas-backend',
  });
});

export default router;

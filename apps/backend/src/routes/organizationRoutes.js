import express from 'express';
import { verifyToken, requireOrgRole } from '../middleware/auth.js';
import {
  getMyOrganization,
  getOrganizations,
  getOrganization,
  createNewOrganization,
  updateExistingOrganization,
  deleteExistingOrganization,
  getOrgStats,
  getOrganizationUsers,
} from '../controllers/organizationController.js';
import {
  validateCreateOrganization,
  validateUpdateOrganization,
} from '../validators/organizationValidator.js';

const router = express.Router();

/**
 * Organization Routes - Multi-Tenant Role System
 *
 * Public routes: None
 * User routes: GET /me, GET /:id (own org), GET /:id/stats (own org)
 * Org Admin routes: PUT /:id (own org), manage users
 * Super Admin routes: GET / (all), POST /, DELETE /:id
 */

// GET /api/v1/organizations/me - Get current user's organization
router.get('/me', verifyToken, getMyOrganization);

// GET /api/v1/organizations/:id/stats - Get organization statistics (must be before /:id)
router.get('/:id/stats', verifyToken, getOrgStats);

// GET /api/v1/organizations/:id/users - Get users in organization (org_owner or org_admin only)
router.get('/:id/users', verifyToken, getOrganizationUsers);

// GET /api/v1/organizations - Get all organizations (super_admin) or user's orgs
router.get('/', verifyToken, getOrganizations);

// GET /api/v1/organizations/:id - Get organization by ID
router.get('/:id', verifyToken, getOrganization);

// POST /api/v1/organizations - Create new organization (any authenticated user can create their own org)
router.post(
  '/',
  verifyToken,
  validateCreateOrganization,
  createNewOrganization
);

// PUT /api/v1/organizations/:id - Update organization (org_owner or org_admin only)
router.put(
  '/:id',
  verifyToken,
  requireOrgRole('org_owner', 'org_admin'), // Org admins can update their own org
  validateUpdateOrganization,
  updateExistingOrganization
);

// DELETE /api/v1/organizations/:id - Delete organization (org_owner only)
router.delete(
  '/:id',
  verifyToken,
  requireOrgRole('org_owner'), // Only organization owner can delete
  deleteExistingOrganization
);

export default router;

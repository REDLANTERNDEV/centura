import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getOrganizationSettings,
  updateOrganizationSettings,
  getOrganizationTeam,
  updateUserRole,
  updateUserStatus,
  removeUserFromOrganization,
} from '../controllers/settingsController.js';

const router = express.Router();

/**
 * Settings Routes - Professional ERP/CRM Settings Management
 *
 * User Profile Settings:
 * - GET /api/v1/settings/profile - Get current user profile
 * - PUT /api/v1/settings/profile - Update user profile (name, email)
 * - PUT /api/v1/settings/password - Update password
 *
 * Organization Settings:
 * - GET /api/v1/settings/organization/:orgId - Get organization settings (manager+)
 * - PUT /api/v1/settings/organization/:orgId - Update organization settings (org_admin+)
 * - GET /api/v1/settings/organization/:orgId/users - Get team members (manager+)
 * - PUT /api/v1/settings/organization/:orgId/users/:userId/role - Update user role (org_admin+)
 * - PUT /api/v1/settings/organization/:orgId/users/:userId/status - Activate/deactivate user (org_admin+)
 * - DELETE /api/v1/settings/organization/:orgId/users/:userId - Remove user from organization (org_admin+)
 */

// User Profile Settings
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.put('/password', verifyToken, updatePassword);

// Organization Settings
router.get('/organization/:orgId', verifyToken, getOrganizationSettings);
router.put('/organization/:orgId', verifyToken, updateOrganizationSettings);
router.get('/organization/:orgId/users', verifyToken, getOrganizationTeam);

// User Management
router.put(
  '/organization/:orgId/users/:userId/role',
  verifyToken,
  updateUserRole
);
router.put(
  '/organization/:orgId/users/:userId/status',
  verifyToken,
  updateUserStatus
);
router.delete(
  '/organization/:orgId/users/:userId',
  verifyToken,
  removeUserFromOrganization
);

export default router;

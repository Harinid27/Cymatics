import { Router } from 'express';
import { outclientController } from '@/controllers/outclient.controller';
import { validate, validateQuery, validateParams, clientSchemas, commonSchemas } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireRole, requirePermission } from '@/middleware/rbac.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/outclients
 * @desc    Get all outclients with pagination and search
 * @access  Private (Admin/Manager)
 */
router.get(
  '/',
  requirePermission('clients:read'),
  validateQuery(clientSchemas.query),
  outclientController.getOutclients
);

/**
 * @route   GET /api/outclients/stats
 * @desc    Get outclient statistics
 * @access  Private (Admin/Manager)
 */
router.get('/stats', requirePermission('clients:read'), outclientController.getOutclientStats);

/**
 * @route   GET /api/outclients/dropdown
 * @desc    Get outclients for dropdown (simplified data)
 * @access  Private (Admin/Manager)
 */
router.get('/dropdown', requirePermission('clients:read'), outclientController.getOutclientsDropdown);

/**
 * @route   GET /api/outclients/:id
 * @desc    Get outclient by ID
 * @access  Private (Admin/Manager)
 */
router.get(
  '/:id',
  requirePermission('clients:read'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  outclientController.getOutclientById
);

/**
 * @route   GET /api/outclients/name/:name
 * @desc    Get outclient by name
 * @access  Private (Admin/Manager)
 */
router.get(
  '/name/:name',
  requirePermission('clients:read'),
  validateParams(Joi.object({ name: Joi.string().required() })),
  outclientController.getOutclientByName
);

/**
 * @route   GET /api/outclients/:id/data
 * @desc    Get outclient data for editing
 * @access  Private (Admin/Manager)
 */
router.get(
  '/:id/data',
  requirePermission('clients:read'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  outclientController.getOutclientData
);

/**
 * @route   POST /api/outclients
 * @desc    Create new outclient
 * @access  Private (Admin/Manager)
 */
router.post(
  '/',
  requireRole(['ADMIN', 'MANAGER']),
  uploadSingle('img'),
  validate(clientSchemas.create),
  outclientController.createOutclient
);

/**
 * @route   PUT /api/outclients/:id
 * @desc    Update outclient
 * @access  Private (Admin/Manager)
 */
router.put(
  '/:id',
  requireRole(['ADMIN', 'MANAGER']),
  validateParams(Joi.object({ id: commonSchemas.id })),
  uploadSingle('img'),
  validate(clientSchemas.update),
  outclientController.updateOutclient
);

/**
 * @route   DELETE /api/outclients/:id
 * @desc    Delete outclient
 * @access  Private (Admin/Manager)
 */
router.delete(
  '/:id',
  requireRole(['ADMIN', 'MANAGER']),
  validateParams(Joi.object({ id: commonSchemas.id })),
  outclientController.deleteOutclient
);

export default router;

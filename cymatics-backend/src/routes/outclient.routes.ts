import { Router } from 'express';
import { outclientController } from '@/controllers/outclient.controller';
import { validate, validateQuery, validateParams, clientSchemas, commonSchemas } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/outclients
 * @desc    Get all outclients with pagination and search
 * @access  Private
 */
router.get(
  '/',
  validateQuery(clientSchemas.query),
  outclientController.getOutclients
);

/**
 * @route   GET /api/outclients/stats
 * @desc    Get outclient statistics
 * @access  Private
 */
router.get('/stats', outclientController.getOutclientStats);

/**
 * @route   GET /api/outclients/dropdown
 * @desc    Get outclients for dropdown (simplified data)
 * @access  Private
 */
router.get('/dropdown', outclientController.getOutclientsDropdown);

/**
 * @route   GET /api/outclients/:id
 * @desc    Get outclient by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  outclientController.getOutclientById
);

/**
 * @route   GET /api/outclients/name/:name
 * @desc    Get outclient by name
 * @access  Private
 */
router.get(
  '/name/:name',
  validateParams(Joi.object({ name: Joi.string().required() })),
  outclientController.getOutclientByName
);

/**
 * @route   GET /api/outclients/:id/data
 * @desc    Get outclient data for editing
 * @access  Private
 */
router.get(
  '/:id/data',
  validateParams(Joi.object({ id: commonSchemas.id })),
  outclientController.getOutclientData
);

/**
 * @route   POST /api/outclients
 * @desc    Create new outclient
 * @access  Private
 */
router.post(
  '/',
  uploadSingle('img'),
  validate(clientSchemas.create),
  outclientController.createOutclient
);

/**
 * @route   PUT /api/outclients/:id
 * @desc    Update outclient
 * @access  Private
 */
router.put(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  uploadSingle('img'),
  validate(clientSchemas.update),
  outclientController.updateOutclient
);

/**
 * @route   DELETE /api/outclients/:id
 * @desc    Delete outclient
 * @access  Private
 */
router.delete(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  outclientController.deleteOutclient
);

export default router;

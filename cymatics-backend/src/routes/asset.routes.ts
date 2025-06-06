import { Router } from 'express';
import { assetController } from '@/controllers/asset.controller';
import { validate, validateQuery, validateParams, commonSchemas } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Asset validation schemas
const assetSchemas = {
  create: Joi.object({
    date: commonSchemas.date,
    type: Joi.string().max(100).required(),
    name: Joi.string().max(200).required(),
    quantity: Joi.number().positive().required(),
    buyPrice: Joi.number().positive().required(),
    value: Joi.number().positive().optional(),
    note: Joi.string().optional().allow(''),
  }),

  update: Joi.object({
    date: Joi.date().iso().optional(),
    type: Joi.string().max(100).optional(),
    name: Joi.string().max(200).optional(),
    quantity: Joi.number().positive().optional(),
    buyPrice: Joi.number().positive().optional(),
    value: Joi.number().positive().optional(),
    note: Joi.string().optional().allow(''),
  }),

  query: Joi.object({
    q: Joi.string().allow('').optional(),
    type: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

/**
 * @route   GET /api/assets
 * @desc    Get all assets with pagination and search
 * @access  Private
 */
router.get(
  '/',
  validateQuery(assetSchemas.query),
  assetController.getAssets
);

/**
 * @route   GET /api/assets/stats
 * @desc    Get asset statistics
 * @access  Private
 */
router.get('/stats', assetController.getAssetStats);

/**
 * @route   GET /api/assets/types
 * @desc    Get asset types
 * @access  Private
 */
router.get('/types', assetController.getAssetTypes);

/**
 * @route   GET /api/assets/:id
 * @desc    Get asset by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  assetController.getAssetById
);

/**
 * @route   POST /api/assets
 * @desc    Create new asset
 * @access  Private
 */
router.post(
  '/',
  uploadSingle('image'),
  validate(assetSchemas.create),
  assetController.createAsset
);

/**
 * @route   PUT /api/assets/:id
 * @desc    Update asset
 * @access  Private
 */
router.put(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  uploadSingle('image'),
  validate(assetSchemas.update),
  assetController.updateAsset
);

/**
 * @route   DELETE /api/assets/:id
 * @desc    Delete asset
 * @access  Private
 */
router.delete(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  assetController.deleteAsset
);

export default router;

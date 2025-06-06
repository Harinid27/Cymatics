import { Router } from 'express';
import { entertainmentController } from '@/controllers/entertainment.controller';
import { validate, validateQuery, validateParams, commonSchemas } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Entertainment validation schemas
const entertainmentSchemas = {
  create: Joi.object({
    date: Joi.date().iso().optional(),
    type: Joi.string().max(100).required(),
    language: Joi.string().max(100).required(),
    rating: Joi.number().integer().min(1).max(10).required(),
    name: Joi.string().max(100).required(),
    source: Joi.string().max(100).optional().allow(''),
  }),

  update: Joi.object({
    date: Joi.date().iso().optional(),
    type: Joi.string().max(100).optional(),
    language: Joi.string().max(100).optional(),
    rating: Joi.number().integer().min(1).max(10).optional(),
    name: Joi.string().max(100).optional(),
    source: Joi.string().max(100).optional().allow(''),
  }),

  query: Joi.object({
    q: Joi.string().allow('').optional(),
    type: Joi.string().optional(),
    language: Joi.string().optional(),
    minRating: Joi.number().integer().min(1).max(10).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

/**
 * @route   GET /api/entertainment
 * @desc    Get all entertainment entries with pagination and filters
 * @access  Private
 */
router.get(
  '/',
  validateQuery(entertainmentSchemas.query),
  entertainmentController.getEntertainment
);

/**
 * @route   GET /api/entertainment/stats
 * @desc    Get entertainment statistics
 * @access  Private
 */
router.get('/stats', entertainmentController.getEntertainmentStats);

/**
 * @route   GET /api/entertainment/types
 * @desc    Get entertainment types
 * @access  Private
 */
router.get('/types', entertainmentController.getEntertainmentTypes);

/**
 * @route   GET /api/entertainment/languages
 * @desc    Get entertainment languages
 * @access  Private
 */
router.get('/languages', entertainmentController.getEntertainmentLanguages);

/**
 * @route   GET /api/entertainment/:id
 * @desc    Get entertainment by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  entertainmentController.getEntertainmentById
);

/**
 * @route   POST /api/entertainment
 * @desc    Create new entertainment entry
 * @access  Private
 */
router.post(
  '/',
  uploadSingle('image'),
  validate(entertainmentSchemas.create),
  entertainmentController.createEntertainment
);

/**
 * @route   PUT /api/entertainment/:id
 * @desc    Update entertainment entry
 * @access  Private
 */
router.put(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  uploadSingle('image'),
  validate(entertainmentSchemas.update),
  entertainmentController.updateEntertainment
);

/**
 * @route   DELETE /api/entertainment/:id
 * @desc    Delete entertainment entry
 * @access  Private
 */
router.delete(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  entertainmentController.deleteEntertainment
);

export default router;

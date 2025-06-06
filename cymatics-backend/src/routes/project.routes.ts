import { Router } from 'express';
import { projectController } from '@/controllers/project.controller';
import { validate, validateQuery, validateParams, projectSchemas, commonSchemas } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with pagination, search, and filters
 * @access  Private
 */
router.get(
  '/',
  validateQuery(projectSchemas.query),
  projectController.getProjects
);

/**
 * @route   GET /api/projects/stats
 * @desc    Get project statistics
 * @access  Private
 */
router.get('/stats', projectController.getProjectStats);

/**
 * @route   GET /api/projects/codes
 * @desc    Get project codes for dropdown
 * @access  Private
 */
router.get('/codes', projectController.getProjectCodes);

/**
 * @route   GET /api/projects/status/:status
 * @desc    Get projects by status
 * @access  Private
 */
router.get(
  '/status/:status',
  validateParams(Joi.object({
    status: Joi.string().valid('ongoing', 'pending', 'completed').required(),
  })),
  validateQuery(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  })),
  projectController.getProjectsByStatus
);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  projectController.getProjectById
);

/**
 * @route   GET /api/projects/code/:code
 * @desc    Get project by code
 * @access  Private
 */
router.get(
  '/code/:code',
  validateParams(Joi.object({ code: Joi.string().required() })),
  projectController.getProjectByCode
);

/**
 * @route   GET /api/projects/:code/data
 * @desc    Get project data for editing
 * @access  Private
 */
router.get(
  '/:code/data',
  validateParams(Joi.object({ code: Joi.string().required() })),
  projectController.getProjectData
);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private
 */
router.post(
  '/',
  uploadSingle('image'),
  validate(projectSchemas.create),
  projectController.createProject
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private
 */
router.put(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  uploadSingle('image'),
  validate(projectSchemas.update),
  projectController.updateProject
);

/**
 * @route   PUT /api/projects/:id/status
 * @desc    Update project status
 * @access  Private
 */
router.put(
  '/:id/status',
  validateParams(Joi.object({ id: commonSchemas.id })),
  validate(Joi.object({ status: Joi.string().required() })),
  projectController.updateProjectStatus
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private
 */
router.delete(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  projectController.deleteProject
);

export default router;

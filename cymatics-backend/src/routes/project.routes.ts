import { Router } from 'express';
import { projectController } from '@/controllers/project.controller';
import { validate, validateQuery, validateParams, projectSchemas, commonSchemas } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireRole, requirePermission } from '@/middleware/rbac.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with pagination, search, and filters
 * @access  Private (All roles)
 */
router.get(
  '/',
  requirePermission('projects:read'),
  validateQuery(projectSchemas.query),
  projectController.getProjects
);

/**
 * @route   GET /api/projects/stats
 * @desc    Get project statistics
 * @access  Private (All roles)
 */
router.get('/stats', requirePermission('projects:read'), projectController.getProjectStats);

/**
 * @route   GET /api/projects/codes
 * @desc    Get project codes for dropdown
 * @access  Private (All roles)
 */
router.get('/codes', requirePermission('projects:read'), projectController.getProjectCodes);

/**
 * @route   GET /api/projects/status/:status
 * @desc    Get projects by status
 * @access  Private (All roles)
 */
router.get(
  '/status/:status',
  requirePermission('projects:read'),
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
 * @access  Private (All roles)
 */
router.get(
  '/:id',
  requirePermission('projects:read'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  projectController.getProjectById
);

/**
 * @route   GET /api/projects/code/:code
 * @desc    Get project by code
 * @access  Private (All roles)
 */
router.get(
  '/code/:code',
  requirePermission('projects:read'),
  validateParams(Joi.object({ code: Joi.string().required() })),
  projectController.getProjectByCode
);

/**
 * @route   GET /api/projects/:code/data
 * @desc    Get project data for editing
 * @access  Private (Admin/Manager)
 */
router.get(
  '/:code/data',
  requireRole(['ADMIN', 'MANAGER']),
  validateParams(Joi.object({ code: Joi.string().required() })),
  projectController.getProjectData
);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private (Admin/Manager)
 */
router.post(
  '/',
  requireRole(['ADMIN', 'MANAGER']),
  uploadSingle('image'),
  validate(projectSchemas.create),
  projectController.createProject
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private (Admin/Manager)
 */
router.put(
  '/:id',
  requireRole(['ADMIN', 'MANAGER']),
  validateParams(Joi.object({ id: commonSchemas.id })),
  uploadSingle('image'),
  validate(projectSchemas.update),
  projectController.updateProject
);

/**
 * @route   PUT /api/projects/:id/status
 * @desc    Update project status
 * @access  Private (Admin/Manager)
 */
router.put(
  '/:id/status',
  requireRole(['ADMIN', 'MANAGER']),
  validateParams(Joi.object({ id: commonSchemas.id })),
  validate(Joi.object({ status: Joi.string().required() })),
  projectController.updateProjectStatus
);



/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private (Admin/Manager)
 */
router.delete(
  '/:id',
  requireRole(['ADMIN', 'MANAGER']),
  validateParams(Joi.object({ id: commonSchemas.id })),
  projectController.deleteProject
);

export default router;

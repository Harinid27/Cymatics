import { Router } from 'express';
import { usersController } from '@/controllers/users.controller';
import { validate, validateQuery, validateParams } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// User validation schemas
const userSchemas = {
  query: Joi.object({
    q: Joi.string().allow('').optional(),
    role: Joi.string().valid('ADMIN', 'MANAGER', 'USER').optional(),
    isActive: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  updateRole: Joi.object({
    role: Joi.string().valid('ADMIN', 'MANAGER', 'USER').required(),
  }),

  updatePermissions: Joi.object({
    permissions: Joi.array().items(Joi.string()).required(),
  }),
};

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin only)
 */
router.get(
  '/',
  validateQuery(userSchemas.query),
  usersController.getUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', usersController.getUserStats);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get(
  '/:id',
  validateParams(Joi.object({ id: Joi.number().integer().positive().required() })),
  usersController.getUserById
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin only)
 */
router.put(
  '/:id/role',
  validateParams(Joi.object({ id: Joi.number().integer().positive().required() })),
  validate(userSchemas.updateRole),
  usersController.updateUserRole
);

/**
 * @route   PUT /api/users/:id/permissions
 * @desc    Update user permissions
 * @access  Private (Admin only)
 */
router.put(
  '/:id/permissions',
  validateParams(Joi.object({ id: Joi.number().integer().positive().required() })),
  validate(userSchemas.updatePermissions),
  usersController.updateUserPermissions
);

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Deactivate user account
 * @access  Private (Admin only)
 */
router.put(
  '/:id/deactivate',
  validateParams(Joi.object({ id: Joi.number().integer().positive().required() })),
  usersController.deactivateUser
);

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Activate user account
 * @access  Private (Admin only)
 */
router.put(
  '/:id/activate',
  validateParams(Joi.object({ id: Joi.number().integer().positive().required() })),
  usersController.activateUser
);

export default router; 
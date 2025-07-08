import { Router } from 'express';
import { clientController } from '@/controllers/client.controller';
import { validate, validateQuery, validateParams, clientSchemas, commonSchemas } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireRole, requirePermission } from '@/middleware/rbac.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/clients
 * @desc    Get all clients with pagination and search
 * @access  Private (Admin/Manager)
 */
router.get(
  '/',
  requirePermission('clients:read'),
  validateQuery(clientSchemas.query),
  clientController.getClients
);

/**
 * @route   GET /api/clients/stats
 * @desc    Get client statistics
 * @access  Private (Admin/Manager)
 */
router.get('/stats', requirePermission('clients:read'), clientController.getClientStats);

/**
 * @route   GET /api/clients/dropdown
 * @desc    Get clients for dropdown (simplified data)
 * @access  Private (Admin/Manager)
 */
router.get('/dropdown', requirePermission('clients:read'), clientController.getClientsDropdown);

/**
 * @route   GET /api/clients/name/:name
 * @desc    Get client by name
 * @access  Private (Admin/Manager)
 */
router.get(
  '/name/:name',
  requirePermission('clients:read'),
  validateParams(Joi.object({ name: Joi.string().required() })),
  clientController.getClientByName
);

/**
 * @route   GET /api/clients/:id/projects
 * @desc    Get projects for a specific client
 * @access  Private (Admin/Manager)
 */
router.get(
  '/:id/projects',
  requirePermission('clients:read'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  clientController.getClientProjects
);

/**
 * @route   GET /api/clients/:id/data
 * @desc    Get client data for editing
 * @access  Private (Admin/Manager)
 */
router.get(
  '/:id/data',
  requirePermission('clients:read'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  clientController.getClientData
);

/**
 * @route   GET /api/clients/:id
 * @desc    Get client by ID
 * @access  Private (Admin/Manager)
 */
router.get(
  '/:id',
  requirePermission('clients:read'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  clientController.getClientById
);

/**
 * @route   POST /api/clients
 * @desc    Create new client
 * @access  Private (Admin/Manager)
 */
router.post(
  '/',
  requireRole(['ADMIN', 'MANAGER']),
  uploadSingle('img'),
  validate(clientSchemas.create),
  clientController.createClient
);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client
 * @access  Private (Admin/Manager)
 */
router.put(
  '/:id',
  requireRole(['ADMIN', 'MANAGER']),
  validateParams(Joi.object({ id: commonSchemas.id })),
  uploadSingle('img'),
  validate(clientSchemas.update),
  clientController.updateClient
);



/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete client
 * @access  Private (Admin/Manager)
 */
router.delete(
  '/:id',
  requireRole(['ADMIN', 'MANAGER']),
  validateParams(Joi.object({ id: commonSchemas.id })),
  clientController.deleteClient
);

export default router;

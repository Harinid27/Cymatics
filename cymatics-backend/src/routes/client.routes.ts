import { Router } from 'express';
import { clientController } from '@/controllers/client.controller';
import { validate, validateQuery, validateParams, clientSchemas, commonSchemas } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/clients
 * @desc    Get all clients with pagination and search
 * @access  Private
 */
router.get(
  '/',
  validateQuery(clientSchemas.query),
  clientController.getClients
);

/**
 * @route   GET /api/clients/stats
 * @desc    Get client statistics
 * @access  Private
 */
router.get('/stats', clientController.getClientStats);

/**
 * @route   GET /api/clients/dropdown
 * @desc    Get clients for dropdown (simplified data)
 * @access  Private
 */
router.get('/dropdown', clientController.getClientsDropdown);

/**
 * @route   GET /api/clients/:id
 * @desc    Get client by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  clientController.getClientById
);

/**
 * @route   GET /api/clients/name/:name
 * @desc    Get client by name
 * @access  Private
 */
router.get(
  '/name/:name',
  validateParams(Joi.object({ name: Joi.string().required() })),
  clientController.getClientByName
);

/**
 * @route   GET /api/clients/:id/data
 * @desc    Get client data for editing
 * @access  Private
 */
router.get(
  '/:id/data',
  validateParams(Joi.object({ id: commonSchemas.id })),
  clientController.getClientData
);

/**
 * @route   POST /api/clients
 * @desc    Create new client
 * @access  Private
 */
router.post(
  '/',
  uploadSingle('img'),
  validate(clientSchemas.create),
  clientController.createClient
);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client
 * @access  Private
 */
router.put(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  uploadSingle('img'),
  validate(clientSchemas.update),
  clientController.updateClient
);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete client
 * @access  Private
 */
router.delete(
  '/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  clientController.deleteClient
);

export default router;

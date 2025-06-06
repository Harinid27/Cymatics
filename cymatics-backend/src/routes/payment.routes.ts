import { Router } from 'express';
import { paymentController } from '@/controllers/payment.controller';
import { validate, validateParams, validateQuery } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const paymentSchemas = {
  createPayment: Joi.object({
    clientId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().optional().max(500),
    dueDate: Joi.date().optional(),
  }),

  updatePayment: Joi.object({
    amount: Joi.number().positive().optional(),
    description: Joi.string().optional().max(500),
    dueDate: Joi.date().optional(),
    status: Joi.string().valid('ongoing', 'pending', 'completed').optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('ongoing', 'pending', 'completed').required(),
  }),

  params: Joi.object({
    id: Joi.number().integer().positive().required(),
    status: Joi.string().valid('ongoing', 'pending', 'completed').required(),
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('ongoing', 'pending', 'completed').optional(),
    search: Joi.string().optional(),
  }),
};

/**
 * @route   GET /api/payments
 * @desc    Get all payments with pagination and filters
 * @access  Private
 */
router.get(
  '/',
  validateQuery(paymentSchemas.query),
  paymentController.getPayments
);

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics
 * @access  Private
 */
router.get('/stats', paymentController.getPaymentStats);

/**
 * @route   GET /api/payments/status/:status
 * @desc    Get payments by status
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
  paymentController.getPaymentsByStatus
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(Joi.object({
    id: Joi.number().integer().positive().required(),
  })),
  paymentController.getPaymentById
);

/**
 * @route   POST /api/payments
 * @desc    Create payment
 * @access  Private
 */
router.post(
  '/',
  validate(paymentSchemas.createPayment),
  paymentController.createPayment
);

/**
 * @route   PUT /api/payments/:id
 * @desc    Update payment
 * @access  Private
 */
router.put(
  '/:id',
  validateParams(Joi.object({
    id: Joi.number().integer().positive().required(),
  })),
  validate(paymentSchemas.updatePayment),
  paymentController.updatePayment
);

/**
 * @route   PUT /api/payments/:id/status
 * @desc    Update payment status
 * @access  Private
 */
router.put(
  '/:id/status',
  validateParams(Joi.object({
    id: Joi.number().integer().positive().required(),
  })),
  validate(paymentSchemas.updateStatus),
  paymentController.updatePaymentStatus
);

/**
 * @route   DELETE /api/payments/:id
 * @desc    Delete payment
 * @access  Private
 */
router.delete(
  '/:id',
  validateParams(Joi.object({
    id: Joi.number().integer().positive().required(),
  })),
  paymentController.deletePayment
);

export default router;

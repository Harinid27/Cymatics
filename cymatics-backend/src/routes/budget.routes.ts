import { Router } from 'express';
import { budgetController } from '@/controllers/budget.controller';
import { validate, validateParams } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const budgetSchemas = {
  createCategory: Joi.object({
    name: Joi.string().required().min(1).max(100),
    percentage: Joi.number().required().min(0).max(100),
    color: Joi.string().required().pattern(/^#[0-9A-Fa-f]{6}$/),
    description: Joi.string().optional().max(500),
  }),

  updateCategory: Joi.object({
    name: Joi.string().optional().min(1).max(100),
    percentage: Joi.number().optional().min(0).max(100),
    color: Joi.string().optional().pattern(/^#[0-9A-Fa-f]{6}$/),
    description: Joi.string().optional().max(500),
  }),

  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

/**
 * @route   GET /api/budget/overview
 * @desc    Get budget overview
 * @access  Private
 */
router.get('/overview', budgetController.getBudgetOverview);

/**
 * @route   GET /api/budget/categories
 * @desc    Get budget categories
 * @access  Private
 */
router.get('/categories', budgetController.getBudgetCategories);

/**
 * @route   GET /api/budget/investment-details
 * @desc    Get investment details
 * @access  Private
 */
router.get('/investment-details', budgetController.getInvestmentDetails);

/**
 * @route   POST /api/budget/categories
 * @desc    Create budget category
 * @access  Private
 */
router.post(
  '/categories',
  validate(budgetSchemas.createCategory),
  budgetController.createBudgetCategory
);

/**
 * @route   PUT /api/budget/categories/:id
 * @desc    Update budget category
 * @access  Private
 */
router.put(
  '/categories/:id',
  validateParams(budgetSchemas.params),
  validate(budgetSchemas.updateCategory),
  budgetController.updateBudgetCategory
);

/**
 * @route   DELETE /api/budget/categories/:id
 * @desc    Delete budget category
 * @access  Private
 */
router.delete(
  '/categories/:id',
  validateParams(budgetSchemas.params),
  budgetController.deleteBudgetCategory
);

export default router;

import { Router } from 'express';
import { financialController } from '@/controllers/financial.controller';
import { validate, validateQuery, validateParams, incomeSchemas, expenseSchemas, commonSchemas } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// ============ INCOME ROUTES ============

/**
 * @route   GET /api/financial/income
 * @desc    Get all income entries with pagination and filters
 * @access  Private
 */
router.get(
  '/income',
  validateQuery(Joi.object({
    q: Joi.string().allow('').optional(),
    projectId: Joi.number().integer().positive().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  })),
  financialController.getIncomes
);

/**
 * @route   GET /api/financial/income/chart-data
 * @desc    Get income chart data for frontend
 * @access  Private
 */
router.get(
  '/income/chart-data',
  validateQuery(Joi.object({
    period: Joi.string().valid('6months', '12months').default('6months'),
  })),
  financialController.getIncomeChartData
);

/**
 * @route   GET /api/financial/income/:id
 * @desc    Get income by ID
 * @access  Private
 */
router.get(
  '/income/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  financialController.getIncomeById
);

/**
 * @route   POST /api/financial/income
 * @desc    Create new income entry
 * @access  Private
 */
router.post(
  '/income',
  validate(incomeSchemas.create),
  financialController.createIncome
);

/**
 * @route   PUT /api/financial/income/:id
 * @desc    Update income entry
 * @access  Private
 */
router.put(
  '/income/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  validate(incomeSchemas.update),
  financialController.updateIncome
);



/**
 * @route   DELETE /api/financial/income/:id
 * @desc    Delete income entry
 * @access  Private
 */
router.delete(
  '/income/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  financialController.deleteIncome
);

// ============ EXPENSE ROUTES ============

/**
 * @route   GET /api/financial/expenses
 * @desc    Get all expense entries with pagination and filters
 * @access  Private
 */
router.get(
  '/expenses',
  validateQuery(Joi.object({
    q: Joi.string().allow('').optional(),
    projectId: Joi.number().integer().positive().optional(),
    category: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  })),
  financialController.getExpenses
);

// ============ EXPENSE UTILITY ROUTES (must come before :id routes) ============

/**
 * @route   GET /api/financial/expenses/categories
 * @desc    Get expense categories
 * @access  Private
 */
router.get('/expenses/categories', financialController.getExpenseCategories);

/**
 * @route   GET /api/financial/expenses/categorized
 * @desc    Get categorized expenses for frontend
 * @access  Private
 */
router.get(
  '/expenses/categorized',
  validateQuery(Joi.object({
    period: Joi.string().valid('6months', '12months').default('6months'),
  })),
  financialController.getCategorizedExpenses
);

/**
 * @route   GET /api/financial/expenses/totals
 * @desc    Get categorized expense totals
 * @access  Private
 */
router.get(
  '/expenses/totals',
  validateQuery(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  })),
  financialController.getCategorizedExpenseTotals
);

/**
 * @route   GET /api/financial/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
router.get(
  '/expenses/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  financialController.getExpenseById
);

/**
 * @route   POST /api/financial/expenses
 * @desc    Create new expense entry
 * @access  Private
 */
router.post(
  '/expenses',
  validate(expenseSchemas.create),
  financialController.createExpense
);

/**
 * @route   PUT /api/financial/expenses/:id
 * @desc    Update expense entry
 * @access  Private
 */
router.put(
  '/expenses/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  validate(expenseSchemas.update),
  financialController.updateExpense
);

/**
 * @route   DELETE /api/financial/expenses/:id
 * @desc    Delete expense entry
 * @access  Private
 */


router.delete(
  '/expenses/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  financialController.deleteExpense
);

// ============ FINANCIAL SUMMARY ROUTES ============

/**
 * @route   GET /api/financial/summary
 * @desc    Get financial summary
 * @access  Private
 */
router.get(
  '/summary',
  validateQuery(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  })),
  financialController.getFinancialSummary
);

/**
 * @route   GET /api/financial/budget
 * @desc    Get budget overview
 * @access  Private
 */
router.get(
  '/budget',
  validateQuery(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  })),
  financialController.getBudgetOverview
);

export default router;

import { Router } from 'express';
import { dashboardController } from '@/controllers/dashboard.controller';
import { validateQuery } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get comprehensive dashboard statistics
 * @access  Private
 */
router.get('/stats', dashboardController.getDashboardStats);

/**
 * @route   GET /api/dashboard/financial-summary
 * @desc    Get financial summary for a specific period
 * @access  Private
 */
router.get(
  '/financial-summary',
  validateQuery(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  })),
  dashboardController.getFinancialSummary
);

/**
 * @route   GET /api/dashboard/today-schedule
 * @desc    Get today's schedule for dashboard
 * @access  Private
 */
router.get('/today-schedule', dashboardController.getTodaySchedule);

/**
 * @route   GET /api/dashboard/charts/income-expense
 * @desc    Get income vs expense chart data
 * @access  Private
 */
router.get(
  '/charts/income-expense',
  validateQuery(Joi.object({
    period: Joi.string().valid('6months', '12months').default('6months'),
  })),
  dashboardController.getIncomeExpenseChart
);

/**
 * @route   GET /api/dashboard/charts/project-details
 * @desc    Get project details chart data
 * @access  Private
 */
router.get('/charts/project-details', dashboardController.getProjectDetailsChart);

/**
 * @route   GET /api/dashboard/charts/expense-breakdown
 * @desc    Get expense breakdown chart data
 * @access  Private
 */
router.get(
  '/charts/expense-breakdown',
  validateQuery(Joi.object({
    period: Joi.string().valid('6months', '12months').default('6months'),
  })),
  dashboardController.getExpenseBreakdownChart
);

/**
 * @route   GET /api/dashboard/charts/monthly-income-expense
 * @desc    Get monthly income vs expense chart data (Django equivalent)
 * @access  Private
 */
router.get('/charts/monthly-income-expense', dashboardController.getMonthlyIncomeExpenseChart);

/**
 * @route   GET /api/dashboard/charts/monthly-projects
 * @desc    Get monthly project count chart data (Django equivalent)
 * @access  Private
 */
router.get('/charts/monthly-projects', dashboardController.getMonthlyProjectChart);

/**
 * @route   GET /api/dashboard/charts/expense-pie
 * @desc    Get expense pie chart data (Django equivalent)
 * @access  Private
 */
router.get('/charts/expense-pie', dashboardController.getExpensePieChart);

/**
 * @route   GET /api/dashboard/charts/monthly-expenses-stacked
 * @desc    Get monthly expenses stacked bar chart data (Django equivalent)
 * @access  Private
 */
router.get('/charts/monthly-expenses-stacked', dashboardController.getMonthlyExpensesStackedChart);

/**
 * @route   GET /api/dashboard/charts/category-expenses
 * @desc    Get category expenses bar chart data (Django equivalent)
 * @access  Private
 */
router.get('/charts/category-expenses', dashboardController.getCategoryExpensesChart);

export default router;

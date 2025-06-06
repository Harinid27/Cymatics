import { Request, Response, NextFunction } from 'express';
import { financialService } from '@/services/financial.service';
import { sendSuccessResponse, parsePaginationQuery, parseSearchQuery } from '@/utils/helpers';

class FinancialController {
  // ============ INCOME METHODS ============

  /**
   * Get all income entries with pagination and filters
   */
  async getIncomes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const search = parseSearchQuery(req.query);
      const { projectId, startDate, endDate } = req.query;

      const options: any = {
        search,
        page,
        limit,
      };

      if (projectId) options.projectId = parseInt(projectId as string);
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const result = await financialService.getIncomes(options);

      sendSuccessResponse(
        res,
        result.incomes,
        'Income entries retrieved successfully',
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get income chart data for frontend
   */
  async getIncomeChartData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = '6months' } = req.query;
      const chartData = await financialService.getIncomeChartData(period as string);

      sendSuccessResponse(res, chartData, 'Income chart data retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get income by ID
   */
  async getIncomeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const income = await financialService.getIncomeById(parseInt(id));

      sendSuccessResponse(res, income, 'Income entry retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new income entry
   */
  async createIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, description, amount, note, projectIncome, projectId } = req.body;

      const incomeData: any = {
        date: new Date(date),
        description,
        amount: parseInt(amount),
        projectIncome: projectIncome || false,
      };

      if (note) {
        incomeData.note = note;
      }

      if (projectId) {
        incomeData.projectId = parseInt(projectId);
      }

      const income = await financialService.createIncome(incomeData);

      sendSuccessResponse(res, income, 'Income entry created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update income entry
   */
  async updateIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { date, description, amount, note, projectIncome, projectId } = req.body;

      const updateData: any = {};
      if (date !== undefined) updateData.date = new Date(date);
      if (description !== undefined) updateData.description = description;
      if (amount !== undefined) updateData.amount = parseInt(amount);
      if (note !== undefined) updateData.note = note || null;
      if (projectIncome !== undefined) updateData.projectIncome = projectIncome;
      if (projectId !== undefined) updateData.projectId = projectId ? parseInt(projectId) : null;

      const income = await financialService.updateIncome(parseInt(id), updateData);

      sendSuccessResponse(res, income, 'Income entry updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete income entry
   */
  async deleteIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await financialService.deleteIncome(parseInt(id));

      sendSuccessResponse(res, result, 'Income entry deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  // ============ EXPENSE METHODS ============

  /**
   * Get all expense entries with pagination and filters
   */
  async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const search = parseSearchQuery(req.query);
      const { projectId, category, startDate, endDate } = req.query;

      const options: any = {
        search,
        page,
        limit,
      };

      if (projectId) options.projectId = parseInt(projectId as string);
      if (category) options.category = category as string;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const result = await financialService.getExpenses(options);

      sendSuccessResponse(
        res,
        result.expenses,
        'Expense entries retrieved successfully',
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const expense = await financialService.getExpenseById(parseInt(id));

      sendSuccessResponse(res, expense, 'Expense entry retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new expense entry
   */
  async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, category, description, amount, notes, projectExpense, projectId } = req.body;

      const expenseData: any = {
        date: new Date(date),
        category,
        description,
        amount: parseInt(amount),
        projectExpense: projectExpense || false,
      };

      if (notes) {
        expenseData.notes = notes;
      }

      if (projectId) {
        expenseData.projectId = parseInt(projectId);
      }

      const expense = await financialService.createExpense(expenseData);

      sendSuccessResponse(res, expense, 'Expense entry created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update expense entry
   */
  async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { date, category, description, amount, notes, projectExpense, projectId } = req.body;

      const updateData: any = {};
      if (date !== undefined) updateData.date = new Date(date);
      if (category !== undefined) updateData.category = category;
      if (description !== undefined) updateData.description = description;
      if (amount !== undefined) updateData.amount = parseInt(amount);
      if (notes !== undefined) updateData.notes = notes || null;
      if (projectExpense !== undefined) updateData.projectExpense = projectExpense;
      if (projectId !== undefined) updateData.projectId = projectId ? parseInt(projectId) : null;

      const expense = await financialService.updateExpense(parseInt(id), updateData);

      sendSuccessResponse(res, expense, 'Expense entry updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete expense entry
   */
  async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await financialService.deleteExpense(parseInt(id));

      sendSuccessResponse(res, result, 'Expense entry deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Get expense categories
   */
  async getExpenseCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await financialService.getExpenseCategories();

      sendSuccessResponse(res, categories, 'Expense categories retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get categorized expenses for frontend
   */
  async getCategorizedExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = '6months' } = req.query;
      const categorizedExpenses = await financialService.getCategorizedExpenses(period as string);

      sendSuccessResponse(res, categorizedExpenses, 'Categorized expenses retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get categorized expense totals
   */
  async getCategorizedExpenseTotals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const options: any = {};
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const result = await financialService.getCategorizedExpenseTotals(options);

      sendSuccessResponse(res, result, 'Categorized expense totals retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const options: any = {};
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const summary = await financialService.getFinancialSummary(options);

      sendSuccessResponse(res, summary, 'Financial summary retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get budget overview (combines multiple financial metrics)
   */
  async getBudgetOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const options: any = {};
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const [summary, categorizedExpenses] = await Promise.all([
        financialService.getFinancialSummary(options),
        financialService.getCategorizedExpenseTotals(options),
      ]);

      const budgetOverview = {
        summary,
        expenseBreakdown: categorizedExpenses,
        profitMargin: summary.totalIncome > 0 ? (summary.netProfit / summary.totalIncome) * 100 : 0,
      };

      sendSuccessResponse(res, budgetOverview, 'Budget overview retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const financialController = new FinancialController();

import { Request, Response, NextFunction } from 'express';
import { budgetService } from '@/services/budget.service';
import { sendSuccessResponse } from '@/utils/helpers';

class BudgetController {
  /**
   * Get budget overview
   */
  async getBudgetOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await budgetService.getBudgetOverview();

      sendSuccessResponse(res, overview, 'Budget overview retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get budget categories
   */
  async getBudgetCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await budgetService.getBudgetCategories();

      sendSuccessResponse(res, categories, 'Budget categories retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get investment details
   */
  async getInvestmentDetails(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const investments = await budgetService.getInvestmentDetails();

      sendSuccessResponse(res, investments, 'Investment details retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create budget category
   */
  async createBudgetCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await budgetService.createBudgetCategory(req.body);

      sendSuccessResponse(res, category, 'Budget category created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update budget category
   */
  async updateBudgetCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await budgetService.updateBudgetCategory(parseInt(id), req.body);

      sendSuccessResponse(res, category, 'Budget category updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete budget category
   */
  async deleteBudgetCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await budgetService.deleteBudgetCategory(parseInt(id));

      sendSuccessResponse(res, null, 'Budget category deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const budgetController = new BudgetController();

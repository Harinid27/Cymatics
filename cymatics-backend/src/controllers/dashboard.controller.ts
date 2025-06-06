import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '@/services/dashboard.service';
import { sendSuccessResponse } from '@/utils/helpers';

class DashboardController {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getDashboardStats();

      sendSuccessResponse(res, stats, 'Dashboard statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get financial summary for a specific period
   */
  async getFinancialSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const summary = await dashboardService.getFinancialSummary(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
      );

      sendSuccessResponse(res, summary, 'Financial summary retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get today's schedule for dashboard
   */
  async getTodaySchedule(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedule = await dashboardService.getTodaySchedule();

      sendSuccessResponse(res, schedule, 'Today\'s schedule retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get income vs expense chart data
   */
  async getIncomeExpenseChart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = '6months' } = req.query;
      const chartData = await dashboardService.getIncomeExpenseChart(period as string);

      sendSuccessResponse(res, chartData, 'Income vs expense chart data retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get project details chart data
   */
  async getProjectDetailsChart(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chartData = await dashboardService.getProjectDetailsChart();

      sendSuccessResponse(res, chartData, 'Project details chart data retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get expense breakdown chart data
   */
  async getExpenseBreakdownChart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = '6months' } = req.query;
      const chartData = await dashboardService.getExpenseBreakdownChart(period as string);

      sendSuccessResponse(res, chartData, 'Expense breakdown chart data retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();

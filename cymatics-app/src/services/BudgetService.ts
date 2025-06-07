import ApiService from './ApiService';

export interface BudgetOverview {
  currentBalance: number;
  receivedAmountThisMonth: number;
  totalReceivedChart: { month: string; value: number }[];
  budgetSplitUp: { name: string; amount: number; color: string }[];
}

export interface BudgetCategory {
  id: number;
  name: string;
  percentage: number;
  color: string;
  amount: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestmentDetail {
  id: number;
  name: string;
  amount: number;
  type: string;
  returns: number;
  date: Date;
  description?: string;
}

class BudgetService {
  /**
   * Get budget overview with current balance, monthly income, and chart data
   */
  async getBudgetOverview(): Promise<BudgetOverview> {
    try {
      const response = await ApiService.get('/financial/budget');
      if (response.success && response.data) {
        return response.data;
      }

      // Return default data if API fails
      return {
        currentBalance: 0,
        receivedAmountThisMonth: 0,
        totalReceivedChart: [],
        budgetSplitUp: []
      };
    } catch (error) {
      console.error('Error fetching budget overview:', error);
      // Return default data instead of throwing
      return {
        currentBalance: 0,
        receivedAmountThisMonth: 0,
        totalReceivedChart: [],
        budgetSplitUp: []
      };
    }
  }

  /**
   * Get budget categories for budget split up
   */
  async getBudgetCategories(): Promise<BudgetCategory[]> {
    try {
      const response = await ApiService.get('/financial/budget/categories');
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching budget categories:', error);
      return [];
    }
  }

  /**
   * Create a new budget category
   */
  async createBudgetCategory(data: {
    name: string;
    percentage: number;
    color: string;
    description?: string;
  }): Promise<BudgetCategory> {
    try {
      const response = await ApiService.post('/financial/budget/categories', data);
      return response.data;
    } catch (error) {
      console.error('Error creating budget category:', error);
      throw error;
    }
  }

  /**
   * Update a budget category
   */
  async updateBudgetCategory(id: number, data: {
    name?: string;
    percentage?: number;
    color?: string;
    description?: string;
  }): Promise<BudgetCategory> {
    try {
      const response = await ApiService.put(`/financial/budget/categories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating budget category:', error);
      throw error;
    }
  }

  /**
   * Delete a budget category
   */
  async deleteBudgetCategory(id: number): Promise<void> {
    try {
      await ApiService.delete(`/financial/budget/categories/${id}`);
    } catch (error) {
      console.error('Error deleting budget category:', error);
      throw error;
    }
  }

  /**
   * Get investment details for balance comparison
   */
  async getInvestmentDetails(): Promise<InvestmentDetail[]> {
    try {
      const response = await ApiService.get('/financial/budget/investments');
      return response.data;
    } catch (error) {
      console.error('Error fetching investment details:', error);
      throw error;
    }
  }

  /**
   * Get budget vs actual spending comparison
   */
  async getBudgetComparison(): Promise<{
    budget: number;
    expense: number;
    balance: number;
  }[]> {
    try {
      const response = await ApiService.get('/financial/budget/comparison');
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching budget comparison:', error);
      return [];
    }
  }

  /**
   * Get monthly income chart data for the last 12 months
   */
  async getMonthlyIncomeChart(): Promise<{ month: string; value: number }[]> {
    try {
      const response = await ApiService.get('/financial/income/chart-data');
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly income chart:', error);
      throw error;
    }
  }
}

export default new BudgetService();

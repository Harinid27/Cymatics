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
  spentAmount?: number;
  remainingAmount?: number;
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
   * Only returns real database data - no mock data fallbacks
   */
  async getBudgetOverview(): Promise<BudgetOverview> {
    try {
      console.log('🏦 Fetching budget overview from dedicated endpoint...');
      const response = await ApiService.get<BudgetOverview>('/budget/overview');

      console.log('🏦 Budget overview API response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        status: response.status,
      });

      if (response.success && response.data) {
        return response.data;
      }

      // If API fails, return empty data structure - NO MOCK DATA
      console.log('🏦 API failed, returning empty budget overview data');
      return {
        currentBalance: 0,
        receivedAmountThisMonth: 0,
        totalReceivedChart: [],
        budgetSplitUp: []
      };
    } catch (error) {
      console.error('Error fetching budget overview:', error);
      // Return empty data instead of mock data
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
   * Only returns real database data - no mock data fallbacks
   */
  async getBudgetCategories(): Promise<BudgetCategory[]> {
    try {
      console.log('📊 Fetching budget categories from dedicated endpoint...');
      const response = await ApiService.get<{ categories: BudgetCategory[] }>('/budget/categories');

      console.log('📊 Budget categories API response:', {
        success: response.success,
        hasData: !!response.data,
        dataLength: response.data?.categories?.length || 0,
        error: response.error,
        status: response.status,
      });

      if (response.success && response.data?.categories) {
        return response.data.categories;
      }

      // Return empty categories if API fails - NO MOCK DATA
      console.log('📊 API failed, returning empty budget categories');
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
      const response = await ApiService.post<BudgetCategory>('/financial/budget/categories', data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to create budget category');
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
      const response = await ApiService.put<BudgetCategory>(`/financial/budget/categories/${id}`, data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to update budget category');
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
   * Only returns real database data - no mock data fallbacks
   */
  async getInvestmentDetails(): Promise<InvestmentDetail[]> {
    try {
      console.log('💰 Fetching investment details from dedicated endpoint...');
      const response = await ApiService.get<{ investments: InvestmentDetail[] }>('/budget/investment-details');

      console.log('💰 Investment details API response:', {
        success: response.success,
        hasData: !!response.data,
        dataLength: response.data?.investments?.length || 0,
        error: response.error,
        status: response.status,
      });

      if (response.success && response.data?.investments) {
        return response.data.investments;
      }

      // Return empty investment data if API fails - NO MOCK DATA
      console.log('💰 API failed, returning empty investment details');
      return [];
    } catch (error) {
      console.error('Error fetching investment details:', error);
      return [];
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
      console.log('📈 Fetching budget comparison data...');
      const response = await ApiService.get<{
        budget: number;
        expense: number;
        balance: number;
      }[]>('/financial/budget/comparison');

      console.log('📈 Budget comparison API response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        status: response.status,
      });

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
   * Get detailed budget analytics including spending patterns and trends
   */
  async getBudgetAnalytics(): Promise<{
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    budgetUtilization: number;
    monthlyTrend: { month: string; budget: number; spent: number }[];
    categoryBreakdown: { category: string; budgeted: number; spent: number; remaining: number }[];
  }> {
    try {
      console.log('📊 Fetching detailed budget analytics...');

      // Get budget overview and categories in parallel
      const [overview, categories] = await Promise.all([
        this.getBudgetOverview(),
        this.getBudgetCategories()
      ]);

      // Calculate analytics from real data only
      const totalBudget = categories.reduce((sum, cat) => sum + cat.amount, 0);
      const totalSpent = overview.receivedAmountThisMonth;
      const remainingBudget = Math.max(0, totalBudget - totalSpent);
      const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      // Generate monthly trend from real chart data
      const monthlyTrend = overview.totalReceivedChart.map(item => ({
        month: item.month,
        budget: totalBudget / 12, // Assuming equal monthly budget
        spent: item.value
      }));

      // Generate category breakdown from real data
      const categoryBreakdown = categories.map(category => ({
        category: category.name,
        budgeted: category.amount,
        spent: category.spentAmount || 0,
        remaining: category.remainingAmount || category.amount
      }));

      return {
        totalBudget,
        totalSpent,
        remainingBudget,
        budgetUtilization,
        monthlyTrend,
        categoryBreakdown
      };
    } catch (error) {
      console.error('Error fetching budget analytics:', error);
      return {
        totalBudget: 0,
        totalSpent: 0,
        remainingBudget: 0,
        budgetUtilization: 0,
        monthlyTrend: [],
        categoryBreakdown: []
      };
    }
  }

  /**
   * Get monthly income chart data for the last 12 months
   */
  async getMonthlyIncomeChart(): Promise<{ month: string; value: number }[]> {
    try {
      const response = await ApiService.get<{ month: string; value: number }[]>('/financial/income/chart-data');
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching monthly income chart:', error);
      return [];
    }
  }
}

export default new BudgetService();

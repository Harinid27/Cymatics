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
   */
  async getBudgetOverview(): Promise<BudgetOverview> {
    try {
      console.log('🏦 Fetching budget overview from dedicated endpoint...');
      const response = await ApiService.get('/budget/overview');

      console.log('🏦 Budget overview API response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        status: response.status,
      });

      if (response.success && response.data) {
        return response.data;
      }

      // Fallback to financial endpoint if budget endpoint fails
      console.log('🏦 Trying fallback financial endpoint...');
      const fallbackResponse = await ApiService.get('/financial/budget');
      if (fallbackResponse.success && fallbackResponse.data) {
        // Transform financial data to budget format if needed
        const financialData = fallbackResponse.data;
        return {
          currentBalance: financialData.summary?.netProfit || 0,
          receivedAmountThisMonth: financialData.summary?.totalIncome || 0,
          totalReceivedChart: [],
          budgetSplitUp: financialData.expenseBreakdown?.map((item: any, index: number) => ({
            name: item.category || 'Unknown',
            amount: item.total || 0,
            color: this.getDefaultColors()[index % this.getDefaultColors().length]
          })) || []
        };
      }

      // Return default data if both APIs fail
      return this.getDefaultBudgetOverview();
    } catch (error) {
      console.error('Error fetching budget overview:', error);
      // Return default data instead of throwing
      return this.getDefaultBudgetOverview();
    }
  }

  private getDefaultBudgetOverview(): BudgetOverview {
    return {
      currentBalance: 0,
      receivedAmountThisMonth: 0,
      totalReceivedChart: [],
      budgetSplitUp: []
    };
  }

  private getDefaultColors(): string[] {
    return ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'];
  }

  /**
   * Get budget categories for budget split up
   */
  async getBudgetCategories(): Promise<BudgetCategory[]> {
    try {
      console.log('📊 Fetching budget categories from dedicated endpoint...');
      const response = await ApiService.get('/budget/categories');

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

      // Return empty array if API fails
      console.log('📊 No budget categories found, returning empty array');
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
      console.log('💰 Fetching investment details from dedicated endpoint...');
      const response = await ApiService.get('/budget/investment-details');

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

      // Return empty array if API fails
      console.log('💰 No investment details found, returning empty array');
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
      const response = await ApiService.get('/financial/budget/comparison');

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

      // Calculate analytics
      const totalBudget = categories.reduce((sum, cat) => sum + cat.amount, 0);
      const totalSpent = overview.receivedAmountThisMonth; // This would be actual spending in a real scenario
      const remainingBudget = Math.max(0, totalBudget - totalSpent);
      const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      // Generate monthly trend (mock data for now)
      const monthlyTrend = overview.totalReceivedChart.map(item => ({
        month: item.month,
        budget: totalBudget / 12, // Assuming equal monthly budget
        spent: item.value
      }));

      // Generate category breakdown
      const categoryBreakdown = categories.map(category => ({
        category: category.name,
        budgeted: category.amount,
        spent: category.amount * (budgetUtilization / 100), // Proportional spending
        remaining: category.amount * (1 - budgetUtilization / 100)
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
      const response = await ApiService.get('/financial/income/chart-data');
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly income chart:', error);
      throw error;
    }
  }
}

export default new BudgetService();

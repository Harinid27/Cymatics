/**
 * Financial Service
 * Handles all financial-related API operations (income and expenses)
 */

import ApiService from './ApiService';
import envConfig from '../config/environment';

// Types
export interface Income {
  id: number;
  date: string;
  description: string;
  amount: number;
  note?: string;
  projectIncome: boolean;
  projectId?: number;
  project?: {
    id: number;
    code: string;
    name: string;
    status: string | null;
    pendingAmt: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  notes?: string;
  projectExpense: boolean;
  projectId?: number;
  project?: {
    id: number;
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomeData {
  date: string;
  description: string;
  amount: number;
  note?: string;
  projectIncome?: boolean;
  projectId?: number;
}

export interface CreateExpenseData {
  date: string;
  category: string;
  description: string;
  amount: number;
  notes?: string;
  projectExpense?: boolean;
  projectId?: number;
}

export interface IncomeChartData {
  chartData: {
    month: string;
    valuation: number;
    received: number;
  }[];
}

export interface FinancialQueryOptions {
  search?: string;
  projectId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface FinancialResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class FinancialService {
  private baseEndpoint = '/api/financial';

  /**
   * Get all income entries with pagination and filters
   */
  async getIncomes(options: FinancialQueryOptions = {}): Promise<FinancialResponse<Income>> {
    try {
      const params: Record<string, string | number> = {};

      if (options.search) params.q = options.search;
      if (options.projectId) params.projectId = options.projectId;
      if (options.startDate) params.startDate = options.startDate;
      if (options.endDate) params.endDate = options.endDate;
      if (options.page) params.page = options.page;
      if (options.limit) params.limit = options.limit;

      const response = await ApiService.get<FinancialResponse<Income>>(
        `${this.baseEndpoint}/income`,
        params
      );

      if (response.success) {
        // The backend returns data directly, not wrapped in another data property
        return {
          data: Array.isArray(response.data) ? response.data : [],
          pagination: response.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        };
      }

      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error('Failed to fetch incomes:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Get income chart data
   */
  async getIncomeChartData(period: '6months' | '12months' = '6months'): Promise<IncomeChartData> {
    try {
      const response = await ApiService.get<IncomeChartData>(
        `${this.baseEndpoint}/income/chart-data`,
        { period }
      );

      if (response.success && response.data) {
        // The backend returns { chartData: [...] } directly
        return response.data;
      }

      // Return empty chart data if API call fails
      return {
        chartData: [],
      };
    } catch (error) {
      console.error('Failed to fetch income chart data:', error);
      return {
        chartData: [],
      };
    }
  }

  /**
   * Get income by ID
   */
  async getIncomeById(id: number): Promise<Income | null> {
    try {
      const response = await ApiService.get<Income>(`${this.baseEndpoint}/income/${id}`);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch income:', error);
      return null;
    }
  }

  /**
   * Create new income entry
   */
  async createIncome(incomeData: CreateIncomeData): Promise<Income | null> {
    try {
      const response = await ApiService.post<Income>(`${this.baseEndpoint}/income`, incomeData);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to create income:', error);
      return null;
    }
  }

  /**
   * Update income
   */
  async updateIncome(id: number, incomeData: Partial<CreateIncomeData>): Promise<Income | null> {
    try {
      const response = await ApiService.put<Income>(`${this.baseEndpoint}/income/${id}`, incomeData);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to update income:', error);
      return null;
    }
  }

  /**
   * Delete income
   */
  async deleteIncome(id: number): Promise<boolean> {
    try {
      const response = await ApiService.delete(`${this.baseEndpoint}/income/${id}`);
      return response.success;
    } catch (error) {
      console.error('Failed to delete income:', error);
      return false;
    }
  }

  /**
   * Get all expenses with pagination and filters
   */
  async getExpenses(options: FinancialQueryOptions = {}): Promise<FinancialResponse<Expense>> {
    try {
      const params: Record<string, string | number> = {};

      if (options.search) params.q = options.search;
      if (options.projectId) params.projectId = options.projectId;
      if (options.startDate) params.startDate = options.startDate;
      if (options.endDate) params.endDate = options.endDate;
      if (options.page) params.page = options.page;
      if (options.limit) params.limit = options.limit;

      const response = await ApiService.get<FinancialResponse<Expense>>(
        `${this.baseEndpoint}/expenses`,
        params
      );

      if (response.success) {
        // The backend returns data directly, not wrapped in another data property
        return {
          data: Array.isArray(response.data) ? response.data : [],
          pagination: response.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        };
      }

      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: number): Promise<Expense | null> {
    try {
      const response = await ApiService.get<Expense>(`${this.baseEndpoint}/expenses/${id}`);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch expense:', error);
      return null;
    }
  }

  /**
   * Create new expense entry
   */
  async createExpense(expenseData: CreateExpenseData): Promise<Expense | null> {
    try {
      const response = await ApiService.post<Expense>(`${this.baseEndpoint}/expenses`, expenseData);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to create expense:', error);
      return null;
    }
  }

  /**
   * Update expense
   */
  async updateExpense(id: number, expenseData: Partial<CreateExpenseData>): Promise<Expense | null> {
    try {
      const response = await ApiService.put<Expense>(`${this.baseEndpoint}/expenses/${id}`, expenseData);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to update expense:', error);
      return null;
    }
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    projectIncome: number;
    nonProjectIncome: number;
  }> {
    try {
      const response = await ApiService.get<{
        totalIncome: number;
        totalExpenses: number;
        netIncome: number;
        projectIncome: number;
        nonProjectIncome: number;
      }>(`${this.baseEndpoint}/summary`);

      if (response.success && response.data) {
        return response.data;
      }

      return {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        projectIncome: 0,
        nonProjectIncome: 0,
      };
    } catch (error) {
      console.error('Failed to fetch financial summary:', error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        projectIncome: 0,
        nonProjectIncome: 0,
      };
    }
  }
}

// Export singleton instance
export default new FinancialService();

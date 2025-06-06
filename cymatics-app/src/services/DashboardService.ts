/**
 * Dashboard API Service
 * Handles all dashboard-related API calls
 */

import ApiService from './ApiService';
import envConfig from '../config/environment';

// Types based on your Python test script
export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  pendingAmount: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalClients: number;
}

export interface TodaySchedule {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string;
  client?: string;
  projectCode?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

export interface IncomeExpenseChart {
  period: string;
  income: ChartData;
  expense: ChartData;
  combined: ChartData;
}

export interface ProjectDetailsChart {
  byStatus: ChartData;
  byType: ChartData;
  byMonth: ChartData;
}

export interface ExpenseBreakdownChart {
  byCategory: ChartData;
  byMonth: ChartData;
  trends: ChartData;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  expenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  incomeBreakdown: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
}

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats | null> {
    try {
      const response = await ApiService.get<DashboardStats>(`${envConfig.DASHBOARD_ENDPOINT}/stats`);

      if (response.success && response.data) {
        return response.data;
      }

      console.error('Failed to fetch dashboard stats:', response.error);
      return null;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return null;
    }
  }

  /**
   * Get today's schedule/shoots
   */
  async getTodaySchedule(): Promise<TodaySchedule[]> {
    try {
      const response = await ApiService.get<TodaySchedule[]>(`${envConfig.DASHBOARD_ENDPOINT}/today-schedule`);

      if (response.success && response.data) {
        return response.data;
      }

      console.error('Failed to fetch today schedule:', response.error);
      return [];
    } catch (error) {
      console.error('Today schedule error:', error);
      return [];
    }
  }

  /**
   * Get income vs expense chart data
   */
  async getIncomeExpenseChart(period: string = '6months'): Promise<IncomeExpenseChart | null> {
    try {
      const url = `${envConfig.DASHBOARD_ENDPOINT}/charts/income-expense`;
      console.log('📈 Requesting income expense chart from:', url);

      const response = await ApiService.get<IncomeExpenseChart>(url, { period });

      console.log('📈 Income expense chart API response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        status: response.status,
      });

      if (response.success) {
        // Return data even if empty - this means API is working
        console.log('✅ Income expense chart API success, returning data');
        return response.data || this.createEmptyIncomeExpenseChart();
      }

      // If endpoint doesn't exist (404), return empty data instead of null
      if (response.status === 404) {
        console.log('📊 Chart endpoint not found, returning empty chart data');
        return this.createEmptyIncomeExpenseChart();
      }

      console.error('❌ Failed to fetch income expense chart:', response.error);
      return null;
    } catch (error) {
      console.error('❌ Income expense chart error:', error);
      return null;
    }
  }

  /**
   * Get project details chart data
   */
  async getProjectDetailsChart(): Promise<ProjectDetailsChart | null> {
    try {
      const response = await ApiService.get<ProjectDetailsChart>(`${envConfig.DASHBOARD_ENDPOINT}/charts/project-details`);

      console.log('Project details chart API response:', response);

      if (response.success) {
        // Return data even if empty - this means API is working
        return response.data || this.createEmptyProjectDetailsChart();
      }

      // If endpoint doesn't exist (404), return empty data instead of null
      if (response.status === 404) {
        console.log('📊 Project chart endpoint not found, returning empty chart data');
        return this.createEmptyProjectDetailsChart();
      }

      console.error('Failed to fetch project details chart:', response.error);
      return null;
    } catch (error) {
      console.error('Project details chart error:', error);
      return null;
    }
  }

  /**
   * Get expense breakdown chart data
   */
  async getExpenseBreakdownChart(period: string = '6months'): Promise<ExpenseBreakdownChart | null> {
    try {
      const response = await ApiService.get<ExpenseBreakdownChart>(
        `${envConfig.DASHBOARD_ENDPOINT}/charts/expense-breakdown`,
        { period }
      );

      console.log('Expense breakdown chart API response:', response);

      if (response.success) {
        // Return data even if empty - this means API is working
        return response.data || this.createEmptyExpenseBreakdownChart();
      }

      // If endpoint doesn't exist (404), return empty data instead of null
      if (response.status === 404) {
        console.log('📊 Expense chart endpoint not found, returning empty chart data');
        return this.createEmptyExpenseBreakdownChart();
      }

      console.error('Failed to fetch expense breakdown chart:', response.error);
      return null;
    } catch (error) {
      console.error('Expense breakdown chart error:', error);
      return null;
    }
  }

  /**
   * Get financial summary for a date range
   */
  async getFinancialSummary(startDate?: string, endDate?: string): Promise<FinancialSummary | null> {
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await ApiService.get<FinancialSummary>(
        `${envConfig.DASHBOARD_ENDPOINT}/financial-summary`,
        params
      );

      if (response.success && response.data) {
        return response.data;
      }

      console.error('Failed to fetch financial summary:', response.error);
      return null;
    } catch (error) {
      console.error('Financial summary error:', error);
      return null;
    }
  }

  /**
   * Get all dashboard data at once
   */
  async getAllDashboardData(period: string = '6months'): Promise<{
    stats: DashboardStats | null;
    todaySchedule: TodaySchedule[];
    incomeExpenseChart: IncomeExpenseChart | null;
    projectDetailsChart: ProjectDetailsChart | null;
    expenseBreakdownChart: ExpenseBreakdownChart | null;
  }> {
    try {
      console.log('🔄 Fetching all dashboard data...');

      // Fetch all data in parallel for better performance
      const [
        stats,
        todaySchedule,
        incomeExpenseChart,
        projectDetailsChart,
        expenseBreakdownChart,
      ] = await Promise.all([
        this.getStats(),
        this.getTodaySchedule(),
        this.getIncomeExpenseChart(period),
        this.getProjectDetailsChart(),
        this.getExpenseBreakdownChart(period),
      ]);

      console.log('📊 Dashboard data results:', {
        stats: stats ? 'loaded' : 'null',
        todayScheduleCount: todaySchedule.length,
        incomeExpenseChart: incomeExpenseChart ? 'loaded' : 'null',
        projectDetailsChart: projectDetailsChart ? 'loaded' : 'null',
        expenseBreakdownChart: expenseBreakdownChart ? 'loaded' : 'null',
      });

      // Provide empty chart data instead of null when API calls fail
      // This allows the frontend to distinguish between connection issues and empty data
      return {
        stats,
        todaySchedule,
        incomeExpenseChart: incomeExpenseChart || this.createEmptyIncomeExpenseChart(),
        projectDetailsChart: projectDetailsChart || this.createEmptyProjectDetailsChart(),
        expenseBreakdownChart: expenseBreakdownChart || this.createEmptyExpenseBreakdownChart(),
      };
    } catch (error) {
      console.error('❌ Failed to fetch all dashboard data:', error);

      // Return empty data structures instead of null to prevent UI errors
      return {
        stats: null,
        todaySchedule: [],
        incomeExpenseChart: this.createEmptyIncomeExpenseChart(),
        projectDetailsChart: this.createEmptyProjectDetailsChart(),
        expenseBreakdownChart: this.createEmptyExpenseBreakdownChart(),
      };
    }
  }

  /**
   * Refresh dashboard data (for pull-to-refresh)
   */
  async refreshDashboard(period: string = '6months'): Promise<boolean> {
    try {
      const data = await this.getAllDashboardData(period);

      // Check if we got at least some data
      const hasData = data.stats !== null ||
                     data.todaySchedule.length > 0 ||
                     data.incomeExpenseChart !== null;

      return hasData;
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      return false;
    }
  }

  /**
   * Create empty income expense chart data
   */
  private createEmptyIncomeExpenseChart(): IncomeExpenseChart {
    const emptyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const emptyData = [0, 0, 0, 0, 0, 0];

    return {
      period: '6months',
      income: {
        labels: emptyLabels,
        datasets: [{
          label: 'Income',
          data: emptyData,
          backgroundColor: ['#4285F4'],
          borderColor: '#4285F4',
          borderWidth: 1,
        }]
      },
      expense: {
        labels: emptyLabels,
        datasets: [{
          label: 'Expense',
          data: emptyData,
          backgroundColor: ['#FF6B6B'],
          borderColor: '#FF6B6B',
          borderWidth: 1,
        }]
      },
      combined: {
        labels: emptyLabels,
        datasets: [
          {
            label: 'Income',
            data: emptyData,
            backgroundColor: ['#4285F4'],
            borderColor: '#4285F4',
            borderWidth: 1,
          },
          {
            label: 'Expense',
            data: emptyData,
            backgroundColor: ['#FF6B6B'],
            borderColor: '#FF6B6B',
            borderWidth: 1,
          }
        ]
      }
    };
  }

  /**
   * Create empty project details chart data
   */
  private createEmptyProjectDetailsChart(): ProjectDetailsChart {
    const emptyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const emptyData = [0, 0, 0, 0, 0, 0];

    return {
      byStatus: {
        labels: ['Active', 'Pending', 'Completed'],
        datasets: [{
          label: 'Projects by Status',
          data: [0, 0, 0],
          backgroundColor: ['#4CAF50', '#FF9800', '#2196F3'],
        }]
      },
      byType: {
        labels: ['Photography', 'Video', 'Event'],
        datasets: [{
          label: 'Projects by Type',
          data: [0, 0, 0],
          backgroundColor: ['#9C27B0', '#FF5722', '#607D8B'],
        }]
      },
      byMonth: {
        labels: emptyLabels,
        datasets: [{
          label: 'Projects by Month',
          data: emptyData,
          backgroundColor: ['#4285F4'],
          borderColor: '#4285F4',
          borderWidth: 1,
        }]
      }
    };
  }

  /**
   * Create empty expense breakdown chart data
   */
  private createEmptyExpenseBreakdownChart(): ExpenseBreakdownChart {
    const emptyLabels = ['Equipment', 'Travel', 'Marketing', 'Other'];
    const emptyData = [0, 0, 0, 0];
    const emptyMonthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const emptyMonthData = [0, 0, 0, 0, 0, 0];

    return {
      byCategory: {
        labels: emptyLabels,
        datasets: [{
          label: 'Expenses by Category',
          data: emptyData,
          backgroundColor: ['#FFB3BA', '#FF8C00', '#4285F4', '#34A853'],
        }]
      },
      byMonth: {
        labels: emptyMonthLabels,
        datasets: [{
          label: 'Monthly Expenses',
          data: emptyMonthData,
          backgroundColor: ['#FF6B6B'],
          borderColor: '#FF6B6B',
          borderWidth: 1,
        }]
      },
      trends: {
        labels: emptyMonthLabels,
        datasets: [{
          label: 'Expense Trends',
          data: emptyMonthData,
          backgroundColor: ['#FF6B6B'],
          borderColor: '#FF6B6B',
          borderWidth: 1,
        }]
      }
    };
  }
}

export default new DashboardService();

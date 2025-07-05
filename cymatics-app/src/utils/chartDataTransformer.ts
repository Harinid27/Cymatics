import { IncomeExpenseChart, ProjectDetailsChart, ExpenseBreakdownChart } from '../services/DashboardService';

export interface GiftedChartData {
  value: number;
  label?: string;
  frontColor?: string;
  gradientColor?: string;
  spacing?: number;
  labelWidth?: number;
  labelTextStyle?: any;
  color?: string;
  text?: string;
}

export interface TransformedChartData {
  incomeExpenseData: {
    income: GiftedChartData[];
    expense: GiftedChartData[];
    combined: GiftedChartData[];
  };
  projectData: {
    byStatus: GiftedChartData[];
    byType: GiftedChartData[];
  };
  expenseData: {
    byCategory: GiftedChartData[];
    trends: GiftedChartData[];
  };
}

/**
 * Transform backend chart data to format expected by react-native-gifted-charts
 */
export class ChartDataTransformer {
  /**
   * Transform income vs expense chart data
   */
  static transformIncomeExpenseData(data: IncomeExpenseChart | null): {
    income: GiftedChartData[];
    expense: GiftedChartData[];
    combined: GiftedChartData[];
  } {
    if (!data || !data.combined) {
      return {
        income: this.getDefaultMonthlyData('#4285F4', '#87CEEB'),
        expense: this.getDefaultMonthlyData('#FF6B6B', '#FFB3BA'),
        combined: this.getDefaultMonthlyData('#4285F4', '#87CEEB'),
      };
    }

    const labels = data.combined.labels || [];
    const incomeDataset = data.income?.datasets?.[0];
    const expenseDataset = data.expense?.datasets?.[0];

    const income: GiftedChartData[] = labels.map((label, index) => ({
      value: incomeDataset?.data?.[index] || 0,
      label: label,
      frontColor: '#4285F4',
      gradientColor: '#87CEEB',
      spacing: index === 0 ? 0 : 24,
    }));

    const expense: GiftedChartData[] = labels.map((label, index) => ({
      value: expenseDataset?.data?.[index] || 0,
      label: label,
      frontColor: '#FF6B6B',
      gradientColor: '#FFB3BA',
      spacing: index === 0 ? 0 : 24,
    }));

    const combined: GiftedChartData[] = labels.map((label, index) => ({
      value: (incomeDataset?.data?.[index] || 0) - (expenseDataset?.data?.[index] || 0),
      label: label,
      frontColor: (incomeDataset?.data?.[index] || 0) >= (expenseDataset?.data?.[index] || 0) ? '#34A853' : '#EA4335',
      gradientColor: (incomeDataset?.data?.[index] || 0) >= (expenseDataset?.data?.[index] || 0) ? '#90EE90' : '#FFB3BA',
      spacing: index === 0 ? 0 : 24,
    }));

    return { income, expense, combined };
  }

  /**
   * Transform project details chart data
   */
  static transformProjectData(data: ProjectDetailsChart | null): {
    byStatus: GiftedChartData[];
    byType: GiftedChartData[];
  } {
    if (!data) {
      return {
        byStatus: this.getDefaultPieData(),
        byType: this.getDefaultPieData(),
      };
    }

    const statusColors = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#9C27B0', '#FF6B6B'];
    const typeColors = ['#FF8C00', '#32CD32', '#FF69B4', '#20B2AA', '#DDA0DD', '#F0E68C'];

    const byStatus: GiftedChartData[] = (data.byStatus?.labels || []).map((label, index) => {
      const value = data.byStatus?.datasets?.[0]?.data?.[index] || 0;
      const total = data.byStatus?.datasets?.[0]?.data?.reduce((a, b) => a + b, 0) || 1;
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      
      return {
        value: value,
        color: statusColors[index % statusColors.length],
        text: `${percentage}%`,
        label: label,
      };
    });

    const byType: GiftedChartData[] = (data.byType?.labels || []).map((label, index) => {
      const value = data.byType?.datasets?.[0]?.data?.[index] || 0;
      const total = data.byType?.datasets?.[0]?.data?.reduce((a, b) => a + b, 0) || 1;
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      
      return {
        value: value,
        color: typeColors[index % typeColors.length],
        text: `${percentage}%`,
        label: label,
      };
    });

    return { byStatus, byType };
  }

  /**
   * Transform expense breakdown chart data
   */
  static transformExpenseData(data: ExpenseBreakdownChart | null): {
    byCategory: GiftedChartData[];
    trends: GiftedChartData[];
  } {
    if (!data) {
      return {
        byCategory: this.getDefaultPieData(),
        trends: this.getDefaultMonthlyData('#FF6B6B', '#FFB3BA'),
      };
    }

    const categoryColors = ['#FFB3BA', '#FF8C00', '#4285F4', '#34A853', '#FBBC04', '#EA4335'];

    const byCategory: GiftedChartData[] = (data.byCategory?.labels || []).map((label, index) => {
      const value = data.byCategory?.datasets?.[0]?.data?.[index] || 0;
      const total = data.byCategory?.datasets?.[0]?.data?.reduce((a, b) => a + b, 0) || 1;
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      
      return {
        value: value,
        color: categoryColors[index % categoryColors.length],
        text: `${percentage}%`,
        label: label,
      };
    });

    const trends: GiftedChartData[] = (data.trends?.labels || []).map((label, index) => ({
      value: data.trends?.datasets?.[0]?.data?.[index] || 0,
      label: label,
      frontColor: '#FF6B6B',
      gradientColor: '#FFB3BA',
    }));

    return { byCategory, trends };
  }

  /**
   * Transform all chart data at once
   */
  static transformAllChartData(
    incomeExpenseChart: IncomeExpenseChart | null,
    projectDetailsChart: ProjectDetailsChart | null,
    expenseBreakdownChart: ExpenseBreakdownChart | null
  ): TransformedChartData {
    return {
      incomeExpenseData: this.transformIncomeExpenseData(incomeExpenseChart),
      projectData: this.transformProjectData(projectDetailsChart),
      expenseData: this.transformExpenseData(expenseBreakdownChart),
    };
  }

  /**
   * Get default monthly data for charts
   */
  private static getDefaultMonthlyData(frontColor: string, gradientColor: string): GiftedChartData[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      value: 0,
      label: month,
      frontColor,
      gradientColor,
      spacing: index === 0 ? 0 : 24,
    }));
  }

  /**
   * Get default pie chart data
   */
  private static getDefaultPieData(): GiftedChartData[] {
    return [
      { value: 1, color: '#E0E0E0', text: '100%', label: 'No Data' },
    ];
  }

  /**
   * Calculate maximum value for chart scaling
   */
  static getMaxValue(data: GiftedChartData[]): number {
    const maxValue = Math.max(...data.map(item => item.value));
    return maxValue > 0 ? maxValue * 1.2 : 100;
  }

  /**
   * Format currency values for display
   */
  static formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `₹${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    } else {
      return `₹${value.toFixed(0)}`;
    }
  }

  /**
   * Get chart colors based on theme
   */
  static getChartColors(theme: 'light' | 'dark' = 'light') {
    if (theme === 'dark') {
      return {
        income: '#4FC3F7',
        expense: '#FF7043',
        profit: '#66BB6A',
        loss: '#EF5350',
        background: '#1E1E1E',
        text: '#FFFFFF',
        grid: '#333333',
      };
    }
    
    return {
      income: '#4285F4',
      expense: '#FF6B6B',
      profit: '#34A853',
      loss: '#EA4335',
      background: '#FFFFFF',
      text: '#333333',
      grid: '#E0E0E0',
    };
  }
}

export default ChartDataTransformer;

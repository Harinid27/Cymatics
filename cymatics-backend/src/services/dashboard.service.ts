import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

// Frontend-compatible interface
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

// Internal detailed interface for comprehensive data
export interface DetailedDashboardStats {
  overview: {
    totalProjects: number;
    totalClients: number;
    totalRevenue: number;
    totalProfit: number;
    totalPending: number;
    totalAssets: number;
    totalAssetValue: number;
  };
  recentActivity: {
    recentProjects: any[];
    recentIncome: any[];
    recentExpenses: any[];
    upcomingEvents: any[];
  };
  charts: {
    monthlyRevenue: { month: string; revenue: number; profit: number }[];
    projectsByStatus: { status: string; count: number }[];
    projectsByType: { type: string; count: number }[];
    expensesByCategory: { category: string; amount: number }[];
  };
  trends: {
    revenueGrowth: number;
    profitMargin: number;
    projectCompletionRate: number;
    averageProjectValue: number;
  };
}

class DashboardService {
  /**
   * Get frontend-compatible dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        incomeStats,
        expenseStats,
        projectStats,
        clientCount,
      ] = await Promise.all([
        prisma.income.aggregate({
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
        }),
        prisma.project.aggregate({
          _count: true,
          _sum: {
            amount: true,
            pendingAmt: true,
          },
        }),
        prisma.client.count(),
      ]);

      // Get project status counts
      const [activeProjectsCount, completedProjectsCount] = await Promise.all([
        prisma.project.count({
          where: {
            status: {
              in: ['active', 'in_progress', 'ongoing'],
            },
          },
        }),
        prisma.project.count({
          where: {
            status: 'completed',
          },
        }),
      ]);

      const totalIncome = incomeStats._sum.amount || 0;
      const totalExpense = expenseStats._sum.amount || 0;
      const currentBalance = totalIncome - totalExpense;
      const pendingAmount = projectStats._sum.pendingAmt || 0;

      return {
        totalIncome,
        totalExpense,
        currentBalance,
        pendingAmount,
        totalProjects: projectStats._count,
        activeProjects: activeProjectsCount,
        completedProjects: completedProjectsCount,
        totalClients: clientCount,
      };
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard statistics (for internal use)
   */
  async getDetailedDashboardStats(): Promise<DetailedDashboardStats> {
    try {
      const [
        overview,
        recentActivity,
        charts,
        trends,
      ] = await Promise.all([
        this.getOverviewStats(),
        this.getRecentActivity(),
        this.getChartData(),
        this.getTrends(),
      ]);

      return {
        overview,
        recentActivity,
        charts,
        trends,
      };
    } catch (error) {
      logger.error('Error getting detailed dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get overview statistics
   */
  private async getOverviewStats(): Promise<DetailedDashboardStats['overview']> {
    const [
      projectStats,
      clientCount,
      assetStats,
    ] = await Promise.all([
      prisma.project.aggregate({
        _count: true,
        _sum: {
          amount: true,
          profit: true,
          pendingAmt: true,
        },
      }),
      prisma.client.count(),
      prisma.asset.aggregate({
        _count: true,
        _sum: {
          value: true,
        },
      }),
    ]);

    return {
      totalProjects: projectStats._count,
      totalClients: clientCount,
      totalRevenue: projectStats._sum.amount || 0,
      totalProfit: projectStats._sum.profit || 0,
      totalPending: projectStats._sum.pendingAmt || 0,
      totalAssets: assetStats._count,
      totalAssetValue: assetStats._sum.value || 0,
    };
  }

  /**
   * Get recent activity
   */
  private async getRecentActivity(): Promise<DetailedDashboardStats['recentActivity']> {
    const [
      recentProjects,
      recentIncome,
      recentExpenses,
      upcomingEvents,
    ] = await Promise.all([
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          name: true,
          amount: true,
          status: true,
          createdAt: true,
          client: {
            select: {
              name: true,
              company: true,
            },
          },
        },
      }),
      prisma.income.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          description: true,
          amount: true,
          date: true,
          project: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      }),
      prisma.expense.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          description: true,
          amount: true,
          category: true,
          date: true,
          project: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      }),
      prisma.calendarEvent.findMany({
        take: 5,
        where: {
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
        },
      }),
    ]);

    return {
      recentProjects,
      recentIncome,
      recentExpenses,
      upcomingEvents,
    };
  }

  /**
   * Get chart data
   */
  private async getChartData(): Promise<DetailedDashboardStats['charts']> {
    const [
      monthlyRevenue,
      projectsByStatus,
      projectsByType,
      expensesByCategory,
    ] = await Promise.all([
      this.getMonthlyRevenueData(),
      prisma.project.groupBy({
        by: ['status'],
        _count: true,
        where: {
          status: { not: null },
        },
      }),
      prisma.project.groupBy({
        by: ['type'],
        _count: true,
        where: {
          type: { not: null },
        },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        _sum: { amount: true },
        orderBy: {
          _sum: { amount: 'desc' },
        },
        take: 10,
      }),
    ]);

    return {
      monthlyRevenue,
      projectsByStatus: projectsByStatus.map(item => ({
        status: item.status || 'Unknown',
        count: item._count,
      })),
      projectsByType: projectsByType.map(item => ({
        type: item.type || 'Unknown',
        count: item._count,
      })),
      expensesByCategory: expensesByCategory.map(item => ({
        category: item.category,
        amount: item._sum.amount || 0,
      })),
    };
  }

  /**
   * Get monthly income vs expense chart data (Django equivalent)
   */
  async getMonthlyIncomeExpenseChart(): Promise<{
    months: string[];
    incomeValues: number[];
    expenseValues: number[];
  }> {
    const currentYear = new Date().getFullYear();

    // Get income data grouped by month
    const incomeData = await prisma.income.groupBy({
      by: ['date'],
      _sum: { amount: true },
      where: {
        date: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get expense data grouped by month
    const expenseData = await prisma.expense.groupBy({
      by: ['date'],
      _sum: { amount: true },
      where: {
        date: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      orderBy: { date: 'asc' },
    });

    // Prepare data for all 12 months
    const months: string[] = [];
    const incomeValues: number[] = [];
    const expenseValues: number[] = [];

    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(currentYear, month, 1);
      months.push(monthDate.toLocaleDateString('en-US', { month: 'long' }));

      // Find income for this month
      const monthIncome = incomeData.find(item =>
        item.date.getMonth() === month
      );
      incomeValues.push(monthIncome?._sum.amount || 0);

      // Find expense for this month
      const monthExpense = expenseData.find(item =>
        item.date.getMonth() === month
      );
      expenseValues.push(monthExpense?._sum.amount || 0);
    }

    return { months, incomeValues, expenseValues };
  }

  /**
   * Get monthly project count chart data (Django equivalent)
   */
  async getMonthlyProjectChart(): Promise<{
    months: string[];
    projectCounts: number[];
  }> {
    const currentYear = new Date().getFullYear();

    // Get project data grouped by month based on shoot_start_date
    const projectData = await prisma.project.groupBy({
      by: ['shootStartDate'],
      _count: true,
      where: {
        shootStartDate: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      orderBy: { shootStartDate: 'asc' },
    });

    // Prepare data for all 12 months
    const months: string[] = [];
    const projectCounts: number[] = [];

    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(currentYear, month, 1);
      months.push(monthDate.toLocaleDateString('en-US', { month: 'long' }));

      // Find projects for this month
      const monthProjects = projectData.find(item =>
        item.shootStartDate?.getMonth() === month
      );
      projectCounts.push(monthProjects?._count || 0);
    }

    return { months, projectCounts };
  }

  /**
   * Get expense pie chart data (Django equivalent)
   */
  async getExpensePieChart(): Promise<{
    categories: string[];
    amounts: number[];
  }> {
    const expenseData = await prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: 'desc' },
      },
    });

    const categories = expenseData.map(item => item.category || 'Unknown');
    const amounts = expenseData.map(item => item._sum.amount || 0);

    return { categories, amounts };
  }

  /**
   * Get monthly expenses stacked bar chart data (Django equivalent)
   */
  async getMonthlyExpensesStackedChart(): Promise<{
    months: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
    }>;
  }> {
    const currentYear = new Date().getFullYear();

    // Get expenses grouped by category and month
    const expenseData = await prisma.expense.groupBy({
      by: ['category', 'date'],
      _sum: { amount: true },
      where: {
        date: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get all unique categories
    const categories = [...new Set(expenseData.map(item => item.category))];

    // Prepare month labels
    const months = [];
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(currentYear, month, 1);
      months.push(monthDate.toLocaleDateString('en-US', { month: 'long' }));
    }

    // Color palette for categories
    const categoryColors = [
      'rgb(20,97,103)', 'rgb(45,179,190)', 'rgb(121,90,128)', 'rgb(189,121,202)',
      'rgb(120,97,57)', 'rgb(177,142,79)', 'rgb(161,161,161)', 'rgb(158,138,142)',
      'rgb(186,143,153)', 'rgb(176,183,183)', 'rgb(79,64,59)', 'rgb(157,131,124)',
      'rgb(181,172,150)', 'rgb(60,148,156)', 'rgb(116,187,194)', 'rgb(98,204,169)'
    ];

    // Create datasets for each category
    const datasets = categories.map((category, index) => {
      const data = [];

      for (let month = 0; month < 12; month++) {
        const monthExpense = expenseData.find(item =>
          item.category === category && item.date.getMonth() === month
        );
        data.push(monthExpense?._sum.amount || 0);
      }

      return {
        label: category || 'Unknown',
        data,
        backgroundColor: categoryColors[index % categoryColors.length],
      };
    });

    return { months, datasets };
  }

  /**
   * Get category expenses bar chart data (Django equivalent)
   */
  async getCategoryExpensesChart(): Promise<{
    categories: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
    }>;
  }> {
    const currentYear = new Date().getFullYear();

    // Get expenses grouped by category and month
    const expenseData = await prisma.expense.groupBy({
      by: ['category', 'date'],
      _sum: { amount: true },
      where: {
        date: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get all unique categories
    const categories = [...new Set(expenseData.map(item => item.category))];

    // Month colors
    const monthColors = [
      'rgb(20,97,103)', 'rgb(45,179,190)', 'rgb(121,90,128)', 'rgb(189,121,202)',
      'rgb(120,97,57)', 'rgb(177,142,79)', 'rgb(60,148,156)', 'rgb(158,138,142)',
      'rgb(186,143,153)', 'rgb(176,183,183)', 'rgb(79,64,59)', 'rgb(157,131,124)'
    ];

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Create datasets for each month
    const datasets = [];

    for (let month = 0; month < 12; month++) {
      const data = categories.map(category => {
        const monthExpense = expenseData.find(item =>
          item.category === category && item.date.getMonth() === month
        );
        return monthExpense?._sum.amount || 0;
      });

      datasets.push({
        label: monthNames[month],
        data,
        backgroundColor: monthColors[month],
      });
    }

    return { categories, datasets };
  }

  /**
   * Get monthly revenue data for the last 12 months
   */
  private async getMonthlyRevenueData(): Promise<{ month: string; revenue: number; profit: number }[]> {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [projectStats] = await Promise.all([
        prisma.project.aggregate({
          where: {
            createdAt: {
              gte: date,
              lt: nextMonth,
            },
          },
          _sum: {
            amount: true,
            profit: true,
          },
        }),
      ]);

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: projectStats._sum.amount || 0,
        profit: projectStats._sum.profit || 0,
      });
    }

    return months;
  }

  /**
   * Get trend analysis
   */
  private async getTrends(): Promise<DetailedDashboardStats['trends']> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      thisMonthStats,
      lastMonthStats,
      completedProjects,
      totalProjects,
      avgProjectValue,
    ] = await Promise.all([
      prisma.project.aggregate({
        where: {
          createdAt: {
            gte: thisMonth,
          },
        },
        _sum: {
          amount: true,
          profit: true,
        },
      }),
      prisma.project.aggregate({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.project.count({
        where: {
          status: 'COMPLETED',
        },
      }),
      prisma.project.count(),
      prisma.project.aggregate({
        _avg: {
          amount: true,
        },
      }),
    ]);

    const thisMonthRevenue = thisMonthStats._sum.amount || 0;
    const lastMonthRevenue = lastMonthStats._sum.amount || 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    const profitMargin = thisMonthRevenue > 0
      ? ((thisMonthStats._sum.profit || 0) / thisMonthRevenue) * 100
      : 0;

    const projectCompletionRate = totalProjects > 0
      ? (completedProjects / totalProjects) * 100
      : 0;

    return {
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      projectCompletionRate: Math.round(projectCompletionRate * 100) / 100,
      averageProjectValue: Math.round((avgProjectValue._avg.amount || 0) * 100) / 100,
    };
  }

  /**
   * Get financial summary for a specific period
   */
  async getFinancialSummary(startDate?: Date, endDate?: Date): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    projectRevenue: number;
    outsourcingCosts: number;
  }> {
    try {
      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [incomeStats, expenseStats, projectStats] = await Promise.all([
        prisma.income.aggregate({
          where: startDate || endDate ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          } : {},
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: startDate || endDate ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          } : {},
          _sum: { amount: true },
        }),
        prisma.project.aggregate({
          where,
          _sum: {
            amount: true,
            outsourcingAmt: true,
          },
        }),
      ]);

      const totalIncome = incomeStats._sum.amount || 0;
      const totalExpenses = expenseStats._sum.amount || 0;
      const projectRevenue = projectStats._sum.amount || 0;
      const outsourcingCosts = projectStats._sum.outsourcingAmt || 0;

      return {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        projectRevenue,
        outsourcingCosts,
      };
    } catch (error) {
      logger.error('Error getting financial summary:', error);
      throw error;
    }
  }

  /**
   * Get today's schedule for dashboard (frontend-compatible format)
   */
  async getTodaySchedule(): Promise<Array<{
    id: string;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    location?: string;
    client?: string;
    projectCode?: string;
  }>> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayEvents = await prisma.calendarEvent.findMany({
        where: {
          startTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
        },
      });

      // Format events for frontend
      return todayEvents.map(event => {
        const formattedEvent: {
          id: string;
          title: string;
          type: string;
          startTime: string;
          endTime: string;
          location?: string;
          client?: string;
          projectCode?: string;
        } = {
          id: event.id.toString(),
          title: event.title || 'Photography Session',
          type: 'shoot', // Default type
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          client: 'Cymatics Photography', // Default client
          projectCode: `CYM-${event.id}`,
        };

        // Only add location if it exists (CalendarEvent doesn't have location field)
        // formattedEvent.location = undefined; // Don't set undefined explicitly

        return formattedEvent;
      });
    } catch (error) {
      logger.error('Error getting today\'s schedule:', error);
      throw error;
    }
  }

  /**
   * Get income vs expense chart data (frontend-compatible format)
   */
  async getIncomeExpenseChart(period: string = '6months'): Promise<{
    period: string;
    income: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
        borderWidth?: number;
      }>;
    };
    expense: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
        borderWidth?: number;
      }>;
    };
    combined: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
        borderWidth?: number;
      }>;
    };
  }> {
    try {
      const months = period === '12months' ? 12 : 6;
      const labels: string[] = [];
      const incomeData: number[] = [];
      const expenseData: number[] = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const [incomeSum, expenseSum] = await Promise.all([
          prisma.income.aggregate({
            where: {
              date: {
                gte: date,
                lt: nextMonth,
              },
            },
            _sum: { amount: true },
          }),
          prisma.expense.aggregate({
            where: {
              date: {
                gte: date,
                lt: nextMonth,
              },
            },
            _sum: { amount: true },
          }),
        ]);

        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        incomeData.push(incomeSum._sum.amount || 0);
        expenseData.push(expenseSum._sum.amount || 0);
      }

      return {
        period,
        income: {
          labels,
          datasets: [{
            label: 'Income',
            data: incomeData,
            backgroundColor: ['#4285F4'],
            borderColor: '#4285F4',
            borderWidth: 1,
          }],
        },
        expense: {
          labels,
          datasets: [{
            label: 'Expense',
            data: expenseData,
            backgroundColor: ['#FF6B6B'],
            borderColor: '#FF6B6B',
            borderWidth: 1,
          }],
        },
        combined: {
          labels,
          datasets: [
            {
              label: 'Income',
              data: incomeData,
              backgroundColor: ['#4285F4'],
              borderColor: '#4285F4',
              borderWidth: 1,
            },
            {
              label: 'Expense',
              data: expenseData,
              backgroundColor: ['#FF6B6B'],
              borderColor: '#FF6B6B',
              borderWidth: 1,
            },
          ],
        },
      };
    } catch (error) {
      logger.error('Error getting income vs expense chart data:', error);
      throw error;
    }
  }

  /**
   * Get project details chart data (frontend-compatible format)
   */
  async getProjectDetailsChart(): Promise<{
    byStatus: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
        borderWidth?: number;
      }>;
    };
    byType: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
        borderWidth?: number;
      }>;
    };
    byMonth: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
        borderWidth?: number;
      }>;
    };
  }> {
    try {
      const [statusCounts, typeCounts, monthlyProjects] = await Promise.all([
        prisma.project.groupBy({
          by: ['status'],
          _count: true,
          where: {
            status: { not: null },
          },
        }),
        prisma.project.groupBy({
          by: ['type'],
          _count: true,
          where: {
            type: { not: null },
          },
        }),
        this.getMonthlyProjectData(),
      ]);

      // Status chart
      const statusLabels = statusCounts.map(item => item.status || 'Unknown');
      const statusData = statusCounts.map(item => item._count);

      // Type chart
      const typeLabels = typeCounts.map(item => item.type || 'Unknown');
      const typeData = typeCounts.map(item => item._count);

      return {
        byStatus: {
          labels: statusLabels,
          datasets: [{
            label: 'Projects by Status',
            data: statusData,
            backgroundColor: ['#4285F4', '#34A853', '#FBBC04', '#EA4335'],
            borderColor: '#fff',
            borderWidth: 2,
          }],
        },
        byType: {
          labels: typeLabels,
          datasets: [{
            label: 'Projects by Type',
            data: typeData,
            backgroundColor: ['#4285F4', '#34A853', '#FBBC04', '#EA4335'],
            borderColor: '#fff',
            borderWidth: 2,
          }],
        },
        byMonth: {
          labels: monthlyProjects.labels,
          datasets: [{
            label: 'Projects by Month',
            data: monthlyProjects.data,
            backgroundColor: ['#4285F4'],
            borderColor: '#4285F4',
            borderWidth: 1,
          }],
        },
      };
    } catch (error) {
      logger.error('Error getting project details chart data:', error);
      throw error;
    }
  }

  /**
   * Get expense breakdown chart data (frontend-compatible format)
   */
  async getExpenseBreakdownChart(period: string = '6months'): Promise<{
    byCategory: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
        borderWidth?: number;
      }>;
    };
    byMonth: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
        borderWidth?: number;
      }>;
    };
    trends: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
        borderWidth?: number;
      }>;
    };
  }> {
    try {
      const months = period === '12months' ? 12 : 6;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const [categoryBreakdown, monthlyExpenses] = await Promise.all([
        prisma.expense.groupBy({
          by: ['category'],
          _sum: { amount: true },
          where: {
            date: {
              gte: startDate,
            },
          },
          orderBy: {
            _sum: { amount: 'desc' },
          },
        }),
        this.getMonthlyExpenseData(months),
      ]);

      // Category breakdown
      const categoryLabels = categoryBreakdown.map(item => item.category);
      const categoryData = categoryBreakdown.map(item => item._sum.amount || 0);

      return {
        byCategory: {
          labels: categoryLabels,
          datasets: [{
            label: 'Expenses by Category',
            data: categoryData,
            backgroundColor: ['#FFB3BA', '#FF8C00', '#4285F4', '#34A853', '#FBBC04', '#EA4335'],
            borderColor: '#fff',
            borderWidth: 2,
          }],
        },
        byMonth: {
          labels: monthlyExpenses.labels,
          datasets: [{
            label: 'Monthly Expenses',
            data: monthlyExpenses.data,
            backgroundColor: ['#FF6B6B'],
            borderColor: '#FF6B6B',
            borderWidth: 1,
          }],
        },
        trends: {
          labels: monthlyExpenses.labels,
          datasets: [{
            label: 'Expense Trends',
            data: monthlyExpenses.data,
            backgroundColor: ['#FF6B6B'],
            borderColor: '#FF6B6B',
            borderWidth: 1,
          }],
        },
      };
    } catch (error) {
      logger.error('Error getting expense breakdown chart data:', error);
      throw error;
    }
  }

  /**
   * Helper method to get monthly project data
   */
  private async getMonthlyProjectData(): Promise<{ labels: string[]; data: number[] }> {
    const labels: string[] = [];
    const data: number[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const count = await prisma.project.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextMonth,
          },
        },
      });

      labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      data.push(count);
    }

    return { labels, data };
  }

  /**
   * Helper method to get monthly expense data
   */
  private async getMonthlyExpenseData(months: number): Promise<{ labels: string[]; data: number[] }> {
    const labels: string[] = [];
    const data: number[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const expenseSum = await prisma.expense.aggregate({
        where: {
          date: {
            gte: date,
            lt: nextMonth,
          },
        },
        _sum: { amount: true },
      });

      labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      data.push(expenseSum._sum.amount || 0);
    }

    return { labels, data };
  }
}

export const dashboardService = new DashboardService();

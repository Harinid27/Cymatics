import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

export interface DashboardStats {
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
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
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
      logger.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get overview statistics
   */
  private async getOverviewStats(): Promise<DashboardStats['overview']> {
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
  private async getRecentActivity(): Promise<DashboardStats['recentActivity']> {
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
  private async getChartData(): Promise<DashboardStats['charts']> {
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
  private async getTrends(): Promise<DashboardStats['trends']> {
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
   * Get today's schedule for dashboard
   */
  async getTodaySchedule(): Promise<{
    todayShoot: any;
    upcomingShots: any[];
  }> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [todayEvents, upcomingEvents] = await Promise.all([
        prisma.calendarEvent.findFirst({
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
        }),
        prisma.calendarEvent.findMany({
          where: {
            startTime: {
              gt: endOfDay,
              lte: nextWeek,
            },
          },
          orderBy: { startTime: 'asc' },
          take: 5,
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        }),
      ]);

      // Format today's shoot
      const todayShoot = todayEvents ? {
        title: todayEvents.title || 'Photography Session',
        company: 'Cymatics Photography', // Default company name
        projectCode: `CYM-${todayEvents.id}`,
        time: todayEvents.startTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        date: todayEvents.startTime.toLocaleDateString('en-GB'),
      } : null;

      // Format upcoming shots
      const upcomingShots = upcomingEvents.map(event => ({
        title: event.title || 'Photography Session',
        company: 'Cymatics Photography',
        date: event.startTime.toLocaleDateString('en-GB'),
        time: event.startTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
      }));

      return {
        todayShoot,
        upcomingShots,
      };
    } catch (error) {
      logger.error('Error getting today\'s schedule:', error);
      throw error;
    }
  }

  /**
   * Get income vs expense chart data
   */
  async getIncomeExpenseChart(period: string = '6months'): Promise<{
    chartData: { month: string; income: number; expense: number }[];
  }> {
    try {
      const months = period === '12months' ? 12 : 6;
      const chartData = [];
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

        chartData.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          income: incomeSum._sum.amount || 0,
          expense: expenseSum._sum.amount || 0,
        });
      }

      return { chartData };
    } catch (error) {
      logger.error('Error getting income vs expense chart data:', error);
      throw error;
    }
  }

  /**
   * Get project details chart data
   */
  async getProjectDetailsChart(): Promise<{
    chartData: { status: string; count: number; percentage: number }[];
  }> {
    try {
      const [statusCounts, totalProjects] = await Promise.all([
        prisma.project.groupBy({
          by: ['status'],
          _count: true,
          where: {
            status: { not: null },
          },
        }),
        prisma.project.count(),
      ]);

      const chartData = statusCounts.map(item => ({
        status: item.status || 'Unknown',
        count: item._count,
        percentage: totalProjects > 0 ? Math.round((item._count / totalProjects) * 100) : 0,
      }));

      return { chartData };
    } catch (error) {
      logger.error('Error getting project details chart data:', error);
      throw error;
    }
  }

  /**
   * Get expense breakdown chart data
   */
  async getExpenseBreakdownChart(period: string = '6months'): Promise<{
    chartData: { category: string; amount: number; percentage: number }[];
  }> {
    try {
      const months = period === '12months' ? 12 : 6;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const [categoryBreakdown, totalExpenses] = await Promise.all([
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
        prisma.expense.aggregate({
          where: {
            date: {
              gte: startDate,
            },
          },
          _sum: { amount: true },
        }),
      ]);

      const total = totalExpenses._sum.amount || 0;
      const chartData = categoryBreakdown.map(item => ({
        category: item.category,
        amount: item._sum.amount || 0,
        percentage: total > 0 ? Math.round(((item._sum.amount || 0) / total) * 100) : 0,
      }));

      return { chartData };
    } catch (error) {
      logger.error('Error getting expense breakdown chart data:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();

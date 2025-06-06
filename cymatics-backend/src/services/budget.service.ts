import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

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
  description?: string | undefined;
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
   * Get budget overview
   */
  async getBudgetOverview(): Promise<BudgetOverview> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get current balance (total income - total expenses)
      const [totalIncome, totalExpenses, thisMonthIncome] = await Promise.all([
        prisma.income.aggregate({
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
        }),
        prisma.income.aggregate({
          where: {
            date: {
              gte: startOfMonth,
            },
          },
          _sum: { amount: true },
        }),
      ]);

      const currentBalance = (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0);
      const receivedAmountThisMonth = thisMonthIncome._sum.amount || 0;

      // Get monthly income data for chart (last 12 months)
      const totalReceivedChart = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const monthlyIncome = await prisma.income.aggregate({
          where: {
            date: {
              gte: date,
              lt: nextMonth,
            },
          },
          _sum: { amount: true },
        });

        totalReceivedChart.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
          value: monthlyIncome._sum.amount || 0,
        });
      }

      // Get budget split up from categories
      const budgetCategories = await this.getBudgetCategories();
      const budgetSplitUp = budgetCategories.categories.map(category => ({
        name: category.name,
        amount: category.amount,
        color: category.color,
      }));

      return {
        currentBalance,
        receivedAmountThisMonth,
        totalReceivedChart,
        budgetSplitUp,
      };
    } catch (error) {
      logger.error('Error getting budget overview:', error);
      throw error;
    }
  }

  /**
   * Get budget categories
   */
  async getBudgetCategories(): Promise<{ categories: BudgetCategory[] }> {
    try {
      // For now, we'll create default categories based on expense categories
      // In a real implementation, you might want to create a separate budget_categories table
      const expenseCategories = await prisma.expense.groupBy({
        by: ['category'],
        _sum: { amount: true },
        _count: true,
      });

      const totalExpenses = expenseCategories.reduce((sum, cat) => sum + (cat._sum.amount || 0), 0);

      const colors = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'];

      const categories: BudgetCategory[] = expenseCategories.map((category, index) => {
        const amount = category._sum.amount || 0;
        const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;

        return {
          id: index + 1,
          name: category.category,
          percentage,
          color: colors[index % colors.length],
          amount,
          description: `Budget allocation for ${category.category}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      return { categories };
    } catch (error) {
      logger.error('Error getting budget categories:', error);
      throw error;
    }
  }

  /**
   * Get investment details
   */
  async getInvestmentDetails(): Promise<{ investments: InvestmentDetail[] }> {
    try {
      // For now, we'll create mock investment data
      // In a real implementation, you might want to create a separate investments table
      const investments: InvestmentDetail[] = [
        {
          id: 1,
          name: 'Equipment Investment',
          amount: 50000,
          type: 'Equipment',
          returns: 8.5,
          date: new Date(),
          description: 'Camera and photography equipment',
        },
        {
          id: 2,
          name: 'Business Expansion',
          amount: 100000,
          type: 'Business',
          returns: 12.0,
          date: new Date(),
          description: 'Studio expansion and new location',
        },
      ];

      return { investments };
    } catch (error) {
      logger.error('Error getting investment details:', error);
      throw error;
    }
  }

  /**
   * Create budget category
   */
  async createBudgetCategory(data: {
    name: string;
    percentage: number;
    color: string;
    description?: string;
  }): Promise<BudgetCategory> {
    try {
      // For now, we'll simulate creating a budget category
      // In a real implementation, you would save this to a budget_categories table
      const category: BudgetCategory = {
        id: Date.now(), // Simple ID generation
        name: data.name,
        percentage: data.percentage,
        color: data.color,
        amount: 0, // Would be calculated based on total budget
        description: data.description || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      logger.info(`Budget category created: ${category.name}`);
      return category;
    } catch (error) {
      logger.error('Error creating budget category:', error);
      throw error;
    }
  }

  /**
   * Update budget category
   */
  async updateBudgetCategory(id: number, data: Partial<{
    name: string;
    percentage: number;
    color: string;
    description: string;
  }>): Promise<BudgetCategory> {
    try {
      // For now, we'll simulate updating a budget category
      // In a real implementation, you would update this in a budget_categories table
      const category: BudgetCategory = {
        id,
        name: data.name || 'Updated Category',
        percentage: data.percentage || 0,
        color: data.color || '#4CAF50',
        amount: 0,
        description: data.description || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      logger.info(`Budget category updated: ${category.name}`);
      return category;
    } catch (error) {
      logger.error('Error updating budget category:', error);
      throw error;
    }
  }

  /**
   * Delete budget category
   */
  async deleteBudgetCategory(id: number): Promise<void> {
    try {
      // For now, we'll simulate deleting a budget category
      // In a real implementation, you would delete this from a budget_categories table
      logger.info(`Budget category deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting budget category:', error);
      throw error;
    }
  }
}

export const budgetService = new BudgetService();

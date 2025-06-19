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
  spentAmount?: number;
  remainingAmount?: number;
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

      // Excluded expense categories (as per Django logic)
      const excludedCategories = ['Food & Snacks', 'Fuel & Travel', 'Outsourcing'];

      // Get current balance (total income - total expenses)
      const [totalIncome, totalExpenses, thisMonthIncome, thisMonthExcludedExpenses] = await Promise.all([
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
        prisma.expense.aggregate({
          where: {
            date: {
              gte: startOfMonth,
            },
            category: {
              in: excludedCategories,
            },
          },
          _sum: { amount: true },
        }),
      ]);

      const currentBalance = (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0);

      // Calculate received amount this month (income minus excluded expenses)
      const rawMonthlyIncome = thisMonthIncome._sum.amount || 0;
      const excludedExpensesAmount = thisMonthExcludedExpenses._sum.amount || 0;
      const receivedAmountThisMonth = rawMonthlyIncome - excludedExpensesAmount;

      // Get monthly income data for chart (last 12 months) - adjusted for excluded expenses
      const totalReceivedChart = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const [monthlyIncome, monthlyExcludedExpenses] = await Promise.all([
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
              category: {
                in: excludedCategories,
              },
            },
            _sum: { amount: true },
          }),
        ]);

        const adjustedIncome = (monthlyIncome._sum.amount || 0) - (monthlyExcludedExpenses._sum.amount || 0);
        totalReceivedChart.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
          value: Math.max(0, adjustedIncome), // Ensure non-negative values
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
   * Get budget categories with Django-style allocations
   */
  async getBudgetCategories(): Promise<{ categories: BudgetCategory[] }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const excludedCategories = ['Food & Snacks', 'Fuel & Travel', 'Outsourcing'];

      // Get current month's adjusted income for budget calculations (Django logic)
      const [thisMonthIncome, thisMonthExcludedExpenses] = await Promise.all([
        prisma.income.aggregate({
          where: {
            date: {
              gte: startOfMonth,
            },
          },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: {
            date: {
              gte: startOfMonth,
            },
            category: {
              in: excludedCategories,
            },
          },
          _sum: { amount: true },
        }),
      ]);

      const adjustedMonthlyIncome = (thisMonthIncome._sum.amount || 0) - (thisMonthExcludedExpenses._sum.amount || 0);

      console.log(`🚀 DJANGO BUDGET CALCULATION - NEW CODE ACTIVE! 🚀
        Raw Monthly Income: ${thisMonthIncome._sum.amount || 0}
        Excluded Expenses: ${thisMonthExcludedExpenses._sum.amount || 0}
        Adjusted Income (Budget Base): ${adjustedMonthlyIncome}`);

      // Django-style budget categories with EXACT percentage allocations
      const budgetAllocations = [
        { name: 'Cymatics', percentage: 36, color: '#4CAF50', categories: ['Cymatics', 'Salary', 'Loan Repayment'] },
        { name: 'Gadgets', percentage: 10, color: '#2196F3', categories: ['Gadgets', 'Asset'] },
        { name: 'Entertainment', percentage: 5, color: '#FF9800', categories: ['Entertainment'] },
        { name: 'Investments', percentage: 15, color: '#9C27B0', categories: ['Investments'] },
        { name: 'Others', percentage: 5, color: '#607D8B', categories: ['Others'] },
        { name: 'Yaso Salary', percentage: 12.5, color: '#E91E63', categories: ['Yaso'] },
        { name: 'Gopi Salary', percentage: 12.5, color: '#00BCD4', categories: ['Gopi'] },
        { name: 'Adithyan', percentage: 4, color: '#FF5722', categories: ['Adithyan'] },
      ];

      const categories: BudgetCategory[] = [];

      for (let i = 0; i < budgetAllocations.length; i++) {
        const allocation = budgetAllocations[i];
        const budgetAmount = Math.round((allocation.percentage / 100) * adjustedMonthlyIncome);

        // Get actual expenses for this category (current month only)
        const actualExpenses = await prisma.expense.aggregate({
          where: {
            date: {
              gte: startOfMonth,
            },
            category: {
              in: allocation.categories,
            },
          },
          _sum: { amount: true },
        });

        const spentAmount = actualExpenses._sum.amount || 0;
        const remainingAmount = budgetAmount - spentAmount;

        console.log(`${allocation.name}: Budget=${budgetAmount}, Spent=${spentAmount}, Remaining=${remainingAmount}`);

        categories.push({
          id: i + 1,
          name: allocation.name,
          percentage: allocation.percentage,
          color: allocation.color,
          amount: budgetAmount,
          spentAmount,
          remainingAmount,
          description: `Budget allocation for ${allocation.name}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      logger.info(`Retrieved ${categories.length} Django-style budget categories`);
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

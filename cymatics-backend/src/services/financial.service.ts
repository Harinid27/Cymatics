import { prisma } from '@/config/database';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { calculatePagination } from '@/utils/helpers';
import { projectService } from './project.service';

export interface CreateIncomeData {
  date: Date;
  description: string;
  amount: number;
  note?: string;
  projectIncome?: boolean;
  projectId?: number;
}

export interface UpdateIncomeData {
  date?: Date;
  description?: string;
  amount?: number;
  note?: string;
  projectIncome?: boolean;
  projectId?: number;
}

export interface CreateExpenseData {
  date: Date;
  category: string;
  description: string;
  amount: number;
  notes?: string;
  projectExpense?: boolean;
  projectId?: number;
}

export interface UpdateExpenseData {
  date?: Date;
  category?: string;
  description?: string;
  amount?: number;
  notes?: string;
  projectExpense?: boolean;
  projectId?: number;
}

export interface IncomeWithProject {
  id: number;
  date: Date;
  description: string;
  amount: number;
  note: string | null;
  projectIncome: boolean;
  projectId: number | null;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: number;
    code: string;
    name: string | null;
    status: string | null;
    pendingAmt: number;
  } | null;
}

export interface ExpenseWithProject {
  id: number;
  date: Date;
  category: string;
  description: string;
  amount: number;
  notes: string | null;
  projectExpense: boolean;
  projectId: number | null;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: number;
    code: string;
    name: string | null;
  } | null;
}

export interface FinancialQueryOptions {
  search?: string;
  projectId?: number;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

class FinancialService {
  /**
   * Create new income entry
   */
  async createIncome(data: CreateIncomeData): Promise<IncomeWithProject> {
    try {
      // Validate project if provided
      if (data.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: data.projectId },
        });

        if (!project) {
          throw new ValidationError('Project not found');
        }
      }

      const income = await prisma.income.create({
        data,
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              pendingAmt: true,
            },
          },
        },
      });

      // Update project finances if this is project income
      if (data.projectId) {
        await projectService.updateProjectFinances(data.projectId);
      }

      logger.info(`Income created: ${income.description} - ₹${income.amount}`);

      return income;
    } catch (error) {
      logger.error('Error creating income:', error);
      throw error;
    }
  }

  /**
   * Get all income entries with pagination and filters
   */
  async getIncomes(options: FinancialQueryOptions = {}): Promise<{
    incomes: IncomeWithProject[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { search = '', projectId, startDate, endDate, page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      // Search in description and notes
      if (search) {
        where.OR = [
          { description: { contains: search, mode: 'insensitive' } },
          { note: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filter by project
      if (projectId) {
        where.projectId = projectId;
      }

      // Filter by date range
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }

      // Get total count for pagination
      const total = await prisma.income.count({ where });

      // Get incomes
      const incomes = await prisma.income.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              pendingAmt: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      });

      const pagination = calculatePagination(page, limit, total);

      return {
        incomes,
        pagination,
      };
    } catch (error) {
      logger.error('Error getting incomes:', error);
      throw error;
    }
  }

  /**
   * Get income by ID
   */
  async getIncomeById(id: number): Promise<IncomeWithProject> {
    try {
      const income = await prisma.income.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              pendingAmt: true,
            },
          },
        },
      });

      if (!income) {
        throw new NotFoundError('Income entry not found');
      }

      return income;
    } catch (error) {
      logger.error('Error getting income by ID:', error);
      throw error;
    }
  }

  /**
   * Update income entry
   */
  async updateIncome(id: number, data: UpdateIncomeData): Promise<IncomeWithProject> {
    try {
      // Check if income exists
      const existingIncome = await prisma.income.findUnique({
        where: { id },
      });

      if (!existingIncome) {
        throw new NotFoundError('Income entry not found');
      }

      // Validate project if provided
      if (data.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: data.projectId },
        });

        if (!project) {
          throw new ValidationError('Project not found');
        }
      }

      const updatedIncome = await prisma.income.update({
        where: { id },
        data,
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              pendingAmt: true,
            },
          },
        },
      });

      // Update project finances for both old and new projects
      if (existingIncome.projectId) {
        await projectService.updateProjectFinances(existingIncome.projectId);
      }
      if (data.projectId && data.projectId !== existingIncome.projectId) {
        await projectService.updateProjectFinances(data.projectId);
      }

      logger.info(`Income updated: ${updatedIncome.description} - ₹${updatedIncome.amount}`);

      return updatedIncome;
    } catch (error) {
      logger.error('Error updating income:', error);
      throw error;
    }
  }

  /**
   * Delete income entry
   */
  async deleteIncome(id: number): Promise<{ message: string }> {
    try {
      // Check if income exists
      const existingIncome = await prisma.income.findUnique({
        where: { id },
      });

      if (!existingIncome) {
        throw new NotFoundError('Income entry not found');
      }

      await prisma.income.delete({
        where: { id },
      });

      // Update project finances if this was project income
      if (existingIncome.projectId) {
        await projectService.updateProjectFinances(existingIncome.projectId);
      }

      logger.info(`Income deleted: ${existingIncome.description} - ₹${existingIncome.amount}`);

      return {
        message: 'Income entry deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting income:', error);
      throw error;
    }
  }



  /**
   * Create new expense entry
   */
  async createExpense(data: CreateExpenseData): Promise<ExpenseWithProject> {
    try {
      // Validate project if provided
      if (data.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: data.projectId },
        });

        if (!project) {
          throw new ValidationError('Project not found');
        }
      }

      const expense = await prisma.expense.create({
        data,
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      // Update project finances if this is project expense
      if (data.projectId) {
        await projectService.updateProjectFinances(data.projectId);
      }

      logger.info(`Expense created: ${expense.description} - ₹${expense.amount}`);

      return expense;
    } catch (error) {
      logger.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Get all expense entries with pagination and filters
   */
  async getExpenses(options: FinancialQueryOptions = {}): Promise<{
    expenses: ExpenseWithProject[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { search = '', projectId, category, startDate, endDate, page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      // Search in description and notes
      if (search) {
        where.OR = [
          { description: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filter by project
      if (projectId) {
        where.projectId = projectId;
      }

      // Filter by category
      if (category) {
        where.category = category;
      }

      // Filter by date range
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }

      // Get total count for pagination
      const total = await prisma.expense.count({ where });

      // Get expenses
      const expenses = await prisma.expense.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      });

      const pagination = calculatePagination(page, limit, total);

      return {
        expenses,
        pagination,
      };
    } catch (error) {
      logger.error('Error getting expenses:', error);
      throw error;
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: number): Promise<ExpenseWithProject> {
    try {
      const expense = await prisma.expense.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      if (!expense) {
        throw new NotFoundError('Expense entry not found');
      }

      return expense;
    } catch (error) {
      logger.error('Error getting expense by ID:', error);
      throw error;
    }
  }

  /**
   * Update expense entry
   */
  async updateExpense(id: number, data: UpdateExpenseData): Promise<ExpenseWithProject> {
    try {
      // Check if expense exists
      const existingExpense = await prisma.expense.findUnique({
        where: { id },
      });

      if (!existingExpense) {
        throw new NotFoundError('Expense entry not found');
      }

      // Validate project if provided
      if (data.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: data.projectId },
        });

        if (!project) {
          throw new ValidationError('Project not found');
        }
      }

      const updatedExpense = await prisma.expense.update({
        where: { id },
        data,
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      // Update project finances for both old and new projects
      if (existingExpense.projectId) {
        await projectService.updateProjectFinances(existingExpense.projectId);
      }
      if (data.projectId && data.projectId !== existingExpense.projectId) {
        await projectService.updateProjectFinances(data.projectId);
      }

      logger.info(`Expense updated: ${updatedExpense.description} - ₹${updatedExpense.amount}`);

      return updatedExpense;
    } catch (error) {
      logger.error('Error updating expense:', error);
      throw error;
    }
  }

  /**
   * Delete expense entry
   */
  async deleteExpense(id: number): Promise<{ message: string }> {
    try {
      // Check if expense exists
      const existingExpense = await prisma.expense.findUnique({
        where: { id },
      });

      if (!existingExpense) {
        throw new NotFoundError('Expense entry not found');
      }

      await prisma.expense.delete({
        where: { id },
      });

      // Update project finances if this was project expense
      if (existingExpense.projectId) {
        await projectService.updateProjectFinances(existingExpense.projectId);
      }

      logger.info(`Expense deleted: ${existingExpense.description} - ₹${existingExpense.amount}`);

      return {
        message: 'Expense entry deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting expense:', error);
      throw error;
    }
  }



  /**
   * Get expense categories
   */
  async getExpenseCategories(): Promise<string[]> {
    try {
      const categories = await prisma.expense.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });

      return categories.map(c => c.category);
    } catch (error) {
      logger.error('Error getting expense categories:', error);
      throw error;
    }
  }

  /**
   * Get categorized expense totals
   */
  async getCategorizedExpenseTotals(options: { startDate?: Date; endDate?: Date } = {}): Promise<{
    categories: { category: string; total: number; count: number }[];
    grandTotal: number;
  }> {
    try {
      const { startDate, endDate } = options;

      // Build where clause for date filtering
      const where: any = {};
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }

      const categoryTotals = await prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      });

      const categories = categoryTotals.map(item => ({
        category: item.category,
        total: item._sum.amount || 0,
        count: item._count,
      }));

      const grandTotal = categories.reduce((sum, cat) => sum + cat.total, 0);

      return {
        categories,
        grandTotal,
      };
    } catch (error) {
      logger.error('Error getting categorized expense totals:', error);
      throw error;
    }
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(options: { startDate?: Date; endDate?: Date } = {}): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    projectIncome: number;
    nonProjectIncome: number;
    projectExpenses: number;
    nonProjectExpenses: number;
    incomeCount: number;
    expenseCount: number;
  }> {
    try {
      const { startDate, endDate } = options;

      // Build where clause for date filtering
      const where: any = {};
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }

      const [incomeStats, expenseStats, projectIncomeStats, projectExpenseStats] = await Promise.all([
        prisma.income.aggregate({
          where,
          _sum: { amount: true },
          _count: true,
        }),
        prisma.expense.aggregate({
          where,
          _sum: { amount: true },
          _count: true,
        }),
        prisma.income.aggregate({
          where: { ...where, projectIncome: true },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { ...where, projectExpense: true },
          _sum: { amount: true },
        }),
      ]);

      const totalIncome = incomeStats._sum.amount || 0;
      const totalExpenses = expenseStats._sum.amount || 0;
      const projectIncome = projectIncomeStats._sum.amount || 0;
      const projectExpenses = projectExpenseStats._sum.amount || 0;

      return {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        projectIncome,
        nonProjectIncome: totalIncome - projectIncome,
        projectExpenses,
        nonProjectExpenses: totalExpenses - projectExpenses,
        incomeCount: incomeStats._count,
        expenseCount: expenseStats._count,
      };
    } catch (error) {
      logger.error('Error getting financial summary:', error);
      throw error;
    }
  }
  /**
   * Get income chart data for frontend
   */
  async getIncomeChartData(period: string = '6months'): Promise<{
    chartData: { month: string; valuation: number; received: number }[];
  }> {
    try {
      const months = period === '12months' ? 12 : 6;
      const chartData = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const [projectValuation, receivedIncome] = await Promise.all([
          prisma.project.aggregate({
            where: {
              createdAt: {
                gte: date,
                lt: nextMonth,
              },
            },
            _sum: { amount: true },
          }),
          prisma.income.aggregate({
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
          valuation: projectValuation._sum.amount || 0,
          received: receivedIncome._sum.amount || 0,
        });
      }

      return { chartData };
    } catch (error) {
      logger.error('Error getting income chart data:', error);
      throw error;
    }
  }

  /**
   * Get categorized expenses for frontend
   */
  async getCategorizedExpenses(period: string = '6months'): Promise<{
    categories: {
      type: string;
      amount: number;
      icon: string;
      entries: { amount: number; date: string }[];
    }[];
  }> {
    try {
      const months = period === '12months' ? 12 : 6;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get expenses grouped by category
      const expensesByCategory = await prisma.expense.groupBy({
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
      });

      // Get detailed entries for each category
      const categories = await Promise.all(
        expensesByCategory.map(async (categoryGroup) => {
          const entries = await prisma.expense.findMany({
            where: {
              category: categoryGroup.category,
              date: {
                gte: startDate,
              },
            },
            select: {
              amount: true,
              date: true,
            },
            orderBy: { date: 'desc' },
            take: 10, // Limit to recent entries
          });

          // Map category to icon (you can customize this mapping)
          const iconMap: { [key: string]: string } = {
            'Petrol': 'local-gas-station',
            'Food': 'restaurant',
            'Equipment': 'camera-alt',
            'Travel': 'flight',
            'Utilities': 'electrical-services',
            'Marketing': 'campaign',
            'Software': 'computer',
            'Maintenance': 'build',
            'Office': 'business',
            'Other': 'category',
          };

          return {
            type: categoryGroup.category,
            amount: categoryGroup._sum.amount || 0,
            icon: iconMap[categoryGroup.category] || 'category',
            entries: entries.map(entry => ({
              amount: entry.amount,
              date: entry.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            })),
          };
        })
      );

      return { categories };
    } catch (error) {
      logger.error('Error getting categorized expenses:', error);
      throw error;
    }
  }

  /**
   * Update project received amount and create payment record
   */
  async updateProjectReceived(projectId: number, amount: number, description?: string): Promise<void> {
    try {
      // Validate project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new ValidationError('Project not found');
      }

      // Create income record for the payment
      const income = await this.createIncome({
        date: new Date(),
        description: description || `Project Payment - ${project.name || project.code}`,
        amount,
        projectIncome: true,
        projectId,
      });

      // Create payment record
      await prisma.projectPayment.create({
        data: {
          projectId,
          amount,
          paymentDate: new Date(),
          description: description || `Payment for ${project.name || project.code}`,
          paymentType: amount >= project.amount ? 'full' : 'partial',
          incomeId: income.id,
        },
      });

      // Update project finances
      await projectService.updateProjectFinances(projectId);

      logger.info(`Project payment recorded: ${project.code} - ₹${amount}`);
    } catch (error) {
      logger.error('Error updating project received amount:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a project
   */
  async getProjectPaymentHistory(projectId: number): Promise<{
    payments: Array<{
      id: number;
      amount: number;
      paymentDate: Date;
      description: string;
      paymentType: string;
      incomeId?: number | null;
    }>;
    totalReceived: number;
    totalAmount: number;
    pendingAmount: number;
  }> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
        },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      const totalReceived = project.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const pendingAmount = project.amount - totalReceived;

      return {
        payments: project.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          description: payment.description,
          paymentType: payment.paymentType,
          ...(payment.incomeId && { incomeId: payment.incomeId }),
        })),
        totalReceived,
        totalAmount: project.amount,
        pendingAmount,
      };
    } catch (error) {
      logger.error('Error getting project payment history:', error);
      throw error;
    }
  }
}

export const financialService = new FinancialService();

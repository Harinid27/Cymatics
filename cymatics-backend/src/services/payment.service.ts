import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { NotFoundError, ValidationError } from '@/utils/errors';

export interface Payment {
  id: number;
  clientName: string;
  amount: number;
  date: Date;
  status: 'ongoing' | 'pending' | 'completed';
  description?: string | undefined;
  projectId?: number;
  clientId?: number | undefined;
  dueDate?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStats {
  totalPayments: number;
  ongoingPayments: number;
  pendingPayments: number;
  completedPayments: number;
  totalAmount: number;
  ongoingAmount: number;
  pendingAmount: number;
  completedAmount: number;
}

class PaymentService {
  /**
   * Get payments by status
   */
  async getPaymentsByStatus(status: string, page: number = 1, limit: number = 10): Promise<{
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const validStatuses = ['ongoing', 'pending', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const skip = (page - 1) * limit;

      // For now, we'll use projects with pending amounts as payments
      // In a real implementation, you might have a separate payments table
      const where: any = {};

      if (status === 'pending') {
        where.pendingAmt = { gt: 0 };
        where.status = { not: 'COMPLETED' };
      } else if (status === 'completed') {
        where.OR = [
          { pendingAmt: { lte: 0 } },
          { status: 'COMPLETED' }
        ];
      } else if (status === 'ongoing') {
        where.pendingAmt = { gt: 0 };
        where.status = 'ACTIVE';
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          include: {
            client: {
              select: {
                name: true,
                company: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.project.count({ where }),
      ]);

      const payments: Payment[] = projects.map(project => ({
        id: project.id,
        clientName: project.client?.name || project.client?.company || 'Unknown Client',
        amount: project.pendingAmt || project.amount || 0,
        date: project.updatedAt,
        status: this.mapProjectStatusToPaymentStatus(project.status, project.pendingAmt || 0),
        description: project.name || undefined,
        projectId: project.id,
        clientId: project.clientId || undefined,
        dueDate: undefined, // Projects don't have deadline field
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }));

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting payments by status:', error);
      throw error;
    }
  }

  /**
   * Get all payments with filters
   */
  async getPayments(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<{
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { page = 1, limit = 10, status, search } = options;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Apply status filter
      if (status) {
        if (status === 'pending') {
          where.pendingAmt = { gt: 0 };
          where.status = { not: 'COMPLETED' };
        } else if (status === 'completed') {
          where.OR = [
            { pendingAmt: { lte: 0 } },
            { status: 'COMPLETED' }
          ];
        } else if (status === 'ongoing') {
          where.pendingAmt = { gt: 0 };
          where.status = 'ACTIVE';
        }
      }

      // Apply search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
          { client: { company: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          include: {
            client: {
              select: {
                name: true,
                company: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.project.count({ where }),
      ]);

      const payments: Payment[] = projects.map(project => ({
        id: project.id,
        clientName: project.client?.name || project.client?.company || 'Unknown Client',
        amount: project.pendingAmt || project.amount || 0,
        date: project.updatedAt,
        status: this.mapProjectStatusToPaymentStatus(project.status, project.pendingAmt || 0),
        description: project.name || undefined,
        projectId: project.id,
        clientId: project.clientId || undefined,
        dueDate: undefined, // Projects don't have deadline field
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }));

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting payments:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: number): Promise<Payment> {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              name: true,
              company: true,
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundError('Payment not found');
      }

      return {
        id: project.id,
        clientName: project.client?.name || project.client?.company || 'Unknown Client',
        amount: project.pendingAmt || project.amount || 0,
        date: project.updatedAt,
        status: this.mapProjectStatusToPaymentStatus(project.status, project.pendingAmt || 0),
        description: project.name || undefined,
        projectId: project.id,
        clientId: project.clientId || undefined,
        dueDate: undefined, // Projects don't have deadline field
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    } catch (error) {
      logger.error('Error getting payment by ID:', error);
      throw error;
    }
  }

  /**
   * Create payment (creates a project with pending amount)
   */
  async createPayment(data: {
    clientId: number;
    amount: number;
    description?: string;
    dueDate?: Date;
  }): Promise<Payment> {
    try {
      // Generate a unique project code
      const timestamp = Date.now();
      const projectCode = `PAY-${timestamp}`;

      const project = await prisma.project.create({
        data: {
          code: projectCode,
          name: data.description || 'Payment Project',
          amount: data.amount,
          pendingAmt: data.amount,
          status: 'ACTIVE',
          type: 'Payment',
          clientId: data.clientId,
        },
        include: {
          client: {
            select: {
              name: true,
              company: true,
            },
          },
        },
      });

      return {
        id: project.id,
        clientName: project.client?.name || project.client?.company || 'Unknown Client',
        amount: project.amount || 0,
        date: project.createdAt,
        status: 'pending' as const,
        description: project.name || undefined,
        projectId: project.id,
        clientId: project.clientId || undefined,
        dueDate: undefined, // Projects don't have deadline field
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Update payment
   */
  async updatePayment(id: number, data: Partial<{
    amount: number;
    description: string;
    dueDate: Date;
    status: string;
  }>): Promise<Payment> {
    try {
      const updateData: any = {};

      if (data.amount !== undefined) {
        updateData.amount = data.amount;
        updateData.pendingAmt = data.amount;
      }
      if (data.description !== undefined) {
        updateData.name = data.description;
      }
      // Note: Projects don't have deadline field, so we skip dueDate updates
      if (data.status !== undefined) {
        updateData.status = this.mapPaymentStatusToProjectStatus(data.status);
        if (data.status === 'completed') {
          updateData.pendingAmt = 0;
        }
      }

      const project = await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              name: true,
              company: true,
            },
          },
        },
      });

      return {
        id: project.id,
        clientName: project.client?.name || project.client?.company || 'Unknown Client',
        amount: project.amount || 0,
        date: project.updatedAt,
        status: this.mapProjectStatusToPaymentStatus(project.status, project.pendingAmt || 0),
        description: project.name || undefined,
        projectId: project.id,
        clientId: project.clientId || undefined,
        dueDate: undefined, // Projects don't have deadline field
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    } catch (error) {
      logger.error('Error updating payment:', error);
      throw error;
    }
  }

  /**
   * Delete payment
   */
  async deletePayment(id: number): Promise<void> {
    try {
      await prisma.project.delete({
        where: { id },
      });

      logger.info(`Payment deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting payment:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<PaymentStats> {
    try {
      const [
        totalProjects,
        ongoingProjects,
        pendingProjects,
        completedProjects,
        totalAmount,
        ongoingAmount,
        pendingAmount,
        completedAmount,
      ] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({
          where: {
            pendingAmt: { gt: 0 },
            status: 'ACTIVE',
          },
        }),
        prisma.project.count({
          where: {
            pendingAmt: { gt: 0 },
            status: { not: 'COMPLETED' },
          },
        }),
        prisma.project.count({
          where: {
            OR: [
              { pendingAmt: { lte: 0 } },
              { status: 'COMPLETED' }
            ],
          },
        }),
        prisma.project.aggregate({
          _sum: { amount: true },
        }),
        prisma.project.aggregate({
          where: {
            pendingAmt: { gt: 0 },
            status: 'ACTIVE',
          },
          _sum: { pendingAmt: true },
        }),
        prisma.project.aggregate({
          where: {
            pendingAmt: { gt: 0 },
            status: { not: 'COMPLETED' },
          },
          _sum: { pendingAmt: true },
        }),
        prisma.project.aggregate({
          where: {
            OR: [
              { pendingAmt: { lte: 0 } },
              { status: 'COMPLETED' }
            ],
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        totalPayments: totalProjects,
        ongoingPayments: ongoingProjects,
        pendingPayments: pendingProjects,
        completedPayments: completedProjects,
        totalAmount: totalAmount._sum.amount || 0,
        ongoingAmount: ongoingAmount._sum.pendingAmt || 0,
        pendingAmount: pendingAmount._sum.pendingAmt || 0,
        completedAmount: completedAmount._sum.amount || 0,
      };
    } catch (error) {
      logger.error('Error getting payment stats:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    try {
      const updateData: any = {
        status: this.mapPaymentStatusToProjectStatus(status),
      };

      if (status === 'completed') {
        updateData.pendingAmt = 0;
      }

      const project = await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              name: true,
              company: true,
            },
          },
        },
      });

      return {
        id: project.id,
        clientName: project.client?.name || project.client?.company || 'Unknown Client',
        amount: project.amount || 0,
        date: project.updatedAt,
        status: this.mapProjectStatusToPaymentStatus(project.status, project.pendingAmt || 0),
        description: project.name || undefined,
        projectId: project.id,
        clientId: project.clientId || undefined,
        dueDate: undefined, // Projects don't have deadline field
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    } catch (error) {
      logger.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Map project status to payment status
   */
  private mapProjectStatusToPaymentStatus(projectStatus: string | null, pendingAmount: number): 'ongoing' | 'pending' | 'completed' {
    if (projectStatus === 'COMPLETED' || pendingAmount <= 0) {
      return 'completed';
    } else if (projectStatus === 'ACTIVE' && pendingAmount > 0) {
      return 'ongoing';
    } else {
      return 'pending';
    }
  }

  /**
   * Map payment status to project status
   */
  private mapPaymentStatusToProjectStatus(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'completed':
        return 'COMPLETED';
      case 'ongoing':
        return 'ACTIVE';
      case 'pending':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  }
}

export const paymentService = new PaymentService();

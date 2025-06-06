import { prisma } from '@/config/database';
import { NotFoundError, ConflictError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { calculatePagination } from '@/utils/helpers';

export interface CreateOutclientData {
  name: string;
  company: string;
  number: string;
  email?: string;
  img?: string;
}

export interface UpdateOutclientData {
  name?: string;
  company?: string;
  number?: string;
  email?: string;
  img?: string;
}

export interface OutclientWithProjects {
  id: number;
  name: string;
  company: string;
  number: string;
  email: string | null;
  img: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectCount: number;
  totalAmount: number;
}

export interface OutclientQueryOptions {
  search?: string;
  page?: number;
  limit?: number;
}

class OutclientService {
  /**
   * Create a new outclient
   */
  async createOutclient(data: CreateOutclientData): Promise<OutclientWithProjects> {
    try {
      // Check if outclient with same email already exists (if email provided)
      if (data.email) {
        const existingOutclient = await prisma.outclient.findFirst({
          where: { email: data.email },
        });

        if (existingOutclient) {
          throw new ConflictError('Outclient with this email already exists');
        }
      }

      const outclient = await prisma.outclient.create({
        data,
      });

      logger.info(`Outclient created: ${outclient.name} (${outclient.company})`);

      return {
        ...outclient,
        projectCount: 0,
        totalAmount: 0,
      };
    } catch (error) {
      logger.error('Error creating outclient:', error);
      throw error;
    }
  }

  /**
   * Get all outclients with pagination and search
   */
  async getOutclients(options: OutclientQueryOptions = {}): Promise<{
    outclients: OutclientWithProjects[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { search = '', page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      // Build where clause for search
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { company: { contains: search, mode: 'insensitive' as const } },
              { number: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      // Get total count for pagination
      const total = await prisma.outclient.count({ where });

      // Get outclients
      const outclients = await prisma.outclient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // Get project counts and amounts for each outclient
      const outclientsWithProjects = await Promise.all(
        outclients.map(async (outclient) => {
          // Count projects where this outclient is mentioned
          const projectCount = await prisma.project.count({
            where: { outClient: outclient.name },
          });

          // Sum amounts for projects with this outclient
          const projectSum = await prisma.project.aggregate({
            where: { outClient: outclient.name },
            _sum: { outsourcingAmt: true },
          });

          return {
            ...outclient,
            projectCount,
            totalAmount: projectSum._sum.outsourcingAmt || 0,
          };
        })
      );

      const pagination = calculatePagination(page, limit, total);

      return {
        outclients: outclientsWithProjects,
        pagination,
      };
    } catch (error) {
      logger.error('Error getting outclients:', error);
      throw error;
    }
  }

  /**
   * Get outclient by ID
   */
  async getOutclientById(id: number): Promise<OutclientWithProjects> {
    try {
      const outclient = await prisma.outclient.findUnique({
        where: { id },
      });

      if (!outclient) {
        throw new NotFoundError('Outclient not found');
      }

      // Get associated projects
      const projects = await prisma.project.findMany({
        where: { outClient: outclient.name },
        select: {
          id: true,
          code: true,
          name: true,
          outsourcingAmt: true,
          outsourcingPaid: true,
          shootStartDate: true,
          shootEndDate: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const projectCount = projects.length;
      const totalAmount = projects.reduce((sum, project) => sum + project.outsourcingAmt, 0);

      return {
        ...outclient,
        projectCount,
        totalAmount,
      };
    } catch (error) {
      logger.error('Error getting outclient by ID:', error);
      throw error;
    }
  }

  /**
   * Get outclient by name
   */
  async getOutclientByName(name: string): Promise<OutclientWithProjects> {
    try {
      const outclient = await prisma.outclient.findFirst({
        where: { name },
      });

      if (!outclient) {
        throw new NotFoundError('Outclient not found');
      }

      // Get associated projects
      const projects = await prisma.project.findMany({
        where: { outClient: outclient.name },
        select: {
          id: true,
          code: true,
          name: true,
          outsourcingAmt: true,
          outsourcingPaid: true,
          shootStartDate: true,
          shootEndDate: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const projectCount = projects.length;
      const totalAmount = projects.reduce((sum, project) => sum + project.outsourcingAmt, 0);

      return {
        ...outclient,
        projectCount,
        totalAmount,
      };
    } catch (error) {
      logger.error('Error getting outclient by name:', error);
      throw error;
    }
  }

  /**
   * Update outclient
   */
  async updateOutclient(id: number, data: UpdateOutclientData): Promise<OutclientWithProjects> {
    try {
      // Check if outclient exists
      const existingOutclient = await prisma.outclient.findUnique({
        where: { id },
      });

      if (!existingOutclient) {
        throw new NotFoundError('Outclient not found');
      }

      // Check if email is already taken by another outclient
      if (data.email) {
        const emailTaken = await prisma.outclient.findFirst({
          where: {
            email: data.email,
            id: { not: id },
          },
        });

        if (emailTaken) {
          throw new ConflictError('Email is already taken by another outclient');
        }
      }

      const updatedOutclient = await prisma.outclient.update({
        where: { id },
        data,
      });

      // Get project statistics
      const projectCount = await prisma.project.count({
        where: { outClient: updatedOutclient.name },
      });

      const projectSum = await prisma.project.aggregate({
        where: { outClient: updatedOutclient.name },
        _sum: { outsourcingAmt: true },
      });

      logger.info(`Outclient updated: ${updatedOutclient.name} (${updatedOutclient.company})`);

      return {
        ...updatedOutclient,
        projectCount,
        totalAmount: projectSum._sum.outsourcingAmt || 0,
      };
    } catch (error) {
      logger.error('Error updating outclient:', error);
      throw error;
    }
  }

  /**
   * Delete outclient
   */
  async deleteOutclient(id: number): Promise<{ message: string }> {
    try {
      // Check if outclient exists
      const existingOutclient = await prisma.outclient.findUnique({
        where: { id },
      });

      if (!existingOutclient) {
        throw new NotFoundError('Outclient not found');
      }

      // Check if outclient has associated projects
      const projectCount = await prisma.project.count({
        where: { outClient: existingOutclient.name },
      });

      if (projectCount > 0) {
        throw new ConflictError('Cannot delete outclient with existing projects');
      }

      await prisma.outclient.delete({
        where: { id },
      });

      logger.info(`Outclient deleted: ${existingOutclient.name} (${existingOutclient.company})`);

      return {
        message: 'Outclient deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting outclient:', error);
      throw error;
    }
  }

  /**
   * Get outclients for dropdown (simplified data)
   */
  async getOutclientsForDropdown(): Promise<{ id: number; name: string; company: string }[]> {
    try {
      const outclients = await prisma.outclient.findMany({
        select: {
          id: true,
          name: true,
          company: true,
        },
        orderBy: { name: 'asc' },
      });

      return outclients;
    } catch (error) {
      logger.error('Error getting outclients for dropdown:', error);
      throw error;
    }
  }

  /**
   * Get outclient statistics
   */
  async getOutclientStats(): Promise<{
    totalOutclients: number;
    totalProjects: number;
    totalOutsourcingAmount: number;
    averageProjectsPerOutclient: number;
  }> {
    try {
      const [outclientCount, projectStats] = await Promise.all([
        prisma.outclient.count(),
        prisma.project.aggregate({
          where: { outsourcing: true },
          _count: true,
          _sum: { outsourcingAmt: true },
        }),
      ]);

      const totalProjects = projectStats._count;
      const totalOutsourcingAmount = projectStats._sum.outsourcingAmt || 0;
      const averageProjectsPerOutclient = outclientCount > 0 ? totalProjects / outclientCount : 0;

      return {
        totalOutclients: outclientCount,
        totalProjects,
        totalOutsourcingAmount,
        averageProjectsPerOutclient: Math.round(averageProjectsPerOutclient * 100) / 100,
      };
    } catch (error) {
      logger.error('Error getting outclient stats:', error);
      throw error;
    }
  }
}

export const outclientService = new OutclientService();

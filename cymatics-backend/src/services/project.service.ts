import { prisma } from '@/config/database';
import { NotFoundError, ConflictError, ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { calculatePagination, generateProjectCode } from '@/utils/helpers';
import { mapsService } from './maps.service';

export interface CreateProjectData {
  name?: string;
  company?: string;
  type?: string;
  status?: string;
  shootStartDate?: Date;
  shootEndDate?: Date;
  amount?: number;
  location?: string;
  address?: string;
  outsourcing?: boolean;
  reference?: string;
  outsourcingAmt?: number;
  outFor?: string;
  outClient?: string;
  outsourcingPaid?: boolean;
  clientId: number;
}

export interface UpdateProjectData {
  name?: string;
  company?: string;
  type?: string;
  status?: string;
  shootStartDate?: Date;
  shootEndDate?: Date;
  amount?: number;
  location?: string;
  address?: string;
  outsourcing?: boolean;
  reference?: string;
  outsourcingAmt?: number;
  outFor?: string;
  outClient?: string;
  outsourcingPaid?: boolean;
  clientId?: number;
}

export interface ProjectWithDetails {
  id: number;
  code: string;
  name: string | null;
  company: string | null;
  type: string | null;
  status: string | null;
  shootStartDate: Date | null;
  shootEndDate: Date | null;
  amount: number;
  location: string | null;
  latitude: number;
  longitude: number;
  outsourcing: boolean;
  reference: string | null;
  image: string | null;
  pendingAmt: number;
  receivedAmt: number;
  address: string | null;
  map: string | null;
  profit: number;
  rating: number;
  outsourcingAmt: number;
  outFor: string | null;
  outClient: string | null;
  outsourcingPaid: boolean;
  clientId: number;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: number;
    name: string;
    company: string;
    email: string | null;
  };
  incomes: {
    id: number;
    amount: number;
    description: string;
    date: Date;
  }[];
  expenses: {
    id: number;
    amount: number;
    description: string;
    category: string;
    date: Date;
  }[];
  _count: {
    incomes: number;
    expenses: number;
  };
}

export interface ProjectQueryOptions {
  search?: string;
  type?: string;
  status?: string;
  company?: string;
  page?: number;
  limit?: number;
}

class ProjectService {
  /**
   * Create a new project
   */
  async createProject(data: CreateProjectData): Promise<ProjectWithDetails> {
    try {
      // Validate client exists
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!client) {
        throw new ValidationError('Client not found');
      }

      // Get coordinates from location/address
      let latitude = 0.0;
      let longitude = 0.0;
      const locationToGeocode = data.location || data.address;

      if (locationToGeocode) {
        try {
          const coordinates = await mapsService.getCoordinatesFromAddress(locationToGeocode);
          if (coordinates) {
            latitude = coordinates.latitude;
            longitude = coordinates.longitude;
          }
        } catch (error) {
          logger.warn('Failed to geocode location:', error);
        }
      }

      // Set default values for financial calculations
      const projectData = {
        ...data,
        pendingAmt: data.amount || 0,
        receivedAmt: 0,
        profit: 0,
        rating: 0,
        latitude,
        longitude,
      };

      // Create project with temporary code
      const project = await prisma.project.create({
        data: {
          ...projectData,
          code: '', // Will be updated after creation
          status: data.status?.toUpperCase() || null,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            },
          },
          incomes: {
            select: {
              id: true,
              amount: true,
              description: true,
              date: true,
            },
          },
          expenses: {
            select: {
              id: true,
              amount: true,
              description: true,
              category: true,
              date: true,
            },
          },
          _count: {
            select: {
              incomes: true,
              expenses: true,
            },
          },
        },
      });

      // Update with generated code
      const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: { code: generateProjectCode(project.id) },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            },
          },
          incomes: {
            select: {
              id: true,
              amount: true,
              description: true,
              date: true,
            },
          },
          expenses: {
            select: {
              id: true,
              amount: true,
              description: true,
              category: true,
              date: true,
            },
          },
          _count: {
            select: {
              incomes: true,
              expenses: true,
            },
          },
        },
      });

      // Update financial calculations
      await this.updateProjectFinances(updatedProject.id);

      // Get updated project with calculations
      const finalProject = await this.getProjectById(updatedProject.id);

      logger.info(`Project created: ${finalProject.code} - ${finalProject.name}`);

      return finalProject;
    } catch (error) {
      logger.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Get all projects with pagination, search, and filters
   */
  async getProjects(options: ProjectQueryOptions = {}): Promise<{
    projects: ProjectWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { search = '', type, status, company, page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      // Search across multiple fields
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { type: { contains: search, mode: 'insensitive' } },
          { status: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Filter by type
      if (type) {
        const typeList = type.split(',').map(t => t.trim());
        where.type = { in: typeList };
      }

      // Filter by status
      if (status) {
        const statusList = status.split(',').map(s => s.trim().toUpperCase());
        where.status = { in: statusList };
      }

      // Filter by company
      if (company) {
        const companyList = company.split(',').map(c => c.trim());
        where.company = { in: companyList };
      }

      // Get total count for pagination
      const total = await prisma.project.count({ where });

      // Get projects
      const projects = await prisma.project.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            },
          },
          incomes: {
            select: {
              id: true,
              amount: true,
              description: true,
              date: true,
            },
          },
          expenses: {
            select: {
              id: true,
              amount: true,
              description: true,
              category: true,
              date: true,
            },
          },
          _count: {
            select: {
              incomes: true,
              expenses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const pagination = calculatePagination(page, limit, total);

      return {
        projects,
        pagination,
      };
    } catch (error) {
      logger.error('Error getting projects:', error);
      throw error;
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: number): Promise<ProjectWithDetails> {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            },
          },
          incomes: {
            select: {
              id: true,
              amount: true,
              description: true,
              date: true,
            },
            orderBy: { date: 'desc' },
          },
          expenses: {
            select: {
              id: true,
              amount: true,
              description: true,
              category: true,
              date: true,
            },
            orderBy: { date: 'desc' },
          },
          _count: {
            select: {
              incomes: true,
              expenses: true,
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      return project;
    } catch (error) {
      logger.error('Error getting project by ID:', error);
      throw error;
    }
  }

  /**
   * Get project by code
   */
  async getProjectByCode(code: string): Promise<ProjectWithDetails> {
    try {
      const project = await prisma.project.findUnique({
        where: { code },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            },
          },
          incomes: {
            select: {
              id: true,
              amount: true,
              description: true,
              date: true,
            },
            orderBy: { date: 'desc' },
          },
          expenses: {
            select: {
              id: true,
              amount: true,
              description: true,
              category: true,
              date: true,
            },
            orderBy: { date: 'desc' },
          },
          _count: {
            select: {
              incomes: true,
              expenses: true,
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      return project;
    } catch (error) {
      logger.error('Error getting project by code:', error);
      throw error;
    }
  }

  /**
   * Update project
   */
  async updateProject(id: number, data: UpdateProjectData): Promise<ProjectWithDetails> {
    try {
      // Check if project exists
      const existingProject = await prisma.project.findUnique({
        where: { id },
      });

      if (!existingProject) {
        throw new NotFoundError('Project not found');
      }

      // Validate client if provided
      if (data.clientId) {
        const client = await prisma.client.findUnique({
          where: { id: data.clientId },
        });

        if (!client) {
          throw new ValidationError('Client not found');
        }
      }

      // Get coordinates if location/address changed
      let updateData: any = { ...data };
      if (data.location || data.address) {
        const locationToGeocode = data.location || data.address;
        if (locationToGeocode) {
          try {
            const coordinates = await mapsService.getCoordinatesFromAddress(locationToGeocode);
            if (coordinates) {
              updateData.latitude = coordinates.latitude;
              updateData.longitude = coordinates.longitude;
            }
          } catch (error) {
            logger.warn('Failed to geocode location:', error);
          }
        }
      }

      // Convert status to uppercase
      if (updateData.status) {
        updateData.status = updateData.status.toUpperCase();
      }

      await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            },
          },
          incomes: {
            select: {
              id: true,
              amount: true,
              description: true,
              date: true,
            },
          },
          expenses: {
            select: {
              id: true,
              amount: true,
              description: true,
              category: true,
              date: true,
            },
          },
          _count: {
            select: {
              incomes: true,
              expenses: true,
            },
          },
        },
      });

      // Update financial calculations
      await this.updateProjectFinances(id);

      // Get updated project with calculations
      const finalProject = await this.getProjectById(id);

      logger.info(`Project updated: ${finalProject.code} - ${finalProject.name}`);

      return finalProject;
    } catch (error) {
      logger.error('Error updating project:', error);
      throw error;
    }
  }

  /**
   * Delete project
   */
  async deleteProject(id: number): Promise<{ message: string }> {
    try {
      // Check if project exists
      const existingProject = await prisma.project.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              incomes: true,
              expenses: true,
            },
          },
        },
      });

      if (!existingProject) {
        throw new NotFoundError('Project not found');
      }

      // Check if project has financial records
      if (existingProject._count.incomes > 0 || existingProject._count.expenses > 0) {
        throw new ConflictError('Cannot delete project with existing financial records');
      }

      await prisma.project.delete({
        where: { id },
      });

      logger.info(`Project deleted: ${existingProject.code} - ${existingProject.name}`);

      return {
        message: 'Project deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting project:', error);
      throw error;
    }
  }



  /**
   * Get project codes for dropdown
   */
  async getProjectCodes(): Promise<{ code: string; name: string | null }[]> {
    try {
      const projects = await prisma.project.findMany({
        select: {
          code: true,
          name: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return projects;
    } catch (error) {
      logger.error('Error getting project codes:', error);
      throw error;
    }
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: string, page: number = 1, limit: number = 10): Promise<{
    projects: {
      id: string;
      name: string;
      pendingAmount: number;
      status: string;
      clientInitial: string;
      clientName?: string;
      amount?: number;
      date?: Date;
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      // Map frontend status to database status
      const where: any = {};

      if (status === 'ongoing') {
        where.status = 'ACTIVE';
        where.pendingAmt = { gt: 0 };
      } else if (status === 'pending') {
        where.OR = [
          { status: 'PENDING' },
          { status: 'ON_HOLD' },
          {
            AND: [
              { status: { not: 'COMPLETED' } },
              { pendingAmt: { gt: 0 } }
            ]
          }
        ];
      } else if (status === 'completed') {
        where.OR = [
          { status: 'COMPLETED' },
          { pendingAmt: { lte: 0 } }
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

      const formattedProjects = projects.map(project => {
        const clientName = project.client?.name || project.client?.company || 'Unknown';
        const clientInitial = clientName.charAt(0).toUpperCase();

        return {
          id: project.id.toString(),
          name: project.name || `Project ${project.code}`,
          pendingAmount: project.pendingAmt || 0,
          status: this.mapDatabaseStatusToFrontend(project.status, project.pendingAmt || 0),
          clientInitial,
          clientName,
          amount: project.amount || 0,
          date: project.updatedAt,
        };
      });

      return {
        projects: formattedProjects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting projects by status:', error);
      throw error;
    }
  }

  /**
   * Map database status to frontend status
   */
  private mapDatabaseStatusToFrontend(dbStatus: string | null, pendingAmount: number): string {
    if (dbStatus === 'COMPLETED' || pendingAmount <= 0) {
      return 'completed';
    } else if (dbStatus === 'ACTIVE' && pendingAmount > 0) {
      return 'ongoing';
    } else {
      return 'pending';
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<{
    totalProjects: number;
    totalRevenue: number;
    totalProfit: number;
    totalPending: number;
    averageProjectValue: number;
    statusBreakdown: { status: string; count: number }[];
    typeBreakdown: { type: string; count: number }[];
  }> {
    try {
      const [
        totalProjects,
        revenueStats,
        statusBreakdown,
        typeBreakdown,
      ] = await Promise.all([
        prisma.project.count(),
        prisma.project.aggregate({
          _sum: {
            amount: true,
            profit: true,
            pendingAmt: true,
          },
          _avg: {
            amount: true,
          },
        }),
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
      ]);

      return {
        totalProjects,
        totalRevenue: revenueStats._sum.amount || 0,
        totalProfit: revenueStats._sum.profit || 0,
        totalPending: revenueStats._sum.pendingAmt || 0,
        averageProjectValue: revenueStats._avg.amount || 0,
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.status || 'Unknown',
          count: item._count,
        })),
        typeBreakdown: typeBreakdown.map(item => ({
          type: item.type || 'Unknown',
          count: item._count,
        })),
      };
    } catch (error) {
      logger.error('Error getting project stats:', error);
      throw error;
    }
  }

  /**
   * Update project finances (profit, pending amount, received amount)
   */
  async updateProjectFinances(projectId: number): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          incomes: true,
          expenses: true,
        },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      const totalExpenses = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalIncome = project.incomes.reduce((sum, income) => sum + income.amount, 0);

      const profit = project.amount - (project.outsourcingAmt + totalExpenses);
      const receivedAmt = totalIncome;
      const pendingAmt = project.amount - receivedAmt;

      await prisma.project.update({
        where: { id: projectId },
        data: {
          profit,
          receivedAmt,
          pendingAmt,
        },
      });

      logger.debug(`Updated finances for project ${project.code}: profit=${profit}, received=${receivedAmt}, pending=${pendingAmt}`);
    } catch (error) {
      logger.error('Error updating project finances:', error);
      throw error;
    }
  }
}

export const projectService = new ProjectService();

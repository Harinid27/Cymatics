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
  onedriveLink?: string;
  projectLead?: string;
  clientId: number;
}

export enum ProjectStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD'
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
  onedriveLink?: string;
  projectLead?: string;
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
  onedriveLink: string | null;
  projectLead: string | null;
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
  startDate?: Date | undefined;
  endDate?: Date | undefined;
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

      // Automatically create pending income entry if project has amount
      if (updatedProject.amount > 0) {
        await this.createPendingIncomeForProject(updatedProject);
      }

      // Update project status based on dates
      await this.updateProjectStatusBasedOnDates(updatedProject.id);

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
      const { search = '', type, status, company, startDate, endDate, page = 1, limit = 10 } = options;
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

      // Filter by date range (for calendar events)
      if (startDate || endDate) {
        where.OR = [
          // Projects that start within the range
          {
            shootStartDate: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          },
          // Projects that end within the range
          {
            shootEndDate: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          },
          // Projects that span the entire range
          {
            AND: [
              ...(startDate ? [{ shootStartDate: { lte: startDate } }] : []),
              ...(endDate ? [{ shootEndDate: { gte: endDate } }] : []),
            ],
          },
        ];
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

      // Handle status changes for income automation
      if (data.status && data.status.toUpperCase() === 'COMPLETED') {
        await this.convertPendingToActualIncome(id);
      }

      // Update project status based on dates (unless manually overridden)
      if (!data.status) {
        await this.updateProjectStatusBasedOnDates(id);
      }

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
  async deleteProject(id: number, force: boolean = false): Promise<{ message: string }> {
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

      // Check if project has financial records and force is not enabled
      if (!force && (existingProject._count.incomes > 0 || existingProject._count.expenses > 0)) {
        throw new ConflictError('Cannot delete project with existing financial records. Use force delete to remove all related records.');
      }

      // If force delete, remove all related records first
      if (force) {
        // Delete related income records
        await prisma.income.deleteMany({
          where: { projectId: id },
        });

        // Delete related expense records  
        await prisma.expense.deleteMany({
          where: { projectId: id },
        });

        logger.info(`Force deleted financial records for project: ${existingProject.code}`);
      }

      await prisma.project.delete({
        where: { id },
      });

      logger.info(`Project deleted: ${existingProject.code} - ${existingProject.name}`);

      return {
        message: force 
          ? 'Project and all related financial records deleted successfully'
          : 'Project deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting project:', error);
      throw error;
    }
  }



  /**
   * Create pending income for a project
   */
  private async createPendingIncomeForProject(project: any): Promise<void> {
    try {
      // Check if pending income already exists for this project
      const existingPendingIncome = await prisma.income.findFirst({
        where: {
          projectId: project.id,
          description: {
            contains: 'Project Payment',
            mode: 'insensitive',
          },
        },
      });

      if (!existingPendingIncome) {
        await prisma.income.create({
          data: {
            amount: project.amount,
            description: `Project Payment - ${project.name || project.code}`,
            date: project.shootEndDate || new Date(),
            projectIncome: true,
            projectId: project.id,
          },
        });

        logger.info(`Pending income created for project: ${project.code}`);
      }
    } catch (error) {
      logger.error('Error creating pending income for project:', error);
      // Don't throw error to avoid breaking project creation
    }
  }

  /**
   * Convert pending income to actual income when project is completed
   */
  async convertPendingToActualIncome(projectId: number): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      if (project.status?.toUpperCase() === 'COMPLETED') {
        // Find pending income for this project
        const pendingIncome = await prisma.income.findFirst({
          where: {
            projectId: projectId,
            description: {
              contains: 'Project Payment',
              mode: 'insensitive',
            },
          },
        });

        if (pendingIncome) {
          // Update the income description to mark as received
          await prisma.income.update({
            where: { id: pendingIncome.id },
            data: {
              description: `Project Payment Received - ${project.name || project.code}`,
              date: new Date(), // Update to current date when marked as received
            },
          });

          logger.info(`Converted pending income to actual for project: ${project.code}`);
        }
      }
    } catch (error) {
      logger.error('Error converting pending to actual income:', error);
      throw error;
    }
  }

  /**
   * Update project status based on dates (automatic progression)
   */
  async updateProjectStatusBasedOnDates(projectId: number): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);
      const currentDate = new Date();
      const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

      let newStatus = project.status;

      // Don't auto-update if status is manually set to ON_HOLD
      if (project.status === ProjectStatus.ON_HOLD) {
        return;
      }

      if (project.shootStartDate && project.shootEndDate) {
        const startDate = new Date(project.shootStartDate);
        const endDate = new Date(project.shootEndDate);
        const projectStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const projectEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        if (today < projectStart) {
          newStatus = ProjectStatus.NOT_STARTED;
        } else if (today >= projectStart && today <= projectEnd) {
          newStatus = ProjectStatus.IN_PROGRESS;
        } else if (today > projectEnd) {
          newStatus = ProjectStatus.COMPLETED;
        }
      } else if (project.shootStartDate) {
        const startDate = new Date(project.shootStartDate);
        const projectStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

        if (today >= projectStart) {
          newStatus = ProjectStatus.IN_PROGRESS;
        } else {
          newStatus = ProjectStatus.NOT_STARTED;
        }
      }

      // Update status if it changed
      if (newStatus !== project.status) {
        await prisma.project.update({
          where: { id: projectId },
          data: { status: newStatus },
        });

        // Convert pending income if completed
        if (newStatus === ProjectStatus.COMPLETED) {
          await this.convertPendingToActualIncome(projectId);
        }

        logger.info(`Auto-updated project status: ${project.code} -> ${newStatus}`);
      }
    } catch (error) {
      logger.error('Error updating project status based on dates:', error);
      throw error;
    }
  }

  /**
   * Batch update all project statuses based on dates
   */
  async batchUpdateProjectStatuses(): Promise<void> {
    try {
      const projects = await prisma.project.findMany({
        where: {
          status: {
            not: ProjectStatus.ON_HOLD, // Don't auto-update projects on hold
          },
        },
        select: { id: true },
      });

      for (const project of projects) {
        await this.updateProjectStatusBasedOnDates(project.id);
      }

      logger.info(`Batch updated ${projects.length} project statuses`);
    } catch (error) {
      logger.error('Error in batch update project statuses:', error);
      throw error;
    }
  }

  /**
   * Calculate project budget and profitability
   */
  async calculateProjectBudget(projectId: number): Promise<{
    totalBudget: number;
    totalExpenses: number;
    totalIncome: number;
    projectedProfit: number;
    actualProfit: number;
    budgetUtilization: number;
    remainingBudget: number;
  }> {
    try {
      const project = await this.getProjectById(projectId);

      // Get all expenses for this project
      const expenses = await prisma.expense.findMany({
        where: { projectId: projectId },
        select: { amount: true },
      });

      // Get all income for this project
      const incomes = await prisma.income.findMany({
        where: { projectId: projectId },
        select: { amount: true },
      });

      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
      const totalBudget = project.amount; // Project amount is the budget
      const projectedProfit = totalBudget - project.outsourcingAmt - totalExpenses;
      const actualProfit = totalIncome - project.outsourcingAmt - totalExpenses;
      const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
      const remainingBudget = totalBudget - totalExpenses;

      return {
        totalBudget,
        totalExpenses,
        totalIncome,
        projectedProfit,
        actualProfit,
        budgetUtilization,
        remainingBudget,
      };
    } catch (error) {
      logger.error('Error calculating project budget:', error);
      throw error;
    }
  }

  /**
   * Get project profitability analysis
   */
  async getProjectProfitabilityAnalysis(): Promise<{
    totalProjects: number;
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    averageProfitMargin: number;
    mostProfitableProjects: Array<{
      id: number;
      code: string;
      name: string;
      profit: number;
      profitMargin: number;
    }>;
  }> {
    try {
      const projects = await prisma.project.findMany({
        include: {
          incomes: { select: { amount: true } },
          expenses: { select: { amount: true } },
        },
      });

      let totalRevenue = 0;
      let totalExpenses = 0;
      const projectProfitability = [];

      for (const project of projects) {
        const projectRevenue = project.incomes.reduce((sum, income) => sum + income.amount, 0);
        const projectExpenses = project.expenses.reduce((sum, expense) => sum + expense.amount, 0) + project.outsourcingAmt;
        const projectProfit = projectRevenue - projectExpenses;
        const profitMargin = projectRevenue > 0 ? (projectProfit / projectRevenue) * 100 : 0;

        totalRevenue += projectRevenue;
        totalExpenses += projectExpenses;

        projectProfitability.push({
          id: project.id,
          code: project.code,
          name: project.name || 'Unnamed Project',
          profit: projectProfit,
          profitMargin,
        });
      }

      const totalProfit = totalRevenue - totalExpenses;
      const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // Sort by profit and get top 5
      const mostProfitableProjects = projectProfitability
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

      return {
        totalProjects: projects.length,
        totalRevenue,
        totalExpenses,
        totalProfit,
        averageProfitMargin,
        mostProfitableProjects,
      };
    } catch (error) {
      logger.error('Error getting project profitability analysis:', error);
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
        // Include ONLY active/in-progress projects, NOT not-started projects
        where.OR = [
          { status: 'IN_PROGRESS' },
          { status: 'ACTIVE' }
        ];
      } else if (status === 'pending') {
        // Include pending, not started, and on-hold projects
        where.OR = [
          { status: 'NOT_STARTED' },
          { status: 'PENDING' },
          { status: 'ON_HOLD' },
          { status: 'DRAFT' }
        ];
      } else if (status === 'completed') {
        // Include ONLY explicitly completed projects
        // Do NOT include projects based on pending amount alone
        where.status = 'COMPLETED';
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
    // Explicitly completed projects only
    if (dbStatus === 'COMPLETED') {
      return 'completed';
    }

    // NOT_STARTED projects should ALWAYS be pending, regardless of pending amount
    if (dbStatus === 'NOT_STARTED') {
      return 'pending';
    }

    // Pending projects (pending, on hold, or draft)
    if (dbStatus === 'PENDING' || dbStatus === 'ON_HOLD' || dbStatus === 'DRAFT') {
      return 'pending';
    }

    // Ongoing projects (active or in progress)
    if (dbStatus === 'IN_PROGRESS' || dbStatus === 'ACTIVE') {
      return 'ongoing';
    }

    // Default fallback for unknown statuses
    if (pendingAmount > 0) {
      return 'pending';
    }

    return 'completed';
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

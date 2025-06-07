import { prisma } from '@/config/database';
import { NotFoundError, ConflictError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { calculatePagination } from '@/utils/helpers';

export interface CreateClientData {
  name: string;
  company: string;
  number: string;
  email?: string;
  img?: string;
}

export interface UpdateClientData {
  name?: string;
  company?: string;
  number?: string;
  email?: string;
  img?: string;
}

export interface ClientWithProjects {
  id: number;
  name: string;
  company: string;
  number: string;
  email: string | null;
  img: string | null;
  createdAt: Date;
  updatedAt: Date;
  projects: {
    id: number;
    code: string;
    name: string | null;
    amount: number;
    status: string | null;
  }[];
  _count: {
    projects: number;
  };
  totalAmount: number;
}

export interface ClientQueryOptions {
  search?: string;
  page?: number;
  limit?: number;
}

class ClientService {
  /**
   * Create a new client
   */
  async createClient(data: CreateClientData): Promise<ClientWithProjects> {
    try {
      // Check if client with same email already exists (if email provided)
      if (data.email) {
        const existingClient = await prisma.client.findFirst({
          where: { email: data.email },
        });

        if (existingClient) {
          throw new ConflictError('Client with this email already exists');
        }
      }

      const client = await prisma.client.create({
        data,
        include: {
          projects: {
            select: {
              id: true,
              code: true,
              name: true,
              amount: true,
              status: true,
            },
          },
          _count: {
            select: { projects: true },
          },
        },
      });

      const totalAmount = client.projects.reduce((sum, project) => sum + project.amount, 0);

      logger.info(`Client created: ${client.name} (${client.company})`);

      return {
        ...client,
        totalAmount,
      };
    } catch (error) {
      logger.error('Error creating client:', error);
      throw error;
    }
  }

  /**
   * Get all clients with pagination and search
   */
  async getClients(options: ClientQueryOptions = {}): Promise<{
    clients: ClientWithProjects[];
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
      const total = await prisma.client.count({ where });

      // Get clients with projects
      const clients = await prisma.client.findMany({
        where,
        include: {
          projects: {
            select: {
              id: true,
              code: true,
              name: true,
              amount: true,
              status: true,
            },
          },
          _count: {
            select: { projects: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // Calculate total amount for each client
      const clientsWithTotals = clients.map(client => ({
        ...client,
        totalAmount: client.projects.reduce((sum, project) => sum + project.amount, 0),
      }));

      const pagination = calculatePagination(page, limit, total);

      return {
        clients: clientsWithTotals,
        pagination,
      };
    } catch (error) {
      logger.error('Error getting clients:', error);
      throw error;
    }
  }

  /**
   * Get client by ID
   */
  async getClientById(id: number): Promise<ClientWithProjects> {
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          projects: {
            select: {
              id: true,
              code: true,
              name: true,
              amount: true,
              status: true,
              shootStartDate: true,
              shootEndDate: true,
              location: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { projects: true },
          },
        },
      });

      if (!client) {
        throw new NotFoundError('Client not found');
      }

      const totalAmount = client.projects.reduce((sum, project) => sum + project.amount, 0);

      return {
        ...client,
        totalAmount,
      };
    } catch (error) {
      logger.error('Error getting client by ID:', error);
      throw error;
    }
  }

  /**
   * Get client by name
   */
  async getClientByName(name: string): Promise<ClientWithProjects> {
    try {
      const client = await prisma.client.findFirst({
        where: { name },
        include: {
          projects: {
            select: {
              id: true,
              code: true,
              name: true,
              amount: true,
              status: true,
              shootStartDate: true,
              shootEndDate: true,
              location: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { projects: true },
          },
        },
      });

      if (!client) {
        throw new NotFoundError('Client not found');
      }

      const totalAmount = client.projects.reduce((sum, project) => sum + project.amount, 0);

      return {
        ...client,
        totalAmount,
      };
    } catch (error) {
      logger.error('Error getting client by name:', error);
      throw error;
    }
  }

  /**
   * Update client
   */
  async updateClient(id: number, data: UpdateClientData): Promise<ClientWithProjects> {
    try {
      // Check if client exists
      const existingClient = await prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        throw new NotFoundError('Client not found');
      }

      // Check if email is already taken by another client
      if (data.email) {
        const emailTaken = await prisma.client.findFirst({
          where: {
            email: data.email,
            id: { not: id },
          },
        });

        if (emailTaken) {
          throw new ConflictError('Email is already taken by another client');
        }
      }

      const updatedClient = await prisma.client.update({
        where: { id },
        data,
        include: {
          projects: {
            select: {
              id: true,
              code: true,
              name: true,
              amount: true,
              status: true,
            },
          },
          _count: {
            select: { projects: true },
          },
        },
      });

      const totalAmount = updatedClient.projects.reduce((sum, project) => sum + project.amount, 0);

      logger.info(`Client updated: ${updatedClient.name} (${updatedClient.company})`);

      return {
        ...updatedClient,
        totalAmount,
      };
    } catch (error) {
      logger.error('Error updating client:', error);
      throw error;
    }
  }

  /**
   * Delete client
   */
  async deleteClient(id: number): Promise<{ message: string }> {
    try {
      // Check if client exists
      const existingClient = await prisma.client.findUnique({
        where: { id },
        include: {
          _count: {
            select: { projects: true },
          },
        },
      });

      if (!existingClient) {
        throw new NotFoundError('Client not found');
      }

      // Check if client has projects
      if (existingClient._count.projects > 0) {
        throw new ConflictError('Cannot delete client with existing projects');
      }

      await prisma.client.delete({
        where: { id },
      });

      logger.info(`Client deleted: ${existingClient.name} (${existingClient.company})`);

      return {
        message: 'Client deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting client:', error);
      throw error;
    }
  }



  /**
   * Get client statistics
   */
  async getClientStats(): Promise<{
    totalClients: number;
    totalProjects: number;
    totalRevenue: number;
    averageProjectsPerClient: number;
  }> {
    try {
      const [clientCount, projectStats] = await Promise.all([
        prisma.client.count(),
        prisma.project.aggregate({
          _count: true,
          _sum: { amount: true },
        }),
      ]);

      const totalProjects = projectStats._count;
      const totalRevenue = projectStats._sum.amount || 0;
      const averageProjectsPerClient = clientCount > 0 ? totalProjects / clientCount : 0;

      return {
        totalClients: clientCount,
        totalProjects,
        totalRevenue,
        averageProjectsPerClient: Math.round(averageProjectsPerClient * 100) / 100,
      };
    } catch (error) {
      logger.error('Error getting client stats:', error);
      throw error;
    }
  }

  /**
   * Get clients for dropdown (simplified data)
   */
  async getClientsForDropdown(): Promise<{ id: number; name: string; company: string }[]> {
    try {
      const clients = await prisma.client.findMany({
        select: {
          id: true,
          name: true,
          company: true,
        },
        orderBy: { name: 'asc' },
      });

      return clients;
    } catch (error) {
      logger.error('Error getting clients for dropdown:', error);
      throw error;
    }
  }
}

export const clientService = new ClientService();

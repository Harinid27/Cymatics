import { prisma } from '@/config/database';
import { NotFoundError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { calculatePagination } from '@/utils/helpers';

export interface CreateEntertainmentData {
  date?: Date;
  type: string;
  language: string;
  rating: number;
  name: string;
  source?: string;
  image?: string;
}

export interface UpdateEntertainmentData {
  date?: Date;
  type?: string;
  language?: string;
  rating?: number;
  name?: string;
  source?: string;
  image?: string;
}

export interface EntertainmentQueryOptions {
  search?: string;
  type?: string;
  language?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

class EntertainmentService {
  /**
   * Create new entertainment entry
   */
  async createEntertainment(data: CreateEntertainmentData): Promise<any> {
    try {
      const entertainment = await prisma.entertainment.create({
        data: {
          ...data,
          date: data.date || new Date(),
        },
      });

      logger.info(`Entertainment created: ${entertainment.name} (${entertainment.type})`);

      return entertainment;
    } catch (error) {
      logger.error('Error creating entertainment:', error);
      throw error;
    }
  }

  /**
   * Get all entertainment entries with pagination and filters
   */
  async getEntertainment(options: EntertainmentQueryOptions = {}): Promise<{
    entertainment: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { search = '', type, language, minRating, page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { type: { contains: search, mode: 'insensitive' } },
          { language: { contains: search, mode: 'insensitive' } },
          { source: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (type) {
        where.type = type;
      }

      if (language) {
        where.language = language;
      }

      if (minRating) {
        where.rating = { gte: minRating };
      }

      // Get total count for pagination
      const total = await prisma.entertainment.count({ where });

      // Get entertainment entries
      const entertainment = await prisma.entertainment.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      });

      const pagination = calculatePagination(page, limit, total);

      return {
        entertainment,
        pagination,
      };
    } catch (error) {
      logger.error('Error getting entertainment:', error);
      throw error;
    }
  }

  /**
   * Get entertainment by ID
   */
  async getEntertainmentById(id: number): Promise<any> {
    try {
      const entertainment = await prisma.entertainment.findUnique({
        where: { id },
      });

      if (!entertainment) {
        throw new NotFoundError('Entertainment entry not found');
      }

      return entertainment;
    } catch (error) {
      logger.error('Error getting entertainment by ID:', error);
      throw error;
    }
  }

  /**
   * Update entertainment entry
   */
  async updateEntertainment(id: number, data: UpdateEntertainmentData): Promise<any> {
    try {
      const existingEntertainment = await prisma.entertainment.findUnique({
        where: { id },
      });

      if (!existingEntertainment) {
        throw new NotFoundError('Entertainment entry not found');
      }

      const updatedEntertainment = await prisma.entertainment.update({
        where: { id },
        data,
      });

      logger.info(`Entertainment updated: ${updatedEntertainment.name} (${updatedEntertainment.type})`);

      return updatedEntertainment;
    } catch (error) {
      logger.error('Error updating entertainment:', error);
      throw error;
    }
  }

  /**
   * Delete entertainment entry
   */
  async deleteEntertainment(id: number): Promise<{ message: string }> {
    try {
      const existingEntertainment = await prisma.entertainment.findUnique({
        where: { id },
      });

      if (!existingEntertainment) {
        throw new NotFoundError('Entertainment entry not found');
      }

      await prisma.entertainment.delete({
        where: { id },
      });

      logger.info(`Entertainment deleted: ${existingEntertainment.name} (${existingEntertainment.type})`);

      return {
        message: 'Entertainment entry deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting entertainment:', error);
      throw error;
    }
  }

  /**
   * Get entertainment statistics
   */
  async getEntertainmentStats(): Promise<{
    totalEntries: number;
    averageRating: number;
    typeBreakdown: { type: string; count: number; averageRating: number }[];
    languageBreakdown: { language: string; count: number; averageRating: number }[];
    ratingDistribution: { rating: number; count: number }[];
  }> {
    try {
      const [
        totalEntries,
        averageRating,
        typeBreakdown,
        languageBreakdown,
        ratingDistribution,
      ] = await Promise.all([
        prisma.entertainment.count(),
        prisma.entertainment.aggregate({
          _avg: { rating: true },
        }),
        prisma.entertainment.groupBy({
          by: ['type'],
          _count: true,
          _avg: { rating: true },
          orderBy: { type: 'asc' },
        }),
        prisma.entertainment.groupBy({
          by: ['language'],
          _count: true,
          _avg: { rating: true },
          orderBy: { language: 'asc' },
        }),
        prisma.entertainment.groupBy({
          by: ['rating'],
          _count: true,
          orderBy: { rating: 'asc' },
        }),
      ]);

      return {
        totalEntries,
        averageRating: Math.round((averageRating._avg.rating || 0) * 100) / 100,
        typeBreakdown: typeBreakdown.map(item => ({
          type: item.type,
          count: item._count || 0,
          averageRating: Math.round((item._avg?.rating || 0) * 100) / 100,
        })),
        languageBreakdown: languageBreakdown.map(item => ({
          language: item.language,
          count: item._count || 0,
          averageRating: Math.round((item._avg?.rating || 0) * 100) / 100,
        })),
        ratingDistribution: ratingDistribution.map(item => ({
          rating: item.rating,
          count: item._count || 0,
        })),
      };
    } catch (error) {
      logger.error('Error getting entertainment stats:', error);
      throw error;
    }
  }

  /**
   * Get entertainment types
   */
  async getEntertainmentTypes(): Promise<string[]> {
    try {
      const types = await prisma.entertainment.findMany({
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' },
      });

      return types.map(t => t.type);
    } catch (error) {
      logger.error('Error getting entertainment types:', error);
      throw error;
    }
  }

  /**
   * Get entertainment languages
   */
  async getEntertainmentLanguages(): Promise<string[]> {
    try {
      const languages = await prisma.entertainment.findMany({
        select: { language: true },
        distinct: ['language'],
        orderBy: { language: 'asc' },
      });

      return languages.map(l => l.language);
    } catch (error) {
      logger.error('Error getting entertainment languages:', error);
      throw error;
    }
  }
}

export const entertainmentService = new EntertainmentService();

import { prisma } from '@/config/database';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { calculatePagination } from '@/utils/helpers';

export interface CreateCalendarEventData {
  title: string;
  startTime: Date;
  endTime: Date;
}

export interface UpdateCalendarEventData {
  title?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface CalendarEventQueryOptions {
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

class CalendarService {
  /**
   * Create new calendar event
   */
  async createCalendarEvent(data: CreateCalendarEventData): Promise<any> {
    try {
      // Validate that end time is after start time
      if (data.endTime <= data.startTime) {
        throw new ValidationError('End time must be after start time');
      }

      const event = await prisma.calendarEvent.create({
        data,
      });

      logger.info(`Calendar event created: ${event.title}`);

      return event;
    } catch (error) {
      logger.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Get all calendar events with pagination and filters
   */
  async getCalendarEvents(options: CalendarEventQueryOptions = {}): Promise<{
    events: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { search = '', startDate, endDate, page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.title = { contains: search, mode: 'insensitive' };
      }

      // Filter by date range
      if (startDate || endDate) {
        where.OR = [
          // Events that start within the range
          {
            startTime: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          },
          // Events that end within the range
          {
            endTime: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          },
          // Events that span the entire range
          {
            AND: [
              ...(startDate ? [{ startTime: { lte: startDate } }] : []),
              ...(endDate ? [{ endTime: { gte: endDate } }] : []),
            ],
          },
        ];
      }

      // Get total count for pagination
      const total = await prisma.calendarEvent.count({ where });

      // Get events
      const events = await prisma.calendarEvent.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
      });

      const pagination = calculatePagination(page, limit, total);

      return {
        events,
        pagination,
      };
    } catch (error) {
      logger.error('Error getting calendar events:', error);
      throw error;
    }
  }

  /**
   * Get calendar event by ID
   */
  async getCalendarEventById(id: number): Promise<any> {
    try {
      const event = await prisma.calendarEvent.findUnique({
        where: { id },
      });

      if (!event) {
        throw new NotFoundError('Calendar event not found');
      }

      return event;
    } catch (error) {
      logger.error('Error getting calendar event by ID:', error);
      throw error;
    }
  }

  /**
   * Update calendar event
   */
  async updateCalendarEvent(id: number, data: UpdateCalendarEventData): Promise<any> {
    try {
      const existingEvent = await prisma.calendarEvent.findUnique({
        where: { id },
      });

      if (!existingEvent) {
        throw new NotFoundError('Calendar event not found');
      }

      // Validate times if both are provided
      const startTime = data.startTime || existingEvent.startTime;
      const endTime = data.endTime || existingEvent.endTime;

      if (endTime <= startTime) {
        throw new ValidationError('End time must be after start time');
      }

      const updatedEvent = await prisma.calendarEvent.update({
        where: { id },
        data,
      });

      logger.info(`Calendar event updated: ${updatedEvent.title}`);

      return updatedEvent;
    } catch (error) {
      logger.error('Error updating calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete calendar event
   */
  async deleteCalendarEvent(id: number): Promise<{ message: string }> {
    try {
      const existingEvent = await prisma.calendarEvent.findUnique({
        where: { id },
      });

      if (!existingEvent) {
        throw new NotFoundError('Calendar event not found');
      }

      await prisma.calendarEvent.delete({
        where: { id },
      });

      logger.info(`Calendar event deleted: ${existingEvent.title}`);

      return {
        message: 'Calendar event deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  /**
   * Get events for a specific date range (for calendar view)
   */
  async getEventsForDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const events = await prisma.calendarEvent.findMany({
        where: {
          OR: [
            // Events that start within the range
            {
              startTime: {
                gte: startDate,
                lte: endDate,
              },
            },
            // Events that end within the range
            {
              endTime: {
                gte: startDate,
                lte: endDate,
              },
            },
            // Events that span the entire range
            {
              AND: [
                { startTime: { lte: startDate } },
                { endTime: { gte: endDate } },
              ],
            },
          ],
        },
        orderBy: { startTime: 'asc' },
      });

      return events;
    } catch (error) {
      logger.error('Error getting events for date range:', error);
      throw error;
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 5): Promise<any[]> {
    try {
      const now = new Date();

      const events = await prisma.calendarEvent.findMany({
        where: {
          startTime: {
            gte: now,
          },
        },
        orderBy: { startTime: 'asc' },
        take: limit,
      });

      return events;
    } catch (error) {
      logger.error('Error getting upcoming events:', error);
      throw error;
    }
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats(): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    eventsThisMonth: number;
    eventsThisWeek: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59);

      const [
        totalEvents,
        upcomingEvents,
        pastEvents,
        eventsThisMonth,
        eventsThisWeek,
      ] = await Promise.all([
        prisma.calendarEvent.count(),
        prisma.calendarEvent.count({
          where: { startTime: { gte: now } },
        }),
        prisma.calendarEvent.count({
          where: { endTime: { lt: now } },
        }),
        prisma.calendarEvent.count({
          where: {
            startTime: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        prisma.calendarEvent.count({
          where: {
            startTime: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
        }),
      ]);

      return {
        totalEvents,
        upcomingEvents,
        pastEvents,
        eventsThisMonth,
        eventsThisWeek,
      };
    } catch (error) {
      logger.error('Error getting calendar stats:', error);
      throw error;
    }
  }
}

export const calendarService = new CalendarService();

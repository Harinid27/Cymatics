import { Request, Response, NextFunction } from 'express';
import { calendarService } from '@/services/calendar.service';
import { sendSuccessResponse, parsePaginationQuery, parseSearchQuery } from '@/utils/helpers';

class CalendarController {
  /**
   * Get all calendar events with pagination and filters
   */
  async getCalendarEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePaginationQuery(req.query);
      const search = parseSearchQuery(req.query);
      const { startDate, endDate } = req.query;

      const options: any = {
        search,
        page,
        limit,
      };

      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const result = await calendarService.getCalendarEvents(options);

      sendSuccessResponse(
        res,
        result.events,
        'Calendar events retrieved successfully',
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get calendar event by ID
   */
  async getCalendarEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const event = await calendarService.getCalendarEventById(parseInt(id));

      sendSuccessResponse(res, event, 'Calendar event retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new calendar event
   */
  async createCalendarEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, startTime, endTime } = req.body;

      const eventData = {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      };

      const event = await calendarService.createCalendarEvent(eventData);

      sendSuccessResponse(res, event, 'Calendar event created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update calendar event
   */
  async updateCalendarEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, startTime, endTime } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);

      const event = await calendarService.updateCalendarEvent(parseInt(id), updateData);

      sendSuccessResponse(res, event, 'Calendar event updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete calendar event
   */
  async deleteCalendarEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await calendarService.deleteCalendarEvent(parseInt(id));

      sendSuccessResponse(res, result, 'Calendar event deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get events for a specific date range (for calendar view)
   */
  async getEventsForDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        sendSuccessResponse(
          res,
          { error: 'startDate and endDate are required' },
          'Missing required parameters',
          400,
        );
        return;
      }

      const events = await calendarService.getEventsForDateRange(
        new Date(startDate as string),
        new Date(endDate as string),
      );

      sendSuccessResponse(res, events, 'Events for date range retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query;
      const limitNumber = limit ? parseInt(limit as string) : 5;

      const events = await calendarService.getUpcomingEvents(limitNumber);

      sendSuccessResponse(res, events, 'Upcoming events retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await calendarService.getCalendarStats();

      sendSuccessResponse(res, stats, 'Calendar statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get events for current month (calendar view helper)
   */
  async getCurrentMonthEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const events = await calendarService.getEventsForDateRange(startOfMonth, endOfMonth);

      sendSuccessResponse(res, events, 'Current month events retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get events for current week (calendar view helper)
   */
  async getCurrentWeekEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const events = await calendarService.getEventsForDateRange(startOfWeek, endOfWeek);

      sendSuccessResponse(res, events, 'Current week events retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get today's events
   */
  async getTodayEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const events = await calendarService.getEventsForDateRange(startOfDay, endOfDay);

      sendSuccessResponse(res, events, "Today's events retrieved successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

export const calendarController = new CalendarController();

import { Router } from 'express';
import { calendarController } from '@/controllers/calendar.controller';
import { validate, validateQuery, validateParams, commonSchemas } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireRole, requirePermission } from '@/middleware/rbac.middleware';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Calendar validation schemas
const calendarSchemas = {
  create: Joi.object({
    title: Joi.string().max(255).required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
  }),

  update: Joi.object({
    title: Joi.string().max(255).optional(),
    startTime: Joi.date().iso().optional(),
    endTime: Joi.date().iso().optional(),
  }),

  query: Joi.object({
    q: Joi.string().allow('').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }),
};

/**
 * @route   GET /api/calendar/events
 * @desc    Get all calendar events with pagination and filters
 * @access  Private (All roles)
 */
router.get(
  '/events',
  requirePermission('calendar:read'),
  validateQuery(calendarSchemas.query),
  calendarController.getCalendarEvents
);

/**
 * @route   GET /api/calendar/events/stats
 * @desc    Get calendar statistics
 * @access  Private (All roles)
 */
router.get('/events/stats', requirePermission('calendar:read'), calendarController.getCalendarStats);

/**
 * @route   GET /api/calendar/events/upcoming
 * @desc    Get upcoming events
 * @access  Private (All roles)
 */
router.get(
  '/events/upcoming',
  requirePermission('calendar:read'),
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(50).default(5),
  })),
  calendarController.getUpcomingEvents
);

/**
 * @route   GET /api/calendar/events/today
 * @desc    Get today's events
 * @access  Private (All roles)
 */
router.get('/events/today', requirePermission('calendar:read'), calendarController.getTodayEvents);

/**
 * @route   GET /api/calendar/events/week
 * @desc    Get current week events
 * @access  Private (All roles)
 */
router.get('/events/week', requirePermission('calendar:read'), calendarController.getCurrentWeekEvents);

/**
 * @route   GET /api/calendar/events/month
 * @desc    Get current month events
 * @access  Private (All roles)
 */
router.get('/events/month', requirePermission('calendar:read'), calendarController.getCurrentMonthEvents);

/**
 * @route   GET /api/calendar/events/range
 * @desc    Get events for a specific date range
 * @access  Private (All roles)
 */
router.get(
  '/events/range',
  requirePermission('calendar:read'),
  validateQuery(calendarSchemas.dateRange),
  calendarController.getEventsForDateRange
);

/**
 * @route   GET /api/calendar/events/:id
 * @desc    Get calendar event by ID
 * @access  Private (All roles)
 */
router.get(
  '/events/:id',
  requirePermission('calendar:read'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  calendarController.getCalendarEventById
);

/**
 * @route   POST /api/calendar/events
 * @desc    Create new calendar event
 * @access  Private (Admin/Manager)
 */
router.post(
  '/events',
  requireRole(['ADMIN', 'MANAGER']),
  validate(calendarSchemas.create),
  calendarController.createCalendarEvent
);

/**
 * @route   PUT /api/calendar/events/:id
 * @desc    Update calendar event
 * @access  Private (Admin/Manager)
 */
router.put(
  '/events/:id',
  requireRole(['ADMIN', 'MANAGER']),
  validateParams(Joi.object({ id: commonSchemas.id })),
  validate(calendarSchemas.update),
  calendarController.updateCalendarEvent
);

/**
 * @route   DELETE /api/calendar/events/:id
 * @desc    Delete calendar event
 * @access  Private (Admin/Manager)
 */
router.delete(
  '/events/:id',
  requireRole(['ADMIN', 'MANAGER']),
  validateParams(Joi.object({ id: commonSchemas.id })),
  calendarController.deleteCalendarEvent
);

export default router;

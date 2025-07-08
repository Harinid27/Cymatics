import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendErrorResponse } from '@/utils/helpers';

/**
 * Validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      sendErrorResponse(
        res,
        {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
        400,
      );
      return;
    }

    req.body = value;
    next();
  };
};

/**
 * Query validation middleware factory
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      sendErrorResponse(
        res,
        {
          code: 'QUERY_VALIDATION_ERROR',
          message: 'Query validation failed',
          details,
        },
        400,
      );
      return;
    }

    req.query = value;
    next();
  };
};

/**
 * Params validation middleware factory
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      sendErrorResponse(
        res,
        {
          code: 'PARAMS_VALIDATION_ERROR',
          message: 'Parameters validation failed',
          details,
        },
        400,
      );
      return;
    }

    req.params = value;
    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  id: Joi.number().integer().positive().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
  date: Joi.date().iso().required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
  search: Joi.object({
    q: Joi.string().allow('').optional(),
  }),
};

// Auth validation schemas
export const authSchemas = {
  sendOTP: Joi.object({
    email: commonSchemas.email,
  }),

  verifyOTP: Joi.object({
    email: commonSchemas.email,
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),
};

// Client validation schemas
export const clientSchemas = {
  create: Joi.object({
    name: Joi.string().max(100).required(),
    company: Joi.string().max(100).required(),
    number: Joi.string().max(20).required(),
    email: Joi.string().email().max(100).optional().allow(''),
  }),

  update: Joi.object({
    name: Joi.string().max(100).optional(),
    company: Joi.string().max(100).optional(),
    number: Joi.string().max(20).optional(),
    email: Joi.string().email().max(100).optional().allow(''),
  }),

  query: Joi.object({
    q: Joi.string().allow('').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

// Project validation schemas
export const projectSchemas = {
  create: Joi.object({
    name: Joi.string().max(100).required(),
    company: Joi.string().max(100).optional().allow(''),
    type: Joi.string().max(50).optional().allow(''),
    status: Joi.string().max(50).optional().allow(''),
    shootStartDate: Joi.alternatives().try(
      Joi.date().iso(),
      Joi.string().allow('')
    ).optional(),
    shootEndDate: Joi.alternatives().try(
      Joi.date().iso(),
      Joi.string().allow('')
    ).optional(),
    amount: Joi.number().min(0).default(0),
    location: Joi.string().max(200).optional().allow(''),
    address: Joi.string().max(500).optional().allow(''),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    outsourcing: Joi.boolean().default(false),
    reference: Joi.string().optional().allow(''),
    outsourcingAmt: Joi.number().min(0).default(0),
    outFor: Joi.string().max(100).optional().allow(''),
    outClient: Joi.string().max(100).optional().allow(''),
    outsourcingPaid: Joi.boolean().default(false),
    projectLead: Joi.string().max(100).optional().allow(''),
    clientId: Joi.number().integer().positive().required(),
  }),

  update: Joi.object({
    name: Joi.string().max(100).optional().allow(''),
    company: Joi.string().max(100).optional().allow(''),
    type: Joi.string().max(50).optional().allow(''),
    status: Joi.string().max(50).optional().allow(''),
    shootStartDate: Joi.alternatives().try(
      Joi.date().iso(),
      Joi.string().allow('')
    ).optional(),
    shootEndDate: Joi.alternatives().try(
      Joi.date().iso(),
      Joi.string().allow('')
    ).optional(),
    amount: Joi.number().min(0).optional(),
    location: Joi.string().max(200).optional().allow(''),
    address: Joi.string().max(500).optional().allow(''),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    outsourcing: Joi.boolean().optional(),
    reference: Joi.string().optional().allow(''),
    outsourcingAmt: Joi.number().min(0).optional(),
    outFor: Joi.string().max(100).optional().allow(''),
    outClient: Joi.string().max(100).optional().allow(''),
    outsourcingPaid: Joi.boolean().optional(),
    projectLead: Joi.string().max(100).optional().allow(''),
    clientId: Joi.number().integer().positive().optional(),
  }),

  query: Joi.object({
    q: Joi.string().allow('').optional(),
    type: Joi.string().optional(),
    status: Joi.string().optional(),
    company: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(10000).default(10),
  }),
};

// Income validation schemas
export const incomeSchemas = {
  create: Joi.object({
    date: commonSchemas.date,
    description: Joi.string().required(),
    amount: Joi.number().integer().positive().required(),
    note: Joi.string().optional().allow(''),
    projectIncome: Joi.boolean().default(false),
    projectId: Joi.number().integer().positive().optional(),
  }),

  update: Joi.object({
    date: Joi.date().iso().optional(),
    description: Joi.string().optional(),
    amount: Joi.number().integer().positive().optional(),
    note: Joi.string().optional().allow(''),
    projectIncome: Joi.boolean().optional(),
    projectId: Joi.number().integer().positive().optional(),
  }),
};

// Expense validation schemas
export const expenseSchemas = {
  create: Joi.object({
    date: commonSchemas.date,
    category: Joi.string().max(50).required(),
    description: Joi.string().required(),
    amount: Joi.number().integer().positive().required(),
    notes: Joi.string().optional().allow(''),
    projectExpense: Joi.boolean().default(false),
    projectId: Joi.number().integer().positive().optional(),
  }),

  update: Joi.object({
    date: Joi.date().iso().optional(),
    category: Joi.string().max(50).optional(),
    description: Joi.string().optional(),
    amount: Joi.number().integer().positive().optional(),
    notes: Joi.string().optional().allow(''),
    projectExpense: Joi.boolean().optional(),
    projectId: Joi.number().integer().positive().optional(),
  }),
};

// Asset validation schemas
export const assetSchemas = {
  create: Joi.object({
    date: commonSchemas.date,
    type: Joi.string().max(100).required(),
    name: Joi.string().max(200).required(),
    quantity: Joi.number().positive().required(),
    buyPrice: Joi.number().positive().required(),
    value: Joi.number().positive().optional(),
    note: Joi.string().optional().allow(''),
  }),

  update: Joi.object({
    date: Joi.date().iso().optional(),
    type: Joi.string().max(100).optional(),
    name: Joi.string().max(200).optional(),
    quantity: Joi.number().positive().optional(),
    buyPrice: Joi.number().positive().optional(),
    value: Joi.number().positive().optional(),
    note: Joi.string().optional().allow(''),
  }),

  query: Joi.object({
    q: Joi.string().allow('').optional(),
    type: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

// Entertainment validation schemas
export const entertainmentSchemas = {
  create: Joi.object({
    date: Joi.date().iso().optional(),
    type: Joi.string().max(100).required(),
    language: Joi.string().max(100).required(),
    rating: Joi.number().integer().min(1).max(10).required(),
    name: Joi.string().max(100).required(),
    source: Joi.string().max(100).optional().allow(''),
  }),

  update: Joi.object({
    date: Joi.date().iso().optional(),
    type: Joi.string().max(100).optional(),
    language: Joi.string().max(100).optional(),
    rating: Joi.number().integer().min(1).max(10).optional(),
    name: Joi.string().max(100).optional(),
    source: Joi.string().max(100).optional().allow(''),
  }),

  query: Joi.object({
    q: Joi.string().allow('').optional(),
    type: Joi.string().optional(),
    language: Joi.string().optional(),
    minRating: Joi.number().integer().min(1).max(10).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

// Calendar validation schemas
export const calendarSchemas = {
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

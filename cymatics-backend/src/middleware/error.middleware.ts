import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { sendErrorResponse } from '@/utils/helpers';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response | void => {
  // Log the error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle known application errors
  if (error instanceof AppError) {
    return sendErrorResponse(
      res,
      {
        code: error.code || 'APPLICATION_ERROR',
        message: error.message,
      },
      error.statusCode,
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, res);
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return sendErrorResponse(
      res,
      {
        code: 'DATABASE_ERROR',
        message: 'An unknown database error occurred',
      },
      500,
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return sendErrorResponse(
      res,
      {
        code: 'DATABASE_PANIC',
        message: 'Database engine panic',
      },
      500,
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return sendErrorResponse(
      res,
      {
        code: 'DATABASE_INIT_ERROR',
        message: 'Database initialization failed',
      },
      500,
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return sendErrorResponse(
      res,
      {
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'Database validation error',
      },
      400,
    );
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return sendErrorResponse(
      res,
      {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      },
      401,
    );
  }

  if (error.name === 'TokenExpiredError') {
    return sendErrorResponse(
      res,
      {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
      },
      401,
    );
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return sendErrorResponse(
      res,
      {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
      400,
    );
  }

  // Handle multer errors
  if (error.name === 'MulterError') {
    return handleMulterError(error as any, res);
  }

  // Handle syntax errors
  if (error instanceof SyntaxError && 'body' in error) {
    return sendErrorResponse(
      res,
      {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
      },
      400,
    );
  }

  // Default error response
  return sendErrorResponse(
    res,
    {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : error.message,
    },
    500,
  );
};

const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError, res: Response): Response => {
  switch (error.code) {
    case 'P2002':
      return sendErrorResponse(
        res,
        {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'A record with this value already exists',
          details: error.meta,
        },
        409,
      );

    case 'P2014':
      return sendErrorResponse(
        res,
        {
          code: 'INVALID_ID',
          message: 'The provided ID is invalid',
        },
        400,
      );

    case 'P2003':
      return sendErrorResponse(
        res,
        {
          code: 'FOREIGN_KEY_CONSTRAINT',
          message: 'Foreign key constraint failed',
        },
        400,
      );

    case 'P2025':
      return sendErrorResponse(
        res,
        {
          code: 'RECORD_NOT_FOUND',
          message: 'Record not found',
        },
        404,
      );

    default:
      return sendErrorResponse(
        res,
        {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        500,
      );
  }
};

const handleMulterError = (error: any, res: Response): Response => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return sendErrorResponse(
        res,
        {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds the maximum allowed limit',
        },
        400,
      );

    case 'LIMIT_FILE_COUNT':
      return sendErrorResponse(
        res,
        {
          code: 'TOO_MANY_FILES',
          message: 'Too many files uploaded',
        },
        400,
      );

    case 'LIMIT_UNEXPECTED_FILE':
      return sendErrorResponse(
        res,
        {
          code: 'UNEXPECTED_FILE',
          message: 'Unexpected file field',
        },
        400,
      );

    default:
      return sendErrorResponse(
        res,
        {
          code: 'FILE_UPLOAD_ERROR',
          message: 'File upload failed',
        },
        400,
      );
  }
};

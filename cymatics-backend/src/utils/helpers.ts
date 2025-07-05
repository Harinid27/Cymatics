import crypto from 'crypto';
import path from 'path';
import { Response } from 'express';

/**
 * Generate a random OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Extract name from email
 */
export const extractNameFromEmail = (email: string): string => {
  return email.split('@')[0].replace(/[^a-zA-Z]/g, '');
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  return `${timestamp}_${randomString}_${sanitizedName}${extension}`;
};

/**
 * Standardized API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * Send success response
 */
export const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  pagination?: ApiResponse['pagination'],
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendErrorResponse = (
  res: Response,
  error: {
    code: string;
    message: string;
    details?: any;
  },
  statusCode: number = 500,
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  page: number,
  limit: number,
  total: number,
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
  };
};

/**
 * Parse query parameters for pagination
 */
export const parsePaginationQuery = (query: any): { page: number; limit: number } => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));

  return { page, limit };
};

/**
 * Parse search query
 */
export const parseSearchQuery = (query: any): string => {
  return (query.q as string)?.trim() || '';
};

/**
 * Convert string to boolean
 */
export const parseBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'on';
  }
  return false;
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Generate project code
 */
export const generateProjectCode = (id: number): string => {
  return `CYM-${id}`;
};

/**
 * Sleep utility for testing
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove undefined values from object
 */
export const removeUndefined = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
};



/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
};

/**
 * Truncate text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Convert string to slug
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

/**
 * Get file URL for uploaded files
 */
export const getFileUrl = (filename: string): string => {
  return `/uploads/${filename}`;
};

/**
 * Delete file utility
 */
export const deleteFile = async (filename: string): Promise<void> => {
  const fs = await import('fs/promises');
  const filePath = path.join('./uploads', filename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, ignore error
  }
};

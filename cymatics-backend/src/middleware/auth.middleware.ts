import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';
import { config } from '@/config';
import { AuthenticationError } from '@/utils/errors';
import { sendErrorResponse } from '@/utils/helpers';

// Type definitions are imported from @/types/express.d.ts

export interface JwtPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      isActive: true, // Default to true for authenticated users
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      sendErrorResponse(
        res,
        {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token',
        },
        401,
      );
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      sendErrorResponse(
        res,
        {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        },
        401,
      );
      return;
    }

    if (error instanceof AuthenticationError) {
      sendErrorResponse(
        res,
        {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
        },
        401,
      );
      return;
    }

    next(error);
  }
};

/**
 * Optional authentication middleware - doesn't throw error if no token
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        isActive: true, // Default to true for authenticated users
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};

/**
 * Check if user is authenticated (for session-based auth)
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.session || !req.session.userId) {
    sendErrorResponse(
      res,
      {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      },
      401,
    );
    return;
  }

  next();
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  const secret = config.jwt.secret;
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.expiresIn as StringValue,
  };

  return jwt.sign(payload, secret, options);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

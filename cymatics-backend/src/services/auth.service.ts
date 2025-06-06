import { prisma } from '@/config/database';
import { config } from '@/config';
import { emailService } from './email.service';
import { generateOTP, extractNameFromEmail } from '@/utils/helpers';
import { generateToken } from '@/middleware/auth.middleware';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError
} from '@/utils/errors';
import { logger } from '@/utils/logger';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

class AuthService {
  /**
   * Send OTP to email
   */
  async sendOTP(email: string): Promise<{ message: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
      }

      // Extract username from email
      const username = extractNameFromEmail(email);

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            username,
            email,
            isActive: true,
          },
        });

        logger.info(`New user created: ${email}`);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + config.otp.expiresInMinutes * 60 * 1000);

      // Delete any existing OTPs for this user
      await prisma.emailOTP.deleteMany({
        where: { userId: user.id },
      });

      // Create new OTP record
      await prisma.emailOTP.create({
        data: {
          userId: user.id,
          otp,
          expiresAt,
          isUsed: false,
        },
      });

      // Send OTP email
      await emailService.sendOTP(email, otp, user.username);

      logger.info(`OTP sent to ${email}`);

      return {
        message: 'OTP sent successfully to your email',
      };
    } catch (error) {
      logger.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP and login user
   */
  async verifyOTP(email: string, otp: string): Promise<LoginResponse> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Find valid OTP
      const otpRecord = await prisma.emailOTP.findFirst({
        where: {
          userId: user.id,
          otp,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpRecord) {
        throw new AuthenticationError('Invalid or expired OTP');
      }

      // Mark OTP as used
      await prisma.emailOTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
      });

      logger.info(`User logged in successfully: ${email}`);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      };
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: number): Promise<AuthUser> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: number,
    updateData: { username?: string; email?: string },
  ): Promise<AuthUser> {
    try {
      // Check if email is already taken by another user
      if (updateData.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: updateData.email,
            id: { not: userId },
          },
        });

        if (existingUser) {
          throw new ConflictError('Email is already taken');
        }
      }

      // Check if username is already taken by another user
      if (updateData.username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username: updateData.username,
            id: { not: userId },
          },
        });

        if (existingUser) {
          throw new ConflictError('Username is already taken');
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      logger.info(`User profile updated: ${updatedUser.email}`);

      return {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: number): Promise<{ message: string }> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      // Delete all active OTPs
      await prisma.emailOTP.deleteMany({
        where: { userId },
      });

      logger.info(`User account deactivated: ${userId}`);

      return {
        message: 'Account deactivated successfully',
      };
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired OTPs (utility function)
   */
  async cleanupExpiredOTPs(): Promise<number> {
    try {
      const result = await prisma.emailOTP.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired OTPs`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up expired OTPs:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(_userId: number): Promise<{
    totalProjects: number;
    totalClients: number;
    totalIncome: number;
    totalExpenses: number;
  }> {
    try {
      // Note: This is a basic implementation
      // In a real application, you might want to add user-specific filtering
      // For now, we return global stats regardless of userId
      const [totalProjects, totalClients, incomeSum, expenseSum] = await Promise.all([
        prisma.project.count(),
        prisma.client.count(),
        prisma.income.aggregate({
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
        }),
      ]);

      return {
        totalProjects,
        totalClients,
        totalIncome: incomeSum._sum.amount || 0,
        totalExpenses: expenseSum._sum.amount || 0,
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();

import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/auth.service';
import { sendSuccessResponse } from '@/utils/helpers';
import { logger } from '@/utils/logger';

class AuthController {
  /**
   * Send OTP to email
   */
  async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const result = await authService.sendOTP(email);

      sendSuccessResponse(res, result, 'OTP sent successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP and login
   */
  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;

      const result = await authService.verifyOTP(email, otp);

      // Set session if using session-based auth
      if (req.session) {
        req.session.userId = result.user.id;
        req.session.userEmail = result.user.email;
      }

      sendSuccessResponse(res, result, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const profile = await authService.getUserProfile(req.user.id);

      sendSuccessResponse(res, profile, 'Profile retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { username, email } = req.body;
      const updateData: { username?: string; email?: string } = {};

      if (username) updateData.username = username;
      if (email) updateData.email = email;

      const updatedProfile = await authService.updateUserProfile(req.user.id, updateData);

      sendSuccessResponse(res, updatedProfile, 'Profile updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Destroy session if using session-based auth
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destruction error:', err);
          }
        });
      }

      sendSuccessResponse(res, null, 'Logout successful', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await authService.deactivateUser(req.user.id);

      // Destroy session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destruction error:', err);
          }
        });
      }

      sendSuccessResponse(res, result, 'Account deactivated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user dashboard statistics
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const stats = await authService.getUserStats(req.user.id);

      sendSuccessResponse(res, stats, 'Dashboard statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check authentication status
   */
  async checkAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAuthenticated = !!req.user;

      sendSuccessResponse(
        res,
        {
          isAuthenticated,
          user: req.user || null,
        },
        'Authentication status checked',
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token (if using JWT)
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      // Get fresh user data and generate new token
      const result = await authService.verifyOTP(req.user.email, ''); // This is a simplified approach

      sendSuccessResponse(res, result, 'Token refreshed successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

import { Request, Response } from 'express';
import { usersService } from '@/services/users.service';
import { logger } from '@/utils/logger';

class UsersController {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        q: search,
        role,
        isActive,
      } = req.query;

      const result = await usersService.getAllUsers(
        Number(page),
        Number(limit),
        search as string,
        role as string,
        isActive !== undefined ? isActive === 'true' : undefined
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in getUsers controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(_req: Request, res: Response) {
    try {
      const stats = await usersService.getUserStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getUserStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(Number(id));

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Error in getUserById controller:', error);
      
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const updatedUser = await usersService.updateUserRole(Number(id), role);

      res.json({
        success: true,
        data: updatedUser,
        message: 'User role updated successfully',
      });
    } catch (error: any) {
      logger.error('Error in updateUserRole controller:', error);
      
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      if (error.message === 'Invalid role') {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update user permissions
   */
  async updateUserPermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      const updatedUser = await usersService.updateUserPermissions(Number(id), permissions);

      res.json({
        success: true,
        data: updatedUser,
        message: 'User permissions updated successfully',
      });
    } catch (error: any) {
      logger.error('Error in updateUserPermissions controller:', error);
      
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedUser = await usersService.deactivateUser(Number(id));

      res.json({
        success: true,
        data: updatedUser,
        message: 'User deactivated successfully',
      });
    } catch (error: any) {
      logger.error('Error in deactivateUser controller:', error);
      
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Activate user
   */
  async activateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedUser = await usersService.activateUser(Number(id));

      res.json({
        success: true,
        data: updatedUser,
        message: 'User activated successfully',
      });
    } catch (error: any) {
      logger.error('Error in activateUser controller:', error);
      
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const usersController = new UsersController(); 
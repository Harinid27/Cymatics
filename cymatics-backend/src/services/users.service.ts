import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { NotFoundError, ValidationError } from '@/utils/errors';

export interface UserListResponse {
  users: Array<{
    id: number;
    username: string;
    email: string;
    role: string;
    permissions: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  managerUsers: number;
  regularUsers: number;
}

class UsersService {
  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
    isActive?: boolean
  ): Promise<UserListResponse> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // Get users and total count
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            permissions: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: number, newRole: string) {
    try {
      // Validate role
      const validRoles = ['ADMIN', 'MANAGER', 'USER'];
      if (!validRoles.includes(newRole)) {
        throw new ValidationError('Invalid role');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole as any },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`User role updated: ${updatedUser.email} -> ${newRole}`);

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Update user permissions
   */
  async updateUserPermissions(userId: number, permissions: string[]) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { permissions },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`User permissions updated: ${updatedUser.email}`);

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user permissions:', error);
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: number) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Delete all active OTPs for this user
      await prisma.emailOTP.deleteMany({
        where: { userId },
      });

      logger.info(`User deactivated: ${updatedUser.email}`);

      return updatedUser;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Activate user
   */
  async activateUser(userId: number) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`User activated: ${updatedUser.email}`);

      return updatedUser;
    } catch (error) {
      logger.error('Error activating user:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminUsers,
        managerUsers,
        regularUsers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: false } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'MANAGER' } }),
        prisma.user.count({ where: { role: 'USER' } }),
      ]);

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminUsers,
        managerUsers,
        regularUsers,
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }
}

export const usersService = new UsersService(); 
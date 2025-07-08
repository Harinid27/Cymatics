import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Permission constants for each role
const ROLE_PERMISSIONS = {
  ADMIN: ['*'], // All permissions
  MANAGER: ['projects:read', 'projects:write', 'clients:read', 'clients:write', 'calendar:read', 'calendar:write'],
  USER: ['projects:read', 'calendar:read']
};

// Permission check function
export const hasPermission = (userRole: string, requiredPermission: string): boolean => {
  const userPermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];
  
  // Admin has all permissions
  if (userPermissions.includes('*')) {
    return true;
  }
  
  return userPermissions.includes(requiredPermission);
};

// Middleware to require specific role(s)
export const requireRole = (roles: string[]): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.isActive) {
        res.status(401).json({ 
          success: false, 
          message: 'User not found or inactive' 
        });
        return;
      }

      if (!roles.includes(user.role)) {
        console.log(`Access denied: User ${user.email} (${user.role}) attempted to access ${req.method} ${req.path}`);
        res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
        return;
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
      return;
    }
  };
};

// Middleware to require specific permission
export const requirePermission = (permission: string): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.isActive) {
        res.status(401).json({ 
          success: false, 
          message: 'User not found or inactive' 
        });
        return;
      }

      if (!hasPermission(user.role, permission)) {
        console.log(`Permission denied: User ${user.email} (${user.role}) attempted to access ${req.method} ${req.path} (required: ${permission})`);
        res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
        return;
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
      return;
    }
  };
};

// Helper function to get user role
export const getUserRole = async (userId: number): Promise<string | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    return user?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Helper function to check if user is admin
export const isAdmin = async (userId: number): Promise<boolean> => {
  const role = await getUserRole(userId);
  return role === 'ADMIN';
};

// Helper function to check if user is manager or admin
export const isManagerOrAdmin = async (userId: number): Promise<boolean> => {
  const role = await getUserRole(userId);
  return role === 'ADMIN' || role === 'MANAGER';
}; 
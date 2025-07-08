import { useUser } from '@/contexts/UserContext';

/**
 * Hook for checking user permissions and roles
 */
export const usePermissions = () => {
  const { hasPermission, hasRole, isAdmin, isManager } = useUser();

  return {
    hasPermission,
    hasRole,
    isAdmin,
    isManager,
  };
};

/**
 * Hook for checking specific permissions
 */
export const usePermission = (permission: string) => {
  const { hasPermission } = useUser();
  return hasPermission(permission);
};

/**
 * Hook for checking specific roles
 */
export const useRole = (roles: string[]) => {
  const { hasRole } = useUser();
  return hasRole(roles);
};

/**
 * Hook for checking if user is admin
 */
export const useIsAdmin = () => {
  const { isAdmin } = useUser();
  return isAdmin();
};

/**
 * Hook for checking if user is manager or admin
 */
export const useIsManager = () => {
  const { isManager } = useUser();
  return isManager();
};

/**
 * Standalone permission checking function
 */
export const hasPermission = (userData: any, permission: string): boolean => {
  if (!userData || !userData.permissions) return false;
  
  // Admin has all permissions
  if (userData.permissions.includes('*')) return true;
  
  return userData.permissions.includes(permission);
};

/**
 * Standalone role checking function
 */
export const hasRole = (userData: any, roles: string[]): boolean => {
  if (!userData || !userData.role) return false;
  return roles.includes(userData.role);
};

/**
 * Standalone admin checking function
 */
export const isAdmin = (userData: any): boolean => {
  return hasRole(userData, ['admin']);
};

/**
 * Standalone manager checking function
 */
export const isManager = (userData: any): boolean => {
  return hasRole(userData, ['admin', 'manager']);
}; 
import { useAuth } from './useAuth';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  getUserPermissions,
  canAccessRoute,
  type Permission 
} from '@/lib/permissions';

/**
 * Hook for checking user permissions
 */
export function usePermissions() {
  const { user } = useAuth();
  
  const userRole = user?.role || '';
  const userPermissions = getUserPermissions(userRole);
  
  return {
    // Basic permission checks
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    
    // Route access checks
    canAccessRoute: (requiredPermissions: Permission[]) => canAccessRoute(userRole, requiredPermissions),
    
    // User info
    userRole,
    userPermissions,
    
    // Role checks
    isSuperAdmin: userRole.toLowerCase() === 'superadmin',
    isAdmin: userRole.toLowerCase() === 'admin',
    isDoctor: userRole.toLowerCase() === 'doctor',
    isReceptionist: userRole.toLowerCase() === 'receptionist',
    isFinancial: userRole.toLowerCase() === 'financial',
    isPatient: userRole.toLowerCase() === 'patient',
  };
}

import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { type Permission } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions: Permission[];
  fallbackPath?: string;
}

/**
 * Component to protect routes based on user permissions
 */
export function ProtectedRoute({ 
  children, 
  requiredPermissions, 
  fallbackPath = '/app/dashboard' 
}: ProtectedRouteProps) {
  const { canAccessRoute, userRole } = usePermissions();
  
  // If no permissions required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return <>{children}</>;
  }
  
  // Check if user has required permissions
  if (!canAccessRoute(requiredPermissions)) {
    // Redirect to fallback path if user doesn't have permissions
    return <Navigate to={fallbackPath} replace />;
  }
  
  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 */
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[],
  fallbackPath?: string
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute 
        requiredPermissions={requiredPermissions} 
        fallbackPath={fallbackPath}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

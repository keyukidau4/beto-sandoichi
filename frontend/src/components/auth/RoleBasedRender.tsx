import React from 'react';
import { useAppSelector } from '../../hooks';
import type { User } from '../../types';

interface RoleBasedRenderProps {
  children: React.ReactNode;
  allowedRoles?: User['role'] | User['role'][];
  allowedStatuses?: User['status'] | User['status'][];
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user role and status
 */
export const RoleBasedRender: React.FC<RoleBasedRenderProps> = ({
  children,
  allowedRoles,
  allowedStatuses,
  requireAuth = true,
  fallback = null,
}) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // If authentication is required but user is not authenticated
  if (requireAuth && (!isAuthenticated || !user)) {
    return <>{fallback}</>;
  }

  // If user is authenticated, check role and status requirements
  if (user) {
    // Check role requirements
    if (allowedRoles) {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      if (!roles.includes(user.role)) {
        return <>{fallback}</>;
      }
    }

    // Check status requirements
    if (allowedStatuses) {
      const statuses = Array.isArray(allowedStatuses) ? allowedStatuses : [allowedStatuses];
      if (!statuses.includes(user.status)) {
        return <>{fallback}</>;
      }
    }
  }

  return <>{children}</>;
};

/**
 * Hook to check if user has specific role(s)
 */
export const useHasRole = (roles: User['role'] | User['role'][]): boolean => {
  const { user } = useAppSelector((state) => state.auth);
  
  if (!user) return false;
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
};

/**
 * Hook to check if user has specific status(es)
 */
export const useHasStatus = (statuses: User['status'] | User['status'][]): boolean => {
  const { user } = useAppSelector((state) => state.auth);
  
  if (!user) return false;
  
  const allowedStatuses = Array.isArray(statuses) ? statuses : [statuses];
  return allowedStatuses.includes(user.status);
};

/**
 * Hook to check if user is authenticated and approved
 */
export const useIsApproved = (): boolean => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  return isAuthenticated && user?.status === 'approved';
};

/**
 * Hook to check if user can use point payment
 * Only approved buyers can use point payment
 */
export const useCanUsePoints = (): boolean => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  return isAuthenticated && user?.role === 'buyer' && user?.status === 'approved';
};

/**
 * Component specifically for admin-only content
 */
export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => (
  <RoleBasedRender allowedRoles="admin" fallback={fallback}>
    {children}
  </RoleBasedRender>
);

/**
 * Component specifically for staff-only content
 */
export const StaffOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => (
  <RoleBasedRender allowedRoles="staff" fallback={fallback}>
    {children}
  </RoleBasedRender>
);

/**
 * Component specifically for buyer-only content
 */
export const BuyerOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => (
  <RoleBasedRender allowedRoles="buyer" fallback={fallback}>
    {children}
  </RoleBasedRender>
);

/**
 * Component for approved users only
 */
export const ApprovedOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => (
  <RoleBasedRender allowedStatuses="approved" fallback={fallback}>
    {children}
  </RoleBasedRender>
);

/**
 * Component for admin and staff roles
 */
export const AdminOrStaff: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => (
  <RoleBasedRender allowedRoles={['admin', 'staff']} fallback={fallback}>
    {children}
  </RoleBasedRender>
);
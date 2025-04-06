
import React, { ReactNode } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

interface RoleGuardProps {
  role: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({ role, fallback = null, children }: RoleGuardProps) {
  const { hasRole, loading } = useAuthContext();
  
  // Handle loading state
  if (loading) return null;
  
  // Check if user has any of the required roles
  const requiredRoles = Array.isArray(role) ? role : [role];
  const hasRequiredRole = requiredRoles.some(r => hasRole(r));
  
  if (!hasRequiredRole) return <>{fallback}</>;
  
  return <>{children}</>;
}

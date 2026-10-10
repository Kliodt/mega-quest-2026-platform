import { type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAdminAuth } from './AdminAuthContext.js';

export function RequireAdmin(): ReactNode {
  const { adminToken } = useAdminAuth();
  if (adminToken === null) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

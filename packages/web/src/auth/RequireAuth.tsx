import { type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from './AuthContext.js';

export function RequireAuth(): ReactNode {
  const { token } = useAuth();
  if (token === null) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

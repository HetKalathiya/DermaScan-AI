import React from 'react';
import { Navigate } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * AdminProtectedRoute guards admin-only routes by validating:
 * 1. An active session token exists in localStorage
 * 2. The logged-in user's role is 'admin'
 */
const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  const stored = localStorage.getItem('user');

  if (!token || !stored) {
    return <Navigate to="/admin/login" replace />;
  }

  let isAdmin = false;
  try {
    const user = JSON.parse(stored);
    isAdmin = Boolean(user && user.role === 'admin');
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;

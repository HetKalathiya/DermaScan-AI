import React from 'react';
import { Navigate } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  const stored = localStorage.getItem('user');

  if (!token || !stored) {
    return <Navigate to="/admin/login" replace />;
  }

  let isAdmin = false;
  try {
    const user = JSON.parse(stored);
    isAdmin = user && user.role === 'admin';
  } catch {
    isAdmin = false;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;

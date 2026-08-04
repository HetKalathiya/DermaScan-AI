import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    role: 'patient' | 'doctor' | 'admin';
}

/**
 * ProtectedRoute guards a route by checking that:
 * 1. A valid user session exists in localStorage
 * 2. The logged-in user's role matches the required role
 *
 * If not authenticated → redirects to the appropriate login page.
 * If wrong role        → redirects to the appropriate login page.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
    const redirectPath = role === 'doctor' ? '/login/doctor' : '/login/patient';

    // Check for session
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        return <Navigate to={redirectPath} replace />;
    }

    let user: { role?: string } = {};
    try {
        user = JSON.parse(userStr);
    } catch {
        // Corrupted data — clear and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to={redirectPath} replace />;
    }

    // Admin can access everything
    if (user.role === 'admin') {
        return <>{children}</>;
    }

    if (user.role !== role) {
        return <Navigate to={redirectPath} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

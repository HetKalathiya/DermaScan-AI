import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    role: 'patient' | 'doctor' | 'admin' | ('patient' | 'doctor' | 'admin')[];
}

/**
 * ProtectedRoute guards a route by checking that:
 * 1. A valid user session exists in localStorage
 * 2. The logged-in user's role matches the required role (or one of the allowed roles)
 *
 * If not authenticated → redirects to the appropriate login page.
 * If wrong role        → redirects to the appropriate login page.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
    const allowedRoles = Array.isArray(role) ? role : [role];
    const redirectPath = allowedRoles.includes('doctor') && !allowedRoles.includes('patient') ? '/login/doctor' : '/login/patient';

    // Check for session
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        return <Navigate to={redirectPath} replace />;
    }

    let user: {
        role?: string;
        email?: string;
        is_verified?: boolean;
        doctor?: { verified?: boolean; license_number?: string; hospital_name?: string; specialization?: string };
    } = {};

    try {
        user = JSON.parse(userStr);
    } catch {
        // Corrupted data — clear and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to={redirectPath} replace />;
    }

    // Enforce role matching: if user's role does not match any of the allowed roles, redirect
    const userRole = (user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());
    if (!userRole || !normalizedAllowed.includes(userRole)) {
        // Clear mismatched session so the user can log in with the expected role
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to={redirectPath} replace />;
    }

    // Email verification check
    if (user.is_verified === false) {
        const targetPath = (user.role === 'doctor') ? '/doctor/verify-otp' : '/verify-otp';
        return <Navigate to={targetPath} state={{ email: user.email, role: user.role }} replace />;
    }

    // Doctor credential approval check
    if (user.role === 'doctor' && user.doctor && user.doctor.verified === false) {
        return <Navigate to="/doctor/pending-approval" state={{ email: user.email, doctor: user.doctor }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

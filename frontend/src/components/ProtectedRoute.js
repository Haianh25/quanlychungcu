import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const location = useLocation();
    const userToken = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    const isAdminRoute = location.pathname.startsWith('/admin') || (allowedRoles && allowedRoles.includes('admin'));
    const token = isAdminRoute ? adminToken : userToken;

    if (!token) {
        const redirectTo = isAdminRoute ? '/admin/login' : '/login';
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
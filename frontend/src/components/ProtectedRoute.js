// frontend/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const location = useLocation();
    // Use separate storage keys so admin and user sessions don't conflict
    const userToken = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    // Decide token to check depending on route
    const isAdminRoute = location.pathname.startsWith('/admin') || (allowedRoles && allowedRoles.includes('admin'));
    const token = isAdminRoute ? adminToken : userToken;

    // Basic check for token existence
    if (!token) {
        const redirectTo = isAdminRoute ? '/admin/login' : '/login';
        return <Navigate to={redirectTo} replace />;
    }

    // --- Optional: Role Checking (Uncomment and adjust later if needed) ---
    /*
    try {
        // Decode the token to get user info (you might need a library like jwt-decode)
        // Example using a hypothetical decode function:
        // const decodedToken = decodeToken(token); // Replace with actual decoding
        // userRole = decodedToken?.role; // Get role from token payload

        // Check if the token is expired (implement isTokenExpired function)
        // if (isTokenExpired(token)) {
        //     localStorage.removeItem('token'); // Clear expired token
        //     return <Navigate to="/login" replace />;
        // }

        // Check if the user's role is allowed for this route
        // if (allowedRoles && !allowedRoles.includes(userRole)) {
        //     // Role not allowed, maybe redirect to an unauthorized page or home
        //     // return <Navigate to="/unauthorized" replace />; // Or '/'
        // }

    } catch (error) {
        console.error("Error decoding token:", error);
        // Clear only the relevant token (admin vs user)
        if (isAdminRoute) localStorage.removeItem('adminToken');
        else localStorage.removeItem('token');
        return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} replace />;
    }
    */
   // --- End Optional Role Checking ---


    // If token exists (and optionally role is allowed), render the child route component
    return <Outlet />;
};

// Placeholder functions - implement these later if using role/expiry checks
// const decodeToken = (token) => { /* ... implementation ... */ return { role: 'resident' }; };
// const isTokenExpired = (token) => { /* ... implementation ... */ return false; };


export default ProtectedRoute;
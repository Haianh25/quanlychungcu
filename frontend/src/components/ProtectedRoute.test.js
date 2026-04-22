import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
    beforeEach(() => {
        Storage.prototype.getItem = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('redirects to /login if no user token for standard route', () => {
        Storage.prototype.getItem.mockImplementation((key) => {
            if (key === 'token') return null;
            return null;
        });

        render(
            <MemoryRouter initialEntries={['/profile']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<div>Profile Page</div>} />
                    </Route>
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Profile Page')).not.toBeInTheDocument();
    });

    test('renders standard route if user token is present', () => {
        Storage.prototype.getItem.mockImplementation((key) => {
            if (key === 'token') return 'valid-user-token';
            return null;
        });

        render(
            <MemoryRouter initialEntries={['/profile']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<div>Profile Page</div>} />
                    </Route>
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Profile Page')).toBeInTheDocument();
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    test('redirects to /admin/login if no admin token for admin route', () => {
        Storage.prototype.getItem.mockImplementation((key) => {
            if (key === 'adminToken') return null;
            return null;
        });

        render(
            <MemoryRouter initialEntries={['/admin/dashboard']}>
                <Routes>
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
                    </Route>
                    <Route path="/admin/login" element={<div>Admin Login</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Admin Login')).toBeInTheDocument();
        expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
    });

    test('renders admin route if admin token is present', () => {
        Storage.prototype.getItem.mockImplementation((key) => {
            if (key === 'adminToken') return 'valid-admin-token';
            return null;
        });

        render(
            <MemoryRouter initialEntries={['/admin/dashboard']}>
                <Routes>
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
                    </Route>
                    <Route path="/admin/login" element={<div>Admin Login</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Admin Login')).not.toBeInTheDocument();
    });
});

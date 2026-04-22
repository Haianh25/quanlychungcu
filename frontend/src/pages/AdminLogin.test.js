import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AdminLogin from './AdminLogin';

jest.mock('axios');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('AdminLogin Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Storage.prototype.setItem = jest.fn();
    });

    test('renders admin login form correctly', () => {
        render(
            <BrowserRouter>
                <AdminLogin />
            </BrowserRouter>
        );

        expect(screen.getByText('Admin Login')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('updates state on input change', () => {
        render(
            <BrowserRouter>
                <AdminLogin />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText('Email Address');
        const passwordInput = screen.getByPlaceholderText('Password');

        fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'admin123' } });

        expect(emailInput.value).toBe('admin@example.com');
        expect(passwordInput.value).toBe('admin123');
    });

    test('handles successful admin login', async () => {
        axios.post.mockResolvedValueOnce({ data: { token: 'fake-admin-token' } });

        render(
            <BrowserRouter>
                <AdminLogin />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'admin@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'admin123' } });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/admin/login', {
                email: 'admin@example.com',
                password: 'admin123'
            });
            expect(Storage.prototype.setItem).toHaveBeenCalledWith('adminToken', 'fake-admin-token');
            expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
        });
    });

    test('handles login error', async () => {
        axios.post.mockRejectedValueOnce({ response: { data: { message: 'Not authorized' } } });

        render(
            <BrowserRouter>
                <AdminLogin />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(screen.getByText('Not authorized')).toBeInTheDocument();
            expect(Storage.prototype.setItem).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});

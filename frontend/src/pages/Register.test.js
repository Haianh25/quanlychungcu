import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Register from './Register';

jest.mock('axios');

describe('Register Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders registration form correctly', () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        expect(screen.getByText('Create Your Account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Phone Number')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('E-mail Address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    test('updates state on input change', () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        const nameInput = screen.getByPlaceholderText('Full Name');
        fireEvent.change(nameInput, { target: { value: 'John Doe' } });
        expect(nameInput.value).toBe('John Doe');
    });

    test('handles successful registration', async () => {
        axios.post.mockResolvedValueOnce({ data: { message: 'Registration successful!' } });

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByPlaceholderText('Phone Number'), { target: { value: '123456789' } });
        fireEvent.change(screen.getByPlaceholderText('E-mail Address'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/register', {
                fullName: 'John Doe',
                phone: '123456789',
                email: 'john@example.com',
                password: 'password123'
            });
            expect(screen.getByText('Registration successful!')).toBeInTheDocument();
        });
    });

    test('handles registration error', async () => {
        axios.post.mockRejectedValueOnce({ response: { data: { message: 'Email already exists' } } });

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(screen.getByText('Email already exists')).toBeInTheDocument();
        });
    });
});

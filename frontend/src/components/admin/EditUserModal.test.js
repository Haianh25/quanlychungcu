import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import EditUserModal from './EditUserModal';

jest.mock('axios');

describe('EditUserModal', () => {
    const mockUser = { id: 1, full_name: 'Jane Doe', role: 'user' };
    const mockHandleClose = jest.fn();
    const mockOnUserUpdate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        Storage.prototype.getItem = jest.fn(() => 'mock-token');
        window.alert = jest.fn();
    });

    test('renders form with user data', () => {
        render(
            <EditUserModal 
                show={true} 
                handleClose={mockHandleClose} 
                user={mockUser} 
                onUserUpdate={mockOnUserUpdate} 
            />
        );

        expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('User')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Leave blank to keep current password')).toBeInTheDocument();
    });

    test('updates form state when user changes input', () => {
        render(
            <EditUserModal 
                show={true} 
                handleClose={mockHandleClose} 
                user={mockUser} 
                onUserUpdate={mockOnUserUpdate} 
            />
        );

        const nameInput = screen.getByDisplayValue('Jane Doe');
        fireEvent.change(nameInput, { target: { name: 'fullName', value: 'Jane Smith' } });
        expect(nameInput.value).toBe('Jane Smith');

        const roleSelect = screen.getByDisplayValue('User');
        fireEvent.change(roleSelect, { target: { name: 'role', value: 'resident' } });
        expect(roleSelect.value).toBe('resident');
    });

    test('submits form successfully', async () => {
        axios.put.mockResolvedValueOnce({ data: { user: { id: 1, full_name: 'Jane Smith', role: 'resident' } } });

        render(
            <EditUserModal 
                show={true} 
                handleClose={mockHandleClose} 
                user={mockUser} 
                onUserUpdate={mockOnUserUpdate} 
            />
        );

        const nameInput = screen.getByDisplayValue('Jane Doe');
        fireEvent.change(nameInput, { target: { name: 'fullName', value: 'Jane Smith' } });

        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                'http://localhost:5000/api/admin/users/1',
                { fullName: 'Jane Smith', role: 'user' },
                expect.any(Object)
            );
            expect(mockOnUserUpdate).toHaveBeenCalledWith({ id: 1, full_name: 'Jane Smith', role: 'resident' });
            expect(mockHandleClose).toHaveBeenCalled();
        });
    });

    test('handles api error on submit', async () => {
        axios.put.mockRejectedValueOnce({ response: { data: { message: 'Update Failed!' } } });

        render(
            <EditUserModal 
                show={true} 
                handleClose={mockHandleClose} 
                user={mockUser} 
                onUserUpdate={mockOnUserUpdate} 
            />
        );

        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Update Failed!');
            expect(mockOnUserUpdate).not.toHaveBeenCalled();
            expect(mockHandleClose).not.toHaveBeenCalled();
        });
    });
});

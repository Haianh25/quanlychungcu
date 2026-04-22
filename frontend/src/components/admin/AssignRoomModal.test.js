import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import AssignRoomModal from './AssignRoomModal';

jest.mock('axios');

describe('AssignRoomModal Component', () => {
    const mockResident = { id: 1, full_name: 'John Doe' };
    const mockOnAssignSuccess = jest.fn();
    const mockHandleClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        Storage.prototype.getItem = jest.fn(() => 'mock-token');
        window.alert = jest.fn();
    });

    test('renders correctly when show is true', async () => {
        axios.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Block A' }, { id: 2, name: 'Block B' }] });

        render(
            <AssignRoomModal 
                show={true} 
                handleClose={mockHandleClose} 
                resident={mockResident} 
                onAssignSuccess={mockOnAssignSuccess} 
            />
        );

        expect(screen.getByText(/Assign Room to: John Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/Choose Block/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Block A')).toBeInTheDocument();
            expect(screen.getByText('Block B')).toBeInTheDocument();
        });
    });


});

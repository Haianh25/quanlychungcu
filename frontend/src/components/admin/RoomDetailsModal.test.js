import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import RoomDetailsModal from './RoomDetailsModal';

jest.mock('axios');

describe('RoomDetailsModal', () => {
    const mockRoomData = {
        id: 1,
        room_number: '101',
        floor: 1,
        room_type: 'A',
        area: 50,
        bedrooms: 2,
        resident_id: 1,
        resident_name: 'John Doe',
        unpaid_bills_count: 0,
        car_count: 1,
        motorbike_count: 0,
        bicycle_count: 2
    };

    const mockRoomDataVacant = {
        id: 2,
        room_number: '102',
        floor: 1,
        room_type: 'B',
        area: 40,
        bedrooms: 1
    };

    const mockHandleClose = jest.fn();
    const mockOnUnassignSuccess = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        Storage.prototype.getItem = jest.fn(() => 'mock-token');
        window.alert = jest.fn();
        window.confirm = jest.fn(() => true);
    });

    test('does not render if roomData is null', () => {
        const { container } = render(
            <RoomDetailsModal show={true} handleClose={mockHandleClose} roomData={null} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    test('renders correctly for occupied room', () => {
        render(
            <RoomDetailsModal 
                show={true} 
                handleClose={mockHandleClose} 
                roomData={mockRoomData} 
                blockName="Block A" 
            />
        );

        expect(screen.getByText('Block A - 101')).toBeInTheDocument();
        expect(screen.getByText('Occupied')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('50 m²')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /unassign/i })).toBeInTheDocument();
    });

    test('renders correctly for vacant room', () => {
        render(
            <RoomDetailsModal 
                show={true} 
                handleClose={mockHandleClose} 
                roomData={mockRoomDataVacant} 
                blockName="Block B" 
            />
        );

        expect(screen.getByText('Block B - 102')).toBeInTheDocument();
        expect(screen.getByText('Vacant')).toBeInTheDocument();
        expect(screen.getByText('No Resident')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /unassign/i })).not.toBeInTheDocument();
        expect(screen.queryByText('Registered Vehicles')).not.toBeInTheDocument();
    });

    test('calls unassign API successfully', async () => {
        axios.post.mockResolvedValueOnce({});

        render(
            <RoomDetailsModal 
                show={true} 
                handleClose={mockHandleClose} 
                roomData={mockRoomData} 
                blockName="Block A" 
                onUnassignSuccess={mockOnUnassignSuccess}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /unassign/i }));

        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                'http://localhost:5000/api/admin/unassign-room',
                { residentId: 1 },
                expect.any(Object)
            );
            expect(window.alert).toHaveBeenCalledWith('Resident unassigned successfully!');
            expect(mockHandleClose).toHaveBeenCalled();
            expect(mockOnUnassignSuccess).toHaveBeenCalled();
        });
    });

    test('shows unpaid bills warning in confirm dialog', async () => {
        const roomWithDebt = { ...mockRoomData, unpaid_bills_count: 3 };
        
        render(
            <RoomDetailsModal 
                show={true} 
                handleClose={mockHandleClose} 
                roomData={roomWithDebt} 
                blockName="Block A" 
            />
        );

        expect(screen.getByText(/3 Unpaid Bills/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /unassign/i }));

        expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('3 UNPAID BILLS'));
    });
});

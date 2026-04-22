import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import BillPage from './BillPage';

jest.mock('axios');
jest.mock('../components/PayPalbutton', () => () => <div data-testid="paypal-mock">PayPal Mock</div>);

describe('BillPage', () => {
    const mockBills = {
        bills: [
            {
                bill_id: 1,
                status: 'unpaid',
                issue_date: '2023-10-01',
                due_date: '2023-10-15',
                total_amount: '50000',
                line_items: [{ item_id: 1, item_name: 'Water', total_item_amount: '50000' }]
            },
            {
                bill_id: 2,
                status: 'paid',
                issue_date: '2023-09-01',
                due_date: '2023-09-15',
                total_amount: '40000',
                updated_at: '2023-09-10',
                line_items: []
            }
        ]
    };

    const mockTransactions = [
        {
            transaction_id: 'trans1',
            amount: '40000',
            payment_method: 'paypal',
            status: 'success',
            created_at: '2023-09-10'
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        Storage.prototype.getItem = jest.fn(() => 'mock-token');
    });

    test('renders bills and transactions', async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes('my-bills-detailed')) return Promise.resolve({ data: mockBills });
            if (url.includes('my-transactions')) return Promise.resolve({ data: mockTransactions });
            return Promise.reject(new Error('not found'));
        });

        render(<BillPage />);

        expect(screen.getByText('Billing & Payments')).toBeInTheDocument();

        // Check for unpaid bill
        await waitFor(() => {
            expect(screen.getByText(/Unpaid \(1\)/i)).toBeInTheDocument();
            expect(screen.getByText('October 2023')).toBeInTheDocument();
            expect(screen.getByText('Water')).toBeInTheDocument();
            expect(screen.getByTestId('paypal-mock')).toBeInTheDocument();
        });
    });

    test('shows error if not logged in', async () => {
        Storage.prototype.getItem.mockReturnValueOnce(null);

        render(<BillPage />);

        await waitFor(() => {
            expect(screen.getByText('Please Login.')).toBeInTheDocument();
        });
    });

    test('handles api error', async () => {
        axios.get.mockRejectedValueOnce({ response: { data: { message: 'Failed to load bills' } } });

        render(<BillPage />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load bills')).toBeInTheDocument();
        });
    });
});

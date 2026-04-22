import React from 'react';
import { render, screen } from '@testing-library/react';
import PayPalPayment from './PayPalbutton';

// Mock the paypal library components to prevent loading actual SDK in tests
jest.mock('@paypal/react-paypal-js', () => ({
    PayPalScriptProvider: ({ children }) => <div data-testid="paypal-script-provider">{children}</div>,
    PayPalButtons: () => <button data-testid="paypal-buttons">PayPal Button Mock</button>
}));

describe('PayPalPayment Component', () => {
    const mockBill = { bill_id: 1, total_amount: '50000' };
    const mockOnPaymentSuccess = jest.fn();
    const mockOnPaymentError = jest.fn();
    const mockSetProcessing = jest.fn();

    test('renders PayPal script provider and buttons when client id is set', () => {
        // Mock process.env
        const originalEnv = process.env;
        process.env = { ...originalEnv, REACT_APP_PAYPAL_CLIENT_ID: 'fake-id' };

        render(
            <PayPalPayment 
                bill={mockBill}
                onPaymentSuccess={mockOnPaymentSuccess}
                onPaymentError={mockOnPaymentError}
                setProcessing={mockSetProcessing}
                isProcessing={false}
            />
        );

        expect(screen.getByTestId('paypal-script-provider')).toBeInTheDocument();
        expect(screen.getByTestId('paypal-buttons')).toBeInTheDocument();
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();

        // Restore env
        process.env = originalEnv;
    });

    test('shows processing spinner when isProcessing is true', () => {
        render(
            <PayPalPayment 
                bill={mockBill}
                onPaymentSuccess={mockOnPaymentSuccess}
                onPaymentError={mockOnPaymentError}
                setProcessing={mockSetProcessing}
                isProcessing={true}
            />
        );

        expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
});

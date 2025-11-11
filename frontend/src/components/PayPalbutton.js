import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import axios from 'axios';
import { Spinner, Alert } from 'react-bootstrap';

// Lấy Client ID từ file .env của bạn
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID || "AcSdiwcAJY2EOxdA6Kp8bllkLAiLZBWhNk0VNOYTpiW05-ftt5k1ZaYrUFKeWnSfvryZgHpbzgYPBP51";

// Component con để hiển thị nút
const ButtonWrapper = ({ bill, onPaymentSuccess, onPaymentError, setProcessing }) => {
    const api = axios.create({
        baseURL: 'http://localhost:5000/api', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    // 1. Gọi API backend để TẠO đơn hàng
    const createOrder = async () => {
        setProcessing(true); // Bắt đầu hiển thị loading
        onPaymentError(''); // <<< SỬA LỖI TẠI ĐÂY (dòng 19)
        try {
            const res = await api.post('/payment/create-order', {
                bill_id: bill.bill_id,
            });
            return res.data.orderID; 
        } catch (error) {
            console.error('Error creating PayPal order', error);
            onPaymentError('Không thể tạo đơn hàng PayPal. Vui lòng thử lại.'); 
            setProcessing(false);
            throw error;
        }
    };

    // 2. Gọi API backend để XÁC NHẬN (capture) thanh toán
    const onApprove = async (data) => {
        try {
            const res = await api.post('/payment/capture-order', {
                orderID: data.orderID,
                _body: data, 
            });
            console.log('Payment successful', res.data);
            onPaymentSuccess('Thanh toán thành công!');
        } catch (error) {
            console.error('Error capturing PayPal order', error);
            onPaymentError(error.response?.data?.message || 'Thanh toán thất bại. Vui lòng liên hệ ban quản lý.');
        } finally {
            setProcessing(false); // Dừng hiển thị loading
        }
    };

    // 3. Xử lý khi user hủy
    const onCancel = () => {
        onPaymentError('Bạn đã hủy giao dịch.');
        setProcessing(false);
    };

    // 4. Xử lý lỗi từ PayPal SDK
    const onError = (err) => {
        console.error('PayPal SDK Error', err);
        onPaymentError('Đã xảy ra lỗi với PayPal. Vui lòng thử lại sau.');
        setProcessing(false);
    };

    // Tính toán số tiền USD (Giả sử 1 USD = 25000 VND - Bạn nên dùng tỷ giá động)
    const amountUSD = (parseFloat(bill.total_amount) / 25000).toFixed(2);

    return (
        <PayPalButtons
            style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onError}
            onCancel={onCancel}
            forceReRender={[amountUSD]} 
        />
    );
};

// Component chính bao bọc Provider
const PayPalPayment = ({ bill, onPaymentSuccess, onPaymentError, setProcessing, isProcessing }) => {
    if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === "YOUR_SANDBOX_CLIENT_ID") {
        return <Alert variant="danger">PayPal Client ID chưa được cấu hình.</Alert>;
    }

    return (
        <div className="paypal-button-container">
            {isProcessing && (
                <div className="payment-loading-overlay">
                    <Spinner animation="border" />
                    <span>Đang xử lý...</span>
                </div>
            )}
            <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "USD" }}>
                <ButtonWrapper
                    bill={bill}
                    onPaymentSuccess={onPaymentSuccess}
                    onPaymentError={onPaymentError}
                    setProcessing={setProcessing}
                />
            </PayPalScriptProvider>
        </div>
    );
};

export default PayPalPayment;
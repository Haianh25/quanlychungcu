import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './VerifyEmail.css'; // Import CSS mới

const VerifyEmail = () => {
    // --- LOGIC GỐC CỦA BẠN (GIỮ NGUYÊN) ---
    const [message, setMessage] = useState('Verifying your account...');
    const [error, setError] = useState('');
    const { token } = useParams();
    const effectRan = useRef(false);

    useEffect(() => {
        if (effectRan.current === false) {
            const verifyToken = async () => {
                if (!token) {
                    setError('Verification token not found.');
                    setMessage('');
                    return;
                }
                try {
                    const res = await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
                    setMessage(res.data.message || 'Account verified successfully!');
                    setError('');
                } catch (err) {
                    setError(err.response?.data?.message || 'An error occurred during verification.');
                    setMessage('');
                }
            };
            verifyToken();
            return () => {
                effectRan.current = true;
            };
        }
    }, [token]);

    // --- GIAO DIỆN JSX ĐÃ ĐƯỢC THAY ĐỔI THEO THEME MỚI ---
    
    // Xác định trạng thái
    const isLoading = message === 'Verifying your account...' && !error;
    const isSuccess = message && !isLoading && !error;
    const isError = error;

    return (
        <div className="login-page-wrapper">
            {/* 1. CỘT ẢNH NỀN BÊN TRÁI */}
            <div className="login-image-panel">
                {/* Ảnh nền được đặt trong CSS */}
            </div>

            {/* 2. CỘT FORM BÊN PHẢI */}
            <div className="login-form-panel">
                <div className="login-form-content">
                    
                    {/* Logo (Giống Header) */}
                    <div className="login-logo">
                        <img src="/images/logoo.png" alt="PTIT Apartment Logo" />
                        <span>PTIT Apartment</span>
                    </div>

                    <h2 className="login-title">Account Verification</h2>
                    
                    {/* Trạng thái Đang Tải... */}
                    {isLoading && (
                        <>
                            <p className="login-subtitle">Please wait while we verify your account.</p>
                            <div className="alert alert-info">{message}</div>
                            {/* Bạn có thể thêm Spinner của Bootstrap tại đây nếu muốn */}
                        </>
                    )}

                    {/* Trạng thái Lỗi */}
                    {isError && (
                         <>
                            <p className="login-subtitle">An error occurred.</p>
                            <div className="alert alert-danger">{error}</div>
                            <div className="d-grid mt-4">
                                <Link to="/login" className="btn btn-residem-primary">Back to Login</Link>
                            </div>
                        </>
                    )}

                    {/* Trạng thái Thành Công */}
                    {isSuccess && (
                         <>
                            <p className="login-subtitle">Your account is now active!</p>
                            <div className="alert alert-success">{message}</div>
                            <div className="d-grid mt-4">
                                <Link to="/login" className="btn btn-residem-primary">Go to Login Page</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
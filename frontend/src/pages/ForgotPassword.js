import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ForgotPassword.css'; // Import CSS mới

const ForgotPassword = () => {
    // --- LOGIC GỐC CỦA BẠN (GIỮ NGUYÊN) ---
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setMessage(res.data.message || 'If an account with that email exists, a password reset link has been sent.');
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

    // --- GIAO DIỆN JSX ĐÃ ĐƯỢC THAY ĐỔI THEO THEME MỚI ---
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

                    <h2 className="login-title">Forgot Password?</h2>

                    {message ? (
                        // TRẠNG THÁI GỬI THÀNH CÔNG
                        <>
                            <p className="login-subtitle">Please check your email inbox for the reset link.</p>
                            <div className="alert alert-success mt-3">{message}</div>
                            <div className="d-grid mt-4">
                                <Link to="/login" className="btn btn-residem-primary">Back to Login</Link>
                            </div>
                        </>
                    ) : (
                        // TRẠNG THÁI NHẬP FORM
                        <>
                            <p className="login-subtitle">Enter your email and we'll send you a link to reset your password.</p>
                            {error && <div className="alert alert-danger mt-3">{error}</div>}
                            
                            <form onSubmit={onSubmit} className="mt-4">
                                <div className="form-group mb-3">
                                    <label htmlFor="email">E-mail Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        className="form-control"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="d-grid mt-4">
                                    <button type="submit" className="btn btn-residem-primary">Send Reset Link</button>
                                </div>
                            </form>

                            <div className="text-center mt-4 register-link">
                                <span>Remembered your password? <Link to="/login">Back to Login</Link></span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
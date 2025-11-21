import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Register.css'; // Import CSS mới

const Register = () => {
    // --- CẬP NHẬT STATE: Thêm trường phone ---
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '', // Thêm trường phone vào state
        password: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { fullName, email, phone, password } = formData;
    
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during registration.');
        }
    };

    return (
        <div className="login-page-wrapper">
            {/* 1. CỘT ẢNH NỀN BÊN TRÁI */}
            <div className="login-image-panel">
                {/* Ảnh nền được đặt trong CSS */}
            </div>

            {/* 2. CỘT FORM BÊN PHẢI */}
            <div className="login-form-panel">
                <div className="login-form-content">
                    
                    {/* Logo và Tên (Giống Header) */}
                    <div className="login-logo">
                        <img src="/images/logoo.png" alt="PTIT Apartment Logo" />
                        <span>PTIT Apartment</span>
                    </div>

                    {/* Tiêu đề chào mừng */}
                    <h2 className="login-title">Create Your Account</h2>
                    <p className="login-subtitle">Join our community. It's fast and free.</p>

                    {/* Form đăng ký */}
                    <form onSubmit={onSubmit} className="mt-4">
                        
                        {/* Full Name */}
                        <div className="form-group mb-3">
                            <label htmlFor="fullName">Full Name</label>
                            <input
                                id="fullName"
                                type="text"
                                className="form-control"
                                name="fullName"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={onChange}
                                required
                            />
                            {/* Dòng ghi chú dưới ô tên */}
                            <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                                * Please enter your full name exactly as it appears on your ID card or homeowner contract for verification.
                            </small>
                        </div>

                        {/* Phone Number */}
                        <div className="form-group mb-3">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                type="tel"
                                className="form-control"
                                name="phone"
                                placeholder="Phone Number"
                                value={phone}
                                onChange={onChange}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="form-group mb-3">
                            <label htmlFor="email">E-mail Address</label>
                            <input
                                id="email"
                                type="email"
                                className="form-control"
                                name="email"
                                placeholder="E-mail Address"
                                value={email}
                                onChange={onChange}
                                required
                            />
                        </div>
                        
                        {/* Password */}
                        <div className="form-group mb-3">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="form-control"
                                name="password"
                                placeholder="Password"
                                value={password}
                                onChange={onChange}
                                required
                            />
                        </div>

                        {message && <div className="alert alert-success mt-3">{message}</div>}
                        {error && <div className="alert alert-danger mt-3">{error}</div>}

                        {/* [SỬA] Bỏ class 'd-grid', chỉ để 'mt-4' để tránh xung đột layout */}
                        <div className="mt-4">
                            <button type="submit" className="btn btn-residem-primary">
                                Register
                            </button>
                        </div>

                        {/* Link sang trang Login */}
                        <div className="text-center mt-4 register-link">
                            <span>Already have an account? <Link to="/login">Login here</Link></span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
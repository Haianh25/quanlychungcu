import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // Import CSS mới

const Login = () => {
    // --- LOGIC GỐC CỦA BẠN (GIỮ NGUYÊN) ---
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            navigate('/'); // Navigate to home or dashboard after login
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra.');
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
                    
                    {/* Logo và Tên (Giống Header) */}
                    <div className="login-logo">
                        <img src="/images/logoo.png" alt="PTIT Apartment Logo" />
                        <span>PTIT Apartment</span>
                    </div>

                    {/* Tiêu đề chào mừng */}
                    <h2 className="login-title">Welcome Back!</h2>
                    <p className="login-subtitle">Please enter your details to sign in.</p>

                    {/* Form đăng nhập (Giữ nguyên logic) */}
                    <form onSubmit={onSubmit} className="mt-4">
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

                        {error && <div className="alert alert-danger mt-3">{error}</div>}

                        <div className="extra-links-top mt-3">
                            {/* Giữ nguyên link "Forgot password?" của bạn */}
                            <Link to="/forgot-password">Forgot password?</Link>
                        </div>

                        <div className="d-grid mt-4">
                            {/* Nút bấm đã được đổi style */}
                            <button type="submit" className="btn btn-residem-primary">
                                Login
                            </button>
                        </div>

                        {/* Link sang trang Register (Giữ nguyên) */}
                        <div className="text-center mt-4 register-link">
                            <span>Don't have an account? <Link to="/register">Register here</Link></span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
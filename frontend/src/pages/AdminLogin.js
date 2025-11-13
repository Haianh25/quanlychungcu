import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css'; // Import CSS

const AdminLogin = () => {
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
            const res = await axios.post('http://localhost:5000/api/auth/admin/login', formData);
            localStorage.setItem('adminToken', res.data.token);
            navigate('/admin/dashboard'); 
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.');
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
                    
                    <div className="login-logo">
                        <img src="/images/logoo.png" alt="PTIT Apartment Logo" />
                        <span>PTIT Apartment</span>
                    </div>

                    <h2 className="login-title">Admin Login</h2>
                    <p className="login-subtitle">Please enter your administrator credentials.</p>

                    <form onSubmit={onSubmit} className="mt-4">
                        <div className="form-group mb-3">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="form-control"
                                name="email"
                                placeholder="Email Address"
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

                        {/* === THAY ĐỔI TẠI ĐÂY === */}
                        {/* Bỏ class 'd-grid' để nút không bị kéo dãn */}
                        <div className="mt-4">
                            <button type="submit" className="btn btn-residem-primary">
                                Login
                            </button>
                        </div>
                        
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
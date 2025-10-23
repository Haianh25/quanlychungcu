// frontend/src/pages/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { fullName, email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra.');
        }
    };

    return (
        <div className="form-container">
            {/* THÊM KHUNG BAO QUANH */}
            <div className="form-frame">
                {/* THÊM CHỖ ĐỂ LOGO */}
                <div className="logo-placeholder">
                    <img src="/images/logo.png" alt="PTIT Apartment Logo" />
                </div>

                <div className="page-links mb-4">
                    <Link to="/login">Login</Link>
                    <Link to="/register" className="active">Register</Link>
                </div>

                <form onSubmit={onSubmit}>
                    <input
                        type="text"
                        className="form-control"
                        name="fullName"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={onChange}
                        required
                    />
                    <input
                        type="email"
                        className="form-control"
                        name="email"
                        placeholder="E-mail Address"
                        value={email}
                        onChange={onChange}
                        required
                    />
                    <input
                        type="password"
                        className="form-control"
                        name="password"
                        placeholder="Password"
                        value={password}
                        onChange={onChange}
                        required
                    />
                    {message && <div className="alert alert-success mt-3">{message}</div>}
                    {error && <div className="alert alert-danger mt-3">{error}</div>}

                    <div className="d-grid mt-3">
                        <button type="submit" className="btn btn-primary">Register</button>
                    </div>
                </form>

                 <div className="text-center mt-4">
                    <span>Already have an account? <Link to="/login" className="login-link">Login here</Link></span>
                </div>
            </div>
        </div>
    );
};

export default Register;
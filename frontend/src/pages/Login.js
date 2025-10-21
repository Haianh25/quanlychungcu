// frontend/src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // Import the new CSS file

const Login = () => {
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

    return (
        <div className="form-container">
            <div className="form-frame"> {/* Added frame */}
                <div className="logo-placeholder"> {/* Added logo placeholder */}
                    {/* Replace with <img src="/path/to/logo.png" alt="Logo"/> if you have one */}
                    LOGO HERE
                </div>

                <div className="page-links mb-4">
                    <Link to="/login" className="active">Login</Link> {/* Mark Login as active */}
                    <Link to="/register">Register</Link>
                </div>

                <form onSubmit={onSubmit}>
                    <input
                        id="email"
                        type="email"
                        className="form-control"
                        name="email"
                        placeholder="E-mail Address" // Added placeholder
                        value={email}
                        onChange={onChange}
                        required
                    />
                    <input
                        id="password"
                        type="password"
                        className="form-control"
                        name="password"
                        placeholder="Password" // Added placeholder
                        value={password}
                        onChange={onChange}
                        required
                    />
                    {error && <div className="alert alert-danger mt-3">{error}</div>} {/* Show error */}

                    <div className="d-grid mt-3">
                        <button type="submit" className="btn btn-primary">
                            Login
                        </button>
                    </div>

                    {/* Links below the button */}
                    <div className="extra-links mt-3">
                        <Link to="/forgot-password">Forgot password?</Link>
                    </div>
                </form>

                 {/* Link to Register page */}
                 <div className="text-center mt-4 register-link">
                    <span>Don't have an account? <Link to="/register">Register here</Link></span>
                </div>
            </div>
        </div>
    );
};

export default Login;
// frontend/src/pages/AdminLogin.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate only
import './AdminLogin.css'; // Import the specific CSS file

const AdminLogin = () => {
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
            // Store admin token separately so admin sessions don't overwrite user sessions
            localStorage.setItem('adminToken', res.data.token);
            navigate('/admin/dashboard'); // Navigate to admin dashboard on success
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.'); // Use English error
        }
    };

    return (
        <div className="form-container">
            <div className="form-frame"> {/* Added frame */}
                <div className="logo-placeholder"> {/* Added logo placeholder */}
                    <img src="/images/logo.png" alt="PTIT Apartment Logo" />
                </div>

                <h2>Admin Login</h2> {/* English Title */}

                <form onSubmit={onSubmit}>
                    <input
                        id="email"
                        type="email"
                        className="form-control"
                        name="email"
                        placeholder="Email Address" // English placeholder
                        value={email}
                        onChange={onChange}
                        required
                    />
                    <input
                        id="password"
                        type="password"
                        className="form-control"
                        name="password"
                        placeholder="Password" // English placeholder
                        value={password}
                        onChange={onChange}
                        required
                    />
                    {error && <div className="alert alert-danger mt-3">{error}</div>} {/* Show error */}

                    <div className="d-grid mt-3">
                        <button type="submit" className="btn btn-primary">
                            Login {/* English button text */}
                        </button>
                    </div>
                </form>
                {/* Removed Forgot Password and Register links */}
            </div>
        </div>
    );
};

export default AdminLogin;
// frontend/src/pages/ForgotPassword.js
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ForgotPassword.css'; // Import the CSS

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            // Use English message from backend if possible, otherwise use a generic one
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            // Assuming backend sends English message now, otherwise use below
            setMessage(res.data.message || 'If an account with that email exists, a password reset link has been sent.');
        } catch (err) {
            setError('An error occurred. Please try again.'); // Generic English error
        }
    };

    return (
        <div className="form-container">
            <div className="form-frame">
                <div className="logo-placeholder">
                    LOGO HERE
                </div>

               
                {message && <div className="alert alert-info mt-3">{message}</div>}
                {error && <div className="alert alert-danger mt-3">{error}</div>}

                {!message && (
                    <form onSubmit={onSubmit}>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="Enter your email address" // Changed Placeholder
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <div className="d-grid mt-3">
                             <button type="submit" className="btn btn-primary">Send Reset Link</button> {/* Changed Button Text */}
                        </div>
                    </form>
                 )}

                <div className="text-center mt-4 back-link">
                    <Link to="/login">Back to Login</Link> {/* Changed Link Text */}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
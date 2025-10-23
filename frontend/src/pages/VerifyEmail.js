// frontend/src/pages/VerifyEmail.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './VerifyEmail.css'; // Import the CSS

const VerifyEmail = () => {
    const [message, setMessage] = useState('Verifying your account...');
    const [error, setError] = useState('');
    const { token } = useParams();
    const effectRan = useRef(false);

    useEffect(() => {
        // ... (useEffect logic remains the same) ...
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

    let alertClass = '';
    let alertContent = '';
    if (message && message !== 'Verifying your account...') {
        alertClass = 'alert alert-success';
        alertContent = message;
    } else if (error) {
        alertClass = 'alert alert-danger';
        alertContent = error;
    } else {
        alertClass = 'alert alert-info';
        alertContent = message;
    }

    return (
        <div className="verify-container"> {/* Updated container class */}
            <div className="verify-frame"> {/* Updated frame class */}
                <div className="logo-placeholder"> {/* Added logo placeholder */}
                    <img src="/images/logo.png" alt="PTIT Apartment Logo" />
                </div>

                <h1>Account Activation Status</h1>

                <p className={alertClass}>{alertContent}</p>

                {(message !== 'Verifying your account...' || error) && (
                    <Link to="/login" className="btn btn-primary">
                        Go to Login Page
                    </Link>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
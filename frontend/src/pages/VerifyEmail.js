import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './VerifyEmail.css'; 

const VerifyEmail = () => {
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
    
    const isLoading = message === 'Verifying your account...' && !error;
    const isSuccess = message && !isLoading && !error;
    const isError = error;

    return (
        <div className="login-page-wrapper">
            <div className="login-image-panel">
            </div>
            <div className="login-form-panel">
                <div className="login-form-content">
                    
                    <div className="login-logo">
                        <img src="/images/logoo.png" alt="PTIT Apartment Logo" />
                        <span>PTIT Apartment</span>
                    </div>

                    <h2 className="login-title">Account Verification</h2>
                    {isLoading && (
                        <>
                            <p className="login-subtitle">Please wait while we verify your account.</p>
                            <div className="alert alert-info">{message}</div>
                        </>
                    )}
                    {isError && (
                         <>
                            <p className="login-subtitle">An error occurred.</p>
                            <div className="alert alert-danger">{error}</div>
                            <div className="d-grid mt-4">
                                <Link to="/login" className="btn btn-residem-primary">Back to Login</Link>
                            </div>
                        </>
                    )}

                   
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
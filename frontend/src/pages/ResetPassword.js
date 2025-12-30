import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ResetPassword.css'; 

const ResetPassword = () => {

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const onSubmit = async e => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }
        setError('');
        setMessage('');
        try {
            const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { newPassword });
            setMessage(res.data.message);
            setTimeout(() => navigate('/login'), 3000); 
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra.');
        }
    };

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

                    <h2 className="login-title">Reset Password</h2>

                    {message ? (
                        
                        <>
                            <p className="login-subtitle">Your password has been successfully updated.</p>
                            <div className="alert alert-success">{message}</div>
                            <div className="d-grid mt-4">
                                <Link to="/login" className="btn btn-residem-primary">Go to Login</Link>
                            </div>
                        </>
                    ) : (
                        
                        <>
                            <p className="login-subtitle">Please enter and confirm your new password.</p>
                            {error && <div className="alert alert-danger mt-3">{error}</div>}
                            
                            <form onSubmit={onSubmit} className="mt-4">
                                <div className="form-group mb-3">
                                    <label htmlFor="newPassword">New Password</label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        className="form-control"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        required
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        className="form-control"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>
                                <div className="d-grid mt-4">
                                    <button type="submit" className="btn btn-residem-primary">Update Password</button>
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

export default ResetPassword;
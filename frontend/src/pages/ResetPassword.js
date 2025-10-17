import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

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
            setTimeout(() => navigate('/login'), 3000); // Chuyển về trang login sau 3s
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra.');
        }
    };

    return (
        <div className="row">
            <div className="col-md-6 mx-auto">
                <div className="card">
                    <div className="card-body">
                        <h2 className="card-title text-center">Đặt Lại Mật Khẩu Mới</h2>
                        {message && <div className="alert alert-success">{message}</div>}
                        {error && <div className="alert alert-danger">{error}</div>}
                        {!message && (
                            <form onSubmit={onSubmit}>
                                <div className="form-group mb-3">
                                    <label>Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label>Xác nhận mật khẩu mới</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100">Cập nhật Mật khẩu</button>
                            </form>
                        )}
                        {message && <Link to="/login">Đi đến trang Đăng nhập ngay</Link>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
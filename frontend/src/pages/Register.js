import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link

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
        <div className="row">
            <div className="col-md-6 mx-auto">
                <div className="card shadow-sm">
                    <div className="card-body p-4">
                        <h1 className="card-title text-center mb-4">Đăng Ký Tài Khoản</h1>
                        {message && <div className="alert alert-success">{message}</div>}
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={onSubmit}>
                            {/* ... Các trường input giữ nguyên ... */}
                            <div className="form-group mb-3">
                                <label htmlFor="fullName">Họ và Tên</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    className="form-control"
                                    name="fullName"
                                    value={fullName}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    value={email}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label htmlFor="password">Mật khẩu</label>
                                <input
                                    id="password"
                                    type="password"
                                    className="form-control"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    required
                                />
                                <small className="form-text text-muted">
                                    Ít nhất 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt.
                                </small>
                            </div>
                            <div className="d-grid mt-4">
                                <button type="submit" className="btn btn-primary">Đăng Ký</button>
                            </div>
                            {/* DÒNG CODE MỚI ĐƯỢC THÊM VÀO */}
                            <div className="text-center mt-3">
                                <span>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
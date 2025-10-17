import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

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
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra.');
        }
    };

    return (
        <div className="row">
            <div className="col-md-6 mx-auto">
                <div className="card shadow-sm">
                    <div className="card-body p-4">
                        <h1 className="card-title text-center mb-4">Đăng Nhập</h1>
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={onSubmit}>
                            {/* ... Các trường input email và password giữ nguyên ... */}
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
                            </div>
                            <div className="d-grid mt-4">
                                <button type="submit" className="btn btn-primary">
                                    Đăng Nhập
                                </button>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <Link to="/forgot-password">Quên mật khẩu?</Link>
                                {/* DÒNG CODE MỚI ĐƯỢC THÊM VÀO */}
                                <span>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
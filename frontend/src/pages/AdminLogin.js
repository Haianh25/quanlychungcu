// frontend/src/pages/AdminLogin.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
            // Gọi đến API của admin
            const res = await axios.post('http://localhost:5000/api/auth/admin/login', formData);
            localStorage.setItem('token', res.data.token);

            // Điều hướng đến trang dashboard của admin (sẽ tạo sau)
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra.');
        }
    };

    return (
        <div className="row">
            <div className="col-md-6 mx-auto">
                <div className="card shadow-sm border-primary">
                    <div className="card-header bg-primary text-white text-center">
                        <h2>Trang Đăng Nhập Quản Trị Viên</h2>
                    </div>
                    <div className="card-body p-4">
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={onSubmit}>
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
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
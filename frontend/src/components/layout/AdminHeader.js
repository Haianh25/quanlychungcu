// frontend/src/components/layout/AdminHeader.js
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const AdminHeader = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    return (
        // Bỏ mb-4 (margin-bottom) để layout liền mạch hơn
        <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm"> 
            {/* Thêm padding ngang (px-4) */}
            <div className="container-fluid px-4">
                <Link className="navbar-brand" to="/admin/dashboard">
                    Admin Dashboard
                </Link>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <button className="btn btn-outline-danger" onClick={handleLogout}>
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default AdminHeader;
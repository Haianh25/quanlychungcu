// frontend/src/components/layout/AdminHeader.js
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const AdminHeader = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/admin/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4 shadow-sm">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/admin/dashboard">
                    Admin Dashboard
                </Link>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto align-items-center">
                        <li className="nav-item me-3">
                            {/* Notification bell */}
                            <button className="btn btn-outline-secondary position-relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-bell" viewBox="0 0 16 16">
                                    <path d="M8 16a2 2 0 0 0 1.985-1.75H6.015A2 2 0 0 0 8 16zm.104-14a1 1 0 0 0-.208 0C7.69 2 6 3.343 6 6c0 1.098-.628 2.49-1.498 3.52A1 1 0 0 0 5.25 11h5.5a1 1 0 0 0 .748-1.48C10.628 8.49 10 7.098 10 6c0-2.657-1.69-4-1.896-4z"/>
                                </svg>
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    0
                                </span>
                            </button>
                        </li>
                        <li className="nav-item d-flex align-items-center">
                            {/* Profile avatar (simple circle with initial) */}
                            <div className="dropdown">
                                <button className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center" type="button" id="profileMenu" data-bs-toggle="dropdown" aria-expanded="false">
                                    <span className="avatar bg-primary text-white rounded-circle d-inline-flex justify-content-center align-items-center me-2" style={{ width: 32, height: 32 }}>
                                        A
                                    </span>
                                    Admin
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileMenu">
                                    <li><button className="dropdown-item" type="button">Profile</button></li>
                                    <li><hr className="dropdown-divider"/></li>
                                    <li><button className="dropdown-item text-danger" onClick={handleLogout}>Đăng Xuất</button></li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default AdminHeader;
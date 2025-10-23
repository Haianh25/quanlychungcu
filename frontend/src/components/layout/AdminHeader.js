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
                        <li className="nav-item">
                            <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default AdminHeader;
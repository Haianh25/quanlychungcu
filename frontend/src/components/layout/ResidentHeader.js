// frontend/src/components/layout/ResidentHeader.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import 'bootstrap-icons/font/bootstrap-icons.css';
// import './ResidentHeader.css'; // (Bạn có thể đã có file này)

const ResidentHeader = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('');
    // const [userAvatar, setUserAvatar] = useState('/images/default-avatar.jpg'); // Bỏ userAvatar

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                
                if (decodedToken.exp < currentTime) {
                    console.log("Token expired");
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                    setUserRole(null);
                    setUserName('');
                } else {
                    const rawRole = decodedToken?.role ?? decodedToken?.roles ?? decodedToken?.user?.role;
                    let normalizedRole = null;
                    if (Array.isArray(rawRole)) {
                        const lowerRoles = rawRole.map(r => String(r).toLowerCase());
                        if (lowerRoles.includes('resident')) normalizedRole = 'resident';
                        else normalizedRole = lowerRoles[0] || null;
                    } else if (rawRole) {
                        normalizedRole = String(rawRole).toLowerCase();
                    }
                    setUserRole(normalizedRole);
                    setUserName(decodedToken.full_name || decodedToken.email);
                    // setUserAvatar(decodedToken.avatar_url || '/images/default-avatar.jpg'); // Bỏ
                }
            } catch (error) {
                console.error("Invalid token:", error);
                setIsLoggedIn(false); 
                setUserRole(null);
                setUserName('');
            }
        } else {
            setIsLoggedIn(false);
            setUserRole(null);
            setUserName('');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserRole(null);
        setUserName('');
        navigate('/login'); 
    };

    const handleBellClick = () => {
        alert('Show notifications!'); // Placeholder
    };

    // Đổi tên hàm cho rõ nghĩa
    const handleProfileClick = () => {
        navigate('/profile'); // Chuyển đến trang Profile
    };

    return (
        <header className="resident-header sticky-top">
            <nav className="container navbar navbar-expand-lg navbar-dark">
                {/* Logo & Site Name */}
                <Link className="navbar-brand" to={isLoggedIn ? "/" : "/login"}>
                    <img src="/images/logo.png" alt="PTIT Apartment Logo" style={{ height: '100px' }} />
                    PTIT Apartment
                </Link>

                {/* Navbar Toggler (for mobile) */}
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#residentNavbar" aria-controls="residentNavbar" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navbar Links */}
                <div className="collapse navbar-collapse" id="residentNavbar">
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link" aria-current="page" to="/">Homepage</Link>
                        </li>
                        <li className="nav-item">
                            {isLoggedIn && userRole === 'resident' ? (
                                <Link className="nav-link" to="/services">Services</Link>
                            ) : (
                                <span className="nav-link disabled" title="Available for residents only">Services</span>
                            )}
                        </li>
                        <li className="nav-item">
                            {isLoggedIn && userRole === 'resident' ? (
                                <Link className="nav-link" to="/bill">Bill</Link>
                            ) : (
                                <span className="nav-link disabled" title="Available for residents only">Bill</span>
                            )}
                        </li>
                        <li className="nav-item">
                            {isLoggedIn && userRole === 'resident' ? (
                                <Link className="nav-link" to="/news">News</Link>
                            ) : (
                                <span className="nav-link disabled" title="Available for residents only">News</span>
                            )}
                        </li>
                    </ul>
                </div>

                {/* Right side items */}
                {/* Thêm 'd-flex align-items-center' để icon và nút logout thẳng hàng */}
                <div className="header-right-items ms-auto d-flex align-items-center">
                    {isLoggedIn ? (
                        <>
                            <button className="icon-btn" onClick={handleBellClick} title="Notifications">
                                <i className="bi bi-bell-fill"></i>
                            </button>

                            {/* --- (ĐÃ THAY ĐỔI Ở ĐÂY) --- */}
                            {/* Thay thế <img> bằng <button> chứa icon */}
                            <button className="icon-btn ms-2" onClick={handleProfileClick} title={userName || 'Profile'}>
                                <i className="bi bi-person-circle" style={{ fontSize: '1.5rem' }}></i>
                            </button>
                            {/* --- (KẾT THÚC THAY ĐỔI) --- */}
                            
                            <button className="btn btn-auth ms-2" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <Link className="btn btn-auth btn-login-visible" to="/login">Login</Link>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default ResidentHeader;
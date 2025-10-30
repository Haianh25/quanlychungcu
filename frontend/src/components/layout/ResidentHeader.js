// frontend/src/components/layout/ResidentHeader.js
import React, { useState, useEffect } from 'react';
// 1. Import 'useNavigate' để điều hướng
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import 'bootstrap-icons/font/bootstrap-icons.css';
// import './ResidentHeader.css'; 

const ResidentHeader = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('');
    const [userAvatar, setUserAvatar] = useState('/images/default-avatar.jpg');

    // 2. Khởi tạo hook useNavigate
    const navigate = useNavigate();

    // Logic này giờ sẽ chạy ở Header, trên mọi trang
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
                    // ... (reset state)
                    setUserRole(null);
                    setUserName('');
                    setUserAvatar('/images/default-avatar.jpg');
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
                    setUserAvatar(decodedToken.avatar_url || '/images/default-avatar.jpg');
                }
            } catch (error) {
                console.error("Invalid token (keep as logged in):", error);
                // ... (reset state)
                setUserRole(null);
                setUserName('');
                setUserAvatar('/images/default-avatar.jpg');
            }
        } else {
            setIsLoggedIn(false);
            // ... (reset state)
            setUserRole(null);
            setUserName('');
            setUserAvatar('/images/default-avatar.jpg');
        }
    }, []); // Chỉ chạy 1 lần khi load

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserRole(null);
        setUserName('');
        setUserAvatar('/images/default-avatar.jpg');
        // (Tùy chọn) Chuyển về trang login
        // navigate('/login'); // Có thể dùng navigate ở đây
    };

    const handleBellClick = () => {
        alert('Show notifications!'); // Placeholder
    };

    // 3. Sửa hàm này để điều hướng (đã làm)
    const handleAvatarClick = () => {
        // alert('Open user profile menu!'); // Xóa dòng alert cũ
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
                        
                        {/* highlight-start */}
                        {/* --- SỬA LINK BILL --- */}
                        <li className="nav-item">
                            {isLoggedIn && userRole === 'resident' ? (
                                <Link className="nav-link" to="/bill">Bill</Link> // Kích hoạt link
                            ) : (
                                <span className="nav-link disabled" title="Available for residents only">Bill</span>
                            )}
                        </li>
                        {/* highlight-end */}

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
                <div className="header-right-items ms-auto">
                    {isLoggedIn ? (
                        <>
                            <button className="icon-btn" onClick={handleBellClick} title="Notifications">
                                <i className="bi bi-bell-fill"></i>
                            </button>
                            {/* onClick của img này đã được cập nhật */}
                            <img src={userAvatar} alt={userName} className="avatar" onClick={handleAvatarClick} title={userName} />
                            <button className="btn btn-auth" onClick={handleLogout}>Logout</button>
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
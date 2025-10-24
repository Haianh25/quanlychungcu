// frontend/src/components/layout/ResidentHeader.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ResidentHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('');
    const [userAvatar, setUserAvatar] = useState('/images/default-avatar.jpg');

    useEffect(() => {
        const token = localStorage.getItem('userToken'); // Chỉ đọc userToken
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                if (decodedToken.exp < currentTime) {
                    localStorage.removeItem('userToken');
                    setIsLoggedIn(false);
                    setUserRole(null);
                } else {
                    setIsLoggedIn(true);
                    setUserRole(decodedToken.role);
                    setUserName(decodedToken.full_name || decodedToken.email);
                    setUserAvatar(decodedToken.avatar_url || '/images/default-avatar.jpg');
                }
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('userToken');
                setIsLoggedIn(false);
                setUserRole(null);
            }
        } else {
            setIsLoggedIn(false);
            setUserRole(null);
        }
    }, [location.pathname]); // Cập nhật lại state khi chuyển trang

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        setIsLoggedIn(false);
        setUserRole(null);
        setUserName('');
        setUserAvatar('/images/default-avatar.jpg');
        navigate('/'); // Về trang chủ
    };

    const handleBellClick = () => { alert('Show notifications!'); };
    const handleAvatarClick = () => { alert('Open user profile menu!'); };

    const isNavLinkActive = (path) => {
        return location.pathname === path;
    };

    return (
        <header className="resident-header sticky-top">
            <nav className="container navbar navbar-expand-lg navbar-dark">
                <Link className="navbar-brand" to={isLoggedIn ? "/" : "/login"}>
                    <img src="/images/logo.png" alt="PTIT Apartment Logo" style={{ height: '30px' }} />
                    PTIT Apartment
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#residentNavbar" aria-controls="residentNavbar" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="residentNavbar">
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className={`nav-link ${isNavLinkActive('/') ? 'active' : ''}`} to="/">Homepage</Link>
                        </li>
                        {isLoggedIn && userRole === 'resident' && (
                            <>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isNavLinkActive('/services') ? 'active' : ''}`} to="/services">Services</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isNavLinkActive('/bill') ? 'active' : ''}`} to="/bill">Bill</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isNavLinkActive('/news') ? 'active' : ''}`} to="/news">News</Link>
                                </li>
                            </>
                        )}
                    </ul>
                    <div className="header-right-items">
                        {isLoggedIn ? (
                            <>
                                <button className="icon-btn" onClick={handleBellClick} title="Notifications">
                                    <i className="bi bi-bell-fill"></i>
                                </button>
                                <img src={userAvatar} alt={userName} className="avatar" onClick={handleAvatarClick} title={userName} />
                                <button className="btn btn-auth" onClick={handleLogout}>Logout</button>
                            </>
                        ) : (
                            <Link className="btn btn-auth" to="/login">Login</Link>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default ResidentHeader;
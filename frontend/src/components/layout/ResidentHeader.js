// frontend/src/components/layout/ResidentHeader.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../pages/Homepage.css'; // Import CSS từ Homepage
import axios from 'axios'; 
import { Dropdown, ListGroup, Badge } from 'react-bootstrap'; 

// Hàm tính thời gian tương đối
function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return Math.floor(seconds) + " giây trước";
}

const ResidentHeader = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation(); 

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const getAuthToken = (tokenType = 'token') => { // Giữ nguyên 'token'
        return localStorage.getItem(tokenType);
    }

    // Hàm lấy thông báo
    const fetchNotifications = useCallback(async () => {
        const token = getAuthToken(); 
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/notifications', config);
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
            if (err.response && err.response.status === 401) {
                handleLogout(); // Tự động logout nếu token hỏng
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const handleLogout = () => {
        localStorage.removeItem('token'); 
        setIsLoggedIn(false);
        setUserRole(null);
        setUserName('');
        setNotifications([]); 
        navigate('/login'); 
    };
    
    useEffect(() => {
        const token = getAuthToken(); 
        if (token) {
            setIsLoggedIn(true);
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                
                if (decodedToken.exp < currentTime) {
                    console.log("Token expired");
                    handleLogout(); 
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
                    
                    fetchNotifications(); 
                    
                    const intervalId = setInterval(fetchNotifications, 60000);
                    return () => clearInterval(intervalId);
                }
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('token'); 
                setIsLoggedIn(false); 
                setUserRole(null);
                setUserName('');
            }
        } else {
            setIsLoggedIn(false);
            setUserRole(null);
            setUserName('');
            setNotifications([]); 
        }
    // Sửa: Thêm location.pathname và fetchNotifications
    }, [location.pathname, fetchNotifications]); 

    // --- (SỬA LOGIC Ở ĐÂY) ---
    // Click chuông chỉ bật/tắt
    const handleBellClick = () => {
        setShowNotifications(!showNotifications); 
    };
    // --- (KẾT THÚC SỬA) ---

    const handleProfileClick = () => {
        navigate('/profile'); 
    };

    // Đánh dấu TẤT CẢ là đã đọc (khi click nút)
    const markAllAsRead = async () => {
        const token = getAuthToken();
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/notifications/mark-read', {}, config);
            // Cập nhật UI ngay lập tức
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error("Failed to mark notifications as read:", err);
        }
    };

    // --- (THÊM MỚI) Đánh dấu MỘT là đã đọc (khi click vào thông báo) ---
    const markOneAsRead = async (notificationId) => {
        const token = getAuthToken();
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/notifications/mark-read', { notificationId }, config);
            // Cập nhật UI
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (err) {
            console.error("Failed to mark one notification as read:", err);
        }
    };

    // SỬA: Hàm click 1 thông báo
    const handleNotificationClick = (notification) => {
        markOneAsRead(notification.id); // Đánh dấu 1 cái đã đọc
        setShowNotifications(false); // Đóng dropdown
        navigate(notification.link_to || '/'); 
    };
    // --- (KẾT THÚC SỬA) ---

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const isResident = isLoggedIn && userRole === 'resident';
    const isNavLinkActive = (path) => { 
        return location.pathname === path;
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
                            <Link className={`nav-link ${isNavLinkActive('/') ? 'active' : ''}`} aria-current="page" to="/">Homepage</Link>
                        </li>
                        <li className="nav-item">
                            {isResident ? (
                                <Link className={`nav-link ${isNavLinkActive('/services') ? 'active' : ''}`} to="/services">Services</Link>
                            ) : (
                                <span className="nav-link disabled" title="Available for residents only">Services</span>
                            )}
                        </li>
                        <li className="nav-item">
                            {isResident ? (
                                <Link className={`nav-link ${isNavLinkActive('/bill') ? 'active' : ''}`} to="/bill">Bill</Link>
                            ) : (
                                <span className="nav-link disabled" title="Available for residents only">Bill</span>
                            )}
                        </li>
                        <li className="nav-item">
                            {isResident ? (
                                <Link className={`nav-link ${isNavLinkActive('/news') ? 'active' : ''}`} to="/news">News</Link>
                            ) : (
                                <span className="nav-link disabled" title="Available for residents only">News</span>
                            )}
                        </li>
                    </ul>
                </div>

                {/* Right side items */}
                <div className="header-right-items ms-auto d-flex align-items-center">
                    {isLoggedIn ? (
                        <>
                            {/* --- Nút chuông thông báo (DÙNG DROPDOWN) --- */}
                            <Dropdown show={showNotifications} onToggle={handleBellClick}>
                                <Dropdown.Toggle as="button" className="icon-btn notification-bell" title="Notifications">
                                    <i className="bi bi-bell-fill"></i>
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">{unreadCount}</span>
                                    )}
                                </Dropdown.Toggle>

                                <Dropdown.Menu as="div" className="notification-dropdown" align="end">
                                    <div className="notification-header">
                                        <h6>Thông báo</h6>
                                        {/* SỬA: Chỉ hiện nút này nếu có thông báo chưa đọc */}
                                        {unreadCount > 0 && (
                                            <button className="mark-all-read" onClick={markAllAsRead}>
                                                Đánh dấu tất cả đã đọc
                                            </button>
                                        )}
                                    </div>
                                    <ListGroup variant="flush">
                                        {notifications.length === 0 ? (
                                            <div className="notification-empty">Không có thông báo mới.</div>
                                        ) : (
                                            notifications.map(noti => (
                                                <ListGroup.Item 
                                                    key={noti.id} 
                                                    action 
                                                    onClick={() => handleNotificationClick(noti)} 
                                                    className="notification-item"
                                                    // SỬA: Thêm style cho thông báo chưa đọc
                                                    style={{ background: noti.is_read ? '' : '#3a414f' }} 
                                                >
                                                    <p className="mb-1">{noti.message}</p>
                                                    <small>{timeAgo(noti.created_at)}</small>
                                                </ListGroup.Item>
                                            ))
                                        )}
                                    </ListGroup>
                                </Dropdown.Menu>
                            </Dropdown>
                            {/* --- (KẾT THÚC SỬA) --- */}

                            <button className="icon-btn ms-2" onClick={handleProfileClick} title={userName || 'Profile'}>
                                <i className="bi bi-person-circle" style={{ fontSize: '1.5rem' }}></i>
                            </button>
                            
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
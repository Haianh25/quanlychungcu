import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../pages/Homepage.css'; // Import CSS
import axios from 'axios'; 
import { Dropdown, ListGroup } from 'react-bootstrap'; 

// --- TOÀN BỘ LOGIC CỦA BẠN (timeAgo, ...các hàm) ĐƯỢC GIỮ NGUYÊN ---
function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

const ResidentHeader = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('');
    // State lưu số phòng
    const [apartmentNumber, setApartmentNumber] = useState(null);
    
    const navigate = useNavigate();
    const location = useLocation(); 

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const getAuthToken = (tokenType = 'token') => { 
        return localStorage.getItem(tokenType);
    }

    // [MỚI] Hàm fetch trạng thái phòng Real-time & Tự động đá ra nếu mất quyền
    const fetchProfileStatus = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Gọi API nhẹ để lấy status mới nhất
            const res = await axios.get('http://localhost:5000/api/profile/status', config);
            
            const newApartmentNumber = res.data.apartment_number;
            
            // Cập nhật state nếu có sự thay đổi
            if (newApartmentNumber !== apartmentNumber) {
                console.log("Apartment status updated:", newApartmentNumber);
                setApartmentNumber(newApartmentNumber);

                // [LOGIC BỔ SUNG QUAN TRỌNG]
                // Nếu bị mất phòng (new = null) VÀ đang đứng ở trang cần quyền hạn (Services/Bill)
                // -> Đá về trang chủ ngay lập tức
                if (!newApartmentNumber) {
                    const restrictedPaths = ['/services', '/bill'];
                    // Kiểm tra xem đường dẫn hiện tại có bắt đầu bằng các path cấm không
                    const isOnRestrictedPage = restrictedPaths.some(path => location.pathname.startsWith(path));
                    
                    if (isOnRestrictedPage) {
                        alert("Session Update: You have been unassigned from your apartment. Redirecting to Home.");
                        navigate('/');
                    }
                }
            }

            // Check role change (nếu bị demote role)
            if (res.data.role !== userRole && userRole !== null) {
                 window.location.reload();
            }
        } catch (err) {
            // Không làm gì nếu lỗi nhẹ, để tránh spam console
        }
    }, [apartmentNumber, userRole, location.pathname, navigate]);

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
                handleLogout(); 
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const handleLogout = () => {
        localStorage.removeItem('token'); 
        setIsLoggedIn(false);
        setUserRole(null);
        setUserName('');
        setApartmentNumber(null);
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
                    
                    // Lấy giá trị ban đầu từ token
                    if (decodedToken.apartment_number) {
                        setApartmentNumber(decodedToken.apartment_number);
                    }
                    
                    fetchNotifications(); 
                    
                    // [UPDATED] Polling cả Notification và Profile Status mỗi 5s
                    const intervalId = setInterval(() => {
                        fetchNotifications();
                        fetchProfileStatus(); // Check phòng mới
                    }, 5000); 
                    return () => clearInterval(intervalId);
                }
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('token'); 
                setIsLoggedIn(false); 
                setUserRole(null);
                setUserName('');
                setApartmentNumber(null);
            }
        } else {
            setIsLoggedIn(false);
            setUserRole(null);
            setUserName('');
            setApartmentNumber(null);
            setNotifications([]); 
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, fetchNotifications, fetchProfileStatus]); 

    const handleBellClick = () => {
        setShowNotifications(!showNotifications); 
    };

    const handleProfileClick = () => {
        navigate('/profile'); 
    };

    const markAllAsRead = async () => {
        const token = getAuthToken();
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/notifications/mark-read', {}, config);
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error("Failed to mark notifications as read:", err);
        }
    };

    const markOneAsRead = async (notificationId) => {
        const token = getAuthToken();
        if (!token) return;
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/notifications/mark-read', { notificationId }, config);
        } catch (err) {
            console.error("Failed to mark one notification as read:", err);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markOneAsRead(notification.id); 
        }
        setShowNotifications(false); 
        navigate(notification.link_to || '/'); 
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const isResident = isLoggedIn && userRole === 'resident';
    
    const hasRoom = isResident && apartmentNumber; // Kiểm tra có phòng real-time

    const isNavLinkActive = (path) => { 
        return location.pathname === path;
    };

    const handleRestrictedClick = (e, path) => {
        e.preventDefault();
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        if (!isResident) {
            return; 
        }
        
        if (isResident && !hasRoom) {
            alert("Access Denied: You have not been assigned an apartment yet. Please contact Admin to use this service.");
            return;
        }

        navigate(path);
    };

    return (
        <header className="resident-header residem-header-light sticky-top">
            <nav className="container navbar navbar-expand-lg"> 
                
                <Link className="navbar-brand-custom" to={isLoggedIn ? "/" : "/login"}>
                    <img src="/images/logoo.png" alt="PTIT Apartment Logo" className="new-logo" />
                    <span>PTIT Apartment</span>
                </Link>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#residentNavbar" aria-controls="residentNavbar" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="residentNavbar">
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className={`nav-link ${isNavLinkActive('/') ? 'active' : ''}`} aria-current="page" to="/">Home</Link>
                        </li>
                        
                        {/* SERVICES LINK */}
                        <li className="nav-item">
                            {isResident ? (
                                <a 
                                    href="/services" 
                                    className={`nav-link ${isNavLinkActive('/services') ? 'active' : ''}`} 
                                    onClick={(e) => handleRestrictedClick(e, '/services')}
                                >
                                    Services
                                </a>
                            ) : (
                                <span className="nav-link disabled" title="Login to access">Services</span>
                            )}
                        </li>

                        {/* BILL LINK */}
                        <li className="nav-item">
                            {isResident ? (
                                <a 
                                    href="/bill" 
                                    className={`nav-link ${isNavLinkActive('/bill') ? 'active' : ''}`} 
                                    onClick={(e) => handleRestrictedClick(e, '/bill')}
                                >
                                    Bill
                                </a>
                            ) : (
                                <span className="nav-link disabled" title="Login to access">Bill</span>
                            )}
                        </li>

                        <li className="nav-item">
                            {isResident ? (
                                <Link className={`nav-link ${isNavLinkActive('/news') ? 'active' : ''}`} to="/news">News</Link>
                            ) : (
                                <span className="nav-link disabled" title="Login to access">News</span>
                            )}
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${isNavLinkActive('/about') ? 'active' : ''}`} to="/about">About Us</Link>
                        </li>
                    </ul>
                </div>

                <div className="header-right-items ms-auto d-flex align-items-center">
                    {isLoggedIn ? (
                        <>
                            <Dropdown show={showNotifications} onToggle={handleBellClick}>
                                <Dropdown.Toggle as="button" className="icon-btn icon-btn-light notification-bell" title="Notifications">
                                    <i className="bi bi-bell-fill"></i>
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">{unreadCount}</span>
                                    )}
                                </Dropdown.Toggle>

                                <Dropdown.Menu as="div" className="notification-dropdown" align="end">
                                    <div className="notification-header">
                                        <h6>Notifications</h6>
                                        {unreadCount > 0 && (
                                            <button className="mark-all-read" onClick={markAllAsRead}>
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>
                                    <ListGroup variant="flush">
                                        {notifications.length === 0 ? (
                                            <div className="notification-empty">No new notifications.</div>
                                        ) : (
                                            notifications.map(noti => (
                                                <ListGroup.Item 
                                                    key={noti.id} 
                                                    action 
                                                    onClick={() => handleNotificationClick(noti)} 
                                                    className={`notification-item ${noti.is_read ? 'is-read' : 'is-unread'}`} 
                                                >
                                                    <p className="mb-1">{noti.message}</p>
                                                    <small>{timeAgo(noti.created_at)}</small>
                                                </ListGroup.Item>
                                            ))
                                        )}
                                    </ListGroup>
                                </Dropdown.Menu>
                            </Dropdown>

                            <button className="icon-btn icon-btn-light ms-2" onClick={handleProfileClick} title={userName || 'Profile'}>
                                <i className="bi bi-person-circle"></i>
                            </button>
                            
                            <button className="btn btn-residem-primary ms-3" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <Link className="btn btn-residem-primary btn-login-visible" to="/login">Login</Link>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default ResidentHeader;
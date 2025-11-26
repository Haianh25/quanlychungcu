// frontend/src/components/layout/AdminHeader.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios'; 
import { Dropdown, ListGroup, Badge } from 'react-bootstrap'; 
import { BellFill, PersonCircle } from 'react-bootstrap-icons'; // Thêm icon Person

// Hàm tính thời gian tương đối (Giữ nguyên)
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

const AdminHeader = () => {
    // ... (GIỮ NGUYÊN TOÀN BỘ LOGIC STATE & EFFECT CỦA BẠN) ...
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const getAuthToken = () => { return localStorage.getItem('adminToken'); }

    const fetchNotifications = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/notifications', config);
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
            if (err.response && err.response.status === 401) { handleLogout(); }
        }
    }, []); 
    
    useEffect(() => {
        fetchNotifications();
        // [UPDATED] Giảm thời gian polling xuống 5 giây (5000ms) để Admin nhận thông báo nhanh hơn
        const intervalId = setInterval(fetchNotifications, 5000); 
        return () => clearInterval(intervalId);
    }, [location.pathname, fetchNotifications]); 

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const handleBellClick = () => {
        setShowNotifications(!showNotifications); 
        if (!showNotifications && unreadCount > 0) { markAllAsRead(); }
    };

    const markAllAsRead = async () => {
        const token = getAuthToken();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/notifications/mark-read', {}, config);
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) { console.error("Failed to mark notifications as read:", err); }
    };

    const handleNotificationClick = (notification) => {
        setShowNotifications(false); 
        navigate(notification.link_to || '/admin/dashboard'); 
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // --- JSX ĐÃ ĐƯỢC SỬA GIAO DIỆN ---
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top" style={{borderBottom: '1px solid #e0e0e0'}}> 
            <div className="container-fluid px-4">
                {/* Logo & Brand */}
                <Link className="navbar-brand d-flex align-items-center" to="/admin/dashboard" style={{color: '#333', fontWeight: '600', fontSize: '1.4rem'}}>
                    <img src="/images/logoo.png" alt="Logo" style={{height: '35px', marginRight: '10px'}} />
                    PTIT Apartment <span className="badge bg-light text-secondary ms-2 border" style={{fontSize: '0.7rem', fontWeight: '500'}}>Admin</span>
                </Link>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto d-flex align-items-center gap-3">
                        
                        {/* Notification Bell */}
                        <li className="nav-item position-relative">
                            <Dropdown show={showNotifications} onToggle={handleBellClick} align="end">
                                <Dropdown.Toggle as="div" className="position-relative cursor-pointer text-secondary p-2" style={{cursor: 'pointer'}}>
                                    <BellFill size={20} />
                                    {unreadCount > 0 && (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '0.6rem'}}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </Dropdown.Toggle>

                                <Dropdown.Menu className="shadow border-0 mt-2" style={{width: '320px', borderRadius: '10px'}}>
                                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light rounded-top">
                                        <h6 className="mb-0 fw-bold text-dark">Notifications</h6>
                                        {unreadCount > 0 && (
                                            <button className="btn btn-link text-decoration-none p-0 small" style={{color: '#b99a7b', fontSize: '0.8rem'}} onClick={markAllAsRead}>
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <ListGroup variant="flush" style={{maxHeight: '350px', overflowY: 'auto'}}>
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-muted small">No new notifications.</div>
                                        ) : (
                                            notifications.map(noti => (
                                                <ListGroup.Item 
                                                    key={noti.id} 
                                                    action 
                                                    onClick={() => handleNotificationClick(noti)} 
                                                    className={`border-bottom py-3 ${!noti.is_read ? 'bg-light' : ''}`}
                                                    style={{borderLeft: !noti.is_read ? '3px solid #b99a7b' : 'none'}}
                                                >
                                                    <p className="mb-1 text-dark small">{noti.message}</p>
                                                    <small className="text-muted" style={{fontSize: '0.75rem'}}>{timeAgo(noti.created_at)}</small>
                                                </ListGroup.Item>
                                            ))
                                        )}
                                    </ListGroup>
                                </Dropdown.Menu>
                            </Dropdown>
                        </li>
                        
                        {/* User Profile & Logout */}
                        <li className="nav-item d-flex align-items-center border-start ps-3">
                            <div className="d-flex align-items-center gap-2">
                                <div className="d-none d-md-block text-end me-2">
                                    <span className="d-block fw-bold text-dark" style={{fontSize: '0.9rem'}}>Administrator</span>
                                </div>
                                <Dropdown align="end">
                                    <Dropdown.Toggle as="div" style={{cursor: 'pointer'}}>
                                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border" style={{width: '40px', height: '40px'}}>
                                            <PersonCircle size={24} className="text-secondary"/>
                                        </div>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="shadow border-0 mt-2">
                                        <Dropdown.Item onClick={handleLogout} className="text-danger fw-medium">
                                            Logout
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </li>

                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default AdminHeader;
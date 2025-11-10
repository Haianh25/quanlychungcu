// frontend/src/components/layout/AdminHeader.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios'; // Import axios
import { Dropdown, ListGroup, Badge } from 'react-bootstrap'; // Import components
import { BellFill } from 'react-bootstrap-icons'; // Import icon

// --- (THÊM MỚI) Hàm tính thời gian tương đối ---
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
    const navigate = useNavigate();
    const location = useLocation(); // Thêm location

    // --- (THÊM MỚI) State cho thông báo ---
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const getAuthToken = () => {
        return localStorage.getItem('adminToken');
    }

    // --- (THÊM MỚI) Hàm lấy thông báo (dùng useCallback) ---
    const fetchNotifications = useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/notifications', config);
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
            // Nếu token hết hạn (401) thì tự động logout
            if (err.response && err.response.status === 401) {
                handleLogout();
            }
        }
    }, []); // Thêm mảng rỗng
    
    // --- (THÊM MỚI) useEffect để lấy thông báo khi tải trang/chuyển trang admin ---
    useEffect(() => {
        fetchNotifications();
        
        // Thêm bộ đếm thời gian để fetch lại thông báo sau mỗi 1 phút
        const intervalId = setInterval(fetchNotifications, 60000); // 60000ms = 1 phút

        // Dọn dẹp interval khi component unmount
        return () => clearInterval(intervalId);

    }, [location.pathname, fetchNotifications]); // Chạy lại khi chuyển trang admin

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    // --- (THÊM MỚI) Logic xử lý thông báo ---
    const handleBellClick = () => {
        setShowNotifications(!showNotifications); 
        // Khi mở, nếu có thông báo chưa đọc, đánh dấu đã đọc
        if (!showNotifications && unreadCount > 0) {
            markAllAsRead();
        }
    };

    const markAllAsRead = async () => {
        const token = getAuthToken();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/notifications/mark-read', {}, config);
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error("Failed to mark notifications as read:", err);
        }
    };

    // Hàm xử lý khi click vào 1 thông báo
    const handleNotificationClick = (notification) => {
        setShowNotifications(false); // Đóng dropdown
        navigate(notification.link_to || '/admin/dashboard'); // Chuyển trang
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;
    // --- (KẾT THÚC THÊM MỚI) ---


    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm"> 
            <div className="container-fluid px-4">
                <Link className="navbar-brand" to="/admin/dashboard">
                    Admin Dashboard
                </Link>
                <div className="collapse navbar-collapse" id="navbarNav">
                    {/* SỬA: Thêm d-flex và align-items-center */}
                    <ul className="navbar-nav ms-auto d-flex align-items-center">
                        
                        {/* --- (THÊM MỚI) Chuông thông báo --- */}
                        <li className="nav-item admin-header-bell">
                            <Dropdown show={showNotifications} onToggle={handleBellClick}>
                                <Dropdown.Toggle as="button" className="admin-notification-btn" title="Notifications">
                                    <BellFill />
                                    {unreadCount > 0 && (
                                        <Badge pill bg="danger" className="admin-notification-badge">{unreadCount}</Badge>
                                    )}
                                </Dropdown.Toggle>

                                <Dropdown.Menu as="div" className="admin-notification-dropdown" align="end">
                                    <div className="admin-notification-header">
                                        <h6>Thông báo</h6>
                                        {unreadCount > 0 && (
                                            <button className="mark-all-read" onClick={markAllAsRead}>
                                                Đánh dấu tất cả đã đọc
                                            </button>
                                        )}
                                    </div>
                                    <ListGroup variant="flush">
                                        {notifications.length === 0 ? (
                                            <div className="admin-notification-empty">Không có thông báo mới.</div>
                                        ) : (
                                            notifications.map(noti => (
                                                <ListGroup.Item 
                                                    key={noti.id} 
                                                    action // Thêm 'action' để có hiệu ứng hover
                                                    onClick={() => handleNotificationClick(noti)} 
                                                    className="admin-notification-item"
                                                >
                                                    <p className="mb-1">{noti.message}</p>
                                                    <small>{timeAgo(noti.created_at)}</small>
                                                </ListGroup.Item>
                                            ))
                                        )}
                                    </ListGroup>
                                </Dropdown.Menu>
                            </Dropdown>
                        </li>
                        {/* --- (KẾT THÚC THÊM MỚI) --- */}
                        
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
// frontend/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Tabs, Tab, Card, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import './ProfilePage.css'; // Import CSS

const API_BASE_URL = 'http://localhost:5000';

const ProfilePage = () => {
    const [key, setKey] = useState('details'); // Tab mặc định
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // Lỗi chung

    // State cho Tab 1: Chi tiết
    const [detailsFormData, setDetailsFormData] = useState({ fullName: '', email: '', phone: '' });
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState('');
    const [detailsSuccess, setDetailsSuccess] = useState('');

    // State cho Tab 2: Mật khẩu
    const [passFormData, setPassFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');

    // Lấy token (dùng cho user thường)
    const getUserAuthConfig = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Vui lòng đăng nhập để xem hồ sơ.");
            return null;
        }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    // Tải thông tin hồ sơ khi load trang
    useEffect(() => {
        const fetchProfile = async () => {
            const config = getUserAuthConfig();
            if (!config) { setLoading(false); return; }
            setLoading(true); setError('');
            try {
                const res = await axios.get(`${API_BASE_URL}/api/profile/me`, config);
                setDetailsFormData({
                    fullName: res.data.full_name || '',
                    email: res.data.email || '',
                    phone: res.data.phone || ''
                });
            } catch (err) {
                console.error("Lỗi tải hồ sơ:", err);
                setError(err.response?.data?.message || "Không thể tải thông tin hồ sơ.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [getUserAuthConfig]); // Chỉ gọi lại khi hàm get config thay đổi

    // Xử lý thay đổi form
    const handleDetailsChange = (e) => {
        setDetailsFormData({ ...detailsFormData, [e.target.name]: e.target.value });
    };
    const handlePassChange = (e) => {
        setPassFormData({ ...passFormData, [e.target.name]: e.target.value });
    };

    // Submit Tab 1: Cập nhật thông tin
    const handleDetailsSubmit = async (e) => {
        e.preventDefault();
        const config = getUserAuthConfig();
        if (!config) return;
        setDetailsLoading(true); setDetailsError(''); setDetailsSuccess('');
        try {
            const res = await axios.put(`${API_BASE_URL}/api/profile/update-details`, {
                fullName: detailsFormData.fullName,
                email: detailsFormData.email,
                phone: detailsFormData.phone
            }, config);
            setDetailsSuccess(res.data.message || 'Cập nhật thành công!');
            // Cập nhật lại form data (ví dụ nếu backend có chuẩn hóa dữ liệu)
            setDetailsFormData({
                 fullName: res.data.user.full_name,
                 email: res.data.user.email,
                 phone: res.data.user.phone
            });
        } catch (err) {
            console.error("Lỗi cập nhật chi tiết:", err);
            setDetailsError(err.response?.data?.message || "Cập nhật thất bại.");
        } finally {
            setDetailsLoading(false);
        }
    };

    // Submit Tab 2: Đổi mật khẩu
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const config = getUserAuthConfig();
        if (!config) return;
        setPassLoading(true); setPassError(''); setPassSuccess('');
        try {
            const res = await axios.put(`${API_BASE_URL}/api/profile/change-password`, {
                currentPassword: passFormData.currentPassword,
                newPassword: passFormData.newPassword,
                confirmPassword: passFormData.confirmPassword
            }, config);
            setPassSuccess(res.data.message || 'Đổi mật khẩu thành công!');
            setPassFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset form
        } catch (err) {
            console.error("Lỗi đổi mật khẩu:", err);
            setPassError(err.response?.data?.message || "Đổi mật khẩu thất bại.");
        } finally {
            setPassLoading(false);
        }
    };


    if (loading) {
        return <Container className="profile-page-container text-center p-5"><Spinner animation="border" /></Container>;
    }

    return (
        <Container className="profile-page-container my-4">
            <h2 className="mb-4 text-white">Profile</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
                {/* === TAB 1: THÔNG TIN CHI TIẾT === */}
                <Tab eventKey="details" title="Thông tin chi tiết">
                    <Card className="profile-form-card">
                        <Card.Body>
                            <Form onSubmit={handleDetailsSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Họ và tên</Form.Label>
                                            <Form.Control type="text" name="fullName" value={detailsFormData.fullName} onChange={handleDetailsChange} required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone Number</Form.Label>
                                            <Form.Control type="tel" name="phone" value={detailsFormData.phone} onChange={handleDetailsChange} required />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" name="email" value={detailsFormData.email} onChange={handleDetailsChange} required />
                                   
                                </Form.Group>
                                
                                {detailsError && <Alert variant="danger" className="mt-3">{detailsError}</Alert>}
                                {detailsSuccess && <Alert variant="success" className="mt-3">{detailsSuccess}</Alert>}

                                <div className="text-end">
                                    <Button variant="primary" type="submit" disabled={detailsLoading}>
                                        {detailsLoading ? <Spinner as="span" size="sm" /> : 'Save Changes'}
                                    </Button>
                                    
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* === TAB 2: ĐỔI MẬT KHẨU === */}
                <Tab eventKey="password" title="Change Password">
                     <Card className="profile-form-card">
                        <Card.Body>
                             <Form onSubmit={handlePasswordSubmit}>
                                 <Form.Group className="mb-3">
                                    <Form.Label>Current Password</Form.Label>
                                    <Form.Control type="password" name="currentPassword" value={passFormData.currentPassword} onChange={handlePassChange} required />
                                </Form.Group>
                                 <Form.Group className="mb-3">
                                    <Form.Label>New Password</Form.Label>
                                    <Form.Control type="password" name="newPassword" value={passFormData.newPassword} onChange={handlePassChange} required />
                                </Form.Group>
                                 <Form.Group className="mb-3">
                                    <Form.Label>Confirm New Password</Form.Label>
                                    <Form.Control type="password" name="confirmPassword" value={passFormData.confirmPassword} onChange={handlePassChange} required />
                                </Form.Group>

                                {passError && <Alert variant="danger" className="mt-3">{passError}</Alert>}
                                {passSuccess && <Alert variant="success" className="mt-3">{passSuccess}</Alert>}

                                <div className="text-end">
                                    <Button variant="primary" type="submit" disabled={passLoading}>
                                        {passLoading ? <Spinner as="span" size="sm" /> : 'Change Password'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default ProfilePage;
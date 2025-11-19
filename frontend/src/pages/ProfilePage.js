import React, { useState, useEffect, useCallback } from 'react';
import { Container, Tabs, Tab, Card, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import './ProfilePage.css'; 

const API_BASE_URL = 'http://localhost:5000';

const ProfilePage = () => {
    const [key, setKey] = useState('details');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [detailsFormData, setDetailsFormData] = useState({ fullName: '', email: '', phone: '' });
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState('');
    const [detailsSuccess, setDetailsSuccess] = useState('');
    
    const [passFormData, setPassFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');

    const getUserAuthConfig = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Please log in to view profile.");
            return null;
        }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

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
                console.error("Error loading profile:", err);
                setError(err.response?.data?.message || "Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [getUserAuthConfig]);

    const handleDetailsChange = (e) => {
        setDetailsFormData({ ...detailsFormData, [e.target.name]: e.target.value });
    };

    const handlePassChange = (e) => {
        setPassFormData({ ...passFormData, [e.target.name]: e.target.value });
    };

    const handleDetailsSubmit = async (e) => {
        e.preventDefault();
        const config = getUserAuthConfig();
        if (!config) return;
        setDetailsLoading(true); setDetailsError(''); setDetailsSuccess('');
        
        try {
            // Chỉ gửi Phone lên server
            const res = await axios.put(`${API_BASE_URL}/api/profile/update-details`, {
                phone: detailsFormData.phone
            }, config);

            setDetailsSuccess(res.data.message || 'Update successful!');
            // Update state với dữ liệu mới từ server trả về
            setDetailsFormData(prev => ({
                ...prev,
                phone: res.data.user.phone
            }));
        } catch (err) {
            console.error("Update error:", err);
            setDetailsError(err.response?.data?.message || "Update failed.");
        } finally {
            setDetailsLoading(false);
        }
    };

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
            setPassSuccess(res.data.message || 'Password changed successfully!');
            setPassFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err)
        {
            console.error("Password change error:", err);
            setPassError(err.response?.data?.message || "Failed to change password.");
        } finally {
            setPassLoading(false);
        }
    };

    if (loading) {
        return <Container className="profile-page-container text-center p-5"><Spinner animation="border" /></Container>;
    }

    return (
        <Container className="profile-page-container my-5 fadeIn">
            <h2 className="mb-4 profile-page-title">Your Profile</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3 residem-tabs">
                
                {/* === TAB 1: THÔNG TIN CHI TIẾT === */}
                <Tab eventKey="details" title="Profile Details">
                    <Card className="profile-form-card">
                        <Card.Body>
                            <Form onSubmit={handleDetailsSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Full Name</Form.Label>
                                            {/* KHÓA: Disabled & ReadOnly */}
                                            <Form.Control 
                                                type="text" 
                                                value={detailsFormData.fullName} 
                                                disabled 
                                                className="bg-light"
                                                title="Contact Admin to change name"
                                            />
                                            <Form.Text className="text-muted small">
                                                * Name cannot be changed. Contact Admin for corrections.
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone Number</Form.Label>
                                            <Form.Control 
                                                type="tel" 
                                                name="phone" 
                                                value={detailsFormData.phone} 
                                                onChange={handleDetailsChange} 
                                                required 
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    {/* KHÓA: Disabled & ReadOnly */}
                                    <Form.Control 
                                        type="email" 
                                        value={detailsFormData.email} 
                                        disabled 
                                        className="bg-light"
                                        title="Email cannot be changed"
                                    />
                                    <Form.Text className="text-muted small">
                                        * Email is your login identifier and cannot be changed directly.
                                    </Form.Text>
                                </Form.Group>
                            
                                {detailsError && <Alert variant="danger" className="mt-3">{detailsError}</Alert>}
                                {detailsSuccess && <Alert variant="success" className="mt-3">{detailsSuccess}</Alert>}

                                <div className="text-end mt-4">
                                    <Button className="btn-residem-primary" type="submit" disabled={detailsLoading}>
                                        {detailsLoading ? <Spinner as="span" size="sm" /> : 'Save Phone Number'}
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

                                <div className="text-end mt-4">
                                    <Button className="btn-residem-primary" type="submit" disabled={passLoading}>
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
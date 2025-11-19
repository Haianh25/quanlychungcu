import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { PeopleFill, CarFrontFill, Newspaper, CashCoin, ArrowUpRight, GraphUp } from 'react-bootstrap-icons';
import './AdminDashboard.css'; // CSS riêng

const API_BASE_URL = 'http://localhost:5000';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = useCallback(async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard/stats`, config);
            setStats(res.data);
        } catch (err) {
            setError('Could not load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Format tiền tệ
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!stats) return null;

    // Tính % thanh toán
    const paymentProgress = stats.bills.total_expected > 0 
        ? (stats.bills.collected / stats.bills.expected) * 100 
        : 0;

    return (
        <div className="dashboard-container fadeIn">
            <h2 className="page-main-title mb-4">Dashboard Overview</h2>
            
            {/* --- HÀNG 1: CÁC THẺ THỐNG KÊ CHÍNH --- */}
            <Row className="g-4 mb-4">
                {/* 1. Residents */}
                <Col md={6} xl={3}>
                    <Card className="dashboard-card h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 fw-bold text-uppercase small">Total Residents</p>
                                    <h3 className="mb-0 fw-bold text-dark">{stats.residents.total}</h3>
                                </div>
                                <div className="dashboard-icon-box bg-primary-soft">
                                    <PeopleFill className="text-primary-accent" size={24}/>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="badge bg-success-soft text-success me-2">
                                    <ArrowUpRight /> +{stats.residents.new}
                                </span>
                                <span className="text-muted small">New this month</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 2. Revenue */}
                <Col md={6} xl={3}>
                    <Card className="dashboard-card h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 fw-bold text-uppercase small">Monthly Revenue</p>
                                    <h4 className="mb-0 fw-bold text-dark">{formatCurrency(stats.bills.collected)}</h4>
                                </div>
                                <div className="dashboard-icon-box bg-success-soft">
                                    <CashCoin className="text-success" size={24}/>
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="d-flex justify-content-between small mb-1">
                                    <span className="text-muted">Collected</span>
                                    <span className="fw-bold">{Math.round(paymentProgress)}%</span>
                                </div>
                                <ProgressBar variant="success" now={paymentProgress} style={{height: '6px'}} />
                                <div className="mt-2 small text-muted">
                                    Target: {formatCurrency(stats.bills.expected)}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 3. Vehicles */}
                <Col md={6} xl={3}>
                    <Card className="dashboard-card h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 fw-bold text-uppercase small">Active Vehicles</p>
                                    <h3 className="mb-0 fw-bold text-dark">{stats.vehicles}</h3>
                                </div>
                                <div className="dashboard-icon-box bg-warning-soft">
                                    <CarFrontFill className="text-warning" size={24}/>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-muted small">Total parking spots occupied</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 4. News / Activities */}
                <Col md={6} xl={3}>
                    <Card className="dashboard-card h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 fw-bold text-uppercase small">News Posted</p>
                                    <h3 className="mb-0 fw-bold text-dark">{stats.news}</h3>
                                </div>
                                <div className="dashboard-icon-box bg-info-soft">
                                    <Newspaper className="text-info" size={24}/>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-muted small"> updates published this month</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* --- HÀNG 2: BIỂU ĐỒ HOẶC CHI TIẾT HÓA ĐƠN (Placeholder để trang đỡ trống) --- */}
            <Row>
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Billing Status (This Month)</h5>
                        </Card.Header>
                        <Card.Body className="d-flex align-items-center justify-content-center" style={{minHeight: '200px'}}>
                             {/* Chỗ này sau này có thể vẽ biểu đồ tròn (Pie Chart) */}
                             <div className="text-center">
                                <GraphUp size={40} className="text-muted mb-3 opacity-50"/>
                                <p className="text-muted">
                                    Paid: <strong>{stats.bills.paid}</strong> / Unpaid: <strong>{stats.bills.count - stats.bills.paid}</strong>
                                </p>
                             </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100 bg-primary-accent text-white welcome-card">
                        <Card.Body className="p-4 d-flex flex-column justify-content-center">
                            <h3>Welcome Admin!</h3>
                            <p className="opacity-75 mb-4">
                                Manage your apartment complex efficiently. Check the sidebar for management tools.
                            </p>
                            <button className="btn btn-light fw-bold text-primary-accent align-self-start">View Reports</button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;
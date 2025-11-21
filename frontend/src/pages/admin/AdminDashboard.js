import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, ProgressBar, Badge } from 'react-bootstrap';
import axios from 'axios';
// [MỚI] Import thêm icon ExclamationTriangle
import { PeopleFill, CarFrontFill, CashCoin, ArrowUpRight, GraphUp, ExclamationTriangleFill } from 'react-bootstrap-icons';
import './AdminDashboard.css'; 

// --- CHART.JS IMPORTS ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!stats) return null;

    const paymentProgress = stats.bills.total_expected > 0 
        ? (stats.bills.collected / stats.bills.expected) * 100 
        : 0;

    // --- CHART DATA ---
    const revenueLabels = stats.charts?.revenue_history.map(item => item.month) || [];
    const revenueExpected = stats.charts?.revenue_history.map(item => item.expected) || [];
    const revenueCollected = stats.charts?.revenue_history.map(item => item.collected) || [];

    const barChartData = {
        labels: revenueLabels,
        datasets: [
            {
                label: 'Collected',
                data: revenueCollected,
                backgroundColor: 'rgba(25, 135, 84, 0.7)', 
                borderColor: 'rgba(25, 135, 84, 1)',
                borderWidth: 1,
            },
            {
                label: 'Expected',
                data: revenueExpected,
                backgroundColor: 'rgba(185, 154, 123, 0.5)',
                borderColor: 'rgba(185, 154, 123, 1)',
                borderWidth: 1,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Revenue Overview (Last 6 Months)' },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        if (value >= 1000000) return value / 1000000 + 'M';
                        if (value >= 1000) return value / 1000 + 'k';
                        return value;
                    }
                }
            }
        }
    };

    const statusCounts = { paid: 0, unpaid: 0, overdue: 0 };
    if (stats.charts?.bill_status) {
        stats.charts.bill_status.forEach(item => {
            if (statusCounts[item.status] !== undefined) {
                statusCounts[item.status] = item.count;
            }
        });
    }

    const doughnutData = {
        labels: ['Paid', 'Unpaid', 'Overdue'],
        datasets: [
            {
                label: '# of Bills',
                data: [statusCounts.paid, statusCounts.unpaid, statusCounts.overdue],
                backgroundColor: ['rgba(25, 135, 84, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(220, 53, 69, 0.7)'],
                borderColor: ['rgba(25, 135, 84, 1)', 'rgba(255, 193, 7, 1)', 'rgba(220, 53, 69, 1)'],
                borderWidth: 1,
            },
        ],
    };

    // [MỚI] Tính tổng việc cần làm
    const totalPending = (stats.pending_actions?.vehicles || 0) + (stats.pending_actions?.residents || 0);

    return (
        <div className="dashboard-container fadeIn">
            <h2 className="page-main-title mb-4">Dashboard Overview</h2>
            
            {/* --- ROW 1: STATS CARDS --- */}
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

                {/* 4. [MỚI] Action Required (Thay thế News) */}
                <Col md={6} xl={3}>
                    <Card className="dashboard-card h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 fw-bold text-uppercase small">Action Required</p>
                                    <h3 className={`mb-0 fw-bold ${totalPending > 0 ? 'text-danger' : 'text-dark'}`}>
                                        {totalPending}
                                    </h3>
                                </div>
                                <div className="dashboard-icon-box bg-danger-soft" style={{backgroundColor: 'rgba(220, 53, 69, 0.15)'}}>
                                    <ExclamationTriangleFill className="text-danger" size={24}/>
                                </div>
                            </div>
                            <div className="mt-3">
                                {totalPending === 0 ? (
                                    <span className="text-success small"><i className="bi bi-check-circle me-1"></i>All caught up!</span>
                                ) : (
                                    <div className="d-flex flex-column small">
                                        {stats.pending_actions.vehicles > 0 && (
                                            <span className="text-danger mb-1">
                                                <strong>{stats.pending_actions.vehicles}</strong> vehicle requests
                                            </span>
                                        )}
                                        {stats.pending_actions.residents > 0 && (
                                            <span className="text-warning text-dark">
                                                <strong>{stats.pending_actions.residents}</strong> users waiting
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* --- ROW 2: CHARTS --- */}
            <Row className="g-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div style={{ height: '350px' }}>
                                <Bar data={barChartData} options={barChartOptions} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Bill Status (This Month)</h5>
                        </Card.Header>
                        <Card.Body className="d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                            <div style={{ width: '100%', maxWidth: '280px' }}>
                                <Doughnut data={doughnutData} />
                            </div>
                        </Card.Body>
                        <Card.Footer className="bg-white border-0 text-center pb-4">
                            <small className="text-muted">Total Bills: <strong>{stats.bills.count}</strong></small>
                        </Card.Footer>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;
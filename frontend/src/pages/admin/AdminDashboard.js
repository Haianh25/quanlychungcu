import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import { Row, Col, Card, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { PeopleFill, CarFrontFill, CashCoin, ArrowUpRight, GraphUp, ExclamationTriangleFill, Newspaper } from 'react-bootstrap-icons';
import './AdminDashboard.css';

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API_BASE_URL = 'http://localhost:5000';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isFirstLoad = useRef(true); // Ref để check lần load đầu tiên

    const fetchStats = useCallback(async (isPolling = false) => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard/stats`, config);
            setStats(res.data);
        } catch (err) {
            if (!isPolling) setError('Could not load dashboard data.');
        } finally {
            setLoading(false);
            if (!isPolling) isFirstLoad.current = false; // Đánh dấu đã xong lần load đầu
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const intervalId = setInterval(() => {
            fetchStats(true);
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(intervalId);
    }, [fetchStats]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN').format(val) + ' VND';
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="secondary" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!stats) return null;

    const paymentProgress = stats.bills.total_expected > 0
        ? (stats.bills.collected / stats.bills.expected) * 100
        : 0;

    const revenueLabels = stats.charts?.revenue_history.map(item => item.month) || [];
    const revenueExpected = stats.charts?.revenue_history.map(item => item.expected) || [];
    const revenueCollected = stats.charts?.revenue_history.map(item => item.collected) || [];

    const barChartData = {
        labels: revenueLabels,
        datasets: [
            {
                label: 'Collected',
                data: revenueCollected,
                backgroundColor: 'rgba(25, 135, 84, 0.85)',
                hoverBackgroundColor: 'rgba(25, 135, 84, 1)',
                borderRadius: 4,
                barPercentage: 0.6,
                borderWidth: 0,
            },
            {
                label: 'Expected',
                data: revenueExpected,
                backgroundColor: 'rgba(185, 154, 123, 0.5)',
                hoverBackgroundColor: 'rgba(185, 154, 123, 0.7)',
                borderRadius: 4,
                barPercentage: 0.6,
                borderWidth: 0,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: isFirstLoad.current ? 1000 : 0 // Chỉ animate lần đầu
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: { usePointStyle: true, boxWidth: 8, padding: 20, font: { family: "'Be Vietnam Pro', sans-serif" } }
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 10,
                cornerRadius: 8,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { borderDash: [4, 4], color: '#f0f0f0', drawBorder: false },
                ticks: {
                    font: { family: "'Be Vietnam Pro', sans-serif", size: 11 },
                    callback: function (value) {
                        if (value >= 1000000) return value / 1000000 + 'M';
                        if (value >= 1000) return value / 1000 + 'k';
                        return value;
                    }
                }
            },
            x: {
                grid: { display: false },
                ticks: { font: { family: "'Be Vietnam Pro', sans-serif", size: 11 } }
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
        datasets: [{
            data: [statusCounts.paid, statusCounts.unpaid, statusCounts.overdue],
            backgroundColor: ['#198754', '#ffc107', '#dc3545'],
            borderWidth: 0,
            hoverOffset: 5
        }],
    };

    const doughnutOptions = {
        cutout: '75%',
        animation: {
            duration: isFirstLoad.current ? 1000 : 0 // Chỉ animate lần đầu
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, padding: 20, font: { family: "'Be Vietnam Pro', sans-serif", size: 12 } }
            }
        }
    };

    const totalPending = (stats.pending_actions?.vehicles || 0) + (stats.pending_actions?.residents || 0);

    return (
        <div className="dashboard-container fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="page-main-title mb-0">Dashboard Overview</h2>
                {/* Chỉ báo Live Update */}
                <div className="live-indicator">
                     <span className="pulsating-circle"></span> Live Updating
                </div>
            </div>

            <Row className="g-4 mb-4">
                {/* ... (Giữ nguyên phần Cards Residents, Revenue, Vehicles, Action Required) ... */}
                 {/* 1. Residents */}
                 <Col md={6} xl={3}>
                    <Card className="dashboard-card">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="stat-label">Total Residents</p>
                                    <h3 className="stat-value">{stats.residents.total}</h3>
                                </div>
                                <div className="dashboard-icon-box bg-primary-soft">
                                    <PeopleFill />
                                </div>
                            </div>
                            <div className="mt-3 d-flex align-items-center">
                                <span className="badge bg-success bg-opacity-10 text-success badge-trend me-2">
                                    <ArrowUpRight /> +{stats.residents.new}
                                </span>
                                <span className="text-muted small">New this month</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 2. Revenue */}
                <Col md={6} xl={3}>
                    <Card className="dashboard-card">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="stat-label">Monthly Revenue</p>
                                    <h4 className="stat-value">{formatCurrency(stats.bills.collected)}</h4>
                                </div>
                                <div className="dashboard-icon-box bg-success-soft">
                                    <CashCoin />
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="d-flex justify-content-between small mb-1 text-muted">
                                    <span>Collection Rate</span>
                                    <span className="fw-bold text-dark">{Math.round(paymentProgress)}%</span>
                                </div>
                                <ProgressBar now={paymentProgress} variant="success" className="progress-custom" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 3. Vehicles */}
                <Col md={6} xl={3}>
                    <Card className="dashboard-card">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="stat-label">Active Vehicles</p>
                                    <h3 className="stat-value">{stats.vehicles}</h3>
                                </div>
                                <div className="dashboard-icon-box bg-info-soft">
                                    <CarFrontFill />
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-muted small">Parking utilization</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 4. Action Required */}
                <Col md={6} xl={3}>
                    <Card className={`dashboard-card action-required-card ${totalPending > 0 ? 'has-pending' : 'all-clear'}`}>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="stat-label">Action Required</p>
                                    <h3 className={`stat-value ${totalPending > 0 ? 'text-danger' : 'text-success'}`}>
                                        {totalPending}
                                    </h3>
                                </div>
                                <div className={`dashboard-icon-box ${totalPending > 0 ? 'bg-danger-soft' : 'bg-success-soft'}`}>
                                    {totalPending > 0 ? <ExclamationTriangleFill /> : <GraphUp />}
                                </div>
                            </div>
                            <div className="mt-3 small">
                                {totalPending === 0 ? (
                                    <span className="text-success fw-bold"><i className="bi bi-check-circle me-1"></i>All caught up!</span>
                                ) : (
                                    <div className="d-flex flex-column gap-1">
                                        {stats.pending_actions.vehicles > 0 && (
                                            <span className="text-danger fw-medium">
                                                • <strong>{stats.pending_actions.vehicles}</strong> vehicle requests
                                            </span>
                                        )}
                                        {stats.pending_actions.residents > 0 && (
                                            <span className="text-warning text-dark fw-medium">
                                                • <strong>{stats.pending_actions.residents}</strong> users waiting
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col lg={8}>
                    <Card className="dashboard-card">
                        <Card.Body>
                            <h5 className="fw-bold mb-4 text-dark" style={{ fontSize: '1.1rem' }}>Revenue History</h5>
                            <div style={{ height: '350px' }}>
                                <Bar data={barChartData} options={barChartOptions} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="dashboard-card">
                        <Card.Header>
                            <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.1rem' }}>Bill Status</h5>
                            <small className="text-muted">Current Month Overview</small>
                        </Card.Header>
                        <Card.Body className="d-flex align-items-center justify-content-center" style={{ minHeight: '280px' }}>
                            <div style={{ width: '80%', position: 'relative' }}>
                                <Doughnut data={doughnutData} options={doughnutOptions} />
                                <div style={{
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                    textAlign: 'center', pointerEvents: 'none'
                                }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#333' }}>{stats.bills.count}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase' }}>Invoices</div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;
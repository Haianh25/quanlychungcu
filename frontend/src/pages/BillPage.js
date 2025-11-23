import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Tabs, Tab, Card, Button, Spinner, Alert, Table, Badge, Row, Col, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import './BillPage.css'; // Import CSS
import PayPalPayment from '../components/PayPalbutton';

const API_BASE_URL = 'http://localhost:5000';

const BillPage = () => {
    // --- TOÀN BỘ LOGIC GỐC CỦA BẠN (GIỮ NGUYÊN) ---
    const [key, setKey] = useState('unpaid');
    const [allBills, setAllBills] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingBillId, setProcessingBillId] = useState(null);
    const [paymentError, setPaymentError] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState('');

    const getAuthConfig = useCallback(() => {
        const token = localStorage.getItem('token'); 
        if (!token) { setError("Please Login."); return null; }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    const fetchData = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) { setLoading(false); return; }
        if (allBills.length === 0) setLoading(true); 
        setError('');
        
        try {
            const [billsRes, transRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/bills/my-bills-detailed`, config),
                axios.get(`${API_BASE_URL}/api/bills/my-transactions`, config)
            ]);
            setAllBills(billsRes.data.bills || []);
            setTransactions(transRes.data || []);
        } catch (err) {
            console.error('Error loading bill data:', err);
            setError(err.response?.data?.message || 'Could not load bill data.');
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig, allBills.length]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const { unpaidBills, paidBills } = useMemo(() => {
        const unpaid = allBills.filter(b => b.status === 'unpaid' || b.status === 'overdue');
        const paid = allBills.filter(b => b.status === 'paid');
        return { unpaidBills: unpaid, paidBills: paid };
    }, [allBills]);

    // --- LOGIC MỚI CHO SIDEBAR ---
    const recentTransactions = useMemo(() => {
        // Sắp xếp transactions (mới nhất lên đầu) và lấy 3
        return [...transactions]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 3);
    }, [transactions]);

    const handlePaymentSuccess = (message) => {
        setPaymentSuccess(message);
        setPaymentError('');
        setProcessingBillId(null);
        fetchData();
    };

    const handlePaymentError = (message) => {
        setPaymentError(message);
        setPaymentSuccess('');
        setProcessingBillId(null);
    };

    // --- HELPER FORMAT (ĐÃ SỬA SANG TIẾNG ANH & FORMAT CHUẨN) ---
    
    const formatCurrency = (amount) => {
        // Dùng en-US để dấu phẩy ngăn cách hàng nghìn, nhưng vẫn giữ đơn vị VND
        return new Intl.NumberFormat('en-US').format(amount) + ' VND';
    };

    // [SỬA] Hiển thị tên Tháng/Năm tiếng Anh (VD: October 2025)
    const formatMonthHeader = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // [SỬA] Hiển thị ngày tháng năm chuẩn (DD/MM/YYYY)
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB'); 
    };

    const getStatusBadge = (status) => {
        if (status === 'unpaid') return <Badge bg="warning" text="dark">Unpaid</Badge>;
        if (status === 'overdue') return <Badge bg="danger">Overdue</Badge>;
        return <Badge bg="secondary">{status}</Badge>;
    };

    // --- RENDER FUNCTIONS (ĐÃ CẬP NHẬT) ---

    // Render Tab 1 (Unpaid)
    const renderUnpaidBills = () => {
        if (loading) return <div className="text-center p-5"><Spinner animation="border"/></div>;
        if (unpaidBills.length === 0) return <Alert variant="residem-info">You have no unpaid bills.</Alert>; 

        return unpaidBills.map(bill => (
            <Card className="unpaid-bill-card" key={bill.bill_id}>
                <Card.Header className="unpaid-bill-header">
                    <div>
                        {/* [SỬA] Tiêu đề tiếng Anh */}
                        <h4>{formatMonthHeader(bill.issue_date)}</h4>
                        {getStatusBadge(bill.status)}
                    </div>
                    {/* [SỬA] Ngày đến hạn chuẩn */}
                    <span className="due-date-text">Due Date: {formatDate(bill.due_date)}</span>
                </Card.Header>
                <Card.Body className="unpaid-bill-body">
                    {/* [THÊM] Ngày phát hành */}
                    <div className="text-muted small mb-3">
                        Issue Date: {formatDate(bill.issue_date)}
                    </div>

                    {bill.line_items.map(item => (
                        <div className="line-item" key={item.item_id}>
                            <span>{item.item_name}</span>
                            <span>{formatCurrency(item.total_item_amount)}</span>
                        </div>
                    ))}
                    <div className="line-item-total">
                        <span>TOTAL AMOUNT</span>
                        <span>{formatCurrency(bill.total_amount)}</span>
                    </div>
                </Card.Body>
                <Card.Footer className="unpaid-bill-footer">
                    <p className="payment-note">International payment via PayPal (USD)</p>
                    <PayPalPayment
                        bill={bill}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentError={handlePaymentError}
                        setProcessing={() => setProcessingBillId(bill.bill_id)}
                        isProcessing={processingBillId === bill.bill_id}
                    />
                </Card.Footer>
            </Card>
        ));
    };

    // Render Tab 2 (Paid)
    const renderPaidBills = () => {
        if (loading) return null;
        if (paidBills.length === 0) return <Alert variant="residem-info">No paid bills found.</Alert>; 

        return (
            <div className="table-wrapper"> 
                <Table striped hover responsive size="sm" className="residem-table">
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Billing Period</th>
                            <th>Total Amount</th>
                            <th>Payment Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paidBills.map(bill => (
                            <tr key={bill.bill_id}>
                                <td>#{bill.bill_id}</td>
                                <td>{formatMonthHeader(bill.issue_date)}</td>
                                <td>{formatCurrency(bill.total_amount)}</td>
                                <td>{formatDate(bill.updated_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    };

    // Render Tab 3 (Transaction History)
    const renderTransactionHistory = () => {
        if (loading) return null;
        if (transactions.length === 0) return <Alert variant="residem-info">No transaction history found.</Alert>; 
        
        return (
            <div className="table-wrapper"> 
                <Table striped hover responsive size="sm" className="residem-table history-table">
                    <thead>
                        <tr>
                            <th>Trans ID</th>
                            <th>Bill ID</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.transaction_id}>
                                <td className="transaction-id">{t.paypal_transaction_id || t.transaction_id}</td>
                                <td>#{t.bill_id}</td>
                                <td>{formatCurrency(t.amount)}</td>
                                <td>{t.payment_method}</td>
                                <td className={t.status === 'success' ? 'status-success' : (t.status === 'failed' ? 'status-failed' : '')}>
                                    {t.status}
                                </td>
                                <td>{formatDate(t.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    };

    // --- JSX CHÍNH ---
    return (
        <Container className="bill-page-container my-5 fadeIn">
            <Row>
                {/* === CỘT NỘI DUNG CHÍNH (8) === */}
                <Col lg={8}>
                    <h2 className="mb-4 page-main-title">Billing & Payments</h2>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {paymentError && <Alert variant="danger" onClose={() => setPaymentError('')} dismissible>{paymentError}</Alert>}
                    {paymentSuccess && <Alert variant="success" onClose={() => setPaymentSuccess('')} dismissible>{paymentSuccess}</Alert>}
                    
                    {/* Tabs */}
                    <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3 residem-tabs">
                        <Tab eventKey="unpaid" title={`Unpaid (${unpaidBills.length})`}>
                            {renderUnpaidBills()}
                        </Tab>
                        <Tab eventKey="paid" title="Paid Archive">
                            {renderPaidBills()}
                        </Tab>
                        <Tab eventKey="history" title="Transaction History">
                            {renderTransactionHistory()}
                        </Tab>
                    </Tabs>
                </Col>

                {/* === CỘT SIDEBAR (4) === */}
                <Col lg={4}>
                    <aside className="bill-sidebar">
                        
                        {/* Widget: Hỗ trợ thanh toán */}
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Payment Support</h5>
                            <ListGroup variant="flush" className="faq-list">
                                <ListGroup.Item>
                                    <strong>How to pay?</strong>
                                    <p>Select an unpaid bill and click the PayPal button. You will be redirected to complete the payment.</p>
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <strong>Having trouble?</strong>
                                    <p>If you encounter any issues, please contact support at: <br/><strong>contact.ptit@apartment.com</strong></p>
                                </ListGroup.Item>
                            </ListGroup>
                        </div>

                        {/* Widget: Hoạt động gần đây */}
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Recent Activity</h5>
                            <ListGroup variant="flush" className="recent-activity-list">
                                {loading ? (
                                    <Spinner animation="border" size="sm" />
                                ) : recentTransactions.length > 0 ? (
                                    recentTransactions.map(t => (
                                        <ListGroup.Item key={t.transaction_id} className="d-flex justify-content-between">
                                            <div className="activity-info">
                                                <span>{t.payment_method} Payment</span>
                                                <small className="text-muted">{formatDate(t.created_at)}</small>
                                            </div>
                                            <span className={`activity-amount ${t.status === 'success' ? 'status-success' : 'status-failed'}`}>
                                                {formatCurrency(t.amount)}
                                            </span>
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    <ListGroup.Item>No recent activity.</ListGroup.Item>
                                )}
                            </ListGroup>
                        </div>

                    </aside>
                </Col>
            </Row>
        </Container>
    );
};

export default BillPage;
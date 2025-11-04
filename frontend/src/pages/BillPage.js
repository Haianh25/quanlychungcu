// frontend/src/pages/BillPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Tabs, Tab, Card, Button, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import axios from 'axios';
import './BillPage.css'; // Import CSS

const API_BASE_URL = 'http://localhost:5000';

const BillPage = () => {
    const [key, setKey] = useState('unpaid'); // Default tab
    const [allBills, setAllBills] = useState([]);
    const [transactions, setTransactions] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for payment processing
    const [paymentLoadingBillId, setPaymentLoadingBillId] = useState(null); // ID of the bill being paid
    const [paymentError, setPaymentError] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState('');

    const getAuthConfig = useCallback(() => {
        const token = localStorage.getItem('token'); // User token
        if (!token) { setError("Please log in."); return null; }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    const fetchData = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) { setLoading(false); return; }
        setLoading(true); setError('');
        
        try {
            // Call both APIs simultaneously
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
    }, [getAuthConfig]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Categorize bills
    const { unpaidBills, paidBills } = useMemo(() => {
        const unpaid = allBills.filter(b => b.status === 'unpaid' || b.status === 'overdue');
        const paid = allBills.filter(b => b.status === 'paid');
        return { unpaidBills: unpaid, paidBills: paid };
    }, [allBills]);

    // Handle payment
    const handlePayment = async (billId, paymentMethod) => {
        const config = getAuthConfig();
        if (!config || !window.confirm(`Are you sure you want to pay bill #${billId} via ${paymentMethod}?`)) return;

        setPaymentLoadingBillId(billId); // Show spinner
        setPaymentError('');
        setPaymentSuccess('');

        try {
            const res = await axios.post(`${API_BASE_URL}/api/bills/create-payment`, { bill_id: billId, payment_method: paymentMethod }, config);
            setPaymentSuccess(res.data.message);
            // Reload all data
            await fetchData(); 
        } catch (err) {
            console.error("Payment error:", err);
            setPaymentError(err.response?.data?.message || "Payment failed.");
        } finally {
            setPaymentLoadingBillId(null); // Hide spinner
        }
    };

    // Helper formats
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatMonth = (dateStr) => {
        const date = new Date(dateStr);
        // Use UTC months/year as the date string is now 'YYYY-MM-DD'
        return `Month ${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
    };
    const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-GB'); // DD/MM/YYYY, HH:MM:SS
    const formatDueDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB'); // DD/MM/YYYY

    const getStatusBadge = (status) => {
        if (status === 'unpaid') return <Badge bg="warning" text="dark">Unpaid</Badge>;
        if (status === 'overdue') return <Badge bg="danger">Overdue</Badge>;
        return <Badge bg="secondary">{status}</Badge>;
    };

    // Render Tab 1 (Unpaid)
    const renderUnpaidBills = () => {
        if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
        if (unpaidBills.length === 0) return <Alert variant="success">You have no unpaid bills.</Alert>;

        return unpaidBills.map(bill => (
            <Card className="unpaid-bill-card" key={bill.id}>
                {paymentLoadingBillId === bill.id ? (
                    <div className="payment-loading">
                        <Spinner animation="border" />
                        <span>Processing payment...</span>
                    </div>
                ) : (
                    <>
                        <Card.Header className="unpaid-bill-header">
                            <div>
                                <h4>{formatMonth(bill.month_for)}</h4>
                                {getStatusBadge(bill.status)}
                            </div>
                            <span>Due Date: {formatDueDate(bill.due_date)}</span>
                        </Card.Header>
                        <Card.Body className="unpaid-bill-body">
                            {bill.line_items.map(item => (
                                <div className="line-item" key={item.id}>
                                    <span>{item.description}</span>
                                    <span>{formatCurrency(item.amount)}</span>
                                </div>
                            ))}
                            {bill.penalty_amount > 0 && (
                                <div className="line-item text-danger">
                                    <span>Overdue Penalty</span>
                                    <span>{formatCurrency(bill.penalty_amount)}</span>
                                </div>
                            )}
                            <div className="line-item-total">
                                <span>TOTAL</span>
                                <span>{formatCurrency(bill.total_amount)}</span>
                            </div>
                        </Card.Body>
                        <Card.Footer className="unpaid-bill-footer">
                            <Button variant="primary" className="me-2" onClick={() => handlePayment(bill.id, 'VNPAY')}>
                                Pay with VNPAY
                            </Button>
                            <Button variant="danger" onClick={() => handlePayment(bill.id, 'MOMO')}>
                                Pay with MOMO
                            </Button>
                        </Card.Footer>
                    </>
                )}
            </Card>
        ));
    };

    // Render Tab 2 (Paid)
    const renderPaidBills = () => {
        if (loading) return null;
        if (paidBills.length === 0) return <Alert variant="info">No paid bills found.</Alert>;

        return (
            <Table striped bordered hover responsive size="sm" variant="dark">
                <thead>
                    <tr><th>ID</th><th>Month</th><th>Total Amount</th><th>Paid At</th></tr>
                </thead>
                <tbody>
                    {paidBills.map(bill => (
                        <tr key={bill.id}>
                            <td>{bill.id}</td>
                            <td>{formatMonth(bill.month_for)}</td>
                            <td>{formatCurrency(bill.total_amount)}</td>
                            <td>{formatDate(bill.paid_at)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    // Render Tab 3 (Transaction History)
    const renderTransactionHistory = () => {
        if (loading) return null;
        if (transactions.length === 0) return <Alert variant="info">No transactions found.</Alert>;
        
        return (
            <Table striped bordered hover responsive size="sm" variant="dark" className="history-table">
                <thead>
                    <tr><th>Txn Code</th><th>Bill ID</th><th>Amount</th><th>Method</th><th>Status</th><th>Time</th></tr>
                </thead>
                <tbody>
                    {transactions.map(t => (
                        <tr key={t.id}>
                            <td>{t.transaction_code}</td>
                            <td>{t.bill_id}</td>
                            <td>{formatCurrency(t.amount)}</td>
                            <td>{t.payment_method}</td>
                            <td className={t.status === 'success' ? 'status-success' : (t.status === 'failed' ? 'status-failed' : '')}>
                                {t.status}
                            </td>
                            <td>{formatDate(t.processed_at || t.created_at)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    return (
        <Container className="bill-page-container my-4">
            <h2 className="mb-4 text-white">Service Bills</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {paymentError && <Alert variant="danger" onClose={() => setPaymentError('')} dismissible>{paymentError}</Alert>}
            {paymentSuccess && <Alert variant="success" onClose={() => setPaymentSuccess('')} dismissible>{paymentSuccess}</Alert>}
            
            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
                <Tab eventKey="unpaid" title="Unpaid">
                    {renderUnpaidBills()}
                </Tab>
                <Tab eventKey="paid" title="Paid">
                    {renderPaidBills()}
                </Tab>
                <Tab eventKey="history" title="Transaction History">
                    {renderTransactionHistory()}
                </Tab>
            </Tabs>
        </Container>
    );
};

export default BillPage;
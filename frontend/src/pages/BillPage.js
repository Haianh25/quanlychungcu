// frontend/src/pages/BillPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Tabs, Tab, Card, Button, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import axios from 'axios';
import './BillPage.css'; // Import CSS

const API_BASE_URL = 'http://localhost:5000';

const BillPage = () => {
    const [key, setKey] = useState('unpaid'); // Tab mặc định
    const [allBills, setAllBills] = useState([]);
    const [transactions, setTransactions] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State cho thanh toán
    const [paymentLoadingBillId, setPaymentLoadingBillId] = useState(null); // ID của bill đang thanh toán
    const [paymentError, setPaymentError] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState('');

    const getAuthConfig = useCallback(() => {
        const token = localStorage.getItem('token'); // User token
        if (!token) { setError("Vui lòng đăng nhập."); return null; }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    const fetchData = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) { setLoading(false); return; }
        setLoading(true); setError('');
        
        try {
            // Gọi cả 2 API cùng lúc
            const [billsRes, transRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/bills/my-bills-detailed`, config),
                axios.get(`${API_BASE_URL}/api/bills/my-transactions`, config)
            ]);
            
            setAllBills(billsRes.data.bills || []);
            setTransactions(transRes.data || []);
        } catch (err) {
            console.error('Lỗi tải dữ liệu hóa đơn:', err);
            setError(err.response?.data?.message || 'Không thể tải dữ liệu hóa đơn.');
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Phân loại hóa đơn
    const { unpaidBills, paidBills } = useMemo(() => {
        const unpaid = allBills.filter(b => b.status === 'unpaid' || b.status === 'overdue');
        const paid = allBills.filter(b => b.status === 'paid');
        return { unpaidBills: unpaid, paidBills: paid };
    }, [allBills]);

    // Xử lý thanh toán
    const handlePayment = async (billId, paymentMethod) => {
        const config = getAuthConfig();
        if (!config || !window.confirm(`Bạn có chắc muốn thanh toán hóa đơn #${billId} qua ${paymentMethod}?`)) return;

        setPaymentLoadingBillId(billId); // Hiển thị spinner
        setPaymentError('');
        setPaymentSuccess('');

        try {
            const res = await axios.post(`${API_BASE_URL}/api/bills/create-payment`, { bill_id: billId, payment_method: paymentMethod }, config);
            setPaymentSuccess(res.data.message);
            // Tải lại toàn bộ dữ liệu
            await fetchData(); 
        } catch (err) {
            console.error("Lỗi thanh toán:", err);
            setPaymentError(err.response?.data?.message || "Thanh toán thất bại.");
        } finally {
            setPaymentLoadingBillId(null); // Ẩn spinner
        }
    };

    // Helper format
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatMonth = (dateStr) => {
        const date = new Date(dateStr);
        return `Tháng ${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
    };
    const formatDate = (dateStr) => new Date(dateStr).toLocaleString('vi-VN');
    const getStatusBadge = (status) => {
        if (status === 'unpaid') return <Badge bg="warning" text="dark">Chưa thanh toán</Badge>;
        if (status === 'overdue') return <Badge bg="danger">Quá hạn</Badge>;
        return <Badge bg="secondary">{status}</Badge>;
    };

    // Render Tab 1 (Chưa thanh toán)
    const renderUnpaidBills = () => {
        if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
        if (unpaidBills.length === 0) return <Alert variant="success">Bạn không có hóa đơn nào cần thanh toán.</Alert>;

        return unpaidBills.map(bill => (
            <Card className="unpaid-bill-card" key={bill.id}>
                {paymentLoadingBillId === bill.id ? (
                    // Hiển thị loading overlay khi đang thanh toán bill này
                    <div className="payment-loading">
                        <Spinner animation="border" />
                        <span>Đang xử lý thanh toán...</span>
                    </div>
                ) : (
                    <>
                        <Card.Header className="unpaid-bill-header">
                            <div>
                                <h4>{formatMonth(bill.month_for)}</h4>
                                {getStatusBadge(bill.status)}
                            </div>
                            <span>Hạn chót: {new Date(bill.due_date).toLocaleDateString('vi-VN')}</span>
                        </Card.Header>
                        <Card.Body className="unpaid-bill-body">
                            {bill.line_items.map(item => (
                                <div className="line-item" key={item.id}>
                                    <span>{item.description}</span>
                                    <span>{formatCurrency(item.amount)}</span>
                                </div>
                            ))}
                            {/* Hiển thị phí phạt nếu có */}
                            {bill.penalty_amount > 0 && (
                                <div className="line-item text-danger">
                                    <span>Phí phạt quá hạn</span>
                                    <span>{formatCurrency(bill.penalty_amount)}</span>
                                </div>
                            )}
                            <div className="line-item-total">
                                <span>TỔNG CỘNG</span>
                                <span>{formatCurrency(bill.total_amount)}</span>
                            </div>
                        </Card.Body>
                        <Card.Footer className="unpaid-bill-footer">
                            {/* Nút thanh toán (Giả lập 2 cổng) */}
                            <Button variant="primary" className="me-2" onClick={() => handlePayment(bill.id, 'VNPAY')}>
                                Thanh toán VNPAY
                            </Button>
                            <Button variant="danger" onClick={() => handlePayment(bill.id, 'MOMO')}>
                                Thanh toán MOMO
                            </Button>
                        </Card.Footer>
                    </>
                )}
            </Card>
        ));
    };

    // Render Tab 2 (Đã thanh toán)
    const renderPaidBills = () => {
        if (loading) return null; // Chỉ loading ở tab đầu
        if (paidBills.length === 0) return <Alert variant="info">Chưa có hóa đơn nào đã thanh toán.</Alert>;

        return (
            <Table striped bordered hover responsive size="sm" variant="dark">
                <thead>
                    <tr><th>ID</th><th>Tháng</th><th>Tổng tiền</th><th>Ngày thanh toán</th></tr>
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

    // Render Tab 3 (Lịch sử giao dịch)
    const renderTransactionHistory = () => {
        if (loading) return null;
        if (transactions.length === 0) return <Alert variant="info">Chưa có giao dịch nào.</Alert>;
        
        return (
            <Table striped bordered hover responsive size="sm" variant="dark" className="history-table">
                <thead>
                    <tr><th>Mã GD</th><th>Hóa đơn ID</th><th>Số tiền</th><th>Phương thức</th><th>Trạng thái</th><th>Thời gian</th></tr>
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
            <h2 className="mb-4 text-white">Hóa Đơn Dịch Vụ</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {paymentError && <Alert variant="danger" onClose={() => setPaymentError('')} dismissible>{paymentError}</Alert>}
            {paymentSuccess && <Alert variant="success" onClose={() => setPaymentSuccess('')} dismissible>{paymentSuccess}</Alert>}
            
            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
                <Tab eventKey="unpaid" title="Chưa thanh toán">
                    {renderUnpaidBills()}
                </Tab>
                <Tab eventKey="paid" title="Đã thanh toán">
                    {renderPaidBills()}
                </Tab>
                <Tab eventKey="history" title="Lịch sử giao dịch">
                    {renderTransactionHistory()}
                </Tab>
            </Tabs>
        </Container>
    );
};

export default BillPage;
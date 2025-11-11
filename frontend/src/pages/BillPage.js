import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Tabs, Tab, Card, Button, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import axios from 'axios';
import './BillPage.css'; // Import CSS của bạn
import PayPalPayment from '../components/PayPalbutton'; // THÊM: Import component PayPal

const API_BASE_URL = 'http://localhost:5000';

const BillPage = () => {
    const [key, setKey] = useState('unpaid'); // Default tab
    const [allBills, setAllBills] = useState([]);
    const [transactions, setTransactions] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // SỬA: Đổi tên state cho rõ ràng
    const [processingBillId, setProcessingBillId] = useState(null); // ID của bill đang thanh toán
    const [paymentError, setPaymentError] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState('');

    const getAuthConfig = useCallback(() => {
        const token = localStorage.getItem('token'); 
        if (!token) { setError("Vui lòng đăng nhập."); return null; } // Sửa thông báo lỗi
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    const fetchData = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) { setLoading(false); return; }
        
        // Đặt lại loading chỉ khi chưa load lần nào
        if (allBills.length === 0) setLoading(true); 
        setError('');
        
        try {
            // Gọi cả hai API
            const [billsRes, transRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/bills/my-bills-detailed`, config),
                axios.get(`${API_BASE_URL}/api/bills/my-transactions`, config)
            ]);
            
            setAllBills(billsRes.data.bills || []);
            setTransactions(transRes.data || []);
        } catch (err) {
            console.error('Error loading bill data:', err);
            setError(err.response?.data?.message || 'Không thể tải dữ liệu hóa đơn.');
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig, allBills.length]); // Thêm allBills.length để tránh re-load không cần thiết

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Chỉ fetch 1 lần lúc đầu

    // SỬA: Tách bill dựa trên schema mới
    const { unpaidBills, paidBills } = useMemo(() => {
        const unpaid = allBills.filter(b => b.status === 'unpaid' || b.status === 'overdue');
        const paid = allBills.filter(b => b.status === 'paid');
        return { unpaidBills: unpaid, paidBills: paid };
    }, [allBills]);

    // --- THÊM: Callbacks cho PayPal ---
    const handlePaymentSuccess = (message) => {
        setPaymentSuccess(message);
        setPaymentError('');
        setProcessingBillId(null);
        fetchData(); // Tải lại dữ liệu sau khi thành công
    };

    const handlePaymentError = (message) => {
        setPaymentError(message);
        setPaymentSuccess('');
        setProcessingBillId(null);
    };
    // -------------------------------

    // Helper formats
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatMonth = (dateStr) => {
        const date = new Date(dateStr);
        // SỬA: Dùng issue_date
        return `Tháng ${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
    };
    const formatDate = (dateStr) => new Date(dateStr).toLocaleString('vi-VN'); // Sửa thành vi-VN
    const formatDueDate = (dateStr) => new Date(dateStr).toLocaleDateString('vi-VN');

    const getStatusBadge = (status) => {
        if (status === 'unpaid') return <Badge bg="warning" text="dark">Chưa thanh toán</Badge>;
        if (status === 'overdue') return <Badge bg="danger">Quá hạn</Badge>;
        return <Badge bg="secondary">{status}</Badge>;
    };

    // Render Tab 1 (Unpaid)
    const renderUnpaidBills = () => {
        if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="light"/></div>;
        if (unpaidBills.length === 0) return <Alert variant="success">Bạn không có hóa đơn nào chưa thanh toán.</Alert>;

        return unpaidBills.map(bill => (
            <Card className="unpaid-bill-card" key={bill.bill_id}>
                <Card.Header className="unpaid-bill-header">
                    <div>
                        <h4>{formatMonth(bill.issue_date)}</h4>
                        {getStatusBadge(bill.status)}
                    </div>
                    <span>Hạn thanh toán: {formatDueDate(bill.due_date)}</span>
                </Card.Header>
                <Card.Body className="unpaid-bill-body">
                    {/* SỬA: Dùng 'line_items' và 'item_name', 'total_item_amount' */}
                    {bill.line_items.map(item => (
                        <div className="line-item" key={item.item_id}>
                            <span>{item.item_name}</span>
                            <span>{formatCurrency(item.total_item_amount)}</span>
                        </div>
                    ))}
                    <div className="line-item-total">
                        <span>TỔNG CỘNG</span>
                        <span>{formatCurrency(bill.total_amount)}</span>
                    </div>
                </Card.Body>
                <Card.Footer className="unpaid-bill-footer">
                    {/* --- THAY THẾ NÚT MOCK BẰNG PAYPAL --- */}
                    <p>Thanh toán quốc tế qua PayPal (USD)</p>
                    <PayPalPayment
                        bill={bill}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentError={handlePaymentError}
                        setProcessing={() => setProcessingBillId(bill.bill_id)}
                        isProcessing={processingBillId === bill.bill_id}
                    />
                    {/* ----------------------------------- */}
                </Card.Footer>
            </Card>
        ));
    };

    // Render Tab 2 (Paid)
    const renderPaidBills = () => {
        if (loading) return null;
        if (paidBills.length === 0) return <Alert variant="info">Không tìm thấy hóa đơn đã thanh toán.</Alert>;

        return (
            <Table striped bordered hover responsive size="sm" variant="dark">
                <thead>
                    <tr><th>ID</th><th>Tháng</th><th>Tổng Tiền</th><th>Ngày Thanh Toán</th></tr>
                </thead>
                <tbody>
                    {paidBills.map(bill => (
                        <tr key={bill.bill_id}>
                            <td>{bill.bill_id}</td>
                            <td>{formatMonth(bill.issue_date)}</td>
                            <td>{formatCurrency(bill.total_amount)}</td>
                            <td>{formatDate(bill.updated_at)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    // Render Tab 3 (Transaction History)
    const renderTransactionHistory = () => {
        if (loading) return null;
        if (transactions.length === 0) return <Alert variant="info">Không có lịch sử giao dịch.</Alert>;
        
        return (
            <Table striped bordered hover responsive size="sm" variant="dark" className="history-table">
                <thead>
                    <tr><th>Mã Giao Dịch</th><th>Bill ID</th><th>Số Tiền</th><th>Phương Thức</th><th>Trạng Thái</th><th>Thời Gian</th></tr>
                </thead>
                <tbody>
                    {/* SỬA: Dùng cột schema mới */}
                    {transactions.map(t => (
                        <tr key={t.transaction_id}>
                            <td>{t.paypal_transaction_id || t.transaction_id}</td>
                            <td>{t.bill_id}</td>
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
        );
    };

    return (
        <Container className="bill-page-container my-4">
            <h2 className="mb-4 text-white">Hóa đơn Dịch vụ</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {paymentError && <Alert variant="danger" onClose={() => setPaymentError('')} dismissible>{paymentError}</Alert>}
            {paymentSuccess && <Alert variant="success" onClose={() => setPaymentSuccess('')} dismissible>{paymentSuccess}</Alert>}
            
            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3 bill-tabs-nav">
                <Tab eventKey="unpaid" title={`Chưa thanh toán (${unpaidBills.length})`}>
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
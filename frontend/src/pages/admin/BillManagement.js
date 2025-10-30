// frontend/src/pages/admin/BillManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Badge } from 'react-bootstrap';
import axios from 'axios';
import './BillManagement.css'; // Import CSS

const API_BASE_URL = 'http://localhost:5000';

const BillManagement = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [generating, setGenerating] = useState(false);

    // State cho Modal chi tiết
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBillId, setSelectedBillId] = useState(null);
    const [lineItems, setLineItems] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    const getAuthConfig = useCallback(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) { setError("Admin token missing."); return null; }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    const fetchBills = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) { setLoading(false); return; }
        setLoading(true); setError('');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/bills`, config);
            setBills(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải danh sách hóa đơn.');
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig]);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    // Format ngày (MM/YYYY)
    const formatMonth = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
    };
    // Format ngày (DD/MM/YYYY)
    const formatDate = (dateStr) => {
         if (!dateStr) return '';
         const date = new Date(dateStr);
         return date.toLocaleDateString('vi-VN');
    };
    // Format tiền
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    // Lấy badge màu cho status
    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid': return <Badge bg="success">Đã thanh toán</Badge>;
            case 'unpaid': return <Badge bg="warning" text="dark">Chưa thanh toán</Badge>;
            case 'overdue': return <Badge bg="danger">Quá hạn</Badge>;
            case 'canceled': return <Badge bg="secondary">Đã hủy</Badge>;
            default: return <Badge bg="light" text="dark">{status}</Badge>;
        }
    };

    // --- Xử lý sự kiện ---
    const handleGenerateBills = async () => {
        const config = getAuthConfig();
        if (!config || !window.confirm('Tạo hóa đơn cho tháng này? (Sẽ bỏ qua các căn hộ đã có hóa đơn)')) return;
        setGenerating(true); setError(''); setSuccess('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/admin/bills/generate`, {}, config);
            setSuccess(res.data.message || 'Hoàn tất tạo hóa đơn.');
            await fetchBills(); // Tải lại
        } catch (err) {
            setError(err.response?.data?.message || 'Tạo hóa đơn thất bại.');
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkAsPaid = async (billId) => {
        const config = getAuthConfig();
        if (!config || !window.confirm(`Xác nhận thanh toán cho hóa đơn #${billId}?`)) return;
        setError(''); setSuccess('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/admin/bills/${billId}/mark-paid`, {}, config);
            setSuccess(res.data.message || `Đã cập nhật hóa đơn #${billId}.`);
            await fetchBills(); // Tải lại
        } catch (err) {
            setError(err.response?.data?.message || 'Cập nhật thất bại.');
        }
    };

    const handleShowDetails = async (billId) => {
        const config = getAuthConfig();
        if (!config) return;
        setSelectedBillId(billId);
        setShowDetailModal(true);
        setLoadingDetails(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/bills/${billId}`, config);
            setLineItems(res.data);
        } catch (err) {
            setError('Không thể tải chi tiết hóa đơn.');
            setShowDetailModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };
    
    const handleCloseDetailModal = () => setShowDetailModal(false);

    return (
        <Container fluid className="p-3">
            <h3>Quản lý Hóa Đơn</h3> <hr />
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
            <div className="mb-3 d-flex justify-content-between">
                <h4 className="mb-0">Danh sách hóa đơn</h4>
                <Button variant="primary" onClick={handleGenerateBills} disabled={generating}>
                    {generating ? <Spinner as="span" size="sm" /> : 'Tạo Hóa Đơn Tháng Này'}
                </Button>
            </div>

            {loading ? (
                <div className="text-center p-5"><Spinner animation="border" /></div>
            ) : (
                <Table striped bordered hover responsive size="sm" className="align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th><th>Cư dân</th><th>Căn hộ</th><th>Tháng</th>
                            <th>Trạng thái</th><th>Tổng tiền</th><th>Ngày TT</th><th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.length === 0 ? (
                            <tr><td colSpan="8" className="text-center">Chưa có hóa đơn nào.</td></tr>
                        ) : (
                            bills.map(bill => (
                                <tr key={bill.id} className={`status-${bill.status}`}>
                                    <td>{bill.id}</td>
                                    <td>{bill.resident_name}</td>
                                    <td>{bill.room_name}</td>
                                    <td>{formatMonth(bill.month_for)}</td>
                                    <td>{getStatusBadge(bill.status)}</td>
                                    <td>{formatCurrency(bill.total_amount)}</td>
                                    <td>{formatDate(bill.paid_at)}</td>
                                    <td className="bill-actions">
                                        <Button variant="info" size="sm" className="me-1" onClick={() => handleShowDetails(bill.id)}>
                                            Chi tiết
                                        </Button>
                                        {bill.status !== 'paid' && (
                                            <Button variant="success" size="sm" onClick={() => handleMarkAsPaid(bill.id)}>
                                                Thanh toán
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            )}

            {/* Modal Chi Tiết Hóa Đơn */}
            <Modal show={showDetailModal} onHide={handleCloseDetailModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết Hóa đơn #{selectedBillId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingDetails ? <div className="text-center"><Spinner animation="border" /></div> :
                        lineItems.length === 0 ? <p>Không có chi tiết.</p> :
                        (
                            <Table striped size="sm">
                                <thead>
                                    <tr><th>Mô tả</th><th className="text-end">Số tiền</th></tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.description}</td>
                                            <td className="text-end">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="table-group-divider">
                                        <td className="fw-bold">TỔNG CỘNG</td>
                                        <td className="fw-bold text-end">
                                            {formatCurrency(lineItems.reduce((acc, item) => acc + parseFloat(item.amount), 0))}
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        )
                    }
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default BillManagement;
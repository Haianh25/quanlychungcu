import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Badge, Form, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import './BillManagement.css'; // Import CSS của bạn

const API_BASE_URL = 'http://localhost:5000';

const BillManagement = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [generating, setGenerating] = useState(false);

    // State for Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null); 
    const [lineItems, setLineItems] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    // State cho Filter
    const [filterStatus, setFilterStatus] = useState('');
    const [filterRoom, setFilterRoom] = useState('');

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
            // SỬA: Đảm bảo gọi đúng route GET /api/admin/bills
            const res = await axios.get(`${API_BASE_URL}/api/admin/bills`, config); 
            setBills(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load the bill list.');
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig]);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    // Lọc danh sách bill
    const filteredBills = useMemo(() => {
        return bills.filter(bill => {
            const matchStatus = !filterStatus || bill.status === filterStatus;
            const matchRoom = !filterRoom || (bill.room_name && bill.room_name.toLowerCase().includes(filterRoom.toLowerCase()));
            return matchStatus && matchRoom;
        });
    }, [bills, filterStatus, filterRoom]);

    // Format (MM/YYYY)
    const formatMonth = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
    };
    // Format (DD/MM/YYYY)
    const formatDate = (dateStr) => {
         if (!dateStr) return 'N/A';
         const date = new Date(dateStr);
         return date.toLocaleString('vi-VN');
    };
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    // Get status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid': return <Badge bg="success">Đã thanh toán</Badge>;
            case 'unpaid': return <Badge bg="warning" text="dark">Chưa thanh toán</Badge>;
            case 'overdue': return <Badge bg="danger">Quá hạn</Badge>;
            case 'canceled': return <Badge bg="secondary">Đã hủy</Badge>;
            default: return <Badge bg="light" text="dark">{status}</Badge>;
        }
    };

    // --- Event Handlers ---
    const handleGenerateBills = async () => {
        const config = getAuthConfig();
        if (!config || !window.confirm('Bạn chắc chắn muốn tạo hóa đơn cho tháng này? (Sẽ bỏ qua các phòng đã có hóa đơn)')) return;
        setGenerating(true); setError(''); setSuccess('');
        try {
            // ==================================================================
            // SỬA LỖI 404 Ở ĐÂY: Thêm /bills/ vào trước /generate-bills
            // ==================================================================
            const res = await axios.post(`${API_BASE_URL}/api/admin/bills/generate-bills`, {}, config);
            setSuccess(res.data.message || 'Bill generation complete.');
            await fetchBills(); // Reload
        } catch (err) {
            setError(err.response?.data?.message || 'Bill generation failed.');
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkAsPaid = async (billId) => {
        const config = getAuthConfig();
        if (!config || !window.confirm(`Bạn chắc chắn muốn đánh dấu hóa đơn #${billId} là ĐÃ THANH TOÁN?`)) return;
        
        setError(''); setSuccess('');
        try {
            // SỬA: Đảm bảo gọi đúng route POST /api/admin/bills/:id/mark-paid
            const res = await axios.post(`${API_BASE_URL}/api/admin/bills/${billId}/mark-paid`, {}, config);
            setSuccess(res.data.message);
            setBills(bills.map(b => b.bill_id === billId ? { ...b, status: 'paid', paid_at: new Date().toISOString() } : b));
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể đánh dấu thanh toán.');
        }
    };

    const handleShowDetails = async (bill) => {
        const config = getAuthConfig();
        if (!config) return;
        setSelectedBill(bill); 
        setShowDetailModal(true);
        setLoadingDetails(true);
        try {
            // SỬA: Đảm bảo gọi đúng route GET /api/admin/bills/:id
            const res = await axios.get(`${API_BASE_URL}/api/admin/bills/${bill.bill_id}`, config);
            setLineItems(res.data);
        } catch (err) {
            setError('Could not load bill details.');
            setShowDetailModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };
    
    const handleCloseDetailModal = () => setShowDetailModal(false);

    // THÊM: Bộ lọc thay đổi
    const handleFilterChange = (e) => {
        if (e.target.name === 'filterRoom') {
            setFilterRoom(e.target.value);
        } else if (e.target.name === 'filterStatus') {
            setFilterStatus(e.target.value);
        }
    };

    return (
        <Container fluid className="p-3 bill-management-container">
            <h3>Quản lý Hóa đơn</h3> <hr />
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
            <div className="mb-3 d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Danh sách Hóa đơn</h4>
                <Button variant="primary" onClick={handleGenerateBills} disabled={generating}>
                    {generating ? <Spinner as="span" size="sm" /> : 'Tạo Hóa đơn Tháng Này'}
                </Button>
            </div>

            {/* --- THÊM: BỘ LỌC --- */}
            <Card bg="dark" text="white" className="mb-3">
                <Card.Body>
                    <Form as={Row} className="g-2 align-items-end">
                        <Col md={4}>
                            <Form.Group controlId="filterRoom">
                                <Form.Label>Lọc theo số phòng</Form.Label>
                                <Form.Control 
                                    type="text"
                                    name="filterRoom" // Thêm name
                                    placeholder="Nhập số phòng..."
                                    value={filterRoom}
                                    onChange={handleFilterChange} // Sửa
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="filterStatus">
                                <Form.Label>Lọc theo trạng thái</Form.Label>
                                <Form.Select 
                                    name="filterStatus" // Thêm name
                                    value={filterStatus}
                                    onChange={handleFilterChange} // Sửa
                                >
                                    <option value="">Tất cả</option>
                                    <option value="unpaid">Chưa thanh toán</option>
                                    <option value="paid">Đã thanh toán</option>
                                    <option value="overdue">Quá hạn</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Form>
                </Card.Body>
            </Card>
            
            {loading ? (
                <div className="text-center p-5"><Spinner animation="border" /></div>
            ) : (
                <Table striped bordered hover responsive size="sm" className="align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th><th>Cư dân</th><th>Phòng</th><th>Tháng</th>
                            <th>Trạng thái</th><th>Tổng tiền</th><th>Ngày TT</th><th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBills.length === 0 ? (
                            <tr><td colSpan="8" className="text-center">Không tìm thấy hóa đơn.</td></tr>
                        ) : (
                            filteredBills.map(bill => (
                                <tr key={bill.bill_id} className={`status-${bill.status}`}>
                                    <td>{bill.bill_id}</td>
                                    <td>{bill.resident_name}</td>
                                    <td>{bill.room_name}</td>
                                    <td>{formatMonth(bill.issue_date)}</td>
                                    <td>{getStatusBadge(bill.status)}</td>
                                    <td>{formatCurrency(bill.total_amount)}</td>
                                    <td>{formatDate(bill.paid_at)}</td>
                                    <td className="bill-actions">
                                        <Button variant="info" size="sm" className="me-1" onClick={() => handleShowDetails(bill)}>
                                            Chi tiết
                                        </Button>
                                        {bill.status === 'unpaid' && (
                                            <Button variant="success" size="sm" onClick={() => handleMarkAsPaid(bill.bill_id)}>
                                                Mark Paid
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            )}

            {/* Bill Details Modal */}
            <Modal show={showDetailModal} onHide={handleCloseDetailModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết Hóa đơn #{selectedBill?.bill_id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBill && (
                        <div className="bill-info-summary">
                            <p><strong>Cư dân:</strong> {selectedBill.resident_name}</p>
                            <p><strong>Phòng:</strong> {selectedBill.room_name}</p>
                            <p><strong>Tháng:</strong> {formatMonth(selectedBill.issue_date)}</p>
                        </div>
                    )}
                    {loadingDetails ? <div className="text-center"><Spinner animation="border" /></div> :
                        lineItems.length === 0 ? <p>Không tìm thấy chi tiết.</p> :
                        (
                            <Table striped size="sm">
                                <thead>
                                    <tr><th>Mô tả</th><th className="text-end">Số tiền</th></tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((item, index) => (
                                        <tr key={index}>
                                            {/* SỬA: Dùng đúng tên cột từ bill_items */}
                                            <td>{item.item_name}</td>
                                            <td className="text-end">{formatCurrency(item.total_item_amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="table-group-divider">
                                        <td className="fw-bold">TỔNG CỘNG (Từ Bill)</td>
                                        <td className="fw-bold text-end">
                                            {selectedBill ? formatCurrency(selectedBill.total_amount) : 'N/A'}
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
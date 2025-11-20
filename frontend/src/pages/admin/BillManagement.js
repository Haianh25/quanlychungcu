import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Badge, Form, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import './BillManagement.css';

const API_BASE_URL = 'http://localhost:5000';

const BillManagement = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [generating, setGenerating] = useState(false);
    
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null); 
    const [lineItems, setLineItems] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
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

    const filteredBills = useMemo(() => {
        return bills.filter(bill => {
            const matchStatus = !filterStatus || bill.status === filterStatus;
            const matchRoom = !filterRoom || (bill.room_name && bill.room_name.toLowerCase().includes(filterRoom.toLowerCase()));
            return matchStatus && matchRoom;
        });
    }, [bills, filterStatus, filterRoom]);

    const formatMonth = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
    };
    const formatDate = (dateStr) => {
         if (!dateStr) return 'N/A';
         const date = new Date(dateStr);
         return date.toLocaleString('vi-VN');
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid': return <span className="status-badge status-success">Paid</span>;
            case 'unpaid': return <span className="status-badge status-warning">Unpaid</span>;
            case 'overdue': return <span className="status-badge status-danger">Overdue</span>;
            case 'canceled': return <span className="status-badge status-secondary">Canceled</span>;
            default: return <span className="status-badge status-secondary">{status}</span>;
        }
    };

    const handleGenerateBills = async () => {
        const config = getAuthConfig();
        if (!config || !window.confirm('Are you sure you want to generate bills for this month?')) return;
        setGenerating(true); setError(''); setSuccess('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/admin/bills/generate-bills`, {}, config);
            setSuccess(res.data.message || 'Bill generation complete.');
            await fetchBills();
        } catch (err) {
            setError(err.response?.data?.message || 'Bill generation failed.');
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkAsPaid = async (billId) => {
        const config = getAuthConfig();
        if (!config || !window.confirm(`Mark bill #${billId} as PAID?`)) return;
        
        setError(''); setSuccess('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/admin/bills/${billId}/mark-paid`, {}, config);
            setSuccess(res.data.message);
            setBills(bills.map(b => b.bill_id === billId ? { ...b, status: 'paid', paid_at: new Date().toISOString() } : b));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark as paid.');
        }
    };

    const handleShowDetails = async (bill) => {
        const config = getAuthConfig();
        if (!config) return;
        setSelectedBill(bill); 
        setShowDetailModal(true);
        setLoadingDetails(true);
        try {
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

    const handleFilterChange = (e) => {
        if (e.target.name === 'filterRoom') {
            setFilterRoom(e.target.value);
        } else if (e.target.name === 'filterStatus') {
            setFilterStatus(e.target.value);
        }
    };

    return (
        <div className="management-page-container fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="page-main-title">Bill Management</h2>
                <Button className="btn-residem-primary" onClick={handleGenerateBills} disabled={generating}>
                    {generating ? <Spinner as="span" size="sm" /> : 'Generate This Month\'s Bills'}
                </Button>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
            <Card className="residem-card">
                <Card.Body>
                    <Form as={Row} className="g-2 align-items-end mb-3">
                        <Col md={4}>
                            <Form.Group controlId="filterRoom">
                                <Form.Label className="residem-form-label">Filter by Room</Form.Label>
                                <Form.Control 
                                    className="residem-form-control"
                                    type="text"
                                    name="filterRoom"
                                    placeholder="Enter room number..."
                                    value={filterRoom}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="filterStatus">
                                <Form.Label className="residem-form-label">Filter by Status</Form.Label>
                                <Form.Select 
                                    className="residem-form-select"
                                    name="filterStatus"
                                    value={filterStatus}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="unpaid">Unpaid</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Form>
                    
                    <div className="table-wrapper">
                        {loading ? (
                            <div className="text-center p-5"><Spinner animation="border" /></div>
                        ) : (
                            <Table striped hover responsive size="sm" className="residem-table align-middle">
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Resident</th>
                                        <th>Room</th>
                                        <th>Period</th>
                                        <th>Status</th>
                                        <th>Total Amount</th>
                                        <th>Payment Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBills.length === 0 ? (
                                        <tr><td colSpan="8" className="text-center">No bills found.</td></tr>
                                    ) : (
                                        filteredBills.map((bill, index) => (
                                            <tr key={bill.bill_id}>
                                                <td>{index + 1}</td>
                                                <td title={bill.resident_name}>{bill.resident_name}</td>
                                                <td>{bill.block_name ? `${bill.block_name} - ${bill.room_name}` : bill.room_name}</td>
                                                <td>{formatMonth(bill.issue_date)}</td>
                                                <td>{getStatusBadge(bill.status)}</td>
                                                <td>{formatCurrency(bill.total_amount)}</td>
                                                <td>{formatDate(bill.paid_at)}</td>
                                                <td className="bill-actions">
                                                    <Button className="btn-residem-secondary btn-sm me-1" onClick={() => handleShowDetails(bill)}>
                                                        Details
                                                    </Button>
                                                    {bill.status === 'unpaid' && (
                                                        <Button className="btn-residem-success btn-sm" onClick={() => handleMarkAsPaid(bill.bill_id)}>
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
                    </div>
                </Card.Body>
            </Card>

            {/* Bill Details Modal */}
            <Modal show={showDetailModal} onHide={handleCloseDetailModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Invoice Details #{selectedBill?.bill_id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBill && (
                        <div className="bill-info-summary mb-4 p-3 bg-light rounded border">
                            <Row>
                                <Col md={6}>
                                    <p><strong>Resident:</strong> {selectedBill.resident_name}</p>
                                    <p><strong>Room:</strong> <Badge bg="info" className="text-dark">{selectedBill.block_name ? `${selectedBill.block_name} - ${selectedBill.room_name}` : selectedBill.room_name}</Badge></p>
                                </Col>
                                <Col md={6} className="text-md-end">
                                    <p><strong>Billing Period:</strong> {formatMonth(selectedBill.issue_date)}</p>
                                    <p><strong>Status:</strong> {getStatusBadge(selectedBill.status)}</p>
                                </Col>
                            </Row>
                        </div>
                    )}

                    <h6 className="mb-3 border-bottom pb-2">Items Breakdown</h6>
                    
                    {loadingDetails ? <div className="text-center py-4"><Spinner animation="border" /></div> :
                        lineItems.length === 0 ? <p className="text-center text-muted">No items found.</p> :
                        (
                            <Table hover className="align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th style={{width: '70%'}}>Description</th>
                                        <th className="text-end">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.item_name}</td>
                                            <td className="text-end font-monospace">{formatCurrency(item.total_item_amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="table-active border-top border-2 border-dark">
                                        <td className="fw-bold text-uppercase">Total Due</td>
                                        <td className="fw-bold text-end fs-5 text-primary-accent">
                                            {selectedBill ? formatCurrency(selectedBill.total_amount) : 'N/A'}
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        )
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="residem-secondary" onClick={handleCloseDetailModal}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default BillManagement;
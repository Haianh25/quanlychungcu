import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Spinner, Alert, Modal, Badge, Form, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import { FileEarmarkExcelFill, LightningChargeFill, EyeFill, CheckCircleFill } from 'react-bootstrap-icons'; 
import Pagination from '../../components/admin/Pagination'; // [MỚI] Import Pagination
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

    // [MỚI] State cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [billsPerPage] = useState(10);

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

    // [MỚI] Logic cắt trang
    const indexOfLastBill = currentPage * billsPerPage;
    const indexOfFirstBill = indexOfLastBill - billsPerPage;
    const currentBills = filteredBills.slice(indexOfFirstBill, indexOfLastBill);

    // [MỚI] Hàm chuyển trang
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
        return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
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
        setCurrentPage(1); // [MỚI] Reset về trang 1 khi lọc
    };

    const handleExportExcel = () => {
        const dataToExport = filteredBills.map((bill, index) => ({
            'No.': index + 1,
            'Resident': bill.resident_name || 'Unknown',
            'Room': bill.block_name ? `${bill.block_name} - ${bill.room_name}` : bill.room_name,
            'Billing Period': formatMonth(bill.issue_date),
            'Status': bill.status.toUpperCase(),
            'Total Amount (VND)': parseInt(bill.total_amount),
            'Payment Date': bill.paid_at ? formatDate(bill.paid_at) : 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bills Report");

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Bills_Report_${dateStr}.xlsx`);
    };

    return (
        <div className="management-page-container fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="page-main-title">Bill Management</h2>
                <div className="d-flex gap-2">
                    <Button className="btn-export-excel d-flex align-items-center" onClick={handleExportExcel} disabled={loading || filteredBills.length === 0}>
                        <FileEarmarkExcelFill className="me-2" /> Export Excel
                    </Button>
                    
                    <Button className="btn-residem-primary d-flex align-items-center" onClick={handleGenerateBills} disabled={generating}>
                        {generating ? <><Spinner as="span" size="sm" className="me-2"/> Generating...</> : <><LightningChargeFill className="me-2"/> Generate Monthly Bills</>}
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
            <Card className="residem-card">
                <Card.Body>
                    <Form as={Row} className="g-3 align-items-end mb-4">
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
                            <div className="text-center p-5"><Spinner animation="border" variant="secondary" /></div>
                        ) : (
                            <Table striped hover responsive className="residem-table align-middle">
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
                                    {/* [UPDATED] Sử dụng currentBills thay vì filteredBills */}
                                    {currentBills.length === 0 ? (
                                        <tr><td colSpan="8" className="text-center text-muted py-4">No bills found matching your criteria.</td></tr>
                                    ) : (
                                        currentBills.map((bill, index) => (
                                            <tr key={bill.bill_id}>
                                                <td>{indexOfFirstBill + index + 1}</td>
                                                <td>
                                                    <div className="fw-bold text-dark">{bill.resident_name}</div>
                                                </td>
                                                <td><Badge bg="light" text="dark" className="border fw-normal">{bill.block_name ? `${bill.block_name} - ${bill.room_name}` : bill.room_name}</Badge></td>
                                                <td>{formatMonth(bill.issue_date)}</td>
                                                <td>{getStatusBadge(bill.status)}</td>
                                                <td className="fw-bold text-dark">{formatCurrency(bill.total_amount)}</td>
                                                <td className="small text-muted">{formatDate(bill.paid_at)}</td>
                                                <td className="bill-actions">
                                                    <Button className="btn-residem-secondary btn-sm me-2" onClick={() => handleShowDetails(bill)}>
                                                        <EyeFill className="me-1"/> Details
                                                    </Button>
                                                    {bill.status === 'unpaid' && (
                                                        <Button className="btn-residem-success btn-sm" onClick={() => handleMarkAsPaid(bill.bill_id)}>
                                                            <CheckCircleFill className="me-1"/> Mark Paid
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    {/* Placeholder để giữ chiều cao bảng ổn định nếu ít row */}
                                    {currentBills.length > 0 && currentBills.length < billsPerPage && Array.from({ length: billsPerPage - currentBills.length }).map((_, idx) => (
                                        <tr key={`placeholder-${idx}`}><td colSpan="8" style={{height: '65px'}}></td></tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </div>

                    {/* [MỚI] Thanh Phân Trang */}
                    {filteredBills.length > billsPerPage && (
                        <div className="residem-pagination mt-4 d-flex justify-content-center">
                            <Pagination
                                itemsPerPage={billsPerPage}
                                totalItems={filteredBills.length}
                                paginate={paginate}
                                currentPage={currentPage}
                            />
                        </div>
                    )}

                </Card.Body>
            </Card>

            {/* Bill Details Modal */}
            <Modal show={showDetailModal} onHide={handleCloseDetailModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Invoice Details #{selectedBill?.bill_id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBill && (
                        <div className="bill-info-summary">
                            <Row>
                                <Col md={6}>
                                    <p><strong>Resident:</strong> {selectedBill.resident_name}</p>
                                    <p><strong>Room:</strong> <Badge bg="secondary" className="ms-1">{selectedBill.block_name ? `${selectedBill.block_name} - ${selectedBill.room_name}` : selectedBill.room_name}</Badge></p>
                                </Col>
                                <Col md={6} className="text-md-end">
                                    <p><strong>Billing Period:</strong> {formatMonth(selectedBill.issue_date)}</p>
                                    <p><strong>Status:</strong> {getStatusBadge(selectedBill.status)}</p>
                                </Col>
                            </Row>
                        </div>
                    )}

                    <h6 className="mb-3 fw-bold text-dark border-bottom pb-2">Items Breakdown</h6>
                    
                    {loadingDetails ? <div className="text-center py-4"><Spinner animation="border" variant="secondary" /></div> :
                        lineItems.length === 0 ? <p className="text-center text-muted">No items found.</p> :
                        (
                            <Table hover className="align-middle mb-0" style={{border: '1px solid #eee'}}>
                                <thead className="bg-light">
                                    <tr>
                                        <th style={{width: '70%', borderBottom: 'none'}}>Description</th>
                                        <th className="text-end" style={{borderBottom: 'none'}}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="text-dark">{item.item_name}</td>
                                            <td className="text-end font-monospace">{formatCurrency(item.total_item_amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="table-active" style={{borderTop: '2px solid #333'}}>
                                        <td className="fw-bold text-uppercase">Total Due</td>
                                        <td className="fw-bold text-end fs-5" style={{color: '#b99a7b'}}>
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
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form, InputGroup, Badge, Card } from 'react-bootstrap';
import axios from 'axios';
// SỬA: Thêm icon Trash (Thùng rác)
import { PencilSquare, PlusCircleFill, Trash } from 'react-bootstrap-icons';
import './FeeManagement.css';

const API_BASE_URL = 'http://localhost:5000';

const FeeManagement = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    // THÊM: State cho Modal Xóa
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const [modalLoading, setModalLoading] = useState(false);
    const [currentFee, setCurrentFee] = useState(null); // Fee đang được sửa hoặc XÓA
    
    const [editFormData, setEditFormData] = useState({ fee_name: '', price: 0, description: '' });
    const [newFeeData, setNewFeeData] = useState({
        fee_name: '',
        fee_code: '',
        price: '',
        description: ''
    });

    const getAuthConfig = useCallback(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            setError("Lỗi xác thực: Không tìm thấy Admin token.");
            return null;
        }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    const fetchFees = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) { setLoading(false); return; }
        
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/fees`, config);
            setFees(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải danh sách phí.');
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig]);

    useEffect(() => {
        fetchFees();
    }, [fetchFees]);

    // --- HÀM CHO MODAL ---
    
    const handleClose = () => {
        setShowEditModal(false);
        setShowAddModal(false);
        setShowDeleteModal(false); // SỬA: Thêm vào
        setCurrentFee(null);
        setModalLoading(false);
        setError(''); 
    };

    // --- LOGIC CHỈNH SỬA (EDIT) ---
    // (Giữ nguyên không đổi)
    const handleShowEditModal = (fee) => {
        setCurrentFee(fee);
        setEditFormData({
            fee_name: fee.fee_name,
            price: fee.price,
            description: fee.description || ''
        });
        setError(''); 
        setSuccess(''); 
        setShowEditModal(true);
    };
    const handleEditFormChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };
    const handleEditSave = async (e) => {
        e.preventDefault();
        const config = getAuthConfig();
        if (!config || !currentFee) return;

        setModalLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.put(`${API_BASE_URL}/api/admin/fees/${currentFee.fee_id}`, editFormData, config);
            setSuccess('Cập nhật phí thành công!');
            handleClose();
            fetchFees(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Cập nhật thất bại.');
        } finally {
            setModalLoading(false);
        }
    };

    // --- LOGIC THÊM MỚI (ADD) ---
    // (Giữ nguyên không đổi)
    const handleShowAddModal = () => {
        setNewFeeData({ fee_name: '', fee_code: '', price: '', description: '' });
        setError('');
        setSuccess('');
        setShowAddModal(true);
    };
    const handleNewFeeChange = (e) => {
        setNewFeeData({ ...newFeeData, [e.target.name]: e.target.value });
    };
    const handleAddNewSave = async (e) => {
        e.preventDefault();
        const config = getAuthConfig();
        if (!config) return;

        setModalLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.post(`${API_BASE_URL}/api/admin/fees`, newFeeData, config);
            setSuccess('Thêm phí mới thành công!');
            handleClose();
            fetchFees(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Thêm mới thất bại.');
        } finally {
            setModalLoading(false);
        }
    };

    // --- (THÊM MỚI) LOGIC XÓA (DELETE) ---

    const handleShowDeleteModal = (fee) => {
        setCurrentFee(fee);
        setError('');
        setSuccess('');
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        const config = getAuthConfig();
        if (!config || !currentFee) return;

        setModalLoading(true);
        setError('');
        setSuccess('');

        try {
            // Gọi API DELETE mới
            await axios.delete(`${API_BASE_URL}/api/admin/fees/${currentFee.fee_id}`, config);
            setSuccess('Đã xóa phí thành công!');
            handleClose();
            fetchFees(); // Tải lại danh sách
        } catch (err) {
            // Hiển thị lỗi trong Modal Xóa
            setError(err.response?.data?.message || 'Xóa thất bại.');
        } finally {
            setModalLoading(false);
        }
    };


    // Hàm format tiền tệ
    const formatCurrency = (value) => {
        return parseFloat(value).toLocaleString('vi-VN');
    };

    return (
        <Container fluid className="p-3 admin-page-content">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">Quản lý Phí Dịch vụ</h3>
                <Button variant="primary" onClick={handleShowAddModal}>
                    <PlusCircleFill className="me-2" /> Thêm Phí Mới
                </Button>
            </div>
            
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            {error && !showEditModal && !showAddModal && !showDeleteModal && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {loading ? (
                <div className="text-center"><Spinner animation="border" /></div>
            ) : (
                <Card bg="dark" text="white" className="shadow-sm">
                    <Card.Body>
                        <Table striped bordered hover responsive className="admin-table">
                            <thead className="table-dark">
                                <tr>
                                    <th>Tên Phí (Hiển thị)</th>
                                    <th>Mã Phí (Key)</th>
                                    <th>Giá Tiền</th>
                                    <th>Mô tả</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.map(fee => (
                                    <tr key={fee.fee_id}>
                                        <td><strong>{fee.fee_name}</strong></td>
                                        <td>
                                            <Badge bg="info" className="fee-code-badge">{fee.fee_code}</Badge>
                                        </td>
                                        <td>{formatCurrency(fee.price)} VND</td>
                                        <td>{fee.description}</td>
                                        <td>
                                            <Button variant="outline-light" size="sm" onClick={() => handleShowEditModal(fee)} className="me-2">
                                                <PencilSquare className="me-1" /> Sửa
                                            </Button>
                                            {/* THÊM: Nút Xóa */}
                                            <Button variant="outline-danger" size="sm" onClick={() => handleShowDeleteModal(fee)}>
                                                <Trash className="me-1" /> Xóa
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}

            {/* Modal chỉnh sửa (EDIT) */}
            {/* (Giữ nguyên không đổi) */}
            <Modal show={showEditModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Chỉnh sửa Phí</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSave}>
                    <Modal.Body>
                        {error && showEditModal && <Alert variant="danger">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label>Mã Phí (Key)</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={currentFee?.fee_code || ''} 
                                readOnly 
                                disabled 
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên Phí (Hiển thị)</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="fee_name"
                                value={editFormData.fee_name} 
                                onChange={handleEditFormChange}
                                required 
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Giá Tiền</Form.Label>
                            <InputGroup>
                                <Form.Control 
                                    type="number" 
                                    name="price"
                                    value={editFormData.price} 
                                    onChange={handleEditFormChange}
                                    required 
                                    min="0"
                                />
                                <InputGroup.Text>VND</InputGroup.Text>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control 
                                as="textarea"
                                rows={3}
                                name="description"
                                value={editFormData.description} 
                                onChange={handleEditFormChange}
                                placeholder="Ví dụ: Phí quản lý hàng tháng, Phí gửi xe máy..."
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose} disabled={modalLoading}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit" disabled={modalLoading}>
                            {modalLoading ? <Spinner as="span" size="sm" /> : 'Lưu Thay Đổi'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal Thêm Mới (ADD) */}
            {/* (Giữ nguyên không đổi) */}
            <Modal show={showAddModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Thêm Phí Mới</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddNewSave}>
                    <Modal.Body>
                        {error && showAddModal && <Alert variant="danger">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label>Mã Phí (Key)</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="fee_code"
                                value={newFeeData.fee_code} 
                                onChange={handleNewFeeChange}
                                required 
                                placeholder="Ví dụ: CAR_FEE, BICYCLE_FEE (Viết hoa, không dấu)"
                            />
                            <Form.Text className="text-muted">
                                Mã này phải khớp với logic hệ thống (ví dụ: CAR_FEE).
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên Phí (Hiển thị)</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="fee_name"
                                value={newFeeData.fee_name} 
                                onChange={handleNewFeeChange}
                                required 
                                placeholder="Ví dụ: Phí gửi xe ô tô"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Giá Tiền</Form.Label>
                            <InputGroup>
                                <Form.Control 
                                    type="number" 
                                    name="price"
                                    value={newFeeData.price} 
                                    onChange={handleNewFeeChange}
                                    required 
                                    min="0"
                                    placeholder="Ví dụ: 1200000"
                                />
                                <InputGroup.Text>VND</InputGroup.Text>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control 
                                as="textarea"
                                rows={3}
                                name="description"
                                value={newFeeData.description} 
                                onChange={handleNewFeeChange}
                                placeholder="Ví dụ: Phí gửi xe ô tô hàng tháng"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose} disabled={modalLoading}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit" disabled={modalLoading}>
                            {modalLoading ? <Spinner as="span" size="sm" /> : 'Thêm Mới'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* THÊM: Modal Xác nhận Xóa (DELETE) */}
            <Modal show={showDeleteModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận Xóa</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && showDeleteModal && <Alert variant="danger">{error}</Alert>}
                    Bạn có chắc chắn muốn xóa phí <strong>"{currentFee?.fee_name}"</strong> (Mã: {currentFee?.fee_code}) không?
                    <br />
                    <small className="text-warning">
                        Lưu ý: Phí này có thể không xóa được nếu đã được sử dụng trong các hóa đơn cũ.
                    </small>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={modalLoading}>
                        Hủy
                    </Button>
                    <Button variant="danger" onClick={handleDeleteConfirm} disabled={modalLoading}>
                        {modalLoading ? <Spinner as="span" size="sm" /> : 'Xác nhận Xóa'}
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
};

export default FeeManagement;
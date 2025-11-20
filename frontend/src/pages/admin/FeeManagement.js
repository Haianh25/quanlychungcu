import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert, Modal, Form, InputGroup, Card } from 'react-bootstrap';
import axios from 'axios';
import { PencilSquare, PlusCircleFill, Trash, ExclamationTriangle } from 'react-bootstrap-icons';
import './FeeManagement.css';

const API_BASE_URL = 'http://localhost:5000';

const FeeManagement = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const [modalLoading, setModalLoading] = useState(false);
    const [currentFee, setCurrentFee] = useState(null); 
    
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
            setError("Authentication failed: Admin token not found.");
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
            setError(err.response?.data?.message || 'Failed to load fee list.');
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig]);

    useEffect(() => {
        fetchFees();
    }, [fetchFees]);

    const handleClose = () => {
        setShowEditModal(false);
        setShowAddModal(false);
        setShowDeleteModal(false); 
        setCurrentFee(null);
        setModalLoading(false);
        setError(''); 
    };

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
            setSuccess('Fee updated successfully!');
            handleClose();
            fetchFees(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed.');
        } finally {
            setModalLoading(false);
        }
    };

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
            setSuccess('New fee added successfully!');
            handleClose();
            fetchFees(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add new fee.');
        } finally {
            setModalLoading(false);
        }
    };

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
            await axios.delete(`${API_BASE_URL}/api/admin/fees/${currentFee.fee_id}`, config);
            setSuccess('Fee deleted successfully!');
            handleClose();
            fetchFees(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed.');
        } finally {
            setModalLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return parseFloat(value).toLocaleString('vi-VN');
    };

    return (
        <div className="management-page-container fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="page-main-title">Fee Management</h2>
                <Button className="btn-residem-primary" onClick={handleShowAddModal}>
                    <PlusCircleFill className="me-2" /> Add New Fee
                </Button>
            </div>
            
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            {error && !showEditModal && !showAddModal && !showDeleteModal && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {loading ? (
                <div className="text-center"><Spinner animation="border" /></div>
            ) : (
                <Card className="residem-card">
                    <Card.Body>
                        <div className="table-wrapper">
                            <Table striped hover responsive className="residem-table align-middle">
                                <thead>
                                    <tr>
                                        <th>Fee Name (Display)</th>
                                        <th>Fee Code (Key)</th>
                                        <th>Price</th>
                                        <th>Description</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.map(fee => (
                                        <tr key={fee.fee_id}>
                                            <td><strong>{fee.fee_name}</strong></td>
                                            <td>
                                                <span className="status-badge status-info fee-code-badge">{fee.fee_code}</span>
                                            </td>
                                            <td>{formatCurrency(fee.price)} VND</td>
                                            <td>{fee.description}</td>
                                            <td>
                                                <Button className="btn-residem-warning btn-sm me-2" onClick={() => handleShowEditModal(fee)}>
                                                    <PencilSquare className="me-1" /> Edit
                                                </Button>
                                                <Button className="btn-residem-danger btn-sm" onClick={() => handleShowDeleteModal(fee)}>
                                                    <Trash className="me-1" /> Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {fees.length === 0 && <tr><td colSpan="5" className="text-center text-muted">No fee configurations found.</td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Modal EDIT */}
            <Modal show={showEditModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Edit Fee Configuration</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSave}>
                    <Modal.Body>
                        {error && showEditModal && <Alert variant="danger">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Fee Code (System Key)</Form.Label>
                            <Form.Control 
                                className="residem-form-control bg-light"
                                type="text" 
                                value={currentFee?.fee_code || ''} 
                                readOnly 
                                disabled 
                            />
                            <Form.Text className="text-muted">System code cannot be changed.</Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Fee Name (Display)<span className="required-star">*</span></Form.Label>
                            <Form.Control 
                                className="residem-form-control"
                                type="text" 
                                name="fee_name"
                                value={editFormData.fee_name} 
                                onChange={handleEditFormChange}
                                required 
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Price<span className="required-star">*</span></Form.Label>
                            <InputGroup>
                                <Form.Control 
                                    className="residem-form-control"
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
                            <Form.Label className="residem-form-label">Description</Form.Label>
                            <Form.Control 
                                className="residem-form-control"
                                as="textarea"
                                rows={3}
                                name="description"
                                value={editFormData.description} 
                                onChange={handleEditFormChange}
                                placeholder="e.g., Monthly management fee..."
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="residem-secondary" onClick={handleClose} disabled={modalLoading}>
                            Cancel
                        </Button>
                        <Button className="btn-residem-primary" type="submit" disabled={modalLoading}>
                            {modalLoading ? <Spinner as="span" size="sm" /> : 'Save Changes'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal ADD */}
            <Modal show={showAddModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Add New Fee Configuration</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddNewSave}>
                    <Modal.Body>
                        {error && showAddModal && <Alert variant="danger">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Fee Code (System Key)<span className="required-star">*</span></Form.Label>
                            <Form.Control 
                                className="residem-form-control"
                                type="text" 
                                name="fee_code"
                                value={newFeeData.fee_code} 
                                onChange={handleNewFeeChange}
                                required 
                                placeholder="e.g., CAR_FEE (UPPERCASE_UNDERSCORE)"
                            />
                            <Form.Text className="text-muted">
                                Unique identifier used in system logic. Must be UPPERCASE with UNDERSCORES.
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Fee Name (Display)<span className="required-star">*</span></Form.Label>
                            <Form.Control 
                                className="residem-form-control"
                                type="text" 
                                name="fee_name"
                                value={newFeeData.fee_name} 
                                onChange={handleNewFeeChange}
                                required 
                                placeholder="e.g., Car Parking Fee"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Price<span className="required-star">*</span></Form.Label>
                            <InputGroup>
                                <Form.Control 
                                    className="residem-form-control"
                                    type="number" 
                                    name="price"
                                    value={newFeeData.price} 
                                    onChange={handleNewFeeChange}
                                    required 
                                    min="0"
                                    placeholder="e.g., 1200000"
                                />
                                <InputGroup.Text>VND</InputGroup.Text>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Description</Form.Label>
                            <Form.Control 
                                className="residem-form-control"
                                as="textarea"
                                rows={3}
                                name="description"
                                value={newFeeData.description} 
                                onChange={handleNewFeeChange}
                                placeholder="e.g., Monthly car parking fee"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="residem-secondary" onClick={handleClose} disabled={modalLoading}>
                            Cancel
                        </Button>
                        <Button className="btn-residem-primary" type="submit" disabled={modalLoading}>
                            {modalLoading ? <Spinner as="span" size="sm" /> : 'Add Fee'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal DELETE */}
            <Modal show={showDeleteModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title text-danger">
                        <ExclamationTriangle className="me-2 mb-1"/> Confirm Deletion
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && showDeleteModal && <Alert variant="danger">{error}</Alert>}
                    <p>Are you sure you want to delete the fee configuration: <strong>{currentFee?.fee_name}</strong>?</p>
                    <div className="alert alert-warning small">
                        <strong>Warning:</strong> This action cannot be undone. If this fee code is used in past bills or active services, deletion may fail to maintain data integrity.
                    </div>
                    <div className="text-muted small">Fee Code: <code>{currentFee?.fee_code}</code></div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="residem-secondary" onClick={handleClose} disabled={modalLoading}>
                        Cancel
                    </Button>
                    <Button className="btn-residem-danger" onClick={handleDeleteConfirm} disabled={modalLoading}>
                        {modalLoading ? <Spinner as="span" size="sm" /> : 'Confirm Delete'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FeeManagement;
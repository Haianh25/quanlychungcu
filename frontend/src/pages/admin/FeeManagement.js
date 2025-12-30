import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert, Modal, Form, InputGroup, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import { PencilSquare, PlusCircleFill, Trash, ExclamationTriangleFill, TagFill, ShieldLockFill, Stars, Magic } from 'react-bootstrap-icons';
import './FeeManagement.css';

const API_BASE_URL = 'http://localhost:5000';

const SYSTEM_FEE_CODES = [
    'MANAGEMENT_FEE', 'ADMIN_FEE', 'CAR_FEE', 'MOTORBIKE_FEE', 'BICYCLE_FEE',
    'CAR_CARD_FEE', 'MOTORBIKE_CARD_FEE', 'BICYCLE_CARD_FEE', 'LATE_PAYMENT_FEE'
];

const SERVICE_TEMPLATES = [
    { code: 'CUSTOM', name: '✨ Create Custom Fee...', price: '', desc: '' },
    
    { code: 'GYM_MONTHLY', name: 'Gym Membership (Monthly)', price: 300000, desc: 'Unlimited access to Gym & Fitness center.' },
    { code: 'POOL_ACCESS', name: 'Swimming Pool Pass', price: 500000, desc: 'Monthly access to Infinity Pool (Level 5).' },
    { code: 'YOGA_CLASS', name: 'Yoga Class (Per Session)', price: 100000, desc: 'Join daily Yoga sessions with instructor.' },
    { code: 'TENNIS_COURT', name: 'Tennis Court Rental', price: 150000, desc: 'Hourly rate for tennis court usage.' },
    { code: 'SAUNA_SPA', name: 'Sauna & Spa Access', price: 200000, desc: 'Weekend access to Sauna facilities.' },

    { code: 'BBQ_BOOKING', name: 'BBQ Area Reservation', price: 250000, desc: 'Fee per 4-hour slot booking (Cleaning included).' },
    { code: 'KARAOKE_VIP', name: 'Karaoke Room (VIP)', price: 300000, desc: 'Hourly rate including equipment rental.' },
    { code: 'PRIVATE_CINEMA', name: 'Private Cinema Room', price: 400000, desc: 'Rent the mini-theater for private screening (3 hours).' },
    { code: 'KIDS_CLUB', name: 'Kids Club Monthly', price: 150000, desc: 'Access to indoor playground for children.' },
    { code: 'LIBRARY_MEMBER', name: 'Library Membership', price: 50000, desc: 'Annual library card issuance fee.' },
    { code: 'COWORKING_DESK', name: 'Co-working Hot Desk', price: 100000, desc: 'Daily pass for Co-working space usage.' },

    { code: 'EV_CHARGING', name: 'EV Charging Subscription', price: 500000, desc: 'Monthly subscription for Electric Vehicle charging.' },
    { code: 'PARKING_GUEST', name: 'Overnight Guest Parking', price: 50000, desc: 'Per night fee for visitor vehicles.' },
    { code: 'HOUSE_CLEANING', name: 'House Cleaning Service', price: 250000, desc: 'Basic cleaning service (2 hours).' },
    { code: 'LAUNDRY_SERVICE', name: 'Laundry Pickup', price: 50000, desc: 'Service fee per pickup request (Laundry cost separate).' },
    { code: 'AC_MAINTENANCE', name: 'AC Maintenance', price: 200000, desc: 'Periodic air conditioner cleaning and checkup.' },
    { code: 'PEST_CONTROL', name: 'Pest Control Service', price: 450000, desc: 'Professional pest control for apartments.' },
    { code: 'EXTRA_TRASH', name: 'Heavy Trash Collection', price: 100000, desc: 'Service fee for disposing large furniture/items.' },
    { code: 'PET_CARE', name: 'Pet Care / Walking', price: 80000, desc: 'Hourly rate for pet walking service.' },
    { code: 'WATER_DELIVERY', name: 'Premium Water Delivery', price: 60000, desc: 'Price per 19L bottle delivered to door.' }
];

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
    const [newFeeData, setNewFeeData] = useState({ fee_name: '', fee_code: '', price: '', description: '' });

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

    const handleTemplateChange = (e) => {
        const code = e.target.value;
        if (code === 'CUSTOM') {
            setNewFeeData({ fee_name: '', fee_code: '', price: '', description: '' });
        } else {
            const template = SERVICE_TEMPLATES.find(t => t.code === code);
            if (template) {
                setNewFeeData({
                    fee_name: template.name,
                    fee_code: template.code,
                    price: template.price,
                    description: template.desc
                });
            }
        }
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
                <Button className="btn-residem-primary d-flex align-items-center gap-2" onClick={handleShowAddModal}>
                    <PlusCircleFill size={18}/> Add New Fee
                </Button>
            </div>
            
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            {error && !showEditModal && !showAddModal && !showDeleteModal && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {loading ? (
                <div className="text-center p-5"><Spinner animation="border" variant="secondary" /></div>
            ) : (
                <Card className="residem-card">
                    <Card.Body>
                        <div className="table-wrapper">
                            <Table striped hover responsive className="residem-table align-middle">
                                <thead>
                                    <tr>
                                        <th>Fee Name (Display)</th>
                                        <th>Fee Code (System Key)</th>
                                        <th>Price</th>
                                        <th>Description</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.map(fee => {
                                        const isSystem = SYSTEM_FEE_CODES.includes(fee.fee_code);
                                        return (
                                            <tr key={fee.fee_id}>
                                                <td>
                                                    <div className="fw-bold text-dark">
                                                        {fee.fee_name}
                                                        {isSystem ? 
                                                            <Badge bg="secondary" className="ms-2" style={{fontSize: '0.65rem'}}>SYSTEM</Badge> : 
                                                            <Badge bg="info" className="ms-2" style={{fontSize: '0.65rem'}}>SERVICE</Badge>
                                                        }
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="fee-code-badge">
                                                        <TagFill size={12} className="me-1 opacity-50"/>
                                                        {fee.fee_code}
                                                    </span>
                                                </td>
                                                <td className="fw-bold text-success" style={{fontSize: '1rem'}}>
                                                    {formatCurrency(fee.price)} <small className="text-muted fw-normal">VND</small>
                                                </td>
                                                <td className="text-muted small text-truncate" style={{maxWidth: '250px'}}>
                                                    {fee.description || <span className="fst-italic opacity-50">No description</span>}
                                                </td>
                                                <td className="text-end">
                                                    <Button variant="light" className="btn-residem-warning btn-sm me-2" onClick={() => handleShowEditModal(fee)}>
                                                        <PencilSquare className="me-1" /> Edit
                                                    </Button>
                                                    
                                                    {!isSystem ? (
                                                        <Button variant="light" className="btn-residem-danger btn-sm" onClick={() => handleShowDeleteModal(fee)}>
                                                            <Trash className="me-1" /> Delete
                                                        </Button>
                                                    ) : (
                                                        <Button variant="light" className="btn-residem-secondary btn-sm" disabled title="System fees cannot be deleted">
                                                            <ShieldLockFill className="me-1"/> Locked
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {fees.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-5">No fee configurations found.</td></tr>}
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
                            <Form.Text className="text-muted small">System code cannot be changed.</Form.Text>
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

            {/* Modal ADD  */}
            <Modal show={showAddModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Add New Fee Configuration</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddNewSave}>
                    <Modal.Body>
                        {error && showAddModal && <Alert variant="danger">{error}</Alert>}
                        
                        {/*  */}
                        <Card className="mb-3 border-0 bg-light">
                            <Card.Body className="p-3">
                                <Form.Group className="mb-0">
                                    <Form.Label className="residem-form-label d-flex align-items-center text-primary">
                                        <Stars className="me-2"/> Quick Select Service Template
                                    </Form.Label>
                                    <Form.Select className="residem-form-select" onChange={handleTemplateChange}>
                                        {SERVICE_TEMPLATES.map(t => (
                                            <option key={t.code} value={t.code}>{t.name}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Text className="text-muted small">
                                        <Magic className="me-1"/> Select a pre-defined service to auto-fill scalability codes.
                                    </Form.Text>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Fee Code (System Key)<span className="required-star">*</span></Form.Label>
                            <Form.Control 
                                className="residem-form-control"
                                type="text" 
                                name="fee_code"
                                value={newFeeData.fee_code} 
                                onChange={handleNewFeeChange}
                                required 
                                placeholder="e.g., GYM_FEE"
                            />
                            <Form.Text className="text-muted small">
                                Unique identifier for backend processing (UPPERCASE_UNDERSCORE).
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
                                placeholder="e.g., Gym Membership"
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
                                    placeholder="0"
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
                                placeholder="e.g., Monthly access fee..."
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

            {/*  */}
            <Modal show={showDeleteModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title text-danger">
                        <ExclamationTriangleFill className="me-2 mb-1"/> Confirm Deletion
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && showDeleteModal && <Alert variant="danger">{error}</Alert>}
                    <p>Are you sure you want to delete the fee configuration: <strong>{currentFee?.fee_name}</strong>?</p>
                    <div className="alert alert-warning small border-warning bg-warning bg-opacity-10">
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
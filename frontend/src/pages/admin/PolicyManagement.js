import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Spinner, Alert, Modal, Form, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { GearFill, CarFrontFill, Scooter, PencilSquare, Bicycle } from 'react-bootstrap-icons'; 
import './FeeManagement.css'; 

const API_BASE_URL = 'http://localhost:5000';

const PolicyManagement = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [currentPolicy, setCurrentPolicy] = useState(null);
    // [UPDATED] State cho max_bicycles
    const [formData, setFormData] = useState({ max_cars: 0, max_motorbikes: 0, max_bicycles: 0, description: '' });
    const [saving, setSaving] = useState(false);

    const fetchPolicies = useCallback(async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/admin/policies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPolicies(res.data);
        } catch (err) {
            setError('Failed to load policies.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    const handleEdit = (policy) => {
        setCurrentPolicy(policy);
        setFormData({
            max_cars: policy.max_cars,
            max_motorbikes: policy.max_motorbikes,
            max_bicycles: policy.max_bicycles || 0, // [UPDATED] Lấy giá trị cũ hoặc 0
            description: policy.description || ''
        });
        setError(''); setSuccess('');
        setShowModal(true);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('adminToken');
        setSaving(true); setError('');
        try {
            await axios.put(`${API_BASE_URL}/api/admin/policies/${currentPolicy.type_code}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(`Policy for Type ${currentPolicy.type_code} updated!`);
            setShowModal(false);
            fetchPolicies();
        } catch (err) {
            setError('Failed to update policy.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="management-page-container fadeIn">
            <h2 className="page-main-title mb-4">Vehicle Quota Policies</h2>
            
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <Card className="residem-card">
                <Card.Body>
                    {loading ? <div className="text-center p-5"><Spinner animation="border"/></div> : (
                        <div className="table-wrapper">
                            <Table hover striped className="residem-table align-middle">
                                <thead>
                                    <tr>
                                        <th>Room Type</th>
                                        <th>Description</th>
                                        <th>Max Cars</th>
                                        <th>Max Motorbikes</th>
                                        {/* [UPDATED] Thêm cột Max Bicycles */}
                                        <th>Max Bicycles</th>
                                        <th className="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {policies.map(p => (
                                        <tr key={p.type_code}>
                                            <td>
                                                <span className="badge bg-primary fs-6">Type {p.type_code}</span>
                                            </td>
                                            <td className="text-muted">{p.description}</td>
                                            <td className="fw-bold text-dark">
                                                <CarFrontFill className="me-2 text-secondary"/> {p.max_cars}
                                            </td>
                                            <td className="fw-bold text-dark">
                                                <Scooter className="me-2 text-secondary"/> {p.max_motorbikes}
                                            </td>
                                            {/* [UPDATED] Hiển thị Max Bicycles */}
                                            <td className="fw-bold text-dark">
                                                <Bicycle className="me-2 text-secondary"/> {p.max_bicycles || 'Unl.'}
                                            </td>
                                            <td className="text-end">
                                                <Button variant="light" className="btn-residem-warning btn-sm" onClick={() => handleEdit(p)}>
                                                    <PencilSquare className="me-1"/> Edit Limit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Edit Quota: Type {currentPolicy?.type_code}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Description</Form.Label>
                            <Form.Control type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </Form.Group>
                        <div className="row">
                            <div className="col-4">
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">Max Cars</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><CarFrontFill/></InputGroup.Text>
                                        <Form.Control type="number" min="0" value={formData.max_cars} onChange={e => setFormData({...formData, max_cars: parseInt(e.target.value)})} />
                                    </InputGroup>
                                </Form.Group>
                            </div>
                            <div className="col-4">
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">Max Motorbikes</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Scooter/></InputGroup.Text>
                                        <Form.Control type="number" min="0" value={formData.max_motorbikes} onChange={e => setFormData({...formData, max_motorbikes: parseInt(e.target.value)})} />
                                    </InputGroup>
                                </Form.Group>
                            </div>
                            {/* [UPDATED] Ô nhập Max Bicycles */}
                            <div className="col-4">
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">Max Bicycles</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Bicycle/></InputGroup.Text>
                                        <Form.Control type="number" min="0" value={formData.max_bicycles} onChange={e => setFormData({...formData, max_bicycles: parseInt(e.target.value)})} />
                                    </InputGroup>
                                </Form.Group>
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button className="btn-residem-primary" onClick={handleSave} disabled={saving}>
                        {saving ? <Spinner size="sm"/> : 'Save Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default PolicyManagement;
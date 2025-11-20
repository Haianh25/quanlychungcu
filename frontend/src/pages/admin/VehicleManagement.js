import React, { useState, useEffect, useCallback } from 'react';
import { Container, Tabs, Tab, Table, Button, Spinner, Alert, Modal, Image, Form, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import { PencilFill, PauseCircleFill, PlayCircleFill, Trash } from 'react-bootstrap-icons';
import './VehicleManagement.css';

const API_BASE_URL = 'http://localhost:5000';

// --- (Component Edit Modal) ---
const getVehicleTypeText = (type) => ({ car: 'Car', motorbike: 'Motorbike', bicycle: 'Bicycle' }[type] || type);

const EditCardModal = ({ show, handleClose, cardData, onSave, loading }) => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        if (cardData) {
            setFormData({
                card_user_name: cardData.card_user_name || '',
                license_plate: cardData.license_plate || '',
                brand: cardData.brand || '',
                color: cardData.color || ''
            });
            setError('');
        }
    }, [cardData]);

    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    const handleSaveChanges = async () => {
         setError('');
        if (!formData.card_user_name || !formData.brand || !formData.color) { setError('User name, brand, and color are required.'); return; }
        if (cardData && cardData.vehicle_type !== 'bicycle' && !formData.license_plate) { setError('License plate is required for cars/motorbikes.'); return; }
        if(cardData) {
            onSave(cardData.id, formData);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title className="residem-modal-title">Edit Vehicle Card #{cardData?.id}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {cardData ? (
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Vehicle Type</Form.Label>
                            <Form.Control className="residem-form-control" type="text" value={getVehicleTypeText(cardData.vehicle_type)} disabled readOnly />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Card User Name<span className="required-star">*</span></Form.Label>
                            <Form.Control className="residem-form-control" type="text" name="card_user_name" value={formData.card_user_name || ''} onChange={handleChange} required />
                        </Form.Group>
                        {cardData.vehicle_type !== 'bicycle' && (
                            <Form.Group className="mb-3">
                                <Form.Label className="residem-form-label">License Plate<span className="required-star">*</span></Form.Label>
                                <Form.Control className="residem-form-control" type="text" name="license_plate" value={formData.license_plate || ''} onChange={handleChange} required />
                            </Form.Group>
                        )}
                        <Row>
                            <Col><Form.Group className="mb-3"><Form.Label className="residem-form-label">Brand<span className="required-star">*</span></Form.Label><Form.Control className="residem-form-control" type="text" name="brand" value={formData.brand || ''} onChange={handleChange} required /></Form.Group></Col>
                            <Col><Form.Group className="mb-3"><Form.Label className="residem-form-label">Color<span className="required-star">*</span></Form.Label><Form.Control className="residem-form-control" type="text" name="color" value={formData.color || ''} onChange={handleChange} required /></Form.Group></Col>
                        </Row>
                        {error && <Alert variant="danger" size="sm">{error}</Alert>}
                    </Form>
                ) : <div className="text-center"><Spinner animation="border" /></div>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="residem-secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
                <Button className="btn-residem-primary" onClick={handleSaveChanges} disabled={loading}>
                    {loading ? <Spinner as="span" size="sm" /> : 'Save Changes'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

const getRequestTypeText = (type) => ({ register: 'New Registration', reissue: 'Reissue', cancel: 'Cancel' }[type] || type);

const VehicleManagement = () => {
    const [key, setKey] = useState('pending');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [allCards, setAllCards] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [loadingCards, setLoadingCards] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageUrlToShow, setImageUrlToShow] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [requestToReject, setRequestToReject] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [cardToEditDetails, setCardToEditDetails] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [sortRequestsBy, setSortRequestsBy] = useState('newest');

    const getAuthConfig = useCallback(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) { setError("Authentication error: Admin token missing."); return null; }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    const fetchPendingRequests = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) return;
        setLoadingRequests(true); setError('');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/vehicle-requests?status=pending&sortBy=${sortRequestsBy}`, config);
            setPendingRequests(res.data);
        } catch (err) { setError(err.response?.data?.message || 'Failed load pending.'); }
        finally { setLoadingRequests(false); }
    }, [getAuthConfig, sortRequestsBy]); 

    const fetchAllCards = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) return;
        setLoadingCards(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/vehicle-cards`, config);
            setAllCards(res.data);
        } catch (err) { setError(err.response?.data?.message || 'Failed load cards.'); }
        finally { setLoadingCards(false); }
    }, [getAuthConfig]); 

    useEffect(() => { fetchAllCards(); }, [fetchAllCards]);
    useEffect(() => { fetchPendingRequests(); }, [fetchPendingRequests]);

    const handleApprove = async (requestId) => {
         const config = getAuthConfig(); if (!config) return;
        setError(''); setSuccess('');
        if (!window.confirm(`Approve request #${requestId}?`)) return;
        try {
            await axios.post(`${API_BASE_URL}/api/admin/vehicle-requests/${requestId}/approve`, {}, config);
            setSuccess(`Request #${requestId} approved.`);
            await fetchPendingRequests(); await fetchAllCards();
        } catch (err) { setError(err.response?.data?.message || `Approve failed.`);}
    };

    const openRejectModal = (request) => { setRequestToReject(request); setRejectReason(''); setShowRejectModal(true); };

    const handleReject = async () => {
         const config = getAuthConfig(); if (!config) return;
        if (!rejectReason.trim()) { alert("Please enter reason."); return; }
        setRejectLoading(true); setError(''); setSuccess('');
        try {
            if (!requestToReject || !requestToReject.id) { throw new Error("Invalid request data."); }
            const requestId = requestToReject.id;
            await axios.post(`${API_BASE_URL}/api/admin/vehicle-requests/${requestId}/reject`, { admin_notes: rejectReason }, config);
            setSuccess(`Request #${requestId} rejected.`); setShowRejectModal(false);
            await fetchPendingRequests();
        } catch (err) { setError(err.response?.data?.message || `Reject failed.`); setShowRejectModal(false);}
        finally { setRejectLoading(false); }
    };

    const handleShowImage = (url) => {
        const fullUrl = url && url.startsWith('/uploads') ? `${API_BASE_URL}${url}` : url;
        setImageUrlToShow(fullUrl || ''); setShowImageModal(true);
    };
    const handleCloseImageModal = () => setShowImageModal(false);
    const handleCloseRejectModal = () => setShowRejectModal(false);

    const handleOpenEditModal = async (cardId) => {
        setError(''); setSuccess(''); setEditLoading(true); setShowEditModal(true); setCardToEditDetails(null);
        try {
            const config = getAuthConfig(); if (!config) throw new Error("Admin not logged in.");
            const res = await axios.get(`${API_BASE_URL}/api/admin/vehicle-cards/${cardId}`, config);
            setCardToEditDetails(res.data);
        } catch (err) { setError(err.response?.data?.message || `Cannot load card #${cardId}.`); setShowEditModal(false); }
        finally { setEditLoading(false); }
    };
    const handleCloseEditModal = () => { setShowEditModal(false); setCardToEditDetails(null); };

    const handleSaveChanges = async (cardId, updatedData) => {
        setError(''); setSuccess(''); setEditLoading(true);
        try {
            const config = getAuthConfig(); if (!config) throw new Error("Admin not logged in.");
            await axios.put(`${API_BASE_URL}/api/admin/vehicle-cards/${cardId}`, updatedData, config);
            setSuccess(`Card #${cardId} has been updated.`); handleCloseEditModal();
            await fetchAllCards();
        } catch (err) { setError(err.response?.data?.message || `Update card #${cardId} failed.`); }
        finally { setEditLoading(false); }
    };

    const handleSetStatus = async (cardId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        setError(''); setSuccess('');
        if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'Activate' : 'Deactivate'} card #${cardId}?`)) return;
        try {
            const config = getAuthConfig(); if (!config) throw new Error("Admin not logged in.");
            await axios.patch(`${API_BASE_URL}/api/admin/vehicle-cards/${cardId}/status`, { status: newStatus }, config);
            setSuccess(`Card #${cardId} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
            await fetchAllCards();
        } catch (err) { setError(err.response?.data?.message || `Update status card #${cardId} failed.`); }
    };

    return (
        <div className="management-page-container fadeIn">
            <h2 className="page-main-title mb-4">Vehicle Card Management</h2>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            <Tabs id="vehicle-management-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3 residem-tabs">
                <Tab eventKey="pending" title={`Pending Requests (${loadingRequests ? '...' : pendingRequests.length})`}>
                    <Card className="residem-card">
                        <Card.Body>
                            <Form.Group as={Row} className="mb-3 align-items-center" controlId="sortRequestsBy">
                                <Form.Label column sm="auto" className="residem-form-label mb-0">Sort by:</Form.Label>
                                <Col sm="4" md="3" lg="2">
                                    <Form.Select className="residem-form-select" value={sortRequestsBy} onChange={(e) => setSortRequestsBy(e.target.value)}>
                                        <option value="newest">Newest Requests</option>
                                        <option value="oldest">Oldest Requests</option>
                                    </Form.Select>
                                </Col>
                            </Form.Group>

                            <div className="table-wrapper">
                                {loadingRequests ? <div className="text-center p-5"><Spinner animation="border" /></div> :
                                pendingRequests.length === 0 ? <Alert variant="residem-info" className="no-news-alert">No pending requests.</Alert> : (
                                    <Table striped hover responsive size="sm" className="residem-table align-middle">
                                        <thead><tr><th>STT</th><th>Resident</th><th>Req. Type</th><th>Type</th><th>User</th><th>License Plate</th><th>Brand</th><th>Proof/Reason</th><th>Time</th><th>Actions</th></tr></thead>
                                        <tbody>{pendingRequests.map((req, index) => (
                                            <tr key={req.id}>
                                                <td>{index + 1}</td>
                                                <td>{req.resident_name || `ID:${req.resident_id}`}</td>
                                                <td>{getRequestTypeText(req.request_type)}</td>
                                                <td>{getVehicleTypeText(req.vehicle_type)}</td><td>{req.full_name}</td><td>{req.license_plate || 'N/A'}</td><td>{req.brand}</td>
                                                <td>
                                                    {req.proof_image_url ? (<Button variant="link" size="sm" className="residem-link" onClick={() => handleShowImage(req.proof_image_url)}>View Photo</Button>)
                                                      : req.reason ? (<span title={req.reason}>{req.reason.substring(0, 30)}{req.reason.length > 30 ? '...' : ''}</span>)
                                                      : '-'}
                                                </td>
                                                <td>{new Date(req.requested_at).toLocaleString('vi-VN')}</td>
                                                <td className="actions-cell">
                                                    <Button className="btn-residem-success btn-sm me-1" onClick={() => handleApprove(req.id)} disabled={loadingRequests}>Approve</Button>
                                                    <Button className="btn-residem-danger btn-sm" onClick={() => openRejectModal(req)} disabled={loadingRequests}>Reject</Button>
                                                </td>
                                            </tr>
                                        ))}</tbody>
                                    </Table>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="all" title="All Cards">
                    <Card className="residem-card">
                        <Card.Body>
                            <div className="table-wrapper">
                                {loadingCards ? <div className="text-center p-5"><Spinner animation="border" /></div> :
                                allCards.length === 0 ? <Alert variant="residem-info" className="no-news-alert">No vehicle cards found.</Alert> : (
                                    <Table striped hover responsive size="sm" className="residem-table align-middle">
                                        <thead><tr><th>STT</th><th>Resident</th><th>User</th><th>Type</th><th>License Plate</th><th>Brand</th><th>Status</th><th>Issued At</th><th>Actions</th></tr></thead>
                                        <tbody>{allCards.map((card, index) => {
                                            const isChangableStatus = card.status === 'active' || card.status === 'inactive';
                                            return (
                                            <tr key={card.id}>
                                                <td>{index + 1}</td>
                                                <td>{card.resident_name || `ID:${card.resident_id}`}</td><td>{card.card_user_name}</td><td>{getVehicleTypeText(card.vehicle_type)}</td><td>{card.license_plate || 'N/A'}</td><td>{card.brand}</td>
                                                <td>
                                                    <span className={`status-badge ${
                                                        {'active':'status-success', 'inactive':'status-warning', 'lost':'status-secondary', 'canceled':'status-danger'}[card.status] || 'status-secondary'
                                                    }`}>
                                                        {card.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(card.issued_at).toLocaleDateString('vi-VN')}</td>
                                                <td className="actions-cell">
                                                    <Button className="btn-residem-warning btn-sm me-1" onClick={() => handleOpenEditModal(card.id)} title="Edit">
                                                        <PencilFill />
                                                    </Button>
                                                    {isChangableStatus && (
                                                        <Button
                                                            className={card.status === 'active' ? 'btn-residem-pause btn-sm' : 'btn-residem-play btn-sm'}
                                                            onClick={() => handleSetStatus(card.id, card.status)}
                                                            title={card.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {card.status === 'active' ? <PauseCircleFill /> : <PlayCircleFill />}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                            )
                                        })}</tbody>
                                    </Table>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            <Modal show={showImageModal} onHide={handleCloseImageModal} centered size="lg">
                 <Modal.Header closeButton><Modal.Title className="residem-modal-title">Proof Document</Modal.Title></Modal.Header>
                 <Modal.Body className="text-center">
                     {imageUrlToShow ? <Image src={imageUrlToShow} fluid onError={(e) => { e.target.onerror = null; e.target.alt="Image failed to load or does not exist"; e.target.src="/images/placeholder-error.png"}} /> : <p>No image URL provided.</p>}
                 </Modal.Body>
             </Modal>

            <Modal show={showRejectModal} onHide={handleCloseRejectModal} centered>
                 <Modal.Header closeButton><Modal.Title className="residem-modal-title">Reject Request #{requestToReject?.id}</Modal.Title></Modal.Header>
                 <Modal.Body><Form.Group><Form.Label className="residem-form-label">Reason for rejection<span className="required-star">*</span></Form.Label><Form.Control className="residem-form-control" as="textarea" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required /></Form.Group></Modal.Body>
                 <Modal.Footer><Button variant="residem-secondary" onClick={handleCloseRejectModal}>Cancel</Button><Button className="btn-residem-danger" onClick={handleReject} disabled={rejectLoading}>{rejectLoading ? <Spinner size="sm"/> : 'Confirm Rejection'}</Button></Modal.Footer>
             </Modal>

            <EditCardModal show={showEditModal} handleClose={handleCloseEditModal} cardData={cardToEditDetails} onSave={handleSaveChanges} loading={editLoading} />
        </div>
    );
};

export default VehicleManagement;
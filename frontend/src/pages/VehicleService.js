import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Tabs, Tab, Card, Button, Form, Row, Col, Modal, Spinner, Alert, Table, ListGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CarFrontFill, Bicycle, Scooter, InfoCircle, PersonBadge, CardChecklist, FileEarmarkImage } from 'react-bootstrap-icons'; 
import './ServicePage.css'; 

const API_BASE_URL = 'http://localhost:5000';

const initialRegFormData = {
    fullName: '', dob: '', phone: '', relationship: '', licensePlate: '', brand: '', color: ''
};

const VehiclePriceTable = () => {
    const [prices, setPrices] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const formatCurrency = (val) => {
        const price = parseFloat(val);
        if (isNaN(price)) return 'N/A';
        if (price === 0) return 'Free';
        return price.toLocaleString('en-US'); 
    };

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/services/fees-table`); 
                setPrices(res.data);
            } catch (err) { setError('Failed to load price table.'); } 
            finally { setLoading(false); }
        };
        fetchPrices();
    }, []);

    if (loading) return <Card className="mb-4 residem-card text-center p-4"><Spinner animation="border" /></Card>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <Card className="mb-4 residem-card border-0 shadow-sm">
            <Card.Header as="h5" className="residem-card-header bg-white border-bottom-0 pt-4 px-4">
                Parking Fee Schedule
            </Card.Header>
            <Card.Body className="px-4 pb-4">
                <Table hover className="residem-table align-middle w-100">
                    <thead>
                        <tr>
                            <th style={{width: '30%'}}>Vehicle Type</th>
                            <th style={{width: '35%'}}>Card Issuance Fee (VND)</th>
                            <th style={{width: '35%'}}>Monthly Fee (VND)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><CarFrontFill className="me-2 text-brown"/> Car</td>
                            <td className="fw-bold">{formatCurrency(prices.CAR_CARD_FEE)}</td>
                            <td className="fw-bold text-brown">{formatCurrency(prices.CAR_FEE)}</td>
                        </tr>
                        <tr>
                            <td><Scooter className="me-2 text-brown"/> Motorbike</td>
                            <td className="fw-bold">{formatCurrency(prices.MOTORBIKE_CARD_FEE)}</td>
                            <td className="fw-bold text-brown">{formatCurrency(prices.MOTORBIKE_FEE)}</td>
                        </tr>
                        <tr>
                            <td><Bicycle className="me-2 text-brown"/> Bicycle</td>
                            <td className="fw-bold">{formatCurrency(prices.BICYCLE_CARD_FEE)}</td>
                            <td className="fw-bold text-brown">{formatCurrency(prices.BICYCLE_FEE)}</td>
                        </tr>
                    </tbody>
                </Table>
                <small className="text-muted mt-3 d-block fst-italic">
                    * Fees will be automatically added to your monthly apartment bill.
                </small>
            </Card.Body>
        </Card>
    );
};

const VehicleService = () => {
    const [key, setKey] = useState('register'); 
    const [existingCards, setExistingCards] = useState([]);
    const [historyCards, setHistoryCards] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [regVehicleType, setRegVehicleType] = useState(null); 
    const [regFormData, setRegFormData] = useState(initialRegFormData); 
    const [regFile, setRegFile] = useState(null);
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState('');
    const [regSuccess, setRegSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState(''); 
    const [selectedCard, setSelectedCard] = useState(null);
    const [reason, setReason] = useState('');
    const [manageLoading, setManageLoading] = useState(false);
    const [manageError, setManageError] = useState('');
    const [manageSuccess, setManageSuccess] = useState('');
 
    const [policy, setPolicy] = useState({ max_cars: 0, max_motorbikes: 0, max_bicycles: 0, roomType: 'A' });

    const getUserAuthConfig = useCallback(() => {
         const token = localStorage.getItem('token');
         if (!token) { setFetchError("Please login."); return null; }
         return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    const fetchExistingCards = useCallback(async () => {
        const config = getUserAuthConfig();
        if (!config) { setLoading(false); return; }
        setLoading(true); setFetchError('');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/services/my-cards`, config);
            setExistingCards(res.data.managedCards || []);
            setHistoryCards(res.data.historyCards || []);
        } catch (err) { setFetchError('Failed to load cards.'); } 
        finally { setLoading(false); }
    }, [getUserAuthConfig]);

    useEffect(() => {
        const fetchPolicy = async () => {
            const config = getUserAuthConfig();
            if (!config) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/services/my-policy`, config);
                setPolicy(res.data);
            } catch (err) {
                console.error("Failed to load policy", err);
            }
        };
        fetchPolicy();
    }, [getUserAuthConfig]);

    useEffect(() => { fetchExistingCards(); }, [fetchExistingCards]);

    const vehicleCounts = useMemo(() => {
        const counts = { car: 0, motorbike: 0, bicycle: 0 };
        existingCards.forEach(card => {
            const type = card.vehicle_type || card.type;
            if (['active', 'inactive', 'pending_register'].includes(card.status)) {
                if (type === 'car') counts.car++;
                if (type === 'motorbike') counts.motorbike++;
                if (type === 'bicycle') counts.bicycle++;
            }
        });
        return counts;
    }, [existingCards]);

    const canRegisterCar = vehicleCounts.car < policy.max_cars;
    const canRegisterMotorbike = vehicleCounts.motorbike < policy.max_motorbikes;
    const canRegisterBicycle = vehicleCounts.bicycle < policy.max_bicycles; 
    
    const handleVehicleSelect = (type) => { setRegVehicleType(type); setRegFormData(initialRegFormData); setRegFile(null); setRegError(''); setRegSuccess(''); };
    const handleRegFormChange = (e) => { setRegFormData({ ...regFormData, [e.target.name]: e.target.value }); };
    const handleFileChange = (e) => { setRegFile(e.target.files[0]); };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const config = getUserAuthConfig();
        if (!config) return;
        setRegLoading(true); setRegError(''); setRegSuccess('');
        
        if (regVehicleType === 'car' && !canRegisterCar) { setRegError(`Car limit reached (Max ${policy.max_cars}).`); setRegLoading(false); return; }
        if (regVehicleType === 'motorbike' && !canRegisterMotorbike) { setRegError(`Motorbike limit reached (Max ${policy.max_motorbikes}).`); setRegLoading(false); return; }
        if (regVehicleType === 'bicycle' && !canRegisterBicycle) { setRegError(`Bicycle limit reached (Max ${policy.max_bicycles}).`); setRegLoading(false); return; }
        
        if (!regFile) { setRegError('Please upload proof photo.'); setRegLoading(false); return; }

        const formData = new FormData();
        formData.append('vehicleType', regVehicleType);
        Object.keys(regFormData).forEach(key => formData.append(key, regFormData[key]));
        if (regVehicleType === 'bicycle') formData.set('licensePlate', 'N/A');
        formData.append('proofImage', regFile);

        try {
            await axios.post(`${API_BASE_URL}/api/services/register-card`, formData, { ...config, headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } });
            setRegSuccess('Request submitted successfully! Waiting for approval.'); 
            setRegVehicleType(null); 
            fetchExistingCards(); 
        } catch (err) { 
            setRegError(err.response?.data?.message || 'Registration failed.');
        } 
        finally { setRegLoading(false); }
    };

    const getVehicleTypeText = (type) => ({ car: 'Car', motorbike: 'Motorbike', bicycle: 'Bicycle' }[type] || type);
    const openModal = (mode, card) => { setModalMode(mode); setSelectedCard(card); setReason(''); setManageError(''); setManageSuccess(''); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setSelectedCard(null); };

    const handleManageSubmit = async () => {
        const config = getUserAuthConfig();
        if (!config) return;
        if (!reason.trim()) { setManageError('Please enter a reason.'); return; }
        setManageLoading(true);
        try {
            const endpoint = modalMode === 'reissue' ? 'reissue-card' : 'cancel-card';
            await axios.post(`${API_BASE_URL}/api/services/${endpoint}`, { cardId: selectedCard.id, reason }, config);
            setManageSuccess('Request submitted successfully!'); fetchExistingCards(); closeModal();
        } catch (err) { setManageError('Request failed.'); } 
        finally { setManageLoading(false); }
    };

    
    const handleCancelPendingRequest = async (requestId) => {
        if (!window.confirm("Are you sure you want to cancel this registration request?")) return;
        
        const config = getUserAuthConfig();
        if (!config) return;
        
        try {
         
            await axios.post(`${API_BASE_URL}/api/services/cancel-pending-request`, { requestId }, config);
            setManageSuccess('Registration request cancelled.');
            fetchExistingCards(); 
        } catch (err) {
            setFetchError(err.response?.data?.message || 'Failed to cancel request.');
        }
    };

    const renderCardItem = (card) => {
        let iconClass = 'bi bi-patch-question';
        const type = card.vehicle_type || card.type;
        if (type === 'car') iconClass = 'bi bi-car-front-fill';
        if (type === 'motorbike') iconClass = 'bi bi-scooter';
        if (type === 'bicycle') iconClass = 'bi bi-bicycle';
        
        let statusText = card.status;
        let statusClass = 'status-badge status-secondary';
        let actions = null;

        switch (card.status) {
            case 'active': statusText = 'Active'; statusClass = 'status-badge status-success';
                actions = (<><Button variant="residem-warning" size="sm" onClick={() => openModal('reissue', card)}>Reissue</Button><Button variant="residem-danger" size="sm" onClick={() => openModal('cancel', card)}>Cancel</Button></>); break;
            case 'inactive': statusText = 'Locked'; statusClass = 'status-badge status-warning';
                actions = (<><Button variant="residem-warning" size="sm" onClick={() => openModal('reissue', card)}>Reissue</Button><Button variant="residem-danger" size="sm" onClick={() => openModal('cancel', card)}>Cancel</Button></>); break;
            case 'pending_register': 
                statusText = 'Pending Reg.'; 
                statusClass = 'status-badge status-pending';
                
                actions = (
                    <div className="d-flex align-items-center gap-2">
                        <div className="processing-indicator"><i className="bi bi-hourglass-split"></i><span>Processing...</span></div>
                        <Button variant="outline-danger" size="sm" onClick={() => handleCancelPendingRequest(card.real_request_id)}>Cancel Request</Button>
                    </div>
                ); 
                break;
            case 'pending_reissue': statusText = 'Pending Reissue'; statusClass = 'status-badge status-pending';
                actions = (<><div className="processing-indicator"><i className="bi bi-hourglass-split"></i><span>Pending</span></div><Button variant="residem-danger" size="sm" onClick={() => openModal('cancel', card)}>Cancel</Button></>); break;
            case 'pending_cancel': statusText = 'Pending Cancel'; statusClass = 'status-badge status-pending';
                actions = (<div className="processing-indicator"><i className="bi bi-hourglass-split"></i><span>Pending</span></div>); break;
            case 'lost': statusText = 'Lost'; statusClass = 'status-badge status-danger'; break;
            case 'canceled': statusText = 'Canceled'; statusClass = 'status-badge status-danger'; break;
            default: statusText = card.status;
        }

        return (
            <div className="existing-card-item" key={card.id || card.request_id}>
                <div className="existing-card-info">
                    <i className={iconClass}></i>
                    <div><h5>{card.brand} {card.model}</h5><p>Plate: <span>{card.license_plate || 'N/A'}</span></p><p>Status: <span className={statusClass}>{statusText}</span></p></div>
                </div>
                {actions && <div className="existing-card-actions">{actions}</div>}
            </div>
        );
    };


    const renderRegisterForm = () => {
         if (!regVehicleType) return null;
         const typeName = getVehicleTypeText(regVehicleType);
         
         return (
             <Container className="registration-form-container residem-card shadow-sm">
                 <div className="form-header">
                    <h4 className="form-title">New Registration</h4>
                    <div className="form-subtitle">Request parking card for: <strong className="text-brown">{typeName}</strong></div>
                 </div>

                 <Form onSubmit={handleRegisterSubmit} className="p-2">
                     
                    
                     <div className="form-section">
                          <h6 className="form-section-header"><PersonBadge className="me-2"/>Owner Information</h6>
                          <Row className="g-3">
                             <Col md={6}>
                                  <Form.Group>
                                     <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                                     <Form.Control placeholder="e.g. Nguyen Van A" type="text" name="fullName" value={regFormData.fullName} onChange={handleRegFormChange} required />
                                  </Form.Group>
                             </Col>
                             <Col md={6}>
                                  <Form.Group>
                                     <Form.Label>Date of Birth <span className="text-danger">*</span></Form.Label>
                                     <Form.Control type="date" name="dob" value={regFormData.dob} onChange={handleRegFormChange} required />
                                  </Form.Group>
                             </Col>
                             <Col md={6}>
                                  <Form.Group>
                                     <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                                     <Form.Control placeholder="09xxxxxxxx" type="tel" name="phone" value={regFormData.phone} onChange={handleRegFormChange} required />
                                  </Form.Group>
                             </Col>
                              <Col md={6}>
                                  <Form.Group>
                                     <Form.Label>Relationship <span className="text-danger">*</span></Form.Label>
                                     <Form.Select name="relationship" value={regFormData.relationship} onChange={handleRegFormChange} required>
                                         <option value="">-- Select --</option>
                                         <option value="Owner">Owner</option>
                                         <option value="Tenant">Tenant</option>
                                         <option value="Family">Family Member</option>
                                     </Form.Select>
                                  </Form.Group>
                              </Col>
                          </Row>
                      </div>

             
                      <div className="form-section mt-4">
                           <h6 className="form-section-header"><CardChecklist className="me-2"/>Vehicle Details</h6>
                           <Row className="g-3">
                              <Col md={4}>
                                   <Form.Group>
                                      <Form.Label>Brand <span className="text-danger">*</span></Form.Label>
                                      <Form.Control placeholder="e.g. Honda" type="text" name="brand" value={regFormData.brand} onChange={handleRegFormChange} required />
                                   </Form.Group>
                              </Col>
                              <Col md={4}>
                                   <Form.Group>
                                      <Form.Label>Color <span className="text-danger">*</span></Form.Label>
                                       <Form.Control placeholder="e.g. Black" type="text" name="color" value={regFormData.color} onChange={handleRegFormChange} required />
                                   </Form.Group>
                              </Col>
                              {regVehicleType !== 'bicycle' && (
                                  <Col md={4}>
                                      <Form.Group>
                                           <Form.Label>License Plate <span className="text-danger">*</span></Form.Label>
                                           <Form.Control placeholder="e.g. 29A-123.45" type="text" name="licensePlate" value={regFormData.licensePlate} onChange={handleRegFormChange} required />
                                       </Form.Group>
                                  </Col>
                              )}
                           </Row>
                      </div>

                     
                      <div className="form-section mt-4">
                          <h6 className="form-section-header"><FileEarmarkImage className="me-2"/>Documents</h6>
                           <Form.Group className="file-upload-box p-3 rounded border-dashed">
                              <Form.Label>Proof Photo <span className="text-danger">*</span></Form.Label>
                              <Form.Control type="file" name="proofImage" onChange={handleFileChange} accept="image/*" required />
                               <Form.Text className="text-muted mt-2 d-block">
                                   <InfoCircle className="me-1"/> Please upload a clear photo of your <strong>Vehicle Registration Certificate (Cà vẹt xe)</strong> or ID Card matching the vehicle owner.
                               </Form.Text>
                           </Form.Group>
                      </div>
                      
                    
                       <div className="mt-4 pt-3 border-top">
                         
                         {regError && <Alert variant="danger" className="mb-3 py-2 small"><i className="bi bi-exclamation-circle me-2"></i>{regError}</Alert>}
                         
                         <div className="d-flex justify-content-end gap-3">
                             <Button variant="residem-secondary" className="px-4" onClick={() => setRegVehicleType(null)}>Cancel</Button>
                             <Button className="btn-residem-primary px-4" type="submit" disabled={regLoading}>
                                 {regLoading ? <><Spinner size="sm" className="me-2"/>Processing...</> : 'Submit Registration'}
                             </Button>
                         </div>
                      </div>
                 </Form>
             </Container>
         );
    };

    return (
        <Container className="service-page my-5 fadeIn">
            <div className="mb-4">
                <Link to="/services" className="text-decoration-none text-muted small font-weight-bold">
                    <i className="bi bi-arrow-left me-2"></i> Back to Services
                </Link>
            </div>
            
            <Row>
                
                <Col lg={8}>
                    <h2 className="mb-4 page-main-title">Vehicle Parking</h2>
              
                    <VehiclePriceTable />

                    {fetchError && <Alert variant="danger">{fetchError}</Alert>}
                    {manageSuccess && <Alert variant="success" dismissible onClose={() => setManageSuccess('')}>{manageSuccess}</Alert>}
                    {regSuccess && <Alert variant="success" dismissible onClose={() => setRegSuccess('')} className="mb-3 fade show">
                        <i className="bi bi-check-circle-fill me-2"></i>{regSuccess}
                    </Alert>}

                    <Tabs id="vehicle-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-4 residem-tabs">
                        <Tab eventKey="register" title="New Registration">
                            {!regVehicleType ? (
                                <Row className="g-3 mt-2">
                                    {['car', 'motorbike', 'bicycle'].map(type => {
                                        
                                         const disabled = (type === 'car' && !canRegisterCar) || 
                                                          (type === 'motorbike' && !canRegisterMotorbike) ||
                                                          (type === 'bicycle' && !canRegisterBicycle);
                                              return (
                                                  <Col md={4} key={type}>
                                                      <Card className={`text-center h-100 ${disabled ? 'vehicle-selection-card-disabled' : 'vehicle-selection-card'}`} onClick={() => !disabled && handleVehicleSelect(type)}>
                                                           <Card.Body className="d-flex flex-column justify-content-center align-items-center p-4">
                                                              <i className={`bi bi-${type === 'car' ? 'car-front-fill' : type === 'motorbike' ? 'scooter' : 'bicycle'} mb-3`}></i>
                                                              <Card.Title className="mb-2">{getVehicleTypeText(type)}</Card.Title>
                                                              {disabled ? <Card.Text className="small text-danger fw-bold">Limit Reached</Card.Text> : <Card.Text className="small text-success fw-bold">Available</Card.Text>}
                                                          </Card.Body>
                                                       </Card>
                                                  </Col>
                                              );
                                    })}
                                </Row>
                            ) : ( renderRegisterForm() )}
                        </Tab>
            
                        <Tab eventKey="manage" title="Manage Cards">
                            <div className="tab-pane-content">
                                {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : existingCards.length === 0 ? <Alert variant="light" className="text-center text-muted border">No active cards.</Alert> : existingCards.map(card => renderCardItem(card))}
                            </div>
                        </Tab>
                        <Tab eventKey="history" title="History">
                            <div className="tab-pane-content">
                                {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : historyCards.length === 0 ? <Alert variant="light" className="text-center text-muted border">No history.</Alert> : historyCards.map(card => renderCardItem(card))}
                            </div>
                        </Tab>
                    </Tabs>
                </Col>
   
                <Col lg={4}>
                    <aside className="service-sidebar">
                        <Card className="sidebar-widget border-0 shadow-sm mb-4 policy-card">
                            <Card.Body className="p-4">
                                <h5 className="widget-title mb-3"><InfoCircle className="me-2 text-brown"/> Registration Policy</h5>
                                <ListGroup variant="flush" className="policy-list">
                                     <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                                         <span><CarFrontFill className="me-2 text-muted"/> Car</span>
                                         
                                         <Badge bg="warning" text="dark" className="rounded-pill">Max {policy.max_cars}</Badge>
                                     </ListGroup.Item>
                                     <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                                              <span><Scooter className="me-2 text-muted"/> Motorbike</span>
                                         
                                         <Badge bg="warning" text="dark" className="rounded-pill">Max {policy.max_motorbikes}</Badge>
                                      </ListGroup.Item>
                                     <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                                         <span><Bicycle className="me-2 text-muted"/> Bicycle</span>
                                        
                                         <Badge bg="success" className="rounded-pill">Max {policy.max_bicycles}</Badge>
                                     </ListGroup.Item>
                                </ListGroup>
                                <div className="mt-3 small text-muted fst-italic">
                                    * Policy for your Room Type: <strong>{policy.roomType}</strong>
                                </div>
                            </Card.Body>
                        </Card>

                        <div className="sidebar-widget mb-4">
                             <h5 className="widget-title">Steps</h5>
                            <ListGroup variant="flush" className="steps-list">
                                <ListGroup.Item><span className="step-number">1</span>Select vehicle type.</ListGroup.Item>
                                <ListGroup.Item><span className="step-number">2</span>Fill in info & Upload proof.</ListGroup.Item>
                                <ListGroup.Item><span className="step-number">3</span>Wait for admin approval.</ListGroup.Item>
                                <ListGroup.Item><span className="step-number">4</span>Get your card.</ListGroup.Item>
                             </ListGroup>
                        </div>

                        <div className="sidebar-widget">
                            <h5 className="widget-title">Support</h5>
                             <div className="p-2">
                                <p className="mb-2 font-weight-bold text-dark">Lost Card?</p>
                                <p className="text-muted small mb-3">Go to "Manage Cards" tab and select "Reissue". Fee may apply.</p>
                                <p className="mb-2 font-weight-bold text-dark">Cancel Service?</p>
                                <p className="text-muted small mb-0">Go to "Manage Cards" tab and select "Cancel".</p>
                             </div>
                        </div>
                    </aside>
                </Col>
            </Row>
            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton><Modal.Title className="residem-modal-title">Request Action</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Reason<span className="required-star">*</span></Form.Label>
                        <Form.Control as="textarea" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setManageError(''); }} isInvalid={!!manageError} placeholder="Please describe why..." />
                        <Form.Control.Feedback type="invalid">{manageError}</Form.Control.Feedback>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                     <Button variant="residem-secondary" onClick={closeModal}>Close</Button>
                    <Button className="btn-residem-primary" onClick={handleManageSubmit} disabled={manageLoading}>{manageLoading ? <Spinner size="sm"/> : 'Submit'}</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default VehicleService;
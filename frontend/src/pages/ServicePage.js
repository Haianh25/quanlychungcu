// frontend/src/pages/ServicePage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Tabs, Tab, Card, Button, Form, Row, Col, Modal, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import './ServicePage.css'; // Import CSS

const API_BASE_URL = 'http://localhost:5000'; // Define base URL

// Initial form structure
const initialRegFormData = {
    fullName: '',
    dob: '',
    phone: '',
    relationship: '',
    licensePlate: '',
    brand: '',
    color: ''
};

const ServicePage = () => {
    const [key, setKey] = useState('register'); // State for Tab
    const [existingCards, setExistingCards] = useState([]);
    const [historyCards, setHistoryCards] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    // === State for Tab 1: New Registration ===
    const [regVehicleType, setRegVehicleType] = useState(null); // 'car', 'motorbike', 'bicycle'
    const [regFormData, setRegFormData] = useState(initialRegFormData); // Use initial state
    const [regFile, setRegFile] = useState(null);
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState('');
    const [regSuccess, setRegSuccess] = useState('');

    // === State for Tab 2: Manage (Reissue / Cancel) ===
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState(''); // 'reissue' or 'cancel'
    const [selectedCard, setSelectedCard] = useState(null);
    const [reason, setReason] = useState('');
    const [manageLoading, setManageLoading] = useState(false);
    const [manageError, setManageError] = useState('');
    const [manageSuccess, setManageSuccess] = useState('');

    // Get User Auth Token
     const getUserAuthConfig = useCallback(() => {
        const token = localStorage.getItem('token');
         if (!token) {
             setFetchError("Please log in to use this service.");
             return null;
        }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    // Fetch user's cards
    const fetchExistingCards = useCallback(async () => {
        const config = getUserAuthConfig();
        if (!config) { setLoading(false); return; }
        setLoading(true);
        setFetchError('');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/services/my-cards`, config);
            setExistingCards(res.data.managedCards || []);
            setHistoryCards(res.data.historyCards || []);
        } catch (err) {
            console.error('Error loading card list:', err);
            setFetchError(err.response?.data?.message || 'Could not load your card list.');
        } finally {
            setLoading(false);
        }
    }, [getUserAuthConfig]);

    // Load cards on component mount
    useEffect(() => {
        fetchExistingCards();
    }, [fetchExistingCards]);

    // --- Calculate vehicle limits (Logic 2-2-inf) ---
    const vehicleCounts = useMemo(() => {
        const counts = { car: 0, motorbike: 0 };
        existingCards.forEach(card => {
            const type = card.vehicle_type || card.type;
            if (type === 'car') {
                if (card.status === 'active' || card.status === 'inactive' || card.status === 'pending_register') {
                    counts.car++;
                }
            }
            if (type === 'motorbike') {
                 if (card.status === 'active' || card.status === 'inactive' || card.status === 'pending_register') {
                    counts.motorbike++;
                }
            }
        });
        return counts;
    }, [existingCards]);

    const canRegisterCar = vehicleCounts.car < 2;
    const canRegisterMotorbike = vehicleCounts.motorbike < 2;


    // --- Tab 1 Logic: New Registration ---
    const handleVehicleSelect = (type) => {
        setRegVehicleType(type);
        setRegFormData(initialRegFormData);
        setRegFile(null);
        setRegError('');
        setRegSuccess('');
    };

    const handleRegFormChange = (e) => {
        setRegFormData({ ...regFormData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setRegFile(e.target.files[0]);
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const config = getUserAuthConfig();
        if (!config) return;

        setRegLoading(true); setRegError(''); setRegSuccess('');

        // Frontend validation for new limits
        if (regVehicleType === 'car' && !canRegisterCar) {
            setRegError('You have reached the limit of 2 car cards.');
            setRegLoading(false); return;
        }
         if (regVehicleType === 'motorbike' && !canRegisterMotorbike) {
            setRegError('You have reached the limit of 2 motorbike cards.');
            setRegLoading(false); return;
        }
        if (!regFile) {
            setRegError('Please upload a proof document.');
             setRegLoading(false); return;
        }

        const formData = new FormData();
        formData.append('vehicleType', regVehicleType);
        Object.keys(regFormData).forEach(key => formData.append(key, regFormData[key]));
        if (regVehicleType === 'bicycle') formData.set('licensePlate', 'N/A');
        formData.append('proofImage', regFile);

        try {
            await axios.post(`${API_BASE_URL}/api/services/register-card`, formData, {
                ...config,
                headers: {
                    ...config.headers,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setRegSuccess('Registration request sent successfully! Please wait for approval.');
            setRegVehicleType(null);
            fetchExistingCards(); // Reload cards
        } catch (err) {
            setRegError(err.response?.data?.message || 'Registration failed. Please try again.');
            console.error('Error registering card:', err);
        } finally {
            setRegLoading(false);
        }
    };

     // Helper text
     const getVehicleTypeText = (type) => ({ car: 'Car', motorbike: 'Motorbike', bicycle: 'Bicycle' }[type] || type);

     // Render Registration Form
     const renderRegisterForm = () => {
        if (!regVehicleType) return null;
        const typeName = getVehicleTypeText(regVehicleType);
        return (
             <Container className="registration-form-container">
                 <h4 className="mb-3">Register Card for {typeName}</h4>
                 <Form onSubmit={handleRegisterSubmit}>
                     <Row>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Card User's Full Name</Form.Label><Form.Control type="text" name="fullName" value={regFormData.fullName} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={4}><Form.Group className="mb-3"><Form.Label>Date of Birth</Form.Label><Form.Control type="date" name="dob" value={regFormData.dob} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={4}><Form.Group className="mb-3"><Form.Label>Phone Number</Form.Label><Form.Control type="tel" name="phone" value={regFormData.phone} onChange={handleRegFormChange} required /></Form.Group></Col>
                     </Row>
                     <Row>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Relationship to Owner</Form.Label><Form.Control type="text" name="relationship" value={regFormData.relationship} onChange={handleRegFormChange} required /></Form.Group></Col>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Brand</Form.Label><Form.Control type="text" name="brand" value={regFormData.brand} onChange={handleRegFormChange} required /></Form.Group></Col>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Color</Form.Label><Form.Control type="text" name="color" value={regFormData.color} onChange={handleRegFormChange} required /></Form.Group></Col>
                    </Row>
                     <Row>
                        {regVehicleType !== 'bicycle' && (
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>License Plate</Form.Label><Form.Control type="text" name="licensePlate" value={regFormData.licensePlate} onChange={handleRegFormChange} required /></Form.Group></Col>
                        )}
                        <Col md={regVehicleType !== 'bicycle' ? 6 : 12}><Form.Group className="mb-3"><Form.Label>Proof Document (Vehicle/Plate Photo)</Form.Label><Form.Control type="file" name="proofImage" onChange={handleFileChange} accept="image/*" required /></Form.Group></Col>
                     </Row>

                    {regError && <Alert variant="danger">{regError}</Alert>}
                    {regSuccess && <Alert variant="success">{regSuccess}</Alert>}
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button variant="secondary" onClick={() => setRegVehicleType(null)}>Back</Button>
                        <Button variant="primary" type="submit" disabled={regLoading}>
                            {regLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Submit Registration'}
                        </Button>
                    </div>
                </Form>
            </Container>
        );
      };

    // --- Tab 2 Logic: Manage Cards ---
    const openModal = (mode, card) => {
        setModalMode(mode); setSelectedCard(card); setReason(''); setManageError(''); setManageSuccess(''); setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false); setSelectedCard(null);
    };

    const handleManageSubmit = async () => {
        const config = getUserAuthConfig();
        if (!config) return;

        if (!reason.trim()) { setManageError('Please enter a reason.'); return; }
        setManageLoading(true); setManageError(''); setManageSuccess('');

        try {
            const apiEndpoint = modalMode === 'reissue' ? 'reissue-card' : 'cancel-card';
            await axios.post(`${API_BASE_URL}/api/services/${apiEndpoint}`,
                { cardId: selectedCard.id, reason: reason },
                config
            );
            const successMessage = modalMode === 'reissue' ? 'Reissue request sent!' : 'Cancellation request sent!';
            setManageSuccess(successMessage + ' Please wait for approval.');
            fetchExistingCards(); // Reload
            closeModal();
        } catch (err) {
            setManageError(err.response?.data?.message || 'Request failed.');
            console.error(`Error ${modalMode} card:`, err);
        } finally {
            setManageLoading(false);
        }
    };

    // Render Card Item
    const renderCardItem = (card) => {
        let iconClass = 'bi bi-patch-question';
        const type = card.type || card.vehicle_type;
        if (type === 'car') iconClass = 'bi bi-car-front-fill';
        if (type === 'motorbike') iconClass = 'bi bi-scooter';
        if (type === 'bicycle') iconClass = 'bi bi-bicycle';

        let statusText = card.status;
        let statusClass = 'text-secondary';
        let actions = null;

        switch (card.status) {
            case 'active':
                statusText = 'Active'; statusClass = 'text-success';
                actions = (<>
                    <Button variant="warning" size="sm" onClick={() => openModal('reissue', card)}>Reissue</Button>
                    <Button variant="danger" size="sm" onClick={() => openModal('cancel', card)}>Cancel Card</Button>
                </>);
                break;
            case 'inactive':
                statusText = 'Locked'; statusClass = 'text-warning';
                actions = (<>
                    <Button variant="warning" size="sm" onClick={() => openModal('reissue', card)}>Reissue</Button>
                    <Button variant="danger" size="sm" onClick={() => openModal('cancel', card)}>Cancel Card</Button>
                </>);
                break;
            case 'pending_register':
                statusText = 'Pending Registration'; statusClass = 'text-warning';
                actions = <Button variant="secondary" size="sm" disabled>Processing</Button>;
                break;
            case 'pending_reissue':
                statusText = 'Pending Reissue'; statusClass = 'text-warning';
                actions = (<>
                    <Button variant="warning" size="sm" disabled>Pending Reissue</Button>
                    <Button variant="danger" size="sm" onClick={() => openModal('cancel', card)}>Cancel Card</Button>
                </>);
                break;
             case 'pending_cancel':
                statusText = 'Pending Cancellation'; statusClass = 'text-warning';
                actions = (<>
                    <Button variant="warning" size="sm" disabled>Pending Cxl.</Button>
                    <Button variant="danger" size="sm" disabled>Pending Cxl.</Button>
                </>);
                break;
             case 'lost': statusText = 'Reported Lost'; statusClass = 'text-danger'; actions = null; break;
             case 'canceled': statusText = 'Canceled'; statusClass = 'text-danger'; actions = null; break;
            default: statusText = card.status;
        }

        return (
            <div className="existing-card-item" key={card.id}>
                <div className="existing-card-info">
                    <i className={iconClass}></i>
                    <div>
                        <h5>{card.brand} {card.model || ''}</h5>
                        <p>License Plate: <span>{card.license_plate || 'N/A'}</span></p>
                        <p>Status: <span className={statusClass}>{statusText}</span></p>
                    </div>
                </div>
                {actions && <div className="existing-card-actions">{actions}</div>}
            </div>
        );
    };

    // --- Main JSX Render ---
    return (
        <Container className="service-page my-4">
            <h2 className="mb-4">Parking Card Services</h2>

            {fetchError && <Alert variant="danger">{fetchError}</Alert>}
            {manageSuccess && <Alert variant="success" onClose={() => setManageSuccess('')} dismissible>{manageSuccess}</Alert>}

            <Tabs id="service-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
                {/* --- Tab 1: Register --- */}
                <Tab eventKey="register" title="Register New Card">
                    {!regVehicleType ? (
                         <>
                            <h4 className="mb-3">Select vehicle type:</h4>
                            <Row>
                                {/* Car Card (with new limit) */}
                                {canRegisterCar ? (
                                    <Col md={4} className="mb-3">
                                        <Card className="text-center vehicle-selection-card" onClick={() => handleVehicleSelect('car')}>
                                            <Card.Body>
                                                <i className="bi bi-car-front-fill"></i>
                                                <Card.Title className="mt-3">Car</Card.Title>
                                                <Card.Text className="text-muted">(Slots left: {2 - vehicleCounts.car})</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ) : (
                                    <Col md={4} className="mb-3">
                                        <Card className="text-center text-muted bg-light" style={{ cursor: 'not-allowed' }}>
                                            <Card.Body>
                                                <i className="bi bi-car-front-fill text-muted"></i>
                                                <Card.Title className="mt-3">Car</Card.Title>
                                                <Card.Text>(Limit of 2 reached)</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}
                                {/* Motorbike Card (with new limit) */}
                                {canRegisterMotorbike ? (
                                    <Col md={4} className="mb-3">
                                        <Card className="text-center vehicle-selection-card" onClick={() => handleVehicleSelect('motorbike')}>
                                            <Card.Body>
                                                <i className="bi bi-scooter"></i>
                                                <Card.Title className="mt-3">Motorbike</Card.Title>
                                                <Card.Text className="text-muted">(Slots left: {2 - vehicleCounts.motorbike})</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ) : (
                                     <Col md={4} className="mb-3">
                                        <Card className="text-center text-muted bg-light" style={{ cursor: 'not-allowed' }}>
                                            <Card.Body>
                                                <i className="bi bi-scooter text-muted"></i>
                                                <Card.Title className="mt-3">Motorbike</Card.Title>
                                                <Card.Text>(Limit of 2 reached)</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}
                                {/* Bicycle Card */}
                                <Col md={4} className="mb-3">
                                    <Card className="text-center vehicle-selection-card" onClick={() => handleVehicleSelect('bicycle')}>
                                        <Card.Body>
                                            <i className="bi bi-bicycle"></i>
                                            <Card.Title className="mt-3">Bicycle</Card.Title>
                                            <Card.Text className="text-muted">(Unlimited)</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                         </>
                    ) : ( renderRegisterForm() )}
                </Tab>

                {/* --- Tab 2: Manage Cards --- */}
                <Tab eventKey="manage" title="Manage Existing Cards">
                    {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> :
                     !fetchError && existingCards.length === 0 ? <p>You have no cards or pending requests.</p> :
                     existingCards.map(card => renderCardItem(card))
                    }
                </Tab>

                {/* --- Tab 3: Card History --- */}
                <Tab eventKey="history" title="Card History">
                    {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> :
                     !fetchError && historyCards.length === 0 ? <p>No canceled or lost cards in your history.</p> :
                     historyCards.map(card => renderCardItem(card))
                    }
                </Tab>
            </Tabs>

             {/* --- Modals --- */}
            <Modal show={showModal} onHide={closeModal}>
                 <Modal.Header closeButton><Modal.Title>{modalMode === 'reissue' ? 'Request Card Reissue' : 'Request Card Cancellation'}</Modal.Title></Modal.Header>
                 <Modal.Body>
                     {selectedCard && <p>Card: <strong>{selectedCard.brand} - {selectedCard.license_plate || 'N/A'}</strong></p>}
                     <Form.Group>
                         <Form.Label>Reason:</Form.Label>
                         <Form.Control as="textarea" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setManageError('');}} isInvalid={!!manageError} />
                         <Form.Control.Feedback type="invalid">{manageError}</Form.Control.Feedback>
                     </Form.Group>
                 </Modal.Body>
                 <Modal.Footer>
                     <Button variant="secondary" onClick={closeModal}>Close</Button>
                     <Button variant="primary" onClick={handleManageSubmit} disabled={manageLoading}>
                          {manageLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Submit Request'}
                     </Button>
                 </Modal.Footer>
             </Modal>
        </Container>
    );
};

export default ServicePage;
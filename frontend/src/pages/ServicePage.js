import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Tabs, Tab, Card, Button, Form, Row, Col, Modal, Spinner, Alert, Table, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import './ServicePage.css';
// (Giữ nguyên import PayPal của bạn)
// import PayPalPayment from '../components/PayPalbutton'; 

const API_BASE_URL = 'http://localhost:5000';

const initialRegFormData = {
    fullName: '',
    dob: '',
    phone: '',
    relationship: '',
    licensePlate: '',
    brand: '',
    color: ''
};

// --- COMPONENT BẢNG GIÁ (ĐÃ SỬA CSS) ---
const VehiclePriceTable = () => {
    const [prices, setPrices] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const formatCurrency = (val) => {
        const price = parseFloat(val);
        if (isNaN(price)) return 'N/A';
        if (price === 0) return 'Miễn phí';
        return price.toLocaleString('vi-VN');
    };

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/services/fees-table`); 
                setPrices(res.data);
            } catch (err) {
                setError('Không thể tải bảng giá dịch vụ. Vui lòng thử lại sau.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
    }, []);

    if (loading) {
        return (
            <Card className="mb-4 residem-card text-center p-4">
                <Spinner animation="border" />
            </Card>
        );
    }
    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        // THAY ĐỔI: Sử dụng style 'residem-table'
        <Card className="mb-4 residem-card">
            <Card.Header as="h5" className="residem-card-header">Bảng giá Dịch vụ Gửi xe</Card.Header>
            <Card.Body>
                <div className="table-wrapper">
                    <Table striped hover responsive className="residem-table">
                        <thead>
                            <tr>
                                <th>Loại xe</th>
                                <th>Phí làm thẻ (VND)</th>
                                <th>Phí gửi xe (VND/tháng)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Ô tô (Car)</td>
                                <td>{formatCurrency(prices.CAR_CARD_FEE)}</td>
                                <td>{formatCurrency(prices.CAR_FEE)}</td>
                            </tr>
                            <tr>
                                <td>Xe máy (Motorbike)</td>
                                <td>{formatCurrency(prices.MOTORBIKE_CARD_FEE)}</td>
                                <td>{formatCurrency(prices.MOTORBIKE_FEE)}</td>
                            </tr>
                            <tr>
                                <td>Xe đạp (Bicycle)</td>
                                <td>{formatCurrency(prices.BICYCLE_CARD_FEE)}</td>
                                <td>{formatCurrency(prices.BICYCLE_FEE)}</td>
                            </tr>
                        </tbody>
                    </Table>
                </div>
                <small className="text-muted mt-3 d-block">
                    * Phí làm thẻ chỉ áp dụng cho đăng ký mới hoặc cấp lại.
                    <br/>
                    * Phí gửi xe hàng tháng sẽ được tự động thêm vào hóa đơn dịch vụ của bạn.
                </small>
            </Card.Body>
        </Card>
    );
};
// --- KẾT THÚC COMPONENT BẢNG GIÁ ---


const ServicePage = () => {
    // --- TOÀN BỘ LOGIC GỐC CỦA BẠN (GIỮ NGUYÊN) ---
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

    const getUserAuthConfig = useCallback(() => {
         const token = localStorage.getItem('token');
           if (!token) {
                 setFetchError("Please log in to use this service.");
                 return null;
         }
         return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

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

    useEffect(() => {
        fetchExistingCards();
    }, [fetchExistingCards]);

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
            fetchExistingCards(); 
        } catch (err) {
            setRegError(err.response?.data?.message || 'Registration failed. Please try again.');
            console.error('Error registering card:', err);
        } finally {
            setRegLoading(false);
        }
    };

     const getVehicleTypeText = (type) => ({ car: 'Car', motorbike: 'Motorbike', bicycle: 'Bicycle' }[type] || type);

     // --- THAY ĐỔI: Form Đăng ký (Đã style lại) ---
     const renderRegisterForm = () => {
         if (!regVehicleType) return null;
         const typeName = getVehicleTypeText(regVehicleType);
         return (
             <Container className="registration-form-container residem-card">
                 <h4 className="mb-3 form-title">Register Card for {typeName}</h4>
                 <Form onSubmit={handleRegisterSubmit}>
                     <Row>
                         <Col md={4}><Form.Group className="mb-3"><Form.Label>Card User's Full Name<span className="required-star">*</span></Form.Label><Form.Control type="text" name="fullName" value={regFormData.fullName} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={4}><Form.Group className="mb-3"><Form.Label>Date of Birth<span className="required-star">*</span></Form.Label><Form.Control type="date" name="dob" value={regFormData.dob} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={4}><Form.Group className="mb-3"><Form.Label>Phone Number<span className="required-star">*</span></Form.Label><Form.Control type="tel" name="phone" value={regFormData.phone} onChange={handleRegFormChange} required /></Form.Group></Col>
                     </Row>
                     <Row>
                         <Col md={4}><Form.Group className="mb-3"><Form.Label>Relationship to Owner<span className="required-star">*</span></Form.Label><Form.Control type="text" name="relationship" value={regFormData.relationship} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={4}><Form.Group className="mb-3"><Form.Label>Brand (e.g., Honda, Vinfast)<span className="required-star">*</span></Form.Label><Form.Control type="text" name="brand" value={regFormData.brand} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={4}><Form.Group className="mb-3"><Form.Label>Color<span className="required-star">*</span></Form.Label><Form.Control type="text" name="color" value={regFormData.color} onChange={handleRegFormChange} required /></Form.Group></Col>
                     </Row>
                     <Row>
                         {regVehicleType !== 'bicycle' && (
                             <Col md={6}><Form.Group className="mb-3"><Form.Label>License Plate<span className="required-star">*</span></Form.Label><Form.Control type="text" name="licensePlate" value={regFormData.licensePlate} onChange={handleRegFormChange} required /></Form.Group></Col>
                         )}
                         <Col md={regVehicleType !== 'bicycle' ? 6 : 12}><Form.Group className="mb-3"><Form.Label>Proof Document (Vehicle/Plate Photo)<span className="required-star">*</span></Form.Label><Form.Control type="file" name="proofImage" onChange={handleFileChange} accept="image/*" required /></Form.Group></Col>
                     </Row>

                     {regError && <Alert variant="danger">{regError}</Alert>}
                     {regSuccess && <Alert variant="success">{regSuccess}</Alert>}
                     <div className="d-flex justify-content-end gap-2 mt-3">
                         <Button variant="residem-secondary" onClick={() => setRegVehicleType(null)}>Back</Button>
                         <Button variant="residem-primary" type="submit" disabled={regLoading}>
                             {regLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Submit Registration'}
                         </Button>
                     </div>
                 </Form>
             </Container>
         );
     };

     // --- LOGIC MODAL (GIỮ NGUYÊN) ---
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
            fetchExistingCards(); 
            closeModal();
        } catch (err) {
            setManageError(err.response?.data?.message || 'Request failed.');
            console.error(`Error ${modalMode} card:`, err);
        } finally {
            setManageLoading(false);
        }
    };

    // --- THAY ĐỔI: Render Card Item (Đã style lại) ---
    const renderCardItem = (card) => {
        let iconClass = 'bi bi-patch-question';
        const type = card.type || card.vehicle_type;
        if (type === 'car') iconClass = 'bi bi-car-front-fill';
        if (type === 'motorbike') iconClass = 'bi bi-scooter';
        if (type === 'bicycle') iconClass = 'bi bi-bicycle';

        let statusText = card.status;
        let statusClass = 'status-badge status-secondary';
        let actions = null;

        switch (card.status) {
            case 'active':
                statusText = 'Active'; statusClass = 'status-badge status-success';
                actions = (<>
                    <Button variant="residem-warning" size="sm" onClick={() => openModal('reissue', card)}>Reissue</Button>
                    <Button variant="residem-danger" size="sm" onClick={() => openModal('cancel', card)}>Cancel</Button>
                </>);
                break;
            case 'inactive':
                statusText = 'Locked'; statusClass = 'status-badge status-warning';
                actions = (<>
                    <Button variant="residem-warning" size="sm" onClick={() => openModal('reissue', card)}>Reissue</Button>
                    <Button variant="residem-danger" size="sm" onClick={() => openModal('cancel', card)}>Cancel</Button>
                </>);
                break;
            case 'pending_register':
                statusText = 'Pending Registration'; statusClass = 'status-badge status-pending';
                actions = <Button variant="residem-secondary" size="sm" disabled>Processing</Button>;
                break;
            case 'pending_reissue':
                statusText = 'Pending Reissue'; statusClass = 'status-badge status-pending';
                actions = (<>
                    <Button variant="residem-secondary" size="sm" disabled>Pending</Button>
                    <Button variant="residem-danger" size="sm" onClick={() => openModal('cancel', card)}>Cancel</Button>
                </>);
                break;
             case 'pending_cancel':
                statusText = 'Pending Cancellation'; statusClass = 'status-badge status-pending';
                actions = <Button variant="residem-secondary" size="sm" disabled>Pending</Button>;
                break;
             case 'lost': statusText = 'Reported Lost'; statusClass = 'status-badge status-danger'; actions = null; break;
             case 'canceled': statusText = 'Canceled'; statusClass = 'status-badge status-danger'; actions = null; break;
            default: statusText = card.status;
        }

        return (
            <div className="existing-card-item" key={card.id || card.request_id}>
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

    // --- JSX CHÍNH (ĐÃ CẬP NHẬT BỐ CỤC 2 CỘT) ---
    return (
        <Container className="service-page my-5 fadeIn"> 
            <Row>
                {/* === CỘT NỘI DUNG CHÍNH (8) === */}
                <Col lg={8}>
                    <h2 className="mb-4 page-main-title">Parking Card Services</h2>
                    
                    <VehiclePriceTable />
                    
                    {fetchError && <Alert variant="danger">{fetchError}</Alert>}
                    {manageSuccess && <Alert variant="success" onClose={() => setManageSuccess('')} dismissible>{manageSuccess}</Alert>}

                    <Tabs id="service-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3 residem-tabs">
                        <Tab eventKey="register" title="Register New Card">
                            {!regVehicleType ? (
                                <>
                                    <h4 className="mb-3 select-vehicle-title">Select vehicle type:</h4>
                                    <Row>
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
                                                <Card className="text-center vehicle-selection-card-disabled">
                                                    <Card.Body>
                                                        <i className="bi bi-car-front-fill"></i>
                                                        <Card.Title className="mt-3">Car</Card.Title>
                                                        <Card.Text>(Limit of 2 reached)</Card.Text>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        )}
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
                                                <Card className="text-center vehicle-selection-card-disabled">
                                                    <Card.Body>
                                                        <i className="bi bi-scooter"></i>
                                                        <Card.Title className="mt-3">Motorbike</Card.Title>
                                                        <Card.Text>(Limit of 2 reached)</Card.Text>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        )}
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

                        <Tab eventKey="manage" title="Manage Existing Cards">
                            <div className="tab-pane-content">
                                {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> :
                                !fetchError && existingCards.length === 0 ? <Alert variant="residem-info">You have no active cards or pending requests.</Alert> :
                                existingCards.map(card => renderCardItem(card))
                                }
                            </div>
                        </Tab>

                        <Tab eventKey="history" title="Card History">
                             <div className="tab-pane-content">
                                {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> :
                                !fetchError && historyCards.length === 0 ? <Alert variant="residem-info">No canceled or lost cards in your history.</Alert> :
                                historyCards.map(card => renderCardItem(card))
                                }
                            </div>
                        </Tab>
                    </Tabs>
                </Col>

                {/* === CỘT SIDEBAR (4) === */}
                <Col lg={4}>
                    <aside className="service-sidebar">
                        
                        {/* Widget: Hướng dẫn đăng ký */}
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Registration Steps</h5>
                            <ListGroup variant="flush" className="steps-list">
                                <ListGroup.Item>
                                    <span className="step-number">1</span>
                                    Select your vehicle type (Car, Motorbike, Bicycle).
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <span className="step-number">2</span>
                                    Fill in all required information <span className="required-star">*</span> for the card user.
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <span className="step-number">3</span>
                                    Upload a clear photo of your vehicle registration or license plate as proof.
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <span className="step-number">4</span>
                                    Submit your request and wait for approval from the admin.
                                </ListGroup.Item>
                            </ListGroup>
                        </div>

                        {/* Widget: Hỗ trợ Dịch vụ */}
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Service Support</h5>
                            <ListGroup variant="flush" className="faq-list">
                                <ListGroup.Item>
                                    <strong>Lost or Damaged Card?</strong>
                                    <p>Go to the "Manage" tab, find your card, and click "Reissue". A new card fee will be applied.</p>
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <strong>Cancel Card?</strong>
                                    <p>Go to the "Manage" tab and click "Cancel" on the card you wish to deactivate.</p>
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <strong>Need Help?</strong>
                                    <p>Contact support at: <br/><strong>contact.ptit@apartment.com</strong></p>
                                </ListGroup.Item>
                            </ListGroup>
                        </div>

                    </aside>
                </Col>
            </Row>

            {/* MODAL (GIỮ NGUYÊN) */}
            <Modal show={showModal} onHide={closeModal} centered>
                 <Modal.Header closeButton>
                    {/* THAY ĐỔI: Style Modal */}
                    <Modal.Title className="residem-modal-title">{modalMode === 'reissue' ? 'Request Card Reissue' : 'Request Card Cancellation'}</Modal.Title>
                 </Modal.Header>
                 <Modal.Body>
                     {selectedCard && <p>Card: <strong>{selectedCard.brand} - {selectedCard.license_plate || 'N/A'}</strong></p>}
                     <Form.Group>
                         {/* THAY ĐỔI: Thêm dấu * và chú thích */}
                         <Form.Label>Reason<span className="required-star">*</span></Form.Label>
                         <Form.Control as="textarea" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setManageError('');}} isInvalid={!!manageError} />
                         <Form.Control.Feedback type="invalid">{manageError}</Form.Control.Feedback>
                     </Form.Group>
                 </Modal.Body>
                 <Modal.Footer>
                     {/* THAY ĐỔI: Style nút */}
                     <Button variant="residem-secondary" onClick={closeModal}>Close</Button>
                     <Button variant="residem-primary" onClick={handleManageSubmit} disabled={manageLoading}>
                         {manageLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Submit Request'}
                     </Button>
                 </Modal.Footer>
             </Modal>
        </Container>
    );
};

export default ServicePage;
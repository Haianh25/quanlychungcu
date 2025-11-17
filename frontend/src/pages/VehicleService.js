import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Tabs, Tab, Card, Button, Form, Row, Col, Modal, Spinner, Alert, Table, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Thêm Link
import axios from 'axios';
import './ServicePage.css'; // Dùng chung CSS

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
        if (price === 0) return 'Miễn phí';
        return price.toLocaleString('vi-VN');
    };

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/services/fees-table`); 
                setPrices(res.data);
            } catch (err) { setError('Lỗi tải bảng giá.'); } 
            finally { setLoading(false); }
        };
        fetchPrices();
    }, []);

    if (loading) return <Card className="mb-4 residem-card text-center p-4"><Spinner animation="border" /></Card>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <Card className="mb-4 residem-card">
            <Card.Header as="h5" className="residem-card-header">Bảng giá Dịch vụ Gửi xe</Card.Header>
            <Card.Body>
                <div className="table-wrapper">
                    <Table striped hover responsive className="residem-table">
                        <thead><tr><th>Loại xe</th><th>Phí làm thẻ (VND)</th><th>Phí gửi xe (VND/tháng)</th></tr></thead>
                        <tbody>
                            <tr><td>Ô tô (Car)</td><td>{formatCurrency(prices.CAR_CARD_FEE)}</td><td>{formatCurrency(prices.CAR_FEE)}</td></tr>
                            <tr><td>Xe máy (Motorbike)</td><td>{formatCurrency(prices.MOTORBIKE_CARD_FEE)}</td><td>{formatCurrency(prices.MOTORBIKE_FEE)}</td></tr>
                            <tr><td>Xe đạp (Bicycle)</td><td>{formatCurrency(prices.BICYCLE_CARD_FEE)}</td><td>{formatCurrency(prices.BICYCLE_FEE)}</td></tr>
                        </tbody>
                    </Table>
                </div>
                <small className="text-muted mt-3 d-block">* Phí sẽ được cộng vào hóa đơn tháng.</small>
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

    const getUserAuthConfig = useCallback(() => {
         const token = localStorage.getItem('token');
         if (!token) { setFetchError("Vui lòng đăng nhập."); return null; }
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
        } catch (err) { setFetchError('Không thể tải danh sách thẻ.'); } 
        finally { setLoading(false); }
    }, [getUserAuthConfig]);

    useEffect(() => { fetchExistingCards(); }, [fetchExistingCards]);

    const vehicleCounts = useMemo(() => {
        const counts = { car: 0, motorbike: 0 };
        existingCards.forEach(card => {
            const type = card.vehicle_type || card.type;
            if (['active', 'inactive', 'pending_register'].includes(card.status)) {
                if (type === 'car') counts.car++;
                if (type === 'motorbike') counts.motorbike++;
            }
        });
        return counts;
    }, [existingCards]);

    const canRegisterCar = vehicleCounts.car < 2;
    const canRegisterMotorbike = vehicleCounts.motorbike < 2;
    const handleVehicleSelect = (type) => { setRegVehicleType(type); setRegFormData(initialRegFormData); setRegFile(null); setRegError(''); setRegSuccess(''); };
    const handleRegFormChange = (e) => { setRegFormData({ ...regFormData, [e.target.name]: e.target.value }); };
    const handleFileChange = (e) => { setRegFile(e.target.files[0]); };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const config = getUserAuthConfig();
        if (!config) return;
        setRegLoading(true); setRegError(''); setRegSuccess('');
        if (regVehicleType === 'car' && !canRegisterCar) { setRegError('Đã đạt giới hạn 2 thẻ ô tô.'); setRegLoading(false); return; }
        if (regVehicleType === 'motorbike' && !canRegisterMotorbike) { setRegError('Đã đạt giới hạn 2 thẻ xe máy.'); setRegLoading(false); return; }
        if (!regFile) { setRegError('Vui lòng tải lên ảnh minh chứng.'); setRegLoading(false); return; }

        const formData = new FormData();
        formData.append('vehicleType', regVehicleType);
        Object.keys(regFormData).forEach(key => formData.append(key, regFormData[key]));
        if (regVehicleType === 'bicycle') formData.set('licensePlate', 'N/A');
        formData.append('proofImage', regFile);

        try {
            await axios.post(`${API_BASE_URL}/api/services/register-card`, formData, { ...config, headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } });
            setRegSuccess('Gửi yêu cầu thành công! Vui lòng chờ duyệt.'); setRegVehicleType(null); fetchExistingCards(); 
        } catch (err) { setRegError(err.response?.data?.message || 'Đăng ký thất bại.'); } 
        finally { setRegLoading(false); }
    };

    const getVehicleTypeText = (type) => ({ car: 'Car', motorbike: 'Motorbike', bicycle: 'Bicycle' }[type] || type);
    const openModal = (mode, card) => { setModalMode(mode); setSelectedCard(card); setReason(''); setManageError(''); setManageSuccess(''); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setSelectedCard(null); };

    const handleManageSubmit = async () => {
        const config = getUserAuthConfig();
        if (!config) return;
        if (!reason.trim()) { setManageError('Vui lòng nhập lý do.'); return; }
        setManageLoading(true);
        try {
            const endpoint = modalMode === 'reissue' ? 'reissue-card' : 'cancel-card';
            await axios.post(`${API_BASE_URL}/api/services/${endpoint}`, { cardId: selectedCard.id, reason }, config);
            setManageSuccess('Gửi yêu cầu thành công!'); fetchExistingCards(); closeModal();
        } catch (err) { setManageError('Yêu cầu thất bại.'); } 
        finally { setManageLoading(false); }
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
            case 'pending_register': statusText = 'Pending Reg.'; statusClass = 'status-badge status-pending';
                actions = (<div className="processing-indicator"><i className="bi bi-hourglass-split"></i><span>Processing...</span></div>); break;
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

    // --- Form Đăng ký ---
    const renderRegisterForm = () => {
         if (!regVehicleType) return null;
         const typeName = getVehicleTypeText(regVehicleType);
         return (
             <Container className="registration-form-container residem-card">
                 <h4 className="mb-3 form-title">Register Card for {typeName}</h4>
                 <Form onSubmit={handleRegisterSubmit}>
                     <Row>
                         <Col md={6}><Form.Group className="mb-3"><Form.Label>Full Name<span className="required-star">*</span></Form.Label><Form.Control type="text" name="fullName" value={regFormData.fullName} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={6}><Form.Group className="mb-3"><Form.Label>Date of Birth<span className="required-star">*</span></Form.Label><Form.Control type="date" name="dob" value={regFormData.dob} onChange={handleRegFormChange} required /></Form.Group></Col>
                     </Row>
                     <Row>
                         <Col md={6}><Form.Group className="mb-3"><Form.Label>Phone<span className="required-star">*</span></Form.Label><Form.Control type="tel" name="phone" value={regFormData.phone} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={6}><Form.Group className="mb-3"><Form.Label>Relationship<span className="required-star">*</span></Form.Label><Form.Control type="text" name="relationship" value={regFormData.relationship} onChange={handleRegFormChange} required /></Form.Group></Col>
                     </Row>
                     <Row>
                         <Col md={6}><Form.Group className="mb-3"><Form.Label>Brand<span className="required-star">*</span></Form.Label><Form.Control type="text" name="brand" value={regFormData.brand} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={6}><Form.Group className="mb-3"><Form.Label>Color<span className="required-star">*</span></Form.Label><Form.Control type="text" name="color" value={regFormData.color} onChange={handleRegFormChange} required /></Form.Group></Col>
                     </Row>
                     {regVehicleType !== 'bicycle' && (
                         <Form.Group className="mb-3"><Form.Label>License Plate<span className="required-star">*</span></Form.Label><Form.Control type="text" name="licensePlate" value={regFormData.licensePlate} onChange={handleRegFormChange} required /></Form.Group>
                     )}
                     <Form.Group className="mb-3"><Form.Label>Proof Photo<span className="required-star">*</span></Form.Label><Form.Control type="file" name="proofImage" onChange={handleFileChange} accept="image/*" required /></Form.Group>
                     
                     {regError && <Alert variant="danger">{regError}</Alert>}
                     {regSuccess && <Alert variant="success">{regSuccess}</Alert>}
                     <div className="d-flex justify-content-end gap-2 mt-3">
                         <Button variant="residem-secondary" onClick={() => setRegVehicleType(null)}>Back</Button>
                         <Button className="btn-residem-primary" type="submit" disabled={regLoading}>{regLoading ? <Spinner size="sm"/> : 'Submit'}</Button>
                     </div>
                 </Form>
             </Container>
         );
    };

    return (
        <Container className="service-page my-5 fadeIn">
            {/* NÚT QUAY LẠI */}
            <div className="mb-4">
                <Link to="/services" className="text-decoration-none text-muted">
                    <i className="bi bi-arrow-left me-2"></i> Back to Services
                </Link>
            </div>
            
            <Row>
                <Col lg={8}>
                    <h2 className="mb-4 page-main-title">Vehicle Parking</h2>
                    <VehiclePriceTable />
                    {fetchError && <Alert variant="danger">{fetchError}</Alert>}
                    {manageSuccess && <Alert variant="success" dismissible onClose={() => setManageSuccess('')}>{manageSuccess}</Alert>}

                    <Tabs id="vehicle-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3 residem-tabs">
                        <Tab eventKey="register" title="New Registration">
                            {!regVehicleType ? (
                                <Row>
                                    {['car', 'motorbike', 'bicycle'].map(type => {
                                        const disabled = (type === 'car' && !canRegisterCar) || (type === 'motorbike' && !canRegisterMotorbike);
                                        return (
                                            <Col md={4} key={type} className="mb-3">
                                                <Card className={`text-center ${disabled ? 'vehicle-selection-card-disabled' : 'vehicle-selection-card'}`} onClick={() => !disabled && handleVehicleSelect(type)}>
                                                    <Card.Body>
                                                        <i className={`bi bi-${type === 'car' ? 'car-front-fill' : type === 'motorbike' ? 'scooter' : 'bicycle'}`}></i>
                                                        <Card.Title className="mt-3">{getVehicleTypeText(type)}</Card.Title>
                                                        {disabled && <Card.Text>(Limit Reached)</Card.Text>}
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
                                {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : existingCards.length === 0 ? <Alert variant="residem-info">No active cards.</Alert> : existingCards.map(card => renderCardItem(card))}
                            </div>
                        </Tab>
                        <Tab eventKey="history" title="History">
                            <div className="tab-pane-content">
                                {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : historyCards.length === 0 ? <Alert variant="residem-info">No history.</Alert> : historyCards.map(card => renderCardItem(card))}
                            </div>
                        </Tab>
                    </Tabs>
                </Col>
                <Col lg={4}>
                    <aside className="service-sidebar">
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Steps</h5>
                            <ListGroup variant="flush" className="steps-list">
                                <ListGroup.Item><span className="step-number">1</span>Select vehicle type.</ListGroup.Item>
                                <ListGroup.Item><span className="step-number">2</span>Fill in info.</ListGroup.Item>
                                <ListGroup.Item><span className="step-number">3</span>Upload proof.</ListGroup.Item>
                                <ListGroup.Item><span className="step-number">4</span>Wait for approval.</ListGroup.Item>
                            </ListGroup>
                        </div>
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Support</h5>
                            <ListGroup variant="flush" className="faq-list">
                                <ListGroup.Item><strong>Lost Card?</strong><p>Use "Reissue" in Manage tab.</p></ListGroup.Item>
                                <ListGroup.Item><strong>Cancel?</strong><p>Use "Cancel" in Manage tab.</p></ListGroup.Item>
                            </ListGroup>
                        </div>
                    </aside>
                </Col>
            </Row>
            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton><Modal.Title className="residem-modal-title">Request Action</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Reason<span className="required-star">*</span></Form.Label>
                        <Form.Control as="textarea" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setManageError(''); }} isInvalid={!!manageError} />
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
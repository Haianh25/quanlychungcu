import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ClockHistory, CalendarCheck, InfoCircle, XCircle, PeopleFill, GeoAltFill } from 'react-bootstrap-icons'; // Thêm icon
import './ServicePage.css'; 

const API_BASE_URL = 'http://localhost:5000';

const AmenityService = () => {
    const [rooms, setRooms] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [bookingData, setBookingData] = useState({ date: '', startTime: '', endTime: '' });
    const [totalPrice, setTotalPrice] = useState(0);
    const [bookLoading, setBookLoading] = useState(false);
    const [bookMsg, setBookMsg] = useState({ type: '', text: '' });

    const getAuthConfig = useCallback(() => {
        const token = localStorage.getItem('token');
        return token ? { headers: { 'Authorization': `Bearer ${token}` } } : null;
    }, []);

    const fetchData = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) return;
        setLoading(true);
        try {
            const [roomsRes, bookingsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/amenities/rooms`, config),
                axios.get(`${API_BASE_URL}/api/amenities/my-bookings`, config)
            ]);
            setRooms(roomsRes.data);
            setMyBookings(bookingsRes.data);
        } catch (err) {
            setError('Failed to load amenity data. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (bookingData.startTime && bookingData.endTime && selectedRoom) {
            const start = parseInt(bookingData.startTime.split(':')[0]);
            const end = parseInt(bookingData.endTime.split(':')[0]);
            const pricePerHour = parseFloat(selectedRoom.current_price || 0); 
            
            if (end > start) {
                setTotalPrice((end - start) * pricePerHour);
            } else {
                setTotalPrice(0);
            }
        }
    }, [bookingData.startTime, bookingData.endTime, selectedRoom]);

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        const config = getAuthConfig();
        setBookLoading(true); setBookMsg({ type: '', text: '' });
        
        try {
            await axios.post(`${API_BASE_URL}/api/amenities/book`, {
                roomId: selectedRoom.id,
                ...bookingData
            }, config);
            setBookMsg({ type: 'success', text: 'Booking confirmed successfully!' });
            fetchData(); 
            setTimeout(() => setShowModal(false), 1500);
        } catch (err) {
            setBookMsg({ type: 'danger', text: err.response?.data?.message || 'Booking failed.' });
        } finally {
            setBookLoading(false);
        }
    };

    const handleCancelBooking = async (id) => {
        if(!window.confirm('Are you sure you want to cancel this booking?')) return;
        const config = getAuthConfig();
        try {
            await axios.post(`${API_BASE_URL}/api/amenities/cancel/${id}`, {}, config);
            fetchData();
        } catch (err) { alert('Failed to cancel booking.'); }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <Container className="service-page my-5 fadeIn">
            {/* Nút quay lại */}
            <div className="mb-4">
                <Link to="/services" className="text-decoration-none text-muted small font-weight-bold">
                    <i className="bi bi-arrow-left me-2"></i> Back to Services
                </Link>
            </div>

            <Row>
                {/* CỘT CHÍNH: DANH SÁCH PHÒNG */}
                <Col lg={8}>
                    <h2 className="mb-4 page-main-title">Amenities Booking</h2>
                    
                    {error && <Alert variant="danger">{error}</Alert>}

                    {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : (
                        <Row className="g-4"> {/* Thêm gutter để khoảng cách đều */}
                            {rooms.map(room => (
                                <Col md={6} key={room.id}>
                                    <Card className="residem-card h-100 amenity-card">
                                        <div className="amenity-img-wrapper">
                                            {room.image_url ? (
                                                <Card.Img variant="top" src={room.image_url} alt={room.name} />
                                            ) : (
                                                <div className="amenity-img-placeholder">No Image</div>
                                            )}
                                            <Badge bg="warning" className="price-tag">
                                                {formatCurrency(room.current_price)} / Hour
                                            </Badge>
                                        </div>
                                        <Card.Body className="d-flex flex-column p-4">
                                            <Card.Title className="amenity-title">{room.name}</Card.Title>
                                            
                                            {/* Thông tin phụ */}
                                            <div className="amenity-info-row mb-3">
                                                <span className="me-3"><PeopleFill className="me-1 text-primary-accent"/> {room.capacity} People</span>
                                                <span><GeoAltFill className="me-1 text-primary-accent"/> Floor 2</span>
                                            </div>

                                            <Card.Text className="text-muted flex-grow-1 small">
                                                {room.description || 'No description available.'}
                                            </Card.Text>

                                            {room.status === 'active' ? (
                                                <Button 
                                                    className="btn-residem-primary w-100 mt-auto"
                                                    onClick={() => {
                                                        setSelectedRoom(room);
                                                        setBookingData({ date: '', startTime: '', endTime: '' });
                                                        setTotalPrice(0);
                                                        setBookMsg({ type: '', text: '' });
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    Book Now
                                                </Button>
                                            ) : (
                                                <Button variant="secondary" className="w-100 mt-auto" disabled>Maintenance</Button>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Col>

                {/* SIDEBAR: QUY ĐỊNH & LỊCH SỬ */}
                <Col lg={4}>
                    <aside className="service-sidebar">
                        
                        {/* Widget: Rules */}
                        <div className="sidebar-widget">
                            <h5 className="widget-title"><InfoCircle className="me-2"/> Booking Rules</h5>
                            <ul className="rules-list">
                                <li><span className="bullet">📅</span> Book at least <strong>1 day</strong> in advance.</li>
                                <li><span className="bullet">🚫</span> Only <strong>1 active booking</strong> per resident allowed.</li>
                                <li><span className="bullet">💰</span> Fee will be added to your <strong>monthly bill</strong>.</li>
                                <li><span className="bullet">⏰</span> Cancel 24h before to avoid penalty.</li>
                            </ul>
                        </div>

                        {/* Widget: History */}
                        <div className="sidebar-widget">
                            <h5 className="widget-title"><ClockHistory className="me-2"/> My Bookings</h5>
                            <div className="booking-history-list">
                                {myBookings.length === 0 ? <p className="p-3 text-muted text-center small">No booking history found.</p> : 
                                    myBookings.map(b => (
                                        <div key={b.id} className={`booking-item status-${b.status}`}>
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <strong>{b.room_name}</strong>
                                                <Badge bg={b.status === 'confirmed' ? 'success' : 'secondary'} className="status-badge-mini">
                                                    {b.status}
                                                </Badge>
                                            </div>
                                            <div className="small text-muted">
                                                <CalendarCheck className="me-1"/> {new Date(b.booking_date).toLocaleDateString('en-GB')}
                                                <span className="mx-2">|</span> 
                                                {b.start_time.slice(0,5)} - {b.end_time.slice(0,5)}
                                            </div>
                                            {b.status === 'confirmed' && (
                                                <div className="text-end mt-2">
                                                    <Button variant="link" size="sm" className="text-danger p-0 small text-decoration-none" onClick={() => handleCancelBooking(b.id)}>
                                                        <XCircle className="me-1"/> Cancel Booking
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </aside>
                </Col>
            </Row>

             {/* MODAL ĐẶT PHÒNG */}
             <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Book: {selectedRoom?.name}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleBookSubmit}>
                    <Modal.Body>
                        {bookMsg.text && <Alert variant={bookMsg.type} className="small">{bookMsg.text}</Alert>}
                        
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Select Date <small className="text-muted">(Future dates only)</small></Form.Label>
                            <Form.Control 
                                className="residem-form-control"
                                type="date" 
                                required 
                                min={new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                value={bookingData.date}
                                onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                            />
                        </Form.Group>
                        
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">Start Time</Form.Label>
                                    <Form.Select 
                                        className="residem-form-select"
                                        required 
                                        value={bookingData.startTime} 
                                        onChange={(e) => setBookingData({...bookingData, startTime: e.target.value})}
                                    >
                                        <option value="">--:--</option>
                                        {[8,9,10,11,13,14,15,16,17,18,19,20].map(h => (
                                            <option key={h} value={`${h}:00:00`}>{h}:00</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">End Time</Form.Label>
                                    <Form.Select 
                                        className="residem-form-select"
                                        required 
                                        value={bookingData.endTime} 
                                        onChange={(e) => setBookingData({...bookingData, endTime: e.target.value})}
                                    >
                                        <option value="">--:--</option>
                                        {[9,10,11,12,14,15,16,17,18,19,20,21].map(h => (
                                            <option key={h} value={`${h}:00:00`}>{h}:00</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="alert alert-warning d-flex justify-content-between align-items-center mt-3 mb-0">
                            <span>Estimated Cost:</span>
                            <strong style={{ fontSize: '1.2rem', color: '#856404' }}>{formatCurrency(totalPrice)}</strong>
                        </div>
                        <Form.Text className="text-muted small mt-2 d-block text-end">
                            * Cost will be added to your monthly bill.
                        </Form.Text>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="residem-secondary" onClick={() => setShowModal(false)}>Close</Button>
                        <Button className="btn-residem-primary" type="submit" disabled={bookLoading || totalPrice <= 0}>
                            {bookLoading ? <Spinner size="sm"/> : 'Confirm Booking'}
                        </Button>
                    </Modal.Footer>
                </Form>
             </Modal>
        </Container>
    );
};

export default AmenityService;
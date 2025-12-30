import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ClockHistory, CalendarCheck, InfoCircle, XCircle, PeopleFill, GeoAltFill, CheckCircleFill } from 'react-bootstrap-icons';
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
        setBookLoading(true);
        setBookMsg({ type: '', text: '' });
        
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

    const formatCurrency = (val) => {

        const numberPart = new Intl.NumberFormat('vi-VN').format(val);
        return `${numberPart} VND`; 
    };

    const getBookingStatus = (booking) => {
        if (booking.status === 'cancelled') return { label: 'Cancelled', variant: 'secondary', isCompleted: false };

        const bookingDateObj = new Date(booking.booking_date);

        const [hours, minutes] = booking.end_time.split(':').map(Number);

        const bookingEnd = new Date(
            bookingDateObj.getFullYear(),
            bookingDateObj.getMonth(),
            bookingDateObj.getDate(), 
            hours,
            minutes
        );

        const now = new Date();
        if (now > bookingEnd) {
            return { label: 'Completed', variant: 'primary', isCompleted: true }; 
        }
        return { label: 'Confirmed', variant: 'success', isCompleted: false }; 
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
                    <h2 className="mb-4 page-main-title" style={{fontWeight: '700', color: '#2c3e50'}}>Amenities Booking</h2>
                    
                    {error && <Alert variant="danger">{error}</Alert>}

                    {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : (
                        <Row className="g-4">
                            {rooms.map(room => (
                                <Col md={6} key={room.id}>
                                    <Card className="amenity-card h-100 border-0 shadow-sm">
                                        <div className="amenity-img-wrapper position-relative">
                                            {room.image_url ? (
                                                <Card.Img variant="top" src={room.image_url} alt={room.name} />
                                            ) : (
                                                <div className="amenity-img-placeholder">No Image</div>
                                            )}
                                            <span className="price-badge-overlay">
                                                {formatCurrency(room.current_price)} / Hour
                                            </span>
                                        </div>

                                        <Card.Body className="d-flex flex-column p-3">
                                            <Card.Title className="fw-bold mb-2 text-dark">{room.name}</Card.Title>
                                            
                                            <div className="text-muted small mb-3 d-flex gap-3">
                                                <span><PeopleFill className="me-1"/> {room.capacity} People</span>
                                                <span><GeoAltFill className="me-1"/> Floor 2</span>
                                            </div>

                                            <Card.Text className="text-muted small mb-3 flex-grow-1 description-text">
                                                {room.description || 'No description available.'}
                                            </Card.Text>

                                            {room.status === 'active' ? (
                                                <Button 
                                                    className="btn-custom-brown mt-auto"
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
                                                <Button variant="secondary" className="mt-auto w-75 mx-auto d-block" disabled>Maintenance</Button>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Col>

                <Col lg={4}>
                    <aside className="service-sidebar">
                        <div className="sidebar-widget bg-white p-4 rounded shadow-sm mb-4">
                            <h5 className="widget-title mb-3" style={{fontWeight: '600', color: '#2c3e50'}}>
                                <InfoCircle className="me-2"/> Booking Rules
                            </h5>
                            <ul className="list-unstyled small text-muted rules-list">
                                <li className="mb-2">📅 Book at least <strong>1 day</strong> in advance.</li>
                                <li className="mb-2">🚫 Only <strong>1 active booking</strong> allowed.</li>
                                <li className="mb-2">💰 Fee added to <strong>monthly bill</strong>.</li>
                                <li className="mb-2">⏰ Cancel 24h before to avoid penalty.</li>
                            </ul>
                        </div>

                        <div className="sidebar-widget bg-white p-4 rounded shadow-sm">
                            <h5 className="widget-title mb-3" style={{fontWeight: '600', color: '#2c3e50'}}>
                                <ClockHistory className="me-2"/> My Bookings
                            </h5>
                            <div className="booking-list-scroll">
                                {myBookings.length === 0 ?
                                    <p className="p-3 text-muted text-center small">No booking history found.</p> : 
                                    myBookings.map(b => {

                                        const statusInfo = getBookingStatus(b);
                                        
                                        return (
                                            <div key={b.id} className={`booking-item status-${statusInfo.label.toLowerCase()} mb-2 pb-2 border-bottom`}>
                                                <div className="d-flex justify-content-between align-items-start mb-1">
                                                    <strong>{b.room_name}</strong>
                                                    <Badge bg={statusInfo.variant} className="status-badge-mini">
                                                        {statusInfo.label}
                                                    </Badge>
                                                </div>
                                                <div className="small text-muted">
                                                    <CalendarCheck className="me-1"/> {new Date(b.booking_date).toLocaleDateString('en-GB')}
                                                    <span className="mx-2">|</span> 
                                                    {b.start_time.slice(0,5)} - {b.end_time.slice(0,5)}
                                                </div>

                                                {b.status === 'confirmed' && !statusInfo.isCompleted && (
                                                    <div className="text-end mt-1">
                                                        <Button variant="link" size="sm" className="text-danger p-0 small text-decoration-none" onClick={() => handleCancelBooking(b.id)}>
                                                            <XCircle className="me-1"/> Cancel
                                                        </Button>
                                                    </div>
                                                )}
                                                {statusInfo.isCompleted && (
                                                    <div className="text-end mt-1">
                                                        <small className="text-primary fst-italic">
                                                            <CheckCircleFill className="me-1"/> Service used
                                                        </small>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    </aside>
                </Col>
            </Row>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Book: {selectedRoom?.name}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleBookSubmit}>
                    <Modal.Body>
                        {bookMsg.text && <Alert variant={bookMsg.type} className="small">{bookMsg.text}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label>Select Date <small className="text-muted">(Future dates only)</small></Form.Label>
                            <Form.Control type="date" required min={new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                value={bookingData.date} onChange={(e) => setBookingData({...bookingData, date: e.target.value})} />
                        </Form.Group>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Start Time</Form.Label>
                                    <Form.Select required value={bookingData.startTime} onChange={(e) => setBookingData({...bookingData, startTime: e.target.value})}>
                                        <option value="">--:--</option>
                                        {[8,9,10,11,13,14,15,16,17,18,19,20].map(h => <option key={h} value={`${h}:00:00`}>{h}:00</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>End Time</Form.Label>
                                    <Form.Select required value={bookingData.endTime} onChange={(e) => setBookingData({...bookingData, endTime: e.target.value})}>
                                        <option value="">--:--</option>
                                        {[9,10,11,12,14,15,16,17,18,19,20,21].map(h => <option key={h} value={`${h}:00:00`}>{h}:00</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="alert alert-warning d-flex justify-content-between align-items-center mt-3 mb-0">
                            <span>Estimated Cost:</span>

                            <strong style={{ fontSize: '1.2rem', color: '#856404' }}>{formatCurrency(totalPrice)}</strong>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                        <Button style={{backgroundColor: '#b08d55', border: 'none'}} type="submit" disabled={bookLoading || totalPrice <= 0}>
                            {bookLoading ? <Spinner size="sm"/> : 'Confirm Booking'}
                        </Button>
                    </Modal.Footer>
                </Form>
             </Modal>
        </Container>
    );
};

export default AmenityService;
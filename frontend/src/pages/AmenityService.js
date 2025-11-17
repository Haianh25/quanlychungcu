import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Thêm Link
import axios from 'axios';
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
            setError('Không thể tải dữ liệu dịch vụ.');
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
            setBookMsg({ type: 'success', text: 'Đặt phòng thành công!' });
            fetchData(); 
            setTimeout(() => setShowModal(false), 1500);
        } catch (err) {
            setBookMsg({ type: 'danger', text: err.response?.data?.message || 'Lỗi đặt phòng.' });
        } finally {
            setBookLoading(false);
        }
    };

    const handleCancelBooking = async (id) => {
        if(!window.confirm('Bạn chắc chắn muốn hủy lịch này?')) return;
        const config = getAuthConfig();
        try {
            await axios.post(`${API_BASE_URL}/api/amenities/cancel/${id}`, {}, config);
            fetchData();
        } catch (err) { alert('Lỗi khi hủy.'); }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

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
                    <h2 className="mb-4 page-main-title">Amenities Booking</h2>
                    {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : (
                        <Row>
                            {rooms.map(room => (
                                <Col md={6} key={room.id} className="mb-4">
                                    <Card className="residem-card h-100 amenity-card">
                                        <div className="amenity-img-wrapper">
                                            <Card.Img variant="top" src={room.image_url} />
                                            <Badge bg="warning" className="price-tag">
                                                {formatCurrency(room.current_price)} / Giờ
                                            </Badge>
                                        </div>
                                        <Card.Body className="d-flex flex-column">
                                            <Card.Title>{room.name}</Card.Title>
                                            <Card.Text className="text-muted flex-grow-1">{room.description}</Card.Text>
                                            {room.status === 'active' ? (
                                                <Button 
                                                    className="btn-residem-primary w-100 mt-3"
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
                                                <Button variant="secondary" className="w-100 mt-3" disabled>Bảo trì</Button>
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
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Booking Rules</h5>
                            <ul className="rules-list">
                                <li>📅 Đặt trước ít nhất <strong>01 ngày</strong>.</li>
                                <li>🚫 Mỗi căn hộ chỉ giữ <strong>01 lịch</strong>.</li>
                                <li>💰 Phí được cộng vào hóa đơn tháng.</li>
                            </ul>
                        </div>

                        <div className="sidebar-widget">
                            <h5 className="widget-title">My Bookings</h5>
                            <div className="booking-history-list">
                                {myBookings.length === 0 ? <p className="p-3 text-muted text-center">Chưa có lịch đặt.</p> : 
                                    myBookings.map(b => (
                                        <div key={b.id} className={`booking-item status-${b.status}`}>
                                            <div className="d-flex justify-content-between">
                                                <strong>{b.room_name}</strong>
                                                <Badge bg={b.status === 'confirmed' ? 'success' : 'secondary'}>{b.status}</Badge>
                                            </div>
                                            <div className="small text-muted mt-1">
                                                {new Date(b.booking_date).toLocaleDateString('vi-VN')} <br/> 
                                                {b.start_time.slice(0,5)} - {b.end_time.slice(0,5)}
                                            </div>
                                            {b.status === 'confirmed' && (
                                                <Button variant="link" size="sm" className="text-danger p-0 mt-1" onClick={() => handleCancelBooking(b.id)}>Hủy lịch</Button>
                                            )}
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </aside>
                </Col>
            </Row>

             <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Book {selectedRoom?.name}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleBookSubmit}>
                    <Modal.Body>
                        {bookMsg.text && <Alert variant={bookMsg.type}>{bookMsg.text}</Alert>}
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Ngày đặt (Sau hôm nay)</Form.Label>
                            <Form.Control 
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
                                    <Form.Label>Bắt đầu</Form.Label>
                                    <Form.Select 
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
                                    <Form.Label>Kết thúc</Form.Label>
                                    <Form.Select 
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

                        <Alert variant="warning" className="d-flex justify-content-between align-items-center mt-2">
                            <span>Tổng tạm tính:</span>
                            <strong style={{ fontSize: '1.2rem' }}>{formatCurrency(totalPrice)}</strong>
                        </Alert>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="residem-secondary" onClick={() => setShowModal(false)}>Đóng</Button>
                        <Button className="btn-residem-primary" type="submit" disabled={bookLoading || totalPrice <= 0}>
                            {bookLoading ? <Spinner size="sm"/> : 'Xác nhận'}
                        </Button>
                    </Modal.Footer>
                </Form>
             </Modal>
        </Container>
    );
};

export default AmenityService;
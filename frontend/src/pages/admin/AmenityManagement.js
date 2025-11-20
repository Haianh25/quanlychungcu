import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, Tab, Card, Table, Button, Modal, Form, Row, Col, Alert, Spinner, Badge, Tooltip, OverlayTrigger } from 'react-bootstrap';
import axios from 'axios';
import { PencilSquare, Trash, PlusCircleFill, XCircle, InfoCircle, HouseDoor, CalendarCheck, Wallet2, CheckCircle } from 'react-bootstrap-icons';
import './AmenityManagement.css';

const API_BASE_URL = 'http://localhost:5000';

const AmenityManagement = () => {
    const [key, setKey] = useState('rooms');
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal Edit Room
    const [showModal, setShowModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', image_url: '', status: 'active' });
    const [modalLoading, setModalLoading] = useState(false);

    // Modal Cancel Booking (MỚI)
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);

    const getAuthConfig = useCallback(() => {
        const token = localStorage.getItem('adminToken');
        return token ? { headers: { 'Authorization': `Bearer ${token}` } } : null;
    }, []);

    const fetchData = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) return;
        setLoading(true);
        try {
            const [roomsRes, bookingsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/amenities/rooms`, config),
                axios.get(`${API_BASE_URL}/api/admin/amenities/bookings`, config)
            ]);
            setRooms(roomsRes.data);
            setBookings(bookingsRes.data);
        } catch (err) {
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const stats = useMemo(() => {
        const activeRooms = rooms.filter(r => r.status === 'active').length;
        const totalBookings = bookings.length;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const totalRevenue = bookings.reduce((acc, curr) => acc + (curr.status === 'confirmed' ? parseFloat(curr.total_price) : 0), 0);
        return { activeRooms, totalBookings, confirmedBookings, totalRevenue };
    }, [rooms, bookings]);

    // --- ROOM HANDLERS ---
    const handleShowModal = (room) => {
        setEditingRoom(room);
        setFormData({ 
            name: room.name || '', 
            description: room.description || '', 
            image_url: room.image_url || '', 
            status: room.status 
        });
        setShowModal(true); setError(''); setSuccess('');
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        const config = getAuthConfig();
        setModalLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/api/admin/amenities/rooms/${editingRoom.id}`, formData, config);
            setSuccess('Room updated successfully!');
            setShowModal(false);
            fetchData();
        } catch (err) {
            setError('Failed to save changes.');
        } finally {
            setModalLoading(false);
        }
    };

    // --- BOOKING CANCEL HANDLERS (LOGIC MỚI) ---
    const handleOpenCancelModal = (booking) => {
        setBookingToCancel(booking);
        setCancelReason('');
        setShowCancelModal(true);
        setError('');
        setSuccess('');
    };

    const handleConfirmCancel = async () => {
        if (!cancelReason.trim()) {
            alert('Please enter a reason for cancellation.');
            return;
        }
        
        const config = getAuthConfig();
        setCancelLoading(true);
        try {
            // Gửi kèm lý do hủy
            await axios.post(`${API_BASE_URL}/api/admin/amenities/bookings/${bookingToCancel.id}/cancel`, { reason: cancelReason }, config);
            setSuccess(`Booking #${bookingToCancel.id} cancelled successfully. Notification sent to resident.`);
            setShowCancelModal(false);
            fetchData();
        } catch (err) {
            setError('Failed to cancel booking.');
        } finally {
            setCancelLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const renderTooltip = (props, text) => ( <Tooltip id="button-tooltip" {...props}>{text}</Tooltip> );

    return (
        <div className="management-page-container fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="page-main-title">Amenity Management</h2>
            </div>

            {/* STATS ROW */}
            <Row className="mb-4 g-3">
                <Col md={3}>
                    <Card className="stats-card border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="stats-icon bg-primary-soft"><HouseDoor /></div>
                            <div className="ms-3">
                                <h6 className="text-muted mb-0">Active Rooms</h6>
                                <h3>{stats.activeRooms}/{rooms.length}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="stats-card border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="stats-icon bg-info-soft"><CalendarCheck /></div>
                            <div className="ms-3">
                                <h6 className="text-muted mb-0">Total Bookings</h6>
                                <h3>{stats.totalBookings}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="stats-card border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="stats-icon bg-success-soft"><CheckCircle /></div>
                            <div className="ms-3">
                                <h6 className="text-muted mb-0">Confirmed</h6>
                                <h3>{stats.confirmedBookings}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="stats-card border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="stats-icon bg-warning-soft"><Wallet2 /></div>
                            <div className="ms-3">
                                <h6 className="text-muted mb-0">Est. Revenue</h6>
                                <h4>{formatCurrency(stats.totalRevenue)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Card className="residem-card shadow-sm">
                <Card.Body>
                    <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3 residem-tabs">
                        
                        {/* TAB 1: ROOMS */}
                        <Tab eventKey="rooms" title="Room Status & Pricing">
                            <div className="table-wrapper">
                                <Table striped hover responsive className="residem-table align-middle">
                                    <thead>
                                        <tr>
                                            <th>STT</th>
                                            <th>Thumbnail</th>
                                            <th>Room Details</th>
                                            <th>Pricing</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rooms.map((room, index) => (
                                            <tr key={room.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    {room.image_url ? 
                                                        <img src={room.image_url} alt={room.name} className="room-thumbnail" /> : 
                                                        <div className="room-thumbnail-placeholder">No Img</div>
                                                    }
                                                </td>
                                                <td>
                                                    <strong className="text-dark">{room.name}</strong>
                                                    <div className="text-muted small text-truncate" style={{maxWidth: '200px'}}>{room.description}</div>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-primary-accent">{formatCurrency(room.current_price)} / Hr</span>
                                                    <div className="small text-muted">Code: <code>{room.fee_code}</code></div>
                                                </td>
                                                <td>
                                                    <Badge bg={room.status === 'active' ? 'success' : 'secondary'} className="status-badge">
                                                        {room.status === 'active' ? 'Active' : 'Maintenance'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Button variant="residem-warning" size="sm" onClick={() => handleShowModal(room)}>
                                                        <PencilSquare className="me-1" /> Edit
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Tab>

                        {/* TAB 2: BOOKINGS */}
                        <Tab eventKey="bookings" title="Booking Logs">
                            <div className="table-wrapper">
                                <Table striped hover responsive className="residem-table align-middle">
                                    <thead>
                                        <tr>
                                            <th>STT</th>
                                            <th>Resident</th>
                                            <th>Room</th>
                                            <th>Schedule</th>
                                            <th>Total Fee</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.length === 0 ? 
                                            <tr><td colSpan="7" className="text-center py-4">No booking history found.</td></tr> :
                                            bookings.map((b, index) => (
                                                <tr key={b.id}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <div className="fw-bold">{b.resident_name}</div>
                                                        <small className="text-muted">{b.email}</small>
                                                    </td>
                                                    <td><Badge bg="light" text="dark" className="border">{b.room_name}</Badge></td>
                                                    <td>
                                                        <div><i className="bi bi-calendar3 me-1"></i>{new Date(b.booking_date).toLocaleDateString('en-GB')}</div>
                                                        <small className="text-muted"><i className="bi bi-clock me-1"></i>{b.start_time.slice(0,5)} - {b.end_time.slice(0,5)}</small>
                                                    </td>
                                                    <td className="fw-bold text-dark">{formatCurrency(b.total_price)}</td>
                                                    <td>
                                                        <span className={`status-badge ${b.status === 'confirmed' ? 'status-success' : 'status-danger'}`}>
                                                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {b.status === 'confirmed' && (
                                                            <Button variant="outline-danger" size="sm" onClick={() => handleOpenCancelModal(b)}>
                                                                Cancel
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </Table>
                             </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            {/* MODAL EDIT ROOM */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Edit Room Details</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveChanges}>
                    <Modal.Body>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">Room Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">Status</Form.Label>
                                    <Form.Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                        <option value="active">Active (Open)</option>
                                        <option value="maintenance">Maintenance (Closed)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Image URL</Form.Label>
                            <Form.Control type="text" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Description</Form.Label>
                            <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                        </Form.Group>
                        <Alert variant="info" className="d-flex align-items-center small mt-4">
                            <InfoCircle className="me-2 fs-5" />
                            <div>Price is linked to fee code <code>{editingRoom?.fee_code}</code>. Change it in Fee Management.</div>
                        </Alert>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="residem-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="btn-residem-primary" disabled={modalLoading}>{modalLoading ? <Spinner size="sm"/> : 'Save Changes'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* MODAL CANCEL BOOKING (MỚI) */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title text-danger">Confirm Cancellation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>You are about to cancel booking <strong>#{bookingToCancel?.id}</strong> for <strong>{bookingToCancel?.resident_name}</strong>.</p>
                    <Form.Group className="mb-3">
                        <Form.Label className="residem-form-label">Reason for Cancellation <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            value={cancelReason} 
                            onChange={(e) => setCancelReason(e.target.value)} 
                            placeholder="e.g., Room maintenance required, Policy violation..."
                            required
                        />
                        <Form.Text className="text-muted">This reason will be sent to the resident via notification.</Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="residem-secondary" onClick={() => setShowCancelModal(false)}>Back</Button>
                    <Button className="btn-residem-danger" onClick={handleConfirmCancel} disabled={cancelLoading}>
                        {cancelLoading ? <Spinner size="sm"/> : 'Confirm Cancel'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AmenityManagement;
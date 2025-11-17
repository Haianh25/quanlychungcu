import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Tab, Card, Table, Button, Modal, Form, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import { PencilSquare, XCircle } from 'react-bootstrap-icons';
import './AmenityManagement.css';

const API_BASE_URL = 'http://localhost:5000';

const AmenityManagement = () => {
    const [key, setKey] = useState('rooms');
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal Edit
    const [showModal, setShowModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({
        name: '', // Thêm trường name vào state
        description: '', 
        image_url: '', 
        status: 'active'
    });
    const [modalLoading, setModalLoading] = useState(false);

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
            setError('Không thể tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleShowModal = (room) => {
        setEditingRoom(room);
        // Load dữ liệu phòng vào form, bao gồm cả TÊN
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
            // Gửi cả name lên server
            await axios.put(`${API_BASE_URL}/api/admin/amenities/rooms/${editingRoom.id}`, formData, config);
            setSuccess('Cập nhật thông tin phòng thành công!');
            setShowModal(false);
            fetchData();
        } catch (err) {
            setError('Lỗi lưu dữ liệu.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleCancelBooking = async (id) => {
        if (!window.confirm('Hủy lịch đặt này?')) return;
        const config = getAuthConfig();
        try {
            await axios.post(`${API_BASE_URL}/api/admin/amenities/bookings/${id}/cancel`, {}, config);
            setSuccess('Đã hủy lịch đặt.');
            fetchData();
        } catch (err) {
            alert('Lỗi khi hủy.');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <div className="management-page-container fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="page-main-title">Amenity Management</h2>
                {/* Không có nút Add Room vì chúng ta dùng cố định 3 phòng */}
            </div>

            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Card className="residem-card">
                <Card.Body>
                    <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3 residem-tabs">
                        
                        <Tab eventKey="rooms" title="Room Status">
                            <div className="table-wrapper">
                                <Table striped hover responsive className="residem-table align-middle">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Image</th>
                                            <th>Name</th>
                                            <th>Current Price/H</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rooms.map(room => (
                                            <tr key={room.id}>
                                                <td>{room.id}</td>
                                                <td>
                                                    <img src={room.image_url} alt={room.name} className="room-thumbnail" />
                                                </td>
                                                <td>
                                                    <strong>{room.name}</strong>
                                                    <br/>
                                                    <small className="text-muted">Code: {room.fee_code}</small>
                                                </td>
                                                <td>
                                                    {formatCurrency(room.current_price)}
                                                    <br/>
                                                    <small className="text-muted">(Managed in Fee)</small>
                                                </td>
                                                <td>
                                                    <Badge bg={room.status === 'active' ? 'success' : 'secondary'}>
                                                        {room.status}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Button variant="residem-warning" size="sm" onClick={() => handleShowModal(room)}>
                                                        <PencilSquare /> Edit Info
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Tab>

                        <Tab eventKey="bookings" title="Booking History">
                            <div className="table-wrapper">
                                <Table striped hover responsive className="residem-table align-middle">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Resident</th>
                                            <th>Room</th>
                                            <th>Date/Time</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map(b => (
                                            <tr key={b.id}>
                                                <td>{b.id}</td>
                                                <td>
                                                    <div className="fw-bold">{b.resident_name}</div>
                                                    <small className="text-muted">{b.email}</small>
                                                </td>
                                                <td>{b.room_name}</td>
                                                <td>
                                                    {new Date(b.booking_date).toLocaleDateString('vi-VN')}
                                                    <br/>
                                                    <small>{b.start_time.slice(0,5)} - {b.end_time.slice(0,5)}</small>
                                                </td>
                                                <td>{formatCurrency(b.total_price)}</td>
                                                <td>
                                                    <span className={`status-badge ${b.status === 'confirmed' ? 'status-success' : 'status-danger'}`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {b.status === 'confirmed' && (
                                                        <Button className="btn-residem-danger btn-sm" onClick={() => handleCancelBooking(b.id)}>
                                                            <XCircle className="me-1"/> Cancel
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                             </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            {/* MODAL EDIT (ĐÃ THÊM TRƯỜNG NAME) */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">Edit Room</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveChanges}>
                    <Modal.Body>
                        {/* === THÊM PHẦN NHẬP TÊN TẠI ĐÂY === */}
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Room Name<span className="required-star">*</span></Form.Label>
                            <Form.Control 
                                className="residem-form-control" 
                                type="text" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">Status</Form.Label>
                                    <Form.Select className="residem-form-select" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                        <option value="active">Active (Open)</option>
                                        <option value="maintenance">Maintenance (Closed)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">Image URL</Form.Label>
                                    <Form.Control className="residem-form-control" type="text" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Description</Form.Label>
                            <Form.Control className="residem-form-control" as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                        </Form.Group>
                        
                        <div className="alert alert-secondary small">
                            <strong>Note:</strong> Price is managed in <strong>Fee Management</strong> page (Code: {editingRoom?.fee_code}).
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="residem-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="btn-residem-primary" disabled={modalLoading}>
                            {modalLoading ? <Spinner size="sm"/> : 'Save Changes'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default AmenityManagement;
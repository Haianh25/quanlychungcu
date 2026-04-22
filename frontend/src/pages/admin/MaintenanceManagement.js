import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Badge, Button, Form, Modal, Spinner, Dropdown } from 'react-bootstrap';
import { Tools, Filter, ThreeDotsVertical } from 'react-bootstrap-icons';

const MaintenanceManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState(null); // For detail modal
    const [showModal, setShowModal] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token'); // Or adminToken if separate
            // Note: Current app seems to use 'token' for both or sometimes 'adminToken'. 
            // Checking App.js: Logout removes "token" and "adminToken". 
            // AdminLogin returns "token". 
            // Let's safe check both.
            const authToken = localStorage.getItem('adminToken') || localStorage.getItem('token');

            const res = await axios.get('http://localhost:5000/api/admin/maintenance', {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        setUpdateLoading(true);
        try {
            const authToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/admin/maintenance/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            // Update local state
            setRequests(requests.map(req =>
                req.id === id ? { ...req, status: newStatus } : req
            ));

            if (selectedRequest && selectedRequest.id === id) {
                setSelectedRequest({ ...selectedRequest, status: newStatus });
            }

        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update status');
        } finally {
            setUpdateLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <Badge bg="warning" text="dark">Pending</Badge>;
            case 'in_progress': return <Badge bg="primary">In Progress</Badge>;
            case 'completed': return <Badge bg="success">Completed</Badge>;
            case 'rejected': return <Badge bg="danger">Rejected</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const filteredRequests = filterStatus === 'all'
        ? requests
        : requests.filter(r => r.status === filterStatus);

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0"><Tools className="me-2" /> Maintenance Requests</h2>
                <div className="d-flex gap-2 align-items-center">
                    <Filter className="text-muted" />
                    <Form.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ width: '200px' }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                    </Form.Select>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-3">ID</th>
                                <th>Resident</th>
                                <th>Apartment</th>
                                <th>Issue</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" /></td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-4">No requests found.</td></tr>
                            ) : (
                                filteredRequests.map(req => (
                                    <tr key={req.id}>
                                        <td className="ps-3">#{req.id}</td>
                                        <td>
                                            <div>{req.full_name}</div>
                                            <small className="text-muted">{req.phone}</small>
                                        </td>
                                        <td>{req.apartment_number || 'N/A'}</td>
                                        <td>
                                            <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                <strong>{req.title}</strong>
                                            </div>
                                        </td>
                                        <td>{new Date(req.created_at).toLocaleDateString()}</td>
                                        <td>{getStatusBadge(req.status)}</td>
                                        <td>
                                            <Button variant="link" size="sm" onClick={() => { setSelectedRequest(req); setShowModal(true); }}>
                                                Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* Detail Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Request Details #{selectedRequest?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRequest && (
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <h6>Status</h6>
                                <Dropdown>
                                    <Dropdown.Toggle variant="outline-secondary" size="sm" disabled={updateLoading}>
                                        {updateLoading ? 'Updating...' : selectedRequest.status.toUpperCase()}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={() => handleStatusUpdate(selectedRequest.id, 'pending')}>Pending</Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleStatusUpdate(selectedRequest.id, 'in_progress')}>In Progress</Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}>Completed</Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}>Rejected</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                            <div className="col-md-6 mb-3">
                                <h6>Submitted Date</h6>
                                <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
                            </div>
                            <div className="col-12 mb-3">
                                <h6>Resident Info</h6>
                                <p className="mb-0"><strong>Name:</strong> {selectedRequest.full_name}</p>
                                <p className="mb-0"><strong>Apartment:</strong> {selectedRequest.apartment_number}</p>
                                <p className="mb-0"><strong>Email:</strong> {selectedRequest.email}</p>
                                <p className="mb-0"><strong>Phone:</strong> {selectedRequest.phone}</p>
                            </div>
                            <div className="col-12 mb-3">
                                <hr />
                                <h5 className="mb-2">{selectedRequest.title}</h5>
                                <p className="text-secondary">{selectedRequest.description}</p>
                            </div>
                            {selectedRequest.image_url && (
                                <div className="col-12">
                                    <h6>Attached Image</h6>
                                    <img
                                        src={`http://localhost:5000${selectedRequest.image_url}`}
                                        alt="Evidence"
                                        className="img-fluid rounded border"
                                        style={{ maxHeight: '400px' }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MaintenanceManagement;

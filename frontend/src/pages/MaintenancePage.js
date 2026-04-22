import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { Tools, PlusCircle, Image as ImageIcon } from 'react-bootstrap-icons';

const MaintenancePage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/maintenance', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load maintenance requests.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError('');
        setSubmitSuccess('');

        if (!title || !description) {
            setError('Please fill in all required fields.');
            setSubmitLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/maintenance', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSubmitSuccess('Request submitted successfully!');
            setTitle('');
            setDescription('');
            setImageFile(null);
            setShowForm(false);
            fetchRequests(); // Refresh list
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to submit request.');
        } finally {
            setSubmitLoading(false);
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

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2><Tools className="me-2" /> Maintenance & Repair</h2>
                <Button variant="primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : <><PlusCircle className="me-1" /> New Request</>}
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {submitSuccess && <Alert variant="success">{submitSuccess}</Alert>}

            {showForm && (
                <Card className="mb-4 shadow-sm border-0">
                    <Card.Body>
                        <h5 className="mb-3">Submit a New Request</h5>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Title / Issue Type</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Leaking Faucet, Broken Light"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Describe the issue in detail..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Attach Image (Optional)</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files[0])}
                                />
                            </Form.Group>
                            <Button type="submit" variant="success" disabled={submitLoading}>
                                {submitLoading ? <Spinner size="sm" animation="border" /> : 'Submit Request'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : requests.length === 0 ? (
                <Card className="text-center py-5 border-0 shadow-sm">
                    <Card.Body>
                        <Tools size={48} className="text-muted mb-3" />
                        <h5>No maintenance requests found.</h5>
                        <p className="text-muted">Create a request if you need assistance with your apartment.</p>
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-4">
                    {requests.map((req) => (
                        <Col md={12} key={req.id}>
                            {/* Using full width list style for clarity, or can use cards */}
                            <Card className="shadow-sm border-0 h-100">
                                <Card.Body className="d-flex flex-column flex-md-row gap-3">
                                    {req.image_url && (
                                        <div style={{ minWidth: '150px', maxWidth: '150px', height: '100px', flexShrink: 0 }}>
                                            <img
                                                src={`http://localhost:5000${req.image_url}`}
                                                alt="Issue"
                                                className="img-fluid rounded"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <h5 className="mb-1">{req.title}</h5>
                                            <div>{getStatusBadge(req.status)}</div>
                                        </div>
                                        <small className="text-muted mb-2 d-block">
                                            {new Date(req.created_at).toLocaleString()}
                                        </small>
                                        <p className="mb-0 text-secondary">{req.description}</p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default MaintenancePage;

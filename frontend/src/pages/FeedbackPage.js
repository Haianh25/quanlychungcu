import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import './Community.css';
import { Send, ChatQuoteFill, ClockHistory } from 'react-bootstrap-icons';

const FeedbackPage = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [newFeedback, setNewFeedback] = useState({ title: '', description: '', category: 'Suggestion' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/feedback/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbacks(res.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load feedback history.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/feedback', newFeedback, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbacks([res.data, ...feedbacks]);
            setNewFeedback({ title: '', description: '', category: 'Suggestion' });
            setSuccess('Feedback submitted successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit feedback.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <Badge className="badge-residem-primary">PENDING</Badge>;
            case 'reviewed': return <Badge bg="info">REVIEWED</Badge>;
            case 'resolved': return <Badge className="badge-residem-success">RESOLVED</Badge>;
            default: return <Badge bg="secondary">{status.toUpperCase()}</Badge>;
        }
    };

    return (
        <Container className="my-5 fadeIn community-container">
            <h2 className="news-page-title mb-4 text-center text-lg-start">Feedback & Suggestions</h2>

            <Row className="g-4">
                {/* Submit Form */}
                <Col lg={5}>
                    <Card className="community-card mb-4 sticky-top" style={{ top: '100px', zIndex: 10 }}>
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3 d-flex align-items-center">
                                <ChatQuoteFill className="me-2 text-primary-accent" />
                                Send Feedback
                            </h5>
                            <p className="text-muted small mb-4">
                                We value your opinion! Let us know how we can improve your living experience.
                            </p>

                            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
                            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">Category</Form.Label>
                                    <Form.Select
                                        className="form-control-residem"
                                        value={newFeedback.category}
                                        onChange={(e) => setNewFeedback({ ...newFeedback, category: e.target.value })}
                                    >
                                        <option value="Suggestion">Suggestion</option>
                                        <option value="Complaint">Complaint</option>
                                        <option value="Compliment">Compliment</option>
                                        <option value="Other">Other</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">Title</Form.Label>
                                    <Form.Control
                                        className="form-control-residem"
                                        type="text"
                                        placeholder="Brief summary..."
                                        value={newFeedback.title}
                                        required
                                        onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">Description</Form.Label>
                                    <Form.Control
                                        className="form-control-residem"
                                        as="textarea"
                                        rows={4}
                                        placeholder="Detailed explanation..."
                                        value={newFeedback.description}
                                        required
                                        onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                                    />
                                </Form.Group>

                                <div className="d-grid mt-4">
                                    <Button className="btn-residem-primary py-2" type="submit" disabled={submitting}>
                                        {submitting ? <Spinner size="sm" animation="border" /> : <><Send className="me-2" /> Submit Feedback</>}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* History List */}
                <Col lg={7}>
                    <Card className="community-card">
                        <Card.Header className="bg-white py-3 border-0">
                            <h5 className="mb-0 fw-bold d-flex align-items-center">
                                <ClockHistory className="me-2 text-primary-accent" />
                                Your History
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>
                            ) : feedbacks.length === 0 ? (
                                <div className="text-center p-5 text-muted">You haven't submitted any feedback yet.</div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {feedbacks.map(item => (
                                        <div key={item.id} className="list-group-item p-4 border-bottom border-light">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex align-items-center">
                                                    <Badge className="badge-residem-primary me-2">{item.category}</Badge>
                                                    <small className="text-muted">
                                                        {new Date(item.created_at).toLocaleDateString('en-GB')}
                                                    </small>
                                                </div>
                                                {getStatusBadge(item.status)}
                                            </div>
                                            <h5 className="fw-bold text-dark mt-2 mb-2">{item.title}</h5>
                                            <p className="text-muted mb-0 small">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default FeedbackPage;

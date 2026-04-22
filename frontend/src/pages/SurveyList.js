import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Modal, Alert, Container, Row, Col, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';
import './Community.css';
import { CheckCircleFill, ClipboardCheck, ArrowRight } from 'react-bootstrap-icons';

const SurveyList = () => {
    const [surveys, setSurveys] = useState([]);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/surveys', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSurveys(res.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load surveys');
            setLoading(false);
        }
    };

    const handleOpenSurvey = (survey) => {
        setSelectedSurvey(survey);
        setAnswers({});
        setError(null);
        setSuccess(null);
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            // Basic validation
            if (Object.keys(answers).length < selectedSurvey.questions.length && !window.confirm("You haven't answered all questions. Submit anyway?")) {
                return;
            }

            await axios.post(`http://localhost:5000/api/surveys/${selectedSurvey.id}/respond`,
                { answers },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess('Survey submitted successfully!');
            setTimeout(() => {
                setSelectedSurvey(null);
                fetchSurveys();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit survey');
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container className="my-5 fadeIn community-container">
            <h2 className="news-page-title mb-4">Community Surveys</h2>

            {surveys.length === 0 ? (
                <Card className="community-card text-center p-5">
                    <Card.Body>
                        <ClipboardCheck size={60} className="text-muted mb-3 opacity-50" />
                        <h4 className="text-muted">No active surveys</h4>
                        <p className="text-muted mb-0">Check back later for new community polls.</p>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {surveys.map(survey => (
                        <Col key={survey.id} md={6} lg={4} className="mb-4">
                            <Card className="h-100 community-card">
                                <Card.Body className="d-flex flex-column p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <Badge className={survey.has_responded ? "badge-residem-success" : "badge-residem-primary"}>
                                            {survey.has_responded ? "Completed" : "Active"}
                                        </Badge>
                                        <small className="text-muted">
                                            {new Date(survey.created_at).toLocaleDateString('en-GB')}
                                        </small>
                                    </div>
                                    <Card.Title className="fw-bold fs-5 mb-3">{survey.title}</Card.Title>
                                    <Card.Text className="text-muted flex-grow-1 small">
                                        {survey.description}
                                    </Card.Text>
                                    <Button
                                        className={survey.has_responded ? "mt-3 btn-outline-secondary rounded-pill" : "mt-3 btn-residem-primary"}
                                        onClick={() => handleOpenSurvey(survey)}
                                        disabled={survey.has_responded}
                                        variant={survey.has_responded ? "outline-secondary" : "none"}
                                    >
                                        {survey.has_responded ? (
                                            <> <CheckCircleFill className="me-2" /> Thank You </>
                                        ) : (
                                            <> Take Survey <ArrowRight className="ms-2" /> </>
                                        )}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal show={!!selectedSurvey} onHide={() => setSelectedSurvey(null)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedSurvey?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    {selectedSurvey?.description && (
                        <p className="mb-4 text-muted border-bottom pb-3">{selectedSurvey.description}</p>
                    )}

                    <Form>
                        {selectedSurvey?.questions.map((q, index) => (
                            <Form.Group key={index} className="mb-4">
                                <Form.Label className="fw-bold">{index + 1}. {q.text}</Form.Label>

                                {q.type === 'text' && (
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        onChange={(e) => handleAnswerChange(q.id || index, e.target.value)}
                                    />
                                )}

                                {q.type === 'choice' && q.options?.map((opt, i) => (
                                    <Form.Check
                                        key={i}
                                        type="radio"
                                        label={opt}
                                        name={`q-${index}`}
                                        onChange={() => handleAnswerChange(q.id || index, opt)}
                                    />
                                ))}

                                {q.type === 'rating' && (
                                    <div className="d-flex gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Form.Check
                                                key={star}
                                                inline
                                                label={star}
                                                name={`q-${index}`}
                                                type="radio"
                                                onChange={() => handleAnswerChange(q.id || index, star)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Form.Group>
                        ))}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setSelectedSurvey(null)}>Close</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={!!success}>Submit Responses</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default SurveyList;

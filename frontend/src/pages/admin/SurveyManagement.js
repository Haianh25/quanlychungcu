import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { Plus, Trash, ToggleOn, ToggleOff, BarChartFill } from 'react-bootstrap-icons';

const SurveyManagement = () => {
    const [surveys, setSurveys] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [results, setResults] = useState(null);

    // Form State
    const [newSurvey, setNewSurvey] = useState({ title: '', description: '', questions: [] });
    const [currentQuestion, setCurrentQuestion] = useState({ text: '', type: 'text', options: [] });
    const [optionText, setOptionText] = useState('');

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('http://localhost:5000/api/surveys/admin/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSurveys(res.data);
        } catch (err) {
            console.error('Error fetching surveys', err);
        }
    };

    const handleAddQuestion = () => {
        if (!currentQuestion.text) return;
        setNewSurvey({
            ...newSurvey,
            questions: [...newSurvey.questions, { ...currentQuestion, id: Date.now() }]
        });
        setCurrentQuestion({ text: '', type: 'text', options: [] });
    };

    const handleAddOption = () => {
        if (!optionText) return;
        setCurrentQuestion({
            ...currentQuestion,
            options: [...currentQuestion.options, optionText]
        });
        setOptionText('');
    };

    const handleCreateSurvey = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post('http://localhost:5000/api/surveys', newSurvey, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSurveys();
            setShowModal(false);
            setNewSurvey({ title: '', description: '', questions: [] });
        } catch (err) {
            alert('Failed to create survey');
        }
    };

    const handleToggleActive = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.patch(`http://localhost:5000/api/surveys/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSurveys();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this survey?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`http://localhost:5000/api/surveys/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSurveys();
        } catch (err) {
            alert('Failed to delete survey');
        }
    };

    const handleViewResults = async (survey) => {
        setSelectedSurvey(survey);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`http://localhost:5000/api/surveys/${survey.id}/results`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(res.data);
            setShowResults(true);
        } catch (err) {
            alert('Failed to load results');
        }
    };

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Survey Management</h2>
                <Button onClick={() => setShowModal(true)}><Plus size={20} /> Create New Survey</Button>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <Table hover responsive>
                        <thead className="bg-light">
                            <tr>
                                <th>Title</th>
                                <th>Created At</th>
                                <th>Responses</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {surveys.map(s => (
                                <tr key={s.id}>
                                    <td className="fw-bold">{s.title}</td>
                                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                                    <td>{s.response_count}</td>
                                    <td>
                                        <Badge bg={s.is_active ? 'success' : 'secondary'}>
                                            {s.is_active ? 'Active' : 'Closed'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button variant="outline-info" size="sm" onClick={() => handleViewResults(s)}>
                                                <BarChartFill /> Results
                                            </Button>
                                            <Button
                                                variant={s.is_active ? "outline-warning" : "outline-success"}
                                                size="sm"
                                                onClick={() => handleToggleActive(s.id)}
                                            >
                                                {s.is_active ? <ToggleOn /> : <ToggleOff />}
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(s.id)}>
                                                <Trash />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Create Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Create New Survey</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Survey Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={newSurvey.title}
                                onChange={e => setNewSurvey({ ...newSurvey, title: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={newSurvey.description}
                                onChange={e => setNewSurvey({ ...newSurvey, description: e.target.value })}
                            />
                        </Form.Group>

                        <hr />
                        <h5>Add Question</h5>
                        <Row className="mb-3">
                            <Col md={8}>
                                <Form.Control
                                    placeholder="Question text..."
                                    value={currentQuestion.text}
                                    onChange={e => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                />
                            </Col>
                            <Col md={4}>
                                <Form.Select
                                    value={currentQuestion.type}
                                    onChange={e => setCurrentQuestion({ ...currentQuestion, type: e.target.value, options: [] })}
                                >
                                    <option value="text">Text Answer</option>
                                    <option value="rating">Rating (1-5)</option>
                                    <option value="choice">Multiple Choice</option>
                                </Form.Select>
                            </Col>
                        </Row>

                        {currentQuestion.type === 'choice' && (
                            <div className="mb-3 p-3 bg-light rounded">
                                <div className="d-flex gap-2 mb-2">
                                    <Form.Control
                                        size="sm"
                                        placeholder="Add option..."
                                        value={optionText}
                                        onChange={e => setOptionText(e.target.value)}
                                    />
                                    <Button size="sm" variant="secondary" onClick={handleAddOption}>Add</Button>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {currentQuestion.options.map((opt, i) => (
                                        <Badge key={i} bg="white" text="dark" className="border">{opt}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button onClick={handleAddQuestion} disabled={!currentQuestion.text} className="w-100 mb-4">
                            Add Question to Survey
                        </Button>

                        <div className="bg-light p-3 rounded">
                            <h6>Survey Preview:</h6>
                            {newSurvey.questions.length === 0 && <span className="text-muted">No questions added yet.</span>}
                            <ol>
                                {newSurvey.questions.map((q, i) => (
                                    <li key={i} className="mb-2">
                                        <strong>{q.text}</strong> <Badge bg="secondary" className="ms-2">{q.type}</Badge>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="success" onClick={handleCreateSurvey} disabled={!newSurvey.title || newSurvey.questions.length === 0}>
                        Create Survey
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Results Modal */}
            <Modal show={showResults} onHide={() => setShowResults(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Results: {selectedSurvey?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {results && (
                        <div>
                            <p className="lead">Total Responses: <strong>{results.responses.length}</strong></p>

                            <h5 className="mt-4 border-bottom pb-2">Response Feed</h5>
                            {results.responses.map((resp, i) => (
                                <Card key={i} className="mb-3">
                                    <Card.Header className="bg-white d-flex justify-content-between small">
                                        <span className="fw-bold">{resp.full_name} ({resp.email})</span>
                                        <span className="text-muted">{new Date(resp.created_at).toLocaleString()}</span>
                                    </Card.Header>
                                    <Card.Body>
                                        {results.survey.questions.map((q, idx) => (
                                            <div key={idx} className="mb-2">
                                                <small className="text-muted d-block">{q.text}</small>
                                                <strong>{resp.answers[q.id || idx] || 'N/A'}</strong>
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SurveyManagement;

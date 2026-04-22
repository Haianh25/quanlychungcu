import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Badge, Button, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { Search, CheckCircle, XCircle, Hourglass } from 'react-bootstrap-icons';

const FeedbackManagement = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('http://localhost:5000/api/feedback/admin/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbacks(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.patch(`http://localhost:5000/api/feedback/admin/${id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert('Update failed');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <Badge bg="warning" text="dark">Pending</Badge>;
            case 'reviewed': return <Badge bg="info">Reviewed</Badge>;
            case 'resolved': return <Badge bg="success">Resolved</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const filtered = feedbacks.filter(f => {
        const matchStatus = filter === 'all' || f.status === filter;
        const matchSearch = f.title.toLowerCase().includes(search.toLowerCase()) ||
            f.full_name.toLowerCase().includes(search.toLowerCase()) ||
            f.email.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <div className="p-4">
            <h2 className="mb-4">Feedback Management</h2>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <div className="d-flex gap-3 mb-3">
                        <InputGroup style={{ maxWidth: '300px' }}>
                            <InputGroup.Text><Search /></InputGroup.Text>
                            <Form.Control
                                placeholder="Search user or title..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </InputGroup>
                        <Form.Select
                            style={{ maxWidth: '200px' }}
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
                        </Form.Select>
                    </div>

                    <Table hover responsive>
                        <thead className="bg-light">
                            <tr>
                                <th>Category</th>
                                <th>Title</th>
                                <th>User</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(f => (
                                <tr key={f.id}>
                                    <td><Badge bg="light" text="dark" className="border">{f.category}</Badge></td>
                                    <td>
                                        <div className="fw-bold">{f.title}</div>
                                        <small className="text-muted">{f.description}</small>
                                    </td>
                                    <td>
                                        <div>{f.full_name}</div>
                                        <small className="text-muted">{f.email} • Apt: {f.apartment_number || 'N/A'}</small>
                                    </td>
                                    <td>{new Date(f.created_at).toLocaleDateString()}</td>
                                    <td>{getStatusBadge(f.status)}</td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            {f.status !== 'resolved' && (
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    title="Mark Resolved"
                                                    onClick={() => handleStatusUpdate(f.id, 'resolved')}
                                                >
                                                    <CheckCircle />
                                                </Button>
                                            )}
                                            {f.status === 'pending' && (
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    title="Mark Reviewed"
                                                    onClick={() => handleStatusUpdate(f.id, 'reviewed')}
                                                >
                                                    <Hourglass />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted p-4">
                                        No feedback found matching criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </div>
    );
};

export default FeedbackManagement;

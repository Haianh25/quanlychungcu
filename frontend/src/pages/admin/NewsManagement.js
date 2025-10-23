// frontend/src/pages/admin/NewsManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, ListGroup, Row, Col, Card, Modal, Badge } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './NewsManagement.css';

const NewsManagement = () => {
    const [newsList, setNewsList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        status: 'active',
        imageUrl: '',
    });
    const [content, setContent] = useState('');
    const [imageUrlPreview, setImageUrlPreview] = useState('');

    const fetchNews = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/admin/news', config);
            setNewsList(res.data);
        } catch (err) {
            console.error("Error fetching news:", err);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'imageUrl') {
            setImageUrlPreview(value);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingNews(null);
        setFormData({ title: '', status: 'active', imageUrl: '' });
        setContent('');
        setImageUrlPreview('');
    };

    const handleShowCreate = () => {
        handleClose();
        setShowModal(true);
    };

    const handleShowEdit = async (newsItem) => {
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`http://localhost:5000/api/admin/news/${newsItem.id}`, config);
            const fullNews = res.data;

            setEditingNews(fullNews);
            setFormData({
                title: fullNews.title,
                status: fullNews.status,
                imageUrl: fullNews.image_url || '',
            });
            setContent(fullNews.content);
            setImageUrlPreview(fullNews.image_url || '');
            setShowModal(true);
        } catch (err) {
            alert('Error fetching news details.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const payload = {
            title: formData.title,
            content: content,
            status: formData.status,
            imageUrl: formData.imageUrl || null,
        };

        try {
            if (editingNews) {
                await axios.put(`http://localhost:5000/api/admin/news/${editingNews.id}`, payload, config);
                alert('News updated successfully!');
            } else {
                await axios.post('http://localhost:5000/api/admin/news', payload, config);
                alert('News created successfully!');
            }
            fetchNews();
            handleClose();
        } catch (err) {
            alert('Error saving news: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this news post?')) {
            try {
                const token = localStorage.getItem('adminToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`http://localhost:5000/api/admin/news/${id}`, config);
                alert('News deleted successfully!');
                fetchNews();
            } catch (err) {
                alert('Error deleting news.');
            }
        }
    };

    return (
        <>
            <div className="admin-page-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>News Management</h2>
                    <Button variant="primary" onClick={handleShowCreate}>Create New Post</Button>
                </div>

                <ListGroup className="news-list-container">
                    {newsList.map(item => (
                        <ListGroup.Item key={item.id} className="news-list-item">
                            <div className="d-flex align-items-center">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.title} className="news-thumbnail-list" />
                                ) : (
                                    <div className="news-thumbnail-list bg-secondary text-white d-flex align-items-center justify-content-center">No Image</div>
                                )}
                                <div className="ms-3 flex-grow-1">
                                    <h5 className="mb-1">{item.title}</h5>
                                    <p className="mb-1 text-muted small">
                                        By: {item.author_name || 'Admin'} | On: {new Date(item.created_at).toLocaleDateString()}
                                    </p>
                                    <Badge bg={item.status === 'active' ? 'success' : 'secondary'}>
                                        {item.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="d-flex gap-2">
                                <Button variant="outline-light" size="sm" onClick={() => handleShowEdit(item)}>Edit</Button>
                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
            
            <div className="pagination-container">
                {/* Phân trang có thể thêm sau */}
            </div>

            <Modal show={showModal} onHide={handleClose} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingNews ? 'Edit News Post' : 'Create New News Post'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control type="text" name="title" value={formData.title} onChange={handleFormChange} required />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Content</Form.Label>
                            <div className="quill-editor-container">
                                <ReactQuill 
                                    theme="snow" 
                                    value={content} 
                                    onChange={setContent}
                                    modules={quillModules}
                                />
                            </div>
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select name="status" value={formData.status} onChange={handleFormChange}>
                                        <option value="active">Active (Published)</option>
                                        <option value="inactive">Inactive (Draft)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Cover Image URL</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="imageUrl" 
                                        value={formData.imageUrl} 
                                        onChange={handleFormChange} 
                                        placeholder="https://example.com/image.png"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {imageUrlPreview && (
                            <div className="text-center mb-3">
                                <p>Image Preview:</p>
                                <img src={imageUrlPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                            </div>
                        )}
                        
                        <div className="text-end">
                            <Button variant="secondary" onClick={handleClose} className="me-2">Cancel</Button>
                            <Button variant="primary" type="submit">Save Post</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default NewsManagement;
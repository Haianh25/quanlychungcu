import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, ListGroup, Row, Col, Modal, Badge, Spinner, Alert, Card } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { PlusCircleFill, PencilSquare, Trash, Image as ImageIcon, Funnel } from 'react-bootstrap-icons'; // Thêm icons
import './NewsManagement.css'; 

const API_BASE_URL = 'http://localhost:5000';

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
    const [sortBy, setSortBy] = useState('newest');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const getImageUrl = (path) => {
        if (!path) return '';

        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    const fetchNews = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const config = { 
                headers: { Authorization: `Bearer ${token}` },
                params: { sortBy: sortBy } 
            };
            const res = await axios.get(`${API_BASE_URL}/api/admin/news`, config);
            setNewsList(res.data);
            setError('');
        } catch (err) {
            console.error("Error fetching news:", err);
            setError('Failed to fetch news. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, [sortBy]); 

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
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setUploading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            
            const res = await axios.post(`${API_BASE_URL}/api/news/upload-image`, uploadData, config);
            
            const uploadedUrl = res.data.imageUrl;
            
            setFormData({ ...formData, imageUrl: uploadedUrl });
            setImageUrlPreview(uploadedUrl);
            
        } catch (err) {
            console.error("Upload failed:", err);
            alert('Failed to upload image.');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingNews(null);
        setFormData({ title: '', status: 'active', imageUrl: '' });
        setContent('');
        setImageUrlPreview('');
        setUploading(false);
    };

    const handleShowCreate = () => {
        handleClose();
        setShowModal(true);
    };

    const handleShowEdit = async (newsItem) => {
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_BASE_URL}/api/admin/news/${newsItem.id}`, config);
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
                await axios.put(`${API_BASE_URL}/api/admin/news/${editingNews.id}`, payload, config);
                alert('News updated successfully!');
            } else {
                await axios.post(`${API_BASE_URL}/api/admin/news`, payload, config);
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
                await axios.delete(`${API_BASE_URL}/api/admin/news/${id}`, config);
                alert('News deleted successfully!');
                fetchNews();
            } catch (err) {
                alert('Error deleting news.');
            }
        }
    };

    return (
        <div className="management-page-container fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="page-main-title">News Management</h2>
                <Button className="btn-residem-primary d-flex align-items-center gap-2" onClick={handleShowCreate}>
                    <PlusCircleFill size={18}/> Create New Post
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="residem-card">
                <Card.Body>
                    <Form.Group as={Row} className="mb-4 align-items-center" controlId="sortNewsBy">
                        <Form.Label column sm="auto" className="residem-form-label mb-0 d-flex align-items-center">
                            <Funnel className="me-2"/> Sort by:
                        </Form.Label>
                        <Col sm="4" md="3" lg="2">
                            <Form.Select
                                className="residem-form-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </Form.Select>
                        </Col>
                    </Form.Group>

                    <div className="news-list-container">
                        {loading ? (
                            <div className="text-center p-5"><Spinner animation="border" variant="secondary" /></div>
                        ) : newsList.length === 0 ? (
                            <Alert variant="light" className="text-center text-muted m-3">No news posts found.</Alert>
                        ) : (
                            <ListGroup variant="flush">
                                {newsList.map(item => (
                                    <ListGroup.Item key={item.id} className="news-list-item">
                                        <div className="d-flex align-items-center w-100">
                                            {item.image_url ? (
                                                <img src={getImageUrl(item.image_url)} alt={item.title} className="news-thumbnail-list" />
                                            ) : (
                                                <div className="news-thumbnail-list">
                                                    <ImageIcon />
                                                </div>
                                            )}
                                            <div className="flex-grow-1 ms-2">
                                                <h5 className="news-item-title">{item.title}</h5>
                                                <p className="news-item-meta">
                                                    By: {item.author_name || 'Admin'} • On: {new Date(item.created_at).toLocaleDateString('en-GB')}
                                                </p>
                                                <Badge bg={item.status === 'active' ? 'success' : 'secondary'} className="status-badge">
                                                    {item.status === 'active' ? 'Published' : 'Draft'}
                                                </Badge>
                                            </div>
                                            <div className="d-flex gap-2 ms-3">
                                                <Button variant="light" className="btn-residem-warning btn-sm" onClick={() => handleShowEdit(item)}>
                                                    <PencilSquare /> Edit
                                                </Button>
                                                <Button variant="light" className="btn-residem-danger btn-sm" onClick={() => handleDelete(item.id)}>
                                                    <Trash /> Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={handleClose} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="residem-modal-title">
                        {editingNews ? 'Edit News Post' : 'Create New News Post'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Title<span className="required-star">*</span></Form.Label>
                            <Form.Control className="residem-form-control" type="text" name="title" value={formData.title} onChange={handleFormChange} required placeholder="Enter post title..." />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">Content<span className="required-star">*</span></Form.Label>
                            <div className="quill-editor-container residem-quill">
                                <ReactQuill 
                                    theme="snow" 
                                    value={content} 
                                    onChange={setContent}
                                    modules={quillModules}
                                    placeholder="Write something amazing..."
                                />
                            </div>
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">Status</Form.Label>
                                    <Form.Select className="residem-form-select" name="status" value={formData.status} onChange={handleFormChange}>
                                        <option value="active">Active (Published)</option>
                                        <option value="inactive">Inactive (Draft)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="residem-form-label">Cover Image</Form.Label>
                                    <Form.Control 
                                        className="residem-form-control"
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleImageUpload} 
                                        disabled={uploading}
                                    />
                                    {uploading && <div className="text-muted small mt-1">Uploading...</div>}
                                </Form.Group>
                            </Col>
                        </Row>

                        {imageUrlPreview && (
                            <div className="image-preview-box">
                                <p>Image Preview:</p>
                                <img src={getImageUrl(imageUrlPreview)} alt="Preview" />
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="residem-secondary" onClick={handleClose}>Cancel</Button>
                        <Button className="btn-residem-primary" type="submit" disabled={uploading}>
                            {uploading ? <Spinner as="span" size="sm" /> : 'Save Post'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default NewsManagement;
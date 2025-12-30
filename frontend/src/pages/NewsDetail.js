import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './News.css'; 
import { Container, Row, Col, Spinner, Alert, ListGroup } from 'react-bootstrap';

const API_BASE_URL = 'http://localhost:5000';

const NewsDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [allNews, setAllNews] = useState([]);

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    useEffect(() => {
        const fetchItem = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE_URL}/api/news/${id}`);
                setItem(res.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching news detail:', err);
                setError('Cannot load content.');
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
        window.scrollTo(0, 0); 
    }, [id]);

    useEffect(() => {
        const fetchAllNews = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/news`);
                setAllNews(res.data);
            } catch (err) {
                console.error('Error fetching news for sidebar:', err);
            }
        };
        fetchAllNews();
    }, []); 

    const recentPosts = useMemo(() => {
        const otherPosts = allNews.filter(post => post.id !== id);
        
        const sortedPosts = otherPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return sortedPosts.slice(0, 5);
    }, [allNews, id]);

    return (
        <Container className="news-page-container my-5 fadeIn">
            {loading ? (
                <div className="text-center p-5"><Spinner animation="border" /></div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : !item ? (
                <Alert variant="residem-info" className="no-news-alert">
                    News not found.
                </Alert>
            ) : (
                <>
                    <div className="news-header-section mb-4">
                        <Link className="btn btn-residem-secondary btn-sm mb-3" to="/news">
                            &larr; Back to News
                        </Link>
                        
                        <h1 className="news-detail-title">{item.title}</h1>
                        
                        <div className="news-detail-meta text-muted">
                            <span>{new Date(item.created_at).toLocaleString('vi-VN')}</span>
                            <span className="mx-2">•</span>
                            <span>{item.author_name || 'PTIT Apartment'}</span>
                        </div>
                        <hr className="my-4" /> 
                    </div>
                    <Row>
                        <Col lg={8}>
                            <div className="news-detail-wrapper">
                                {(item.imageurl || item.image_url) && (
                                    <img 
                                        src={getImageUrl(item.imageurl || item.image_url)} 
                                        alt={item.title} 
                                        className="news-detail-image img-fluid mb-4 w-100 rounded" 
                                    />
                                )}
                                
                                <div className="news-detail-content" dangerouslySetInnerHTML={{ __html: item.content }} />
                            </div>
                        </Col>
                        <Col lg={4}>
                            <aside className="news-sidebar">
                                <div className="sidebar-widget">
                                    <h5 className="widget-title">Recent Posts</h5>
                                    <ListGroup variant="flush" className="recent-posts-list">
                                        {recentPosts.length === 0 ? (
                                            <div className="text-muted small p-2">No other news available.</div>
                                        ) : (
                                            recentPosts.map(post => (
                                                <ListGroup.Item action as={Link} to={`/news/${post.id}`} key={post.id} className="d-flex align-items-center">
                                                    {(post.imageurl || post.image_url) ? (
                                                        <img 
                                                            src={getImageUrl(post.imageurl || post.image_url)} 
                                                            alt={post.title} 
                                                            className="recent-post-img" 
                                                        />
                                                    ) : (
                                                        <div className="recent-post-img-placeholder">
                                                            <i className="bi bi-image-alt"></i>
                                                        </div>
                                                    )}
                                                    <div className="recent-post-info">
                                                        <span className="recent-post-title">{post.title}</span>
                                                        <small className="text-muted">{new Date(post.created_at).toLocaleDateString('vi-VN')}</small>
                                                    </div>
                                                </ListGroup.Item>
                                            ))
                                        )}
                                    </ListGroup>
                                </div>
                            </aside>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
};

export default NewsDetail;
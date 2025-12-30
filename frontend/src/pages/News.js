import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Pagination from '../components/admin/Pagination'; 
import './News.css';
import { Container, Row, Col, Dropdown, Alert, Spinner } from 'react-bootstrap';

const API_BASE_URL = 'http://localhost:5000';

const News = () => {

    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 9; 

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path; 
        return `${API_BASE_URL}${path}`; 
    };

    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE_URL}/api/news`); 
                setNewsList(res.data);
            } catch (err) {
                console.error('Error fetching public news:', err);
                setError('Failed to load news. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const createExcerpt = (htmlContent, maxLength) => {
        if (!htmlContent) return '';
        const plainText = htmlContent.replace(/<[^>]+>/g, '');
        if (plainText.length <= maxLength) {
            return plainText;
        }
        return plainText.slice(0, maxLength) + '...';
    };

    const sortedNewsList = useMemo(() => {
        return [...newsList].sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [newsList, sortOrder]);

    const currentNewsList = useMemo(() => {
        const indexOfLastPost = currentPage * postsPerPage;
        const indexOfFirstPost = indexOfLastPost - postsPerPage;
        return sortedNewsList.slice(indexOfFirstPost, indexOfLastPost);
    }, [sortedNewsList, currentPage, postsPerPage]);

    const totalPages = Math.ceil(sortedNewsList.length / postsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0); 
    };

    const featuredPost = currentNewsList.length > 0 ? currentNewsList[0] : null;
    const remainingPosts = currentNewsList.length > 1 ? currentNewsList.slice(1) : [];

    return (
        <Container className="news-page-container my-5 fadeIn">
            
            <Row className="mb-4 align-items-center">
                <Col md={6}>
                    <h2 className="news-page-title">Latest News</h2>
                </Col>
                <Col md={6} className="d-flex justify-content-end">
                    <Dropdown onSelect={(eventKey) => {
                        setSortOrder(eventKey);
                        setCurrentPage(1);
                    }}>
                        <Dropdown.Toggle 
                            variant="residem-dropdown" 
                            id="dropdown-basic" 
                            className="news-sort-dropdown"
                        >
                            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item eventKey="desc">Newest First</Dropdown.Item>
                            <Dropdown.Item eventKey="asc">Oldest First</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>

            {loading ? (
                <div className="text-center p-5"><Spinner animation="border" /></div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : newsList.length === 0 ? (
                <Alert variant="residem-info" className="no-news-alert">
                    No news available at the moment.
                </Alert>
            ) : (
                <div className="news-grid-wrapper">

                    {featuredPost && (
                        <Row className="mb-5">
                            <Col xs={12}>
                                <div className="card news-card featured-news-card h-100">
                                    <Row g={0}>
                                        <Col lg={8}> 
                                            {featuredPost.imageurl || featuredPost.image_url ? (
                                                <img 
                                                    src={getImageUrl(featuredPost.imageurl || featuredPost.image_url)} 
                                                    className="featured-news-image" 
                                                    alt={featuredPost.title} 
                                                />
                                            ) : (
                                                <div className="news-image-placeholder featured-news-image">
                                                    <i className="bi bi-image-alt"></i>
                                                </div>
                                            )}
                                        </Col>
                                        <Col lg={4}>
                                            <div className="card-body d-flex flex-column h-100 justify-content-center p-4">
                                                <small className="text-primary-accent fw-bold mb-2 text-uppercase">Featured</small>
                                                <h3 className="card-title featured-title mb-3">{featuredPost.title}</h3>
                                                <p className="card-text news-excerpt text-muted mb-4">
                                                    {createExcerpt(featuredPost.content, 180)} 
                                                </p>
                                                <div className="d-flex justify-content-between align-items-center mt-auto">
                                                    <small className="text-muted">{new Date(featuredPost.created_at).toLocaleDateString('en-GB')}</small>
                                                    <Link className="btn btn-residem-primary" to={`/news/${featuredPost.id}`}>
                                                        Read More
                                                    </Link>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Col>
                        </Row>
                    )}

                    <Row>
                        {remainingPosts.map(item => (
                            <Col md={6} lg={4} className="mb-4" key={item.id}>
                                <div className="card news-card h-100">
                                    <div className="news-img-top-wrapper">
                                        {item.imageurl || item.image_url ? (
                                            <img 
                                                src={getImageUrl(item.imageurl || item.image_url)} 
                                                className="card-img-top news-image" 
                                                alt={item.title} 
                                            />
                                        ) : (
                                            <div className="news-image-placeholder">
                                                <i className="bi bi-image-alt"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-body d-flex flex-column p-4">
                                        <h5 className="card-title mb-3">{item.title}</h5>
                                        <p className="card-text news-excerpt flex-grow-1 text-muted small">
                                            {createExcerpt(item.content, 120)}
                                        </p>
                                        <div className="mt-3 d-flex justify-content-between align-items-center pt-3 border-top">
                                            <small className="text-muted">{new Date(item.created_at).toLocaleDateString('en-GB')}</small>
                                            <Link className="read-more-link" to={`/news/${item.id}`}>
                                                Read More <i className="bi bi-arrow-right"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-5 residem-pagination">
                    <Pagination
                        itemsPerPage={postsPerPage} 
                        totalItems={sortedNewsList.length} 
                        paginate={handlePageChange} 
                        currentPage={currentPage} 
                    />
                </div>
            )}
        </Container>
    );
};

export default News;
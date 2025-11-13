import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './News.css'; // SỬ DỤNG CHUNG CSS VỚI TRANG NEWS
// Thêm các component của Bootstrap
import { Container, Row, Col, Spinner, Alert, Form, InputGroup, ListGroup, Button } from 'react-bootstrap';

const NewsDetail = () => {
    // --- LOGIC GỐC CỦA BẠN (GIỮ NGUYÊN) ---
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- LOGIC MỚI ĐỂ LẤY DATA CHO SIDEBAR ---
    const [allNews, setAllNews] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // State cho search bar

    // useEffect 1: Lấy chi tiết bài viết (Giữ nguyên)
    useEffect(() => {
        const fetchItem = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/news/${id}`);
                setItem(res.data);
                setError(null); // Xóa lỗi cũ nếu fetch thành công
            } catch (err) {
                console.error('Error fetching news detail:', err);
                setError('Không thể tải nội dung.');
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
        window.scrollTo(0, 0); // Cuộn lên đầu trang khi đổi bài viết
    }, [id]);

    // useEffect 2: Lấy tất cả bài viết (cho Sidebar)
    useEffect(() => {
        const fetchAllNews = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/news');
                setAllNews(res.data);
            } catch (err) {
                console.error('Error fetching news for sidebar:', err);
            }
        };
        fetchAllNews();
    }, []); // Chỉ chạy 1 lần

    // useMemo cho Sidebar
    const recentPosts = useMemo(() => {
        return [...allNews]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
    }, [allNews]);
    
    // Dữ liệu giả cho sidebar
    const categories = ['Apartment News', 'Community Events', 'Maintenance', 'Policy Updates'];
    
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    
    // Xử lý khi nhấn Enter (hoặc nút) tìm kiếm
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/news?search=${searchTerm.trim()}`); // Chuyển hướng về trang News với query
        }
    };

    // --- RENDER CHÍNH ---
    return (
        <Container className="news-page-container my-5 fadeIn">
            <Row>
                {/* === CỘT NỘI DUNG CHÍNH (8) === */}
                <Col lg={8}>
                    {loading ? (
                        <div className="text-center p-5"><Spinner animation="border" /></div>
                    ) : error ? (
                        <Alert variant="danger">{error}</Alert>
                    ) : !item ? (
                        <Alert variant="residem-info" className="no-news-alert">
                            Không tìm thấy bài viết.
                        </Alert>
                    ) : (
                        // Bố cục chi tiết bài viết
                        <div className="news-detail-wrapper">
                            {/* Nút quay lại (style mới) */}
                            <Link className="btn btn-residem-secondary btn-sm mb-3" to="/news">
                                &larr; Back to News
                            </Link>
                            
                            {/* Tiêu đề */}
                            <h1 className="news-detail-title">{item.title}</h1>
                            
                            {/* Thông tin (Tác giả, Ngày) */}
                            <div className="news-detail-meta">
                                <span>{new Date(item.created_at).toLocaleString('vi-VN')}</span>
                                <span>•</span>
                                <span>{item.author_name || 'PTIT Apartment'}</span>
                            </div>
                            
                            {/* Ảnh chính */}
                            {(item.imageurl || item.image_url) && (
                                <img src={item.imageurl || item.image_url} alt={item.title} className="news-detail-image img-fluid mb-4" />
                            )}
                            
                            {/* Nội dung HTML */}
                            <div className="news-detail-content" dangerouslySetInnerHTML={{ __html: item.content }} />
                        </div>
                    )}
                </Col>

                {/* === CỘT SIDEBAR (4) === */}
                <Col lg={4}>
                    <aside className="news-sidebar">
                        
                        {/* Widget: Search */}
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Search</h5>
                            {/* CẬP NHẬT: Thêm form và onSubmit */}
                            <Form onSubmit={handleSearchSubmit}>
                                <InputGroup className="mb-3">
                                    <Form.Control
                                        placeholder="Search news..."
                                        className="search-input"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                    />
                                    <Button type="submit" className="btn-residem-primary search-button">
                                        <i className="bi bi-search"></i>
                                    </Button>
                                </InputGroup>
                            </Form>
                        </div>

                        {/* Widget: Categories */}
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Categories</h5>
                            <ListGroup variant="flush" className="category-list">
                                {categories.map(cat => (
                                    <ListGroup.Item action key={cat}>
                                        {cat}
                                        <span className="category-count">(5)</span>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>

                        {/* Widget: Recent Posts */}
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Recent Posts</h5>
                            <ListGroup variant="flush" className="recent-posts-list">
                                {recentPosts.map(post => (
                                    <ListGroup.Item action as={Link} to={`/news/${post.id}`} key={post.id} className="d-flex align-items-center">
                                        {(post.imageurl || post.image_url) ? (
                                            <img src={post.imageurl || post.image_url} alt={post.title} className="recent-post-img" />
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
                                ))}
                            </ListGroup>
                        </div>

                    </aside>
                </Col>
            </Row>
        </Container>
    );
};

export default NewsDetail;
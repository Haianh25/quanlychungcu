import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Pagination from '../components/admin/Pagination'; 
import './News.css';
// Import các component của Bootstrap
import { Container, Row, Col, Dropdown, Alert, Spinner, Form, InputGroup, ListGroup, Button } from 'react-bootstrap';

const News = () => {
    // --- LOGIC GỐC (GIỮ NGUYÊN) ---
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 6; 

    // === THÊM MỚI: State cho tìm kiếm ===
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                const res = await axios.get('http://localhost:5000/api/news');
                setNewsList(res.data);
            } catch (err) {
                console.error('Error fetching public news:', err);
                setError('Không thể tải tin tức. Vui lòng thử lại sau.');
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

    // === CẬP NHẬT: Logic Lọc và Sắp xếp ===

    // 1. Sắp xếp (Giữ nguyên)
    const sortedNewsList = useMemo(() => {
        return [...newsList].sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [newsList, sortOrder]);

    // 2. Lọc (Mới) - Lọc từ danh sách đã sắp xếp
    const filteredNewsList = useMemo(() => {
        if (!searchTerm) {
            return sortedNewsList; // Trả về toàn bộ nếu không tìm kiếm
        }
        return sortedNewsList.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
            // (Bạn có thể thêm || item.content.toLowerCase().includes(searchTerm.toLowerCase()) nếu muốn)
        );
    }, [sortedNewsList, searchTerm]); // Phụ thuộc vào danh sách đã sắp xếp VÀ từ khóa tìm kiếm

    // 3. Phân trang (CẬP NHẬT) - Dùng danh sách đã lọc
    const currentNewsList = useMemo(() => {
        const indexOfLastPost = currentPage * postsPerPage;
        const indexOfFirstPost = indexOfLastPost - postsPerPage;
        return filteredNewsList.slice(indexOfFirstPost, indexOfLastPost); // Dùng filteredNewsList
    }, [filteredNewsList, currentPage, postsPerPage]); // Dùng filteredNewsList

    // 4. Tính tổng số trang (CẬP NHẬT) - Dùng danh sách đã lọc
    const totalPages = Math.ceil(filteredNewsList.length / postsPerPage); // Dùng filteredNewsList.length

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0); 
    };

    // 5. Hàm xử lý khi gõ tìm kiếm (Mới)
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Quay về trang 1 mỗi khi tìm kiếm
    };

    // Logic render (CẬP NHẬT) - Dùng filteredNewsList để kiểm tra
    const featuredPost = currentNewsList.length > 0 ? currentNewsList[0] : null;
    const remainingPosts = currentNewsList.length > 1 ? currentNewsList.slice(1) : [];
    
    // Dữ liệu giả cho sidebar (CẬP NHẬT) - Lấy 5 bài mới nhất từ danh sách GỐC
    const recentPosts = useMemo(() => sortedNewsList.slice(0, 5), [sortedNewsList]);
    const categories = ['Apartment News', 'Community Events', 'Maintenance', 'Policy Updates'];


    // --- GIAO DIỆN JSX ĐÃ ĐƯỢC CẬP NHẬT ---
    return (
        <Container className="news-page-container my-5 fadeIn">
            
            {/* Hàng Tiêu đề và Sắp xếp (Giữ nguyên) */}
            <Row className="mb-4 align-items-center">
                <Col md={6}>
                    <h2 className="news-page-title">News</h2>
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
                            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item eventKey="desc">Newest</Dropdown.Item>
                            <Dropdown.Item eventKey="asc">Oldest</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>
            
            {/* BỐ CỤC 2 CỘT */}
            <Row>
                {/* === CỘT NỘI DUNG CHÍNH (8) === */}
                <Col lg={8}>
                    {loading ? (
                        <div className="text-center p-5"><Spinner animation="border" /></div>
                    ) : error ? (
                        <Alert variant="danger">{error}</Alert>
                    // === CẬP NHẬT: Kiểm tra filteredNewsList thay vì currentNewsList ===
                    ) : filteredNewsList.length === 0 ? (
                        <Alert variant="residem-info" className="no-news-alert">
                            {searchTerm ? `No news found matching "${searchTerm}".` : 'No news available.'}
                        </Alert>
                    ) : (
                        <Row>
                            {/* 1. BÀI VIẾT NỔI BẬT */}
                            {featuredPost && (
                                <Col xs={12} className="mb-4">
                                    <div className="card news-card featured-news-card h-100">
                                        <Row g={0}>
                                            <Col lg={7}>
                                                {featuredPost.imageurl || featuredPost.image_url ? (
                                                    <img src={featuredPost.imageurl || featuredPost.image_url} className="featured-news-image" alt={featuredPost.title} />
                                                ) : (
                                                    <div className="news-image-placeholder featured-news-image">
                                                        <i className="bi bi-image-alt"></i>
                                                    </div>
                                                )}
                                            </Col>
                                            <Col lg={5}>
                                                <div className="card-body d-flex flex-column h-100">
                                                    <h3 className="card-title featured-title">{featuredPost.title}</h3>
                                                    <p className="card-text news-excerpt">
                                                        {createExcerpt(featuredPost.content, 200)} 
                                                    </p>
                                                    <div className="mt-auto d-flex justify-content-between align-items-center">
                                                        <small className="text-muted">{new Date(featuredPost.created_at).toLocaleString('vi-VN')}</small>
                                                        <Link className="btn btn-residem-primary btn-sm" to={`/news/${featuredPost.id}`}>
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                            )}

                            {/* 2. CÁC BÀI VIẾT CÒN LẠI (DẠNG LƯỚI) */}
                            {remainingPosts.map(item => (
                                <div className="col-md-6 mb-4" key={item.id}>
                                    <div className="card news-card h-100">
                                        {item.imageurl || item.image_url ? (
                                            <img src={item.imageurl || item.image_url} className="card-img-top news-image" alt={item.title} />
                                        ) : (
                                            <div className="news-image-placeholder">
                                                <i className="bi bi-image-alt"></i>
                                            </div>
                                        )}
                                        <div className="card-body d-flex flex-column">
                                            <h5 className="card-title">{item.title}</h5>
                                            <p className="card-text news-excerpt">
                                                {createExcerpt(item.content, 150)}
                                            </p>
                                            <div className="mt-auto d-flex justify-content-between align-items-center">
                                                <small className="text-muted">{new Date(item.created_at).toLocaleString('vi-VN')}</small>
                                                <Link className="btn btn-residem-primary btn-sm" to={`/news/${item.id}`}>
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Row>
                    )}

                    {/* Phân trang (Giữ nguyên) */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4 residem-pagination">
                            <Pagination
                                itemsPerPage={postsPerPage} 
                                totalItems={filteredNewsList.length} // CẬP NHẬT: Dùng độ dài của list đã lọc
                                paginate={handlePageChange} 
                                currentPage={currentPage} 
                            />
                        </div>
                    )}
                </Col>

                {/* === CỘT SIDEBAR (4) === */}
                <Col lg={4}>
                    <aside className="news-sidebar">
                        
                        {/* === CẬP NHẬT: WIDGET TÌM KIẾM === */}
                        <div className="sidebar-widget">
                            <h5 className="widget-title">Search</h5>
                            {/* Bọc trong Form để chặn Enter */}
                            <Form onSubmit={(e) => e.preventDefault()}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search news..."
                                    className="search-input"
                                    value={searchTerm} // Gán state
                                    onChange={handleSearchChange} // Gán hàm xử lý
                                />
                            </Form>
                            {/* Đã loại bỏ InputGroup và Button để làm live search */}
                        </div>

                        {/* Widget: Categories (Giữ nguyên) */}
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

                        {/* Widget: Recent Posts (Giữ nguyên) */}
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

export default News;
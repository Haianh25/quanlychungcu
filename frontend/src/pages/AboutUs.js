import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
// Import Icons (cần cài đặt: npm install react-bootstrap-icons)
import { BuildingCheck, PeopleFill, ShieldCheck, HeartFill } from 'react-bootstrap-icons';
import './AboutUs.css'; // CSS riêng cho trang này

const AboutUs = () => {
    return (
        <div className="about-page fadeIn">
            {/* --- 1. HERO SECTION (Giống Homepage nhưng ngắn hơn) --- */}
            <section 
                className="page-hero-section" 
                style={{ 
                    backgroundImage: `url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1800&q=80')` 
                }}
            >
                <div className="page-hero-overlay"></div>
                <Container className="page-hero-title text-center">
                    <h1>About PTIT Apartment</h1>
                    <p className="lead text-light">Building a vibrant community for students and professionals.</p>
                </Container>
            </section>

            {/* --- 2. OUR STORY --- */}
            <section className="about-story-section my-5">
                <Container>
                    <Row className="align-items-center">
                        <Col lg={6} className="mb-4 mb-lg-0">
                            <img 
                                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                                alt="Our Building" 
                                className="img-fluid rounded shadow-lg about-story-img"
                            />
                        </Col>
                        <Col lg={6}>
                            <h2 className="section-title mb-3">Our Story</h2>
                            <p className="text-muted">
                                Founded with a vision to provide high-quality living spaces for the PTIT community, PTIT Apartment has grown into a landmark of modern living in Ha Dong. We believe that a home is more than just four walls; it's a place where connections are made and dreams are nurtured.
                            </p>
                            <p className="text-muted">
                                Our mission is to offer a safe, comfortable, and inspiring environment where every resident feels valued and at home. From state-of-the-art facilities to responsive management, we are dedicated to excellence in every detail.
                            </p>
                            <div className="mt-4">
                                <img src="/images/signature.png" alt="" style={{ height: '40px', opacity: 0.6 }} /> {/* Ảnh chữ ký giả lập nếu có */}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* --- 3. STATS COUNTER (Bố cục phụ - Điểm nhấn) --- */}
            <section className="about-stats-section py-5 bg-white">
                <Container>
                    <Row className="text-center">
                        <Col md={3} sm={6} className="mb-4 mb-md-0">
                            <div className="stat-item">
                                <h3 className="stat-number text-primary-accent">500+</h3>
                                <p className="stat-label">Happy Residents</p>
                            </div>
                        </Col>
                        <Col md={3} sm={6} className="mb-4 mb-md-0">
                            <div className="stat-item">
                                <h3 className="stat-number text-primary-accent">150</h3>
                                <p className="stat-label">Premium Apartments</p>
                            </div>
                        </Col>
                        <Col md={3} sm={6} className="mb-4 mb-md-0">
                            <div className="stat-item">
                                <h3 className="stat-number text-primary-accent">24/7</h3>
                                <p className="stat-label">Security & Support</p>
                            </div>
                        </Col>
                        <Col md={3} sm={6} className="mb-4 mb-md-0">
                            <div className="stat-item">
                                <h3 className="stat-number text-primary-accent">5+</h3>
                                <p className="stat-label">Years of Service</p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* --- 4. CORE VALUES (Bố cục phụ) --- */ }
            <section className="about-values-section my-5">
                <Container>
                    <div className="text-center mb-5">
                        <p className="sub-heading">Why Choose Us</p>
                        <h2 className="section-title">Our Core Values</h2>
                    </div>
                    <Row>
                        <Col md={4} className="mb-4">
                            <Card className="residem-card h-100 text-center value-card">
                                <Card.Body className="p-4">
                                    <div className="value-icon-wrapper mb-3">
                                        <ShieldCheck className="value-icon" />
                                    </div>
                                    <Card.Title>Safety First</Card.Title>
                                    <Card.Text className="text-muted">
                                        We prioritize your safety with 24/7 surveillance and secure access control systems.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="residem-card h-100 text-center value-card">
                                <Card.Body className="p-4">
                                    <div className="value-icon-wrapper mb-3">
                                        <BuildingCheck className="value-icon" />
                                    </div>
                                    <Card.Title>Modern Amenities</Card.Title>
                                    <Card.Text className="text-muted">
                                        Enjoy access to a gym, swimming pool, and co-working spaces designed for your lifestyle.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="residem-card h-100 text-center value-card">
                                <Card.Body className="p-4">
                                    <div className="value-icon-wrapper mb-3">
                                        <HeartFill className="value-icon" />
                                    </div>
                                    <Card.Title>Community Focused</Card.Title>
                                    <Card.Text className="text-muted">
                                        We organize events and maintain spaces that foster friendship and networking among residents.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            
        </div>
    );
};

export default AboutUs;
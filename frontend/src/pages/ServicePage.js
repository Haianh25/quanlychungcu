import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { CarFrontFill, BuildingGear } from 'react-bootstrap-icons';
import './ServicePage.css';

const ServicePage = () => {
    return (
        <Container className="service-page my-5 fadeIn">
            <h2 className="page-main-title mb-5 text-center">Choose a Service</h2>

            <Row className="justify-content-center g-4">
                {/* BOX 1: GỬI XE -> Link tới /services/vehicle */}
                <Col md={5} lg={4}>
                    <Link to="/services/vehicle" className="service-link-box">
                        <Card className="residem-card service-box-card h-100 text-center">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-5">
                                <div className="service-icon-wrapper mb-4">
                                    <CarFrontFill className="service-icon" />
                                </div>
                                <h3 className="service-box-title">Vehicle Parking</h3>
                                <p className="text-muted mt-2">
                                    Register parking cards, manage vehicles.
                                </p>
                                <span className="btn btn-residem-primary mt-3">Access Now</span>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>

                {/* BOX 2: ĐẶT PHÒNG -> Link tới /services/amenity */}
                <Col md={5} lg={4}>
                    <Link to="/services/amenity" className="service-link-box">
                        <Card className="residem-card service-box-card h-100 text-center">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-5">
                                <div className="service-icon-wrapper mb-4">
                                    <BuildingGear className="service-icon" />
                                </div>
                                <h3 className="service-box-title">Amenities Booking</h3>
                                <p className="text-muted mt-2">
                                    Book community rooms, BBQ areas.
                                </p>
                                <span className="btn btn-residem-primary mt-3">Book Now</span>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
            </Row>
        </Container>
    );
};

export default ServicePage;
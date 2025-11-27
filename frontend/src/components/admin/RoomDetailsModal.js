// frontend/src/components/admin/RoomDetailsModal.js
import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { CarFrontFill, Scooter, Bicycle, Grid3x3GapFill, MoonStarsFill, PersonBadgeFill } from 'react-bootstrap-icons';

const RoomDetailsModal = ({ show, handleClose, roomData, blockName }) => {
    if (!roomData) return null; 

    const statusText = roomData.resident_name ? 'Occupied' : 'Vacant';
    const ownerText = roomData.resident_name || 'No Resident';
    const roomFullName = `${blockName} - ${roomData.room_number}`;
    
    // Màu sắc cho loại phòng
    const typeBadgeColor = roomData.room_type === 'A' ? 'info' : 'primary';

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton className="border-bottom-0 pb-0">
                <Modal.Title className="fw-bold">Room Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Header: Room Name & Status */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <h3 className="mb-1 text-primary">{roomFullName}</h3>
                        <Badge bg={roomData.resident_name ? 'success' : 'secondary'} className="text-uppercase">
                            {statusText}
                        </Badge>
                    </div>
                    <div className="text-end">
                        <Badge bg={typeBadgeColor} className="fs-6 mb-1">Type {roomData.room_type}</Badge>
                        <div className="text-muted small">Floor {roomData.floor}</div>
                    </div>
                </div>

                {/* Section 1: Room Specs */}
                <div className="bg-light p-3 rounded mb-4">
                    <h6 className="text-muted text-uppercase small fw-bold mb-3">Apartment Specifications</h6>
                    <Row className="g-3 text-center">
                        <Col xs={6}>
                            <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                                <Grid3x3GapFill className="text-secondary"/> 
                                <span className="fw-bold">{roomData.area || 0} m²</span>
                            </div>
                            <small className="text-muted">Area</small>
                        </Col>
                        <Col xs={6}>
                            <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                                <MoonStarsFill className="text-secondary"/> 
                                <span className="fw-bold">{roomData.bedrooms || 0}</span>
                            </div>
                            <small className="text-muted">Bedrooms</small>
                        </Col>
                    </Row>
                </div>

                {/* Section 2: Resident Info */}
                <div className="mb-4">
                    <h6 className="text-muted text-uppercase small fw-bold mb-2">Resident Information</h6>
                    <div className="d-flex align-items-center gap-2 p-2 border rounded">
                        <PersonBadgeFill className="fs-4 text-secondary ms-2"/>
                        <span className={`fw-medium ${!roomData.resident_name ? 'text-muted fst-italic' : ''}`}>
                            {ownerText}
                        </span>
                    </div>
                </div>

                {/* Section 3: Vehicles (Chỉ hiện nếu có người ở) */}
                {roomData.resident_name && (
                    <div>
                        <h6 className="text-muted text-uppercase small fw-bold mb-3">Registered Vehicles</h6>
                        <Row className="g-2">
                            <Col xs={4}>
                                <div className="border rounded p-2 text-center">
                                    <CarFrontFill className="text-primary mb-1"/>
                                    <div className="fw-bold">{roomData.car_count || 0}</div>
                                    <small className="text-muted" style={{fontSize: '0.7rem'}}>Cars</small>
                                </div>
                            </Col>
                            <Col xs={4}>
                                <div className="border rounded p-2 text-center">
                                    <Scooter className="text-success mb-1"/>
                                    <div className="fw-bold">{roomData.motorbike_count || 0}</div>
                                    <small className="text-muted" style={{fontSize: '0.7rem'}}>Bikes</small>
                                </div>
                            </Col>
                            <Col xs={4}>
                                <div className="border rounded p-2 text-center">
                                    <Bicycle className="text-info mb-1"/>
                                    <div className="fw-bold">{roomData.bicycle_count || 0}</div>
                                    <small className="text-muted" style={{fontSize: '0.7rem'}}>Cycles</small>
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0">
                <Button variant="secondary" onClick={handleClose} className="w-100">
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RoomDetailsModal;
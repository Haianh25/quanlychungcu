import React, { useState } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { CarFrontFill, Scooter, Bicycle, Grid3x3GapFill, MoonStarsFill, PersonBadgeFill, PersonDashFill, ExclamationTriangleFill } from 'react-bootstrap-icons';
import axios from 'axios';

const RoomDetailsModal = ({ show, handleClose, roomData, blockName, onUnassignSuccess }) => {
    const [unassignLoading, setUnassignLoading] = useState(false);

    if (!roomData) return null; 

    const statusText = roomData.resident_name ? 'Occupied' : 'Vacant';
    const ownerText = roomData.resident_name || 'No Resident';
    const roomFullName = `${blockName} - ${roomData.room_number}`;
    const typeBadgeColor = roomData.room_type === 'A' ? 'info' : 'primary';

    const unpaidBillsCount = roomData.unpaid_bills_count || 0;

    const handleUnassign = async () => {
        if (!roomData.resident_id) return;
        
        let confirmMsg = `Are you sure you want to remove resident "${roomData.resident_name}"? This action will deactivate their vehicle cards.`;

        if (unpaidBillsCount > 0) {
            confirmMsg = `WARNING: This resident has ${unpaidBillsCount} UNPAID BILLS!\n\nThe debt will remain on their account, but are you sure you want to let them leave now?`;
        }

        if (!window.confirm(confirmMsg)) {
            return;
        }

        setUnassignLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            await axios.post('http://localhost:5000/api/admin/unassign-room', {
                residentId: roomData.resident_id
            }, config);

            alert('Resident unassigned successfully!');
            handleClose(); 
            if (onUnassignSuccess) onUnassignSuccess();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unassign resident.');
        } finally {
            setUnassignLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton className="border-bottom-0 pb-0">
                <Modal.Title className="fw-bold">Room Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>

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

                <div className="mb-4">
                    <h6 className="text-muted text-uppercase small fw-bold mb-2">Resident Information</h6>
                    <div className="d-flex align-items-center justify-content-between p-2 border rounded">
                        <div className="d-flex align-items-center gap-2">
                            <PersonBadgeFill className="fs-4 text-secondary ms-2"/>
                            <div>
                                <div className={`fw-medium ${!roomData.resident_name ? 'text-muted fst-italic' : ''}`}>
                                    {ownerText}
                                </div>
                    
                                {unpaidBillsCount > 0 && (
                                    <small className="text-danger fw-bold d-block">
                                        <ExclamationTriangleFill className="me-1"/> {unpaidBillsCount} Unpaid Bills
                                    </small>
                                )}
                            </div>
                        </div>
                        
                        {roomData.resident_name && (
                            <Button 
                                variant={unpaidBillsCount > 0 ? "danger" : "outline-danger"} 
                                size="sm" 
                                onClick={handleUnassign} 
                                disabled={unassignLoading}
                                title="Remove resident from room"
                            >
                                {unassignLoading ? <Spinner size="sm" animation="border"/> : <><PersonDashFill/> Unassign</>}
                            </Button>
                        )}
                    </div>
                </div>

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
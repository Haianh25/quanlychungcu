import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';

const AssignRoomModal = ({ show, handleClose, resident, onAssignSuccess }) => {
    const [blocks, setBlocks] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');

    // Fetch blocks when modal opens
    useEffect(() => {
        if (show) {
            const fetchBlocks = async () => {
                const token = localStorage.getItem('adminToken');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                try {
                    const res = await axios.get('http://localhost:5000/api/admin/blocks', config);
                    setBlocks(res.data);
                } catch (err) {
                    console.error("Failed to fetch blocks");
                }
            };
            fetchBlocks();
            
            // Reset state to avoid stale data
            setSelectedBlockId('');
            setSelectedFloor('');
            setAvailableRooms([]);
        }
    }, [show]);

    // Fetch available rooms or cleanup state
    useEffect(() => {
        if (selectedBlockId) {
            // If a block is selected
            const fetchRooms = async () => {
                const token = localStorage.getItem('adminToken');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                try {
                    const res = await axios.get(`http://localhost:5000/api/admin/blocks/${selectedBlockId}/available-rooms`, config);
                    setAvailableRooms(res.data);
                    setSelectedFloor(''); // Reset selected floor
                } catch (err) {
                    console.error("Failed to fetch rooms");
                }
            };
            fetchRooms();
        } else {
            // If "-- Choose Block --" is selected
            setAvailableRooms([]); 
            setSelectedFloor('');  
        }
    }, [selectedBlockId]);

    const handleAssign = async (roomId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const payload = { residentId: resident.id, roomId: roomId };
            await axios.post('http://localhost:5000/api/admin/assign-room', payload, config);
            
            onAssignSuccess(); 
            handleClose();
        } catch (error) {
            // [ĐÃ DỊCH] Sửa thông báo lỗi sang tiếng Anh
            alert(error.response?.data?.message || 'Failed to assign room!');
        }
    };

    // Extract unique floors from available rooms
    const floors = [...new Set(availableRooms.map(room => room.floor))].sort((a, b) => a - b);
    
    // Filter rooms based on selected floor
    const roomsOnSelectedFloor = selectedFloor 
        ? availableRooms.filter(room => room.floor === parseInt(selectedFloor))
        : []; 

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title className="residem-modal-title">Assign Room to: {resident?.full_name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">1. Choose Block</Form.Label>
                            <Form.Select 
                                className="residem-form-select"
                                value={selectedBlockId} 
                                onChange={(e) => setSelectedBlockId(e.target.value)}
                            >
                                <option value="">-- Choose Block --</option>
                                {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="residem-form-label">2. Choose Floor</Form.Label>
                            <Form.Select 
                                className="residem-form-select"
                                value={selectedFloor} 
                                disabled={!selectedBlockId} 
                                onChange={(e) => setSelectedFloor(e.target.value)}
                            >
                                <option value="">-- Choose Floor --</option>
                                {floors.map(floor => <option key={floor} value={floor}>Floor {floor}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
                
                <hr className="my-4" style={{borderColor: '#e0e0e0'}}/>
                
                <h6 className="mb-3 fw-bold text-dark">3. Choose Available Room</h6>
                <div>
                    {selectedBlockId && selectedFloor ? (
                        roomsOnSelectedFloor.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                                {roomsOnSelectedFloor.map(room => (
                                    <Button 
                                        key={room.id} 
                                        variant="outline-success" 
                                        className="btn-residem-secondary text-success border-success"
                                        onClick={() => handleAssign(room.id)}
                                    >
                                        Room {room.room_number}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted fst-italic">No available rooms on this floor.</p> 
                        )
                    ) : (
                        <p className="text-muted fst-italic">Please select a Block and Floor to see available rooms.</p> 
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default AssignRoomModal;
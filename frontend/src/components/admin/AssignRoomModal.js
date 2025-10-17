// frontend/src/components/admin/AssignRoomModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';

const AssignRoomModal = ({ show, handleClose, resident, onAssignSuccess }) => {
    const [blocks, setBlocks] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');

    // Lấy danh sách các block khi modal được mở
    useEffect(() => {
        if (show) {
            const fetchBlocks = async () => {
                const token = localStorage.getItem('token');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                const res = await axios.get('http://localhost:5000/api/admin/blocks', config);
                setBlocks(res.data);
            };
            fetchBlocks();
        }
    }, [show]);

    // Lấy danh sách phòng trống mỗi khi người dùng chọn một block mới
    useEffect(() => {
        if (selectedBlockId) {
            const fetchRooms = async () => {
                const token = localStorage.getItem('token');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                const res = await axios.get(`http://localhost:5000/api/admin/blocks/${selectedBlockId}/available-rooms`, config);
                setAvailableRooms(res.data);
                setSelectedFloor(''); // Reset tầng đã chọn
            };
            fetchRooms();
        }
    }, [selectedBlockId]);

    const handleAssign = async (roomId) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const payload = { residentId: resident.id, roomId: roomId };
            await axios.post('http://localhost:5000/api/admin/assign-room', payload, config);
            onAssignSuccess(); // Báo cho component cha biết đã thành công để tải lại dữ liệu
            handleClose();
        } catch (error) {
            alert('Gán phòng thất bại!');
        }
    };

    // Lấy ra danh sách các tầng duy nhất từ các phòng trống
    const floors = [...new Set(availableRooms.map(room => room.floor))].sort((a, b) => a - b);
    const roomsOnSelectedFloor = availableRooms.filter(room => room.floor === parseInt(selectedFloor));

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Gán Căn Hộ cho: {resident?.full_name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>1. Chọn Tòa Nhà (Block)</Form.Label>
                            <Form.Select onChange={(e) => setSelectedBlockId(e.target.value)}>
                                <option value="">-- Chọn Block --</option>
                                {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>2. Chọn Tầng</Form.Label>
                            <Form.Select disabled={!selectedBlockId} onChange={(e) => setSelectedFloor(e.target.value)}>
                                <option value="">-- Chọn Tầng --</option>
                                {floors.map(floor => <option key={floor} value={floor}>Tầng {floor}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
                <hr />
                <h6>3. Chọn Phòng Trống</h6>
                <div>
                    {selectedFloor ? (
                        roomsOnSelectedFloor.map(room => (
                            <Button key={room.id} variant="outline-success" className="me-2 mb-2" onClick={() => handleAssign(room.id)}>
                                Phòng {room.room_number}
                            </Button>
                        ))
                    ) : (
                        <p className="text-muted">Vui lòng chọn Tòa nhà và Tầng để xem phòng trống.</p>
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default AssignRoomModal;
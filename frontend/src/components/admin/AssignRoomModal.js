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
                const token = localStorage.getItem('adminToken');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                const res = await axios.get('http://localhost:5000/api/admin/blocks', config);
                setBlocks(res.data);
            };
            fetchBlocks();
            
            // Reset state khi modal được mở lại (để tránh lỗi từ lần mở trước)
            setSelectedBlockId('');
            setSelectedFloor('');
            setAvailableRooms([]);
        }
    }, [show]);

    // --- SỬA ĐỔI CHÍNH Ở ĐÂY ---
    // Lấy danh sách phòng trống HOẶC DỌN DẸP state
    useEffect(() => {
        if (selectedBlockId) {
            // Nếu người dùng chọn một block
            const fetchRooms = async () => {
                const token = localStorage.getItem('adminToken');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                const res = await axios.get(`http://localhost:5000/api/admin/blocks/${selectedBlockId}/available-rooms`, config);
                setAvailableRooms(res.data);
                setSelectedFloor(''); // Reset tầng đã chọn
            };
            fetchRooms();
        } else {
            // Nếu người dùng chọn "-- Choose Block --"
            setAvailableRooms([]); // Dọn dẹp danh sách phòng
            setSelectedFloor('');  // Dọn dẹp tầng đã chọn
        }
    }, [selectedBlockId]); // Chỉ chạy khi block thay đổi

    const handleAssign = async (roomId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const payload = { residentId: resident.id, roomId: roomId };
            await axios.post('http://localhost:5000/api/admin/assign-room', payload, config);
            onAssignSuccess(); 
            handleClose();
        } catch (error) {
            alert('Gán phòng thất bại!');
        }
    };

    // Lấy ra danh sách các tầng duy nhất từ các phòng trống
    const floors = [...new Set(availableRooms.map(room => room.floor))].sort((a, b) => a - b);
    
    // Lọc phòng (chỉ lọc khi selectedFloor có giá trị)
    const roomsOnSelectedFloor = selectedFloor 
        ? availableRooms.filter(room => room.floor === parseInt(selectedFloor))
        : []; // Nếu không có tầng, mảng rỗng

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Assign Room to: {resident?.full_name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>1. Choose Block</Form.Label>
                            {/* Dùng 'value' để control component */}
                            <Form.Select value={selectedBlockId} onChange={(e) => setSelectedBlockId(e.target.value)}>
                                <option value="">-- Choose Block --</option>
                                {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>2. Choose Floor</Form.Label>
                            {/* Dùng 'value' để control component */}
                            <Form.Select 
                                value={selectedFloor} 
                                disabled={!selectedBlockId} // Vô hiệu hóa khi không có block
                                onChange={(e) => setSelectedFloor(e.target.value)}
                            >
                                <option value="">-- Choose Floor --</option>
                                {floors.map(floor => <option key={floor} value={floor}>Floor {floor}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
                <hr />
                <h6>3. Choose Available Room</h6>
                <div>
                    {/* Sửa logic hiển thị: Phải chọn cả 2 */}
                    {selectedBlockId && selectedFloor ? (
                        roomsOnSelectedFloor.length > 0 ? (
                            roomsOnSelectedFloor.map(room => (
                                <Button key={room.id} variant="outline-success" className="me-2 mb-2" onClick={() => handleAssign(room.id)}>
                                    Room {room.room_number}
                                </Button>
                            ))
                        ) : (
                            <p className="text-muted">No available rooms on this floor.</p> // Nếu tầng được chọn không có phòng
                        )
                    ) : (
                        <p className="text-muted">Please select a Block and Floor to see available rooms.</p> // Hướng dẫn
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default AssignRoomModal;
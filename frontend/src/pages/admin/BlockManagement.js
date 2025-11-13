import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoomDetailsModal from '../../components/admin/RoomDetailsModal';
import './BlockManagement.css'; // Import CSS mới
// THÊM: Import các component Bootstrap
import { Card, Form, Spinner, Alert } from 'react-bootstrap';

const BlockManagement = () => {
    // --- TOÀN BỘ LOGIC GỐC CỦA BẠN (GIỮ NGUYÊN) ---
    const [blocks, setBlocks] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState('');
    const [selectedBlockName, setSelectedBlockName] = useState('');
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState('');
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('http://localhost:5000/api/admin/blocks', config);
                setBlocks(res.data);
            } catch (err) {
                setError('Không thể tải danh sách tòa nhà.');
            }
        };
        fetchBlocks();
    }, []);

    const handleBlockSelect = async (blockId, blockName) => {
        if (!blockId) {
            setSelectedBlockId('');
            setSelectedBlockName('');
            setRooms([]);
            return;
        }
        setSelectedBlockId(blockId);
        setSelectedBlockName(blockName);
        setLoadingRooms(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`http://localhost:5000/api/admin/blocks/${blockId}/rooms`, config);
            setRooms(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError('Không thể tải danh sách phòng.');
            setRooms([]);
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleShowDetailsModal = (room) => {
        setSelectedRoom(room);
        setShowDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedRoom(null);
    };

    const roomsByFloor = Array.isArray(rooms) ? rooms.reduce((acc, room) => {
        const floor = room.floor;
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(room);
        return acc;
    }, {}) : {};

    const sortedFloors = roomsByFloor && typeof roomsByFloor === 'object'
        ? Object.keys(roomsByFloor).sort((a, b) => parseInt(b) - parseInt(a))
        : [];

    // --- JSX ĐÃ ĐƯỢC CẬP NHẬT GIAO DIỆN ---
    return (
        // THAY ĐỔI: Sử dụng class mới và animation
        <div className="management-page-container fadeIn">
            <h2 className="page-main-title mb-4">Block Management</h2>
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Bọc Card trắng chuyên nghiệp */}
            <Card className="residem-card">
                <Card.Body>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="blockSelect" className="residem-form-label">Select Block:</Form.Label>
                        {/* Style lại Dropdown */}
                        <Form.Select
                            id="blockSelect"
                            className="residem-form-select" // Class mới
                            value={selectedBlockId}
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                const selectedBlock = blocks.find(b => b.id.toString() === selectedId); // So sánh chuỗi an toàn
                                handleBlockSelect(selectedId, selectedBlock ? selectedBlock.name : '');
                            }}
                        >
                            <option value="">-- Select Block --</option>
                            {blocks.map(block => (
                                <option key={block.id} value={block.id}>{block.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Card.Body>
            </Card>

            {loadingRooms && (
                <div className="text-center p-5">
                    <Spinner animation="border" />
                    <p className="mt-2">Loading room list...</p>
                </div>
            )}

            {!loadingRooms && selectedBlockId && (
                <div className="floor-container mt-4">
                    {sortedFloors.length > 0 ? sortedFloors.map(floor => (
                        // Style lại Card tầng
                        <Card key={floor} className="mb-3 residem-card floor-card">
                            <Card.Header className="residem-card-header floor-header">
                                <strong>Floor {floor}</strong>
                            </Card.Header>
                            {/* THAY ĐỔI: Thêm className 'room-grid' vào Card.Body */}
                            <Card.Body className="room-grid">
                                {roomsByFloor[floor].map(room => (
                                    // Style lại ô phòng
                                    <div
                                        key={room.id}
                                        className={`room-box ${room.resident_name ? 'occupied' : 'available'}`}
                                        title={room.resident_name ? `Occupied by: ${room.resident_name}` : 'Available'}
                                        onClick={() => handleShowDetailsModal(room)}
                                    >
                                        {room.room_number}
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    )) : (
                        <Alert variant="residem-info" className="no-news-alert">
                            No rooms found for this block.
                        </Alert>
                    )}
                </div>
            )}

            {selectedRoom && (
                <RoomDetailsModal
                    show={showDetailsModal}
                    handleClose={handleCloseDetailsModal}
                    roomData={selectedRoom}
                    blockName={selectedBlockName}
                />
            )}
        </div>
    );
};

export default BlockManagement;
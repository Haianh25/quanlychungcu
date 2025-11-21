import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import RoomDetailsModal from '../../components/admin/RoomDetailsModal';
import './BlockManagement.css'; 
import { Card, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';

const BlockManagement = () => {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState('');
    const [selectedBlockName, setSelectedBlockName] = useState('');
    const [rooms, setRooms] = useState([]);
    
    // [MỚI] State cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const floorsPerPage = 5; // Mỗi trang hiện 5 tầng
    
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
                setError('Failed to load block list.');
            }
        };
        fetchBlocks();
    }, []);

    const handleBlockSelect = async (blockId, blockName) => {
        if (!blockId) {
            setSelectedBlockId('');
            setSelectedBlockName('');
            setRooms([]);
            setCurrentPage(1);
            return;
        }
        setSelectedBlockId(blockId);
        setSelectedBlockName(blockName);
        setLoadingRooms(true);
        setError('');
        setCurrentPage(1); // Reset về trang 1 khi chọn Block mới
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`http://localhost:5000/api/admin/blocks/${blockId}/rooms`, config);
            setRooms(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError('Failed to load room list.');
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

    // Group rooms by floor
    const roomsByFloor = useMemo(() => {
        if (!Array.isArray(rooms)) return {};
        return rooms.reduce((acc, room) => {
            const floor = room.floor;
            if (!acc[floor]) acc[floor] = [];
            acc[floor].push(room);
            return acc;
        }, {});
    }, [rooms]);

    // Lấy danh sách tất cả các tầng và sắp xếp tăng dần
    const sortedFloors = useMemo(() => {
        return Object.keys(roomsByFloor)
            .map(f => parseInt(f))
            .sort((a, b) => a - b);
    }, [roomsByFloor]);

    // [MỚI] Logic Phân trang
    const indexOfLastFloor = currentPage * floorsPerPage;
    const indexOfFirstFloor = indexOfLastFloor - floorsPerPage;
    const currentFloors = sortedFloors.slice(indexOfFirstFloor, indexOfLastFloor);
    
    // Tạo danh sách số trang
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(sortedFloors.length / floorsPerPage); i++) {
        pageNumbers.push(i);
    }

    // Stats calculation
    const stats = useMemo(() => {
        if (!rooms.length) return null;
        const total = rooms.length;
        const occupied = rooms.filter(r => r.resident_name).length;
        const available = total - occupied;
        return { total, occupied, available };
    }, [rooms]);

    return (
        <div className="management-page-container fadeIn">
            <h2 className="page-main-title mb-4">Block Management</h2>
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Select Block Card */}
            <Card className="residem-card mb-4">
                <Card.Body>
                    <Form.Group>
                        <Form.Label htmlFor="blockSelect" className="residem-form-label">Select Block:</Form.Label>
                        <Form.Select
                            id="blockSelect"
                            className="residem-form-select"
                            value={selectedBlockId}
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                const selectedBlock = blocks.find(b => b.id.toString() === selectedId); 
                                handleBlockSelect(selectedId, selectedBlock ? selectedBlock.name : '');
                            }}
                        >
                            <option value="">-- Choose Block --</option>
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

            {/* Stats Bar */}
            {!loadingRooms && selectedBlockId && stats && (
                <div className="stats-bar fadeIn">
                    <div className="d-flex gap-4">
                        <span className="stat-item"><strong>Total Rooms:</strong> {stats.total}</span>
                        <span className="stat-item text-success"><strong>Available:</strong> {stats.available}</span>
                        <span className="stat-item text-secondary"><strong>Occupied:</strong> {stats.occupied}</span>
                    </div>
                    
                    <div className="d-flex align-items-center">
                        <span className="text-muted small me-2">Legend:</span>
                        <div className="legend-item">
                            <div className="legend-box available"></div>
                            <span>Available</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-box occupied"></div>
                            <span>Occupied</span>
                        </div>
                    </div>
                </div>
            )}

            {/* [MỚI] Room List (Hiển thị 5 tầng của trang hiện tại) */}
            {!loadingRooms && selectedBlockId && currentFloors.length > 0 && (
                <div className="floor-container fadeIn">
                    {currentFloors.map(floor => (
                        <Card key={floor} className="mb-3 residem-card floor-card">
                            <Card.Header className="residem-card-header floor-header d-flex justify-content-between align-items-center">
                                <strong>Floor {floor}</strong>
                                <span className="badge bg-light text-dark border">
                                    {roomsByFloor[floor]?.length || 0} Rooms
                                </span>
                            </Card.Header>
                            <Card.Body className="room-grid">
                                {roomsByFloor[floor] && roomsByFloor[floor].map(room => (
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
                    ))}
                </div>
            )}

            {/* [MỚI] Pagination Bar (Số Trang) */}
            {!loadingRooms && selectedBlockId && pageNumbers.length > 1 && (
                <div className="floor-pagination-container fadeIn">
                    <div className="floor-pagination-label">Select Page</div>
                    <div className="floor-pagination-list">
                        {pageNumbers.map(number => (
                            <button
                                key={number}
                                className={`floor-btn ${currentPage === number ? 'active' : ''}`}
                                onClick={() => {
                                    setCurrentPage(number);
                                    // Cuộn nhẹ lên đầu danh sách tầng để dễ nhìn
                                    const listElement = document.querySelector('.floor-container');
                                    if(listElement) listElement.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                {number}
                            </button>
                        ))}
                    </div>
                    <div className="text-muted small mt-2">
                        Showing floors {currentFloors[0]} - {currentFloors[currentFloors.length - 1]}
                    </div>
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
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import RoomDetailsModal from '../../components/admin/RoomDetailsModal';
import './BlockManagement.css'; 
import { Card, Form, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { Building, Layers, HouseDoorFill, PersonCheckFill, LayoutThreeColumns } from 'react-bootstrap-icons'; // Import icons

const BlockManagement = () => {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState('');
    const [selectedBlockName, setSelectedBlockName] = useState('');
    const [rooms, setRooms] = useState([]);
    
    // State cho phân trang
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
        setCurrentPage(1); 
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

    // Sort floors
    const sortedFloors = useMemo(() => {
        return Object.keys(roomsByFloor)
            .map(f => parseInt(f))
            .sort((a, b) => a - b);
    }, [roomsByFloor]);

    // Logic Phân trang
    const indexOfLastFloor = currentPage * floorsPerPage;
    const indexOfFirstFloor = indexOfLastFloor - floorsPerPage;
    const currentFloors = sortedFloors.slice(indexOfFirstFloor, indexOfLastFloor);
    
    const totalPages = Math.ceil(sortedFloors.length / floorsPerPage);
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
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
            <h2 className="page-main-title">Block & Room Management</h2>
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Select Block Card */}
            <Card className="residem-card mb-4 border-0">
                <Card.Body className="d-flex align-items-center gap-3 p-4">
                    <div className="flex-shrink-0 text-muted">
                        <Building size={32} style={{color: '#b99a7b'}}/>
                    </div>
                    <div className="flex-grow-1">
                        <Form.Group>
                            <Form.Label htmlFor="blockSelect" className="residem-form-label">Select Building Block</Form.Label>
                            <Form.Select
                                id="blockSelect"
                                className="residem-form-select form-select-lg"
                                value={selectedBlockId}
                                onChange={(e) => {
                                    const selectedId = e.target.value;
                                    const selectedBlock = blocks.find(b => b.id.toString() === selectedId); 
                                    handleBlockSelect(selectedId, selectedBlock ? selectedBlock.name : '');
                                }}
                            >
                                <option value="">-- Choose Block to View --</option>
                                {blocks.map(block => (
                                    <option key={block.id} value={block.id}>Block {block.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </div>
                </Card.Body>
            </Card>

            {loadingRooms && (
                <div className="text-center p-5">
                    <Spinner animation="border" variant="secondary" />
                    <p className="mt-2 text-muted">Loading floor plans...</p>
                </div>
            )}

            {/* Stats Bar (Giao diện mới) */}
            {!loadingRooms && selectedBlockId && stats && (
                <div className="stats-container fadeIn">
                    <div className="stat-card-mini">
                        <div className="stat-icon-box bg-gold-soft"><LayoutThreeColumns /></div>
                        <div className="stat-info">
                            <h6>Total Rooms</h6>
                            <h4>{stats.total}</h4>
                        </div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-icon-box bg-green-soft"><HouseDoorFill /></div>
                        <div className="stat-info">
                            <h6>Available</h6>
                            <h4 className="text-success">{stats.available}</h4>
                        </div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-icon-box bg-gray-soft"><PersonCheckFill /></div>
                        <div className="stat-info">
                            <h6>Occupied</h6>
                            <h4 className="text-secondary">{stats.occupied}</h4>
                        </div>
                    </div>
                </div>
            )}

            {/* Room List */}
            {!loadingRooms && selectedBlockId && currentFloors.length > 0 && (
                <div className="floor-container fadeIn">
                    {currentFloors.map(floor => (
                        <Card key={floor} className="residem-card floor-card">
                            <Card.Header className="residem-card-header">
                                <div className="d-flex align-items-center gap-2">
                                    <Layers className="text-muted"/> 
                                    <span>Floor {floor}</span>
                                </div>
                                <Badge bg="light" text="dark" className="border fw-normal">
                                    {roomsByFloor[floor]?.length || 0} Rooms
                                </Badge>
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
                                        <small>{room.resident_name ? 'Occupied' : 'Empty'}</small>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination Bar */}
            {!loadingRooms && selectedBlockId && pageNumbers.length > 1 && (
                <div className="floor-pagination-container fadeIn">
                    <div className="floor-pagination-label">Select Page (View 5 Floors)</div>
                    <div className="floor-pagination-list">
                        {pageNumbers.map(number => (
                            <button
                                key={number}
                                className={`floor-btn ${currentPage === number ? 'active' : ''}`}
                                onClick={() => {
                                    setCurrentPage(number);
                                    const listElement = document.querySelector('.floor-container');
                                    if(listElement) listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                            >
                                {number}
                            </button>
                        ))}
                    </div>
                    <div className="text-muted small mt-3">
                        Displaying floors {currentFloors[0]} - {currentFloors[currentFloors.length - 1]}
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
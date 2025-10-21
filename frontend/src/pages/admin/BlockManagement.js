// frontend/src/pages/admin/BlockManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoomDetailsModal from '../../components/admin/RoomDetailsModal';
import './BlockManagement.css';

const BlockManagement = () => {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState('');
    const [selectedBlockName, setSelectedBlockName] = useState('');
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState('');
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

    // Fetch blocks
    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('http://localhost:5000/api/admin/blocks', config);
                setBlocks(res.data);
            } catch (err) {
                setError('Không thể tải danh sách tòa nhà.');
            }
        };
        fetchBlocks();
    }, []);

    // Fetch rooms when block selected
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
            const token = localStorage.getItem('token');
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

    // --- Logic modal chi tiết phòng ---
    const handleShowDetailsModal = (room) => {
        setSelectedRoom(room);
        setShowDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedRoom(null);
    };
    // --- Kết thúc logic ---

    // Nhóm phòng theo tầng
    const roomsByFloor = Array.isArray(rooms) ? rooms.reduce((acc, room) => {
        const floor = room.floor;
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(room);
        return acc;
    }, {}) : {};

    // Sắp xếp tầng
    const sortedFloors = roomsByFloor && typeof roomsByFloor === 'object'
        ? Object.keys(roomsByFloor).sort((a, b) => parseInt(b) - parseInt(a))
        : [];

    return (
        <>
            <div className="admin-page-content">
                <h2>Quản Lý Tòa Nhà</h2>
                {error && <p className="alert alert-danger">{error}</p>}

                <div className="mb-3">
                    <label htmlFor="blockSelect" className="form-label">Chọn Tòa Nhà:</label>
                    <select
                        id="blockSelect"
                        className="form-select"
                        value={selectedBlockId}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            const selectedBlock = blocks.find(b => b.id === selectedId);
                            handleBlockSelect(selectedId, selectedBlock ? selectedBlock.name : '');
                        }}
                    >
                        <option value="">-- Chọn Block --</option>
                        {blocks.map(block => (
                            <option key={block.id} value={block.id}>{block.name}</option>
                        ))}
                    </select>
                </div>

                {loadingRooms && <p>Đang tải danh sách phòng...</p>}

                {!loadingRooms && selectedBlockId && (
                    <div className="floor-container">
                        {sortedFloors.length > 0 ? sortedFloors.map(floor => (
                            <div key={floor} className="floor-row card mb-3">
                                <div className="card-header">
                                    <strong>Tầng {floor}</strong>
                                </div>
                                <div className="card-body room-grid">
                                    {roomsByFloor[floor].map(room => (
                                        <div
                                            key={room.id}
                                            className={`room-box ${room.resident_name ? 'occupied' : 'available'}`}
                                            title={room.resident_name ? `Đang ở: ${room.resident_name}` : 'Còn trống'}
                                            // Đảm bảo dòng onClick này tồn tại và đúng
                                            onClick={() => handleShowDetailsModal(room)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {room.room_number}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : <p>Không tìm thấy phòng nào cho tòa nhà này.</p>}
                    </div>
                )}
            </div>

            {selectedRoom && (
                <RoomDetailsModal
                    show={showDetailsModal}
                    handleClose={handleCloseDetailsModal}
                    roomData={selectedRoom}
                    blockName={selectedBlockName}
                />
            )}
        </>
    );
};

export default BlockManagement;
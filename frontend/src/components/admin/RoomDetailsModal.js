// frontend/src/components/admin/RoomDetailsModal.js
import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const RoomDetailsModal = ({ show, handleClose, roomData, blockName }) => {
    if (!roomData) return null; // Tránh lỗi nếu chưa có dữ liệu

    const statusText = roomData.resident_name ? 'Đã sở hữu' : 'Chưa sở hữu';
    const ownerText = roomData.resident_name || 'Trống';
    const roomFullName = `${blockName} - ${roomData.room_number}`;

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Thông Tin Phòng: {roomFullName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p><strong>Mã căn hộ:</strong> {roomFullName}</p>
                <p><strong>Trạng thái:</strong>
                    <span className={`ms-2 badge ${roomData.resident_name ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {statusText}
                    </span>
                </p>
                <p><strong>Người sở hữu:</strong> {ownerText}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Đóng
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RoomDetailsModal;
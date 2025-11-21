// frontend/src/components/admin/RoomDetailsModal.js
import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const RoomDetailsModal = ({ show, handleClose, roomData, blockName }) => {
    if (!roomData) return null; // Tránh lỗi nếu chưa có dữ liệu

    const statusText = roomData.resident_name ? 'Owned' : 'Not Owned';
    const ownerText = roomData.resident_name || 'Empty';
    const roomFullName = `${blockName} - ${roomData.room_number}`;

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Room Information: {roomFullName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p><strong>Room ID:</strong> {roomFullName}</p>
                <p><strong>Status:</strong>
                    <span className={`ms-2 badge ${roomData.resident_name ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {statusText}
                    </span>
                </p>
                <p><strong>Owner:</strong> {ownerText}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RoomDetailsModal;
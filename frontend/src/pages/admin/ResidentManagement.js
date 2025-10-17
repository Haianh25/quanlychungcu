// frontend/src/pages/admin/ResidentManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssignRoomModal from '../../components/admin/AssignRoomModal';

const ResidentManagement = () => {
    const [residents, setResidents] = useState([]);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedResident, setSelectedResident] = useState(null);

    const fetchResidents = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/admin/residents', config);
            setResidents(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải danh sách cư dân.');
        }
    };

    useEffect(() => {
        fetchResidents();
    }, []);

    const handleShowModal = (resident) => {
        setSelectedResident(resident);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedResident(null);
    };

    const handleAssignSuccess = () => {
        fetchResidents(); // Tải lại danh sách sau khi gán thành công
    };

    return (
        <div>
            <h2>Quản Lý Cư Dân</h2>
            {error && <p className="alert alert-danger">{error}</p>}
            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Họ Tên</th>
                        <th>Email</th>
                        <th>Căn Hộ Hiện Tại</th>
                        <th>Hành Động</th>
                    </tr>
                </thead>
                <tbody>
                    {residents.map(resident => (
                        <tr key={resident.id}>
                            <td>{resident.full_name}</td>
                            <td>{resident.email}</td>
                            <td>{resident.apartment_number || 'Chưa được gán'}</td>
                            <td>
                                <button className="btn btn-primary btn-sm" onClick={() => handleShowModal(resident)}>
                                    Gán Căn Hộ
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedResident && (
                <AssignRoomModal
                    show={showModal}
                    handleClose={handleCloseModal}
                    resident={selectedResident}
                    onAssignSuccess={handleAssignSuccess}
                />
            )}
        </div>
    );
};

export default ResidentManagement;
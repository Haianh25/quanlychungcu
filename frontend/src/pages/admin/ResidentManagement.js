// frontend/src/pages/admin/ResidentManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssignRoomModal from '../../components/admin/AssignRoomModal';
import Pagination from '../../components/admin/Pagination';
import './ResidentManagement.css';

const ResidentManagement = () => {
    const [residents, setResidents] = useState([]);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedResident, setSelectedResident] = useState(null);

    // State cho tìm kiếm và phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [residentsPerPage] = useState(10);

    const fetchResidents = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
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
        fetchResidents();
    };

    // Lọc danh sách cư dân
    const filteredResidents = residents.filter(resident =>
        resident.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Logic phân trang
    const indexOfLastResident = currentPage * residentsPerPage;
    const indexOfFirstResident = indexOfLastResident - residentsPerPage;
    const currentResidents = filteredResidents.slice(indexOfFirstResident, indexOfLastResident);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        // Sử dụng thẻ Fragment <> và các div với className tương ứng
        <>
            <div className="admin-page-content">
                <h2>Resident Management</h2>
                {error && <p className="alert alert-danger">{error}</p>}

                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm kiếm theo họ tên cư dân..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>

                <table className="table table-striped table-hover">
                    <colgroup>
                        <col style={{ width: '33%' }} />
                        <col style={{ width: '33%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '14%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Current Apartment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentResidents.map(resident => (
                            <tr key={resident.id}>
                                <td title={resident.full_name}>{resident.full_name}</td>
                                <td title={resident.email}>{resident.email}</td>
                                <td>{resident.apartment_number || 'Chưa được gán'}</td>
                                <td className="col-actions">
                                    <button className="btn btn-primary btn-sm action-btn" onClick={() => handleShowModal(resident)}>
                                        Assign Apartment
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* Placeholder rows to keep table height/columns stable between pages */}
                        {currentResidents.length < residentsPerPage && Array.from({ length: residentsPerPage - currentResidents.length }).map((_, idx) => (
                            <tr key={`placeholder-${idx}`} className="placeholder-row">
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td className="col-actions">&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination-container">
                <Pagination
                    itemsPerPage={residentsPerPage}
                    totalItems={filteredResidents.length}
                    paginate={paginate}
                    currentPage={currentPage}
                />
            </div>

            {selectedResident && (
                <AssignRoomModal
                    show={showModal}
                    handleClose={handleCloseModal}
                    resident={selectedResident}
                    onAssignSuccess={handleAssignSuccess}
                />
            )}
        </>
    );
};

export default ResidentManagement;
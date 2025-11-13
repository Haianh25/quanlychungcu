import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssignRoomModal from '../../components/admin/AssignRoomModal';
import Pagination from '../../components/admin/Pagination';
import './ResidentManagement.css'; // Import CSS mới
// THÊM: Import các component Bootstrap
import { Card, Form, Table, Alert } from 'react-bootstrap';

const ResidentManagement = () => {
    // --- TOÀN BỘ LOGIC GỐC CỦA BẠN (GIỮ NGUYÊN) ---
    const [residents, setResidents] = useState([]);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedResident, setSelectedResident] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [residentsPerPage] = useState(10);

    const fetchResidents = async () => {
        try {
            const token = localStorage.getItem('adminToken');
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

    const filteredResidents = residents.filter(resident =>
        resident.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastResident = currentPage * residentsPerPage;
    const indexOfFirstResident = indexOfLastResident - residentsPerPage;
    const currentResidents = filteredResidents.slice(indexOfFirstResident, indexOfLastResident);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // --- JSX ĐÃ ĐƯỢC CẬP NHẬT GIAO DIỆN ---
    return (
        // Sử dụng class mới và animation
        <div className="management-page-container fadeIn">
            <h2 className="page-main-title mb-4">Resident Management</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            {/* Bọc Card trắng chuyên nghiệp */}
            <Card className="residem-card">
                <Card.Body>
                    {/* Thanh tìm kiếm */}
                    <div className="mb-3">
                        <Form.Control
                            type="text"
                            className="residem-search-bar" // Style lại search bar
                            placeholder="Tìm kiếm theo họ tên cư dân..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    
                    {/* Bọc bảng */}
                    <div className="table-wrapper">
                        {/* Dùng Table của React-Bootstrap */}
                        <Table hover striped className="residem-table">
                            {/* Cố định độ rộng cột */}
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
                                        <td>
                                            {/* Style lại trạng thái "Chưa gán" */}
                                            {resident.apartment_number ? (
                                                resident.apartment_number
                                            ) : (
                                                <span className="status-badge status-secondary">Not Assigned</span>
                                            )}
                                        </td>
                                        <td className="col-actions">
                                            {/* Style lại nút */}
                                            <button 
                                                className="btn btn-residem-primary btn-sm" 
                                                onClick={() => handleShowModal(resident)}
                                            >
                                                Assign
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {/* Hàng giữ chỗ (Giữ nguyên logic) */}
                                {currentResidents.length < residentsPerPage && Array.from({ length: residentsPerPage - currentResidents.length }).map((_, idx) => (
                                    <tr key={`placeholder-${idx}`} className="placeholder-row">
                                        <td>&nbsp;</td>
                                        <td>&nbsp;</td>
                                        <td>&nbsp;</td>
                                        <td className="col-actions">&nbsp;</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Phân trang (Style lại) */}
            {filteredResidents.length > residentsPerPage && (
                <div className="residem-pagination mt-4 d-flex justify-content-center">
                    <Pagination
                        itemsPerPage={residentsPerPage}
                        totalItems={filteredResidents.length}
                        paginate={paginate}
                        currentPage={currentPage}
                    />
                </div>
            )}
            
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
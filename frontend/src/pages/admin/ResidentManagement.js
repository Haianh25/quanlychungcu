import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AssignRoomModal from '../../components/admin/AssignRoomModal';
import Pagination from '../../components/admin/Pagination';
import { Card, Form, Table, Alert, InputGroup } from 'react-bootstrap';
import { Search, HouseAdd, HouseCheck, ExclamationCircle, ArrowUp, ArrowDown } from 'react-bootstrap-icons';
import './ResidentManagement.css';

const ResidentManagement = () => {
    const [residents, setResidents] = useState([]);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedResident, setSelectedResident] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [residentsPerPage] = useState(10);

    // [MỚI] State cho sắp xếp
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const fetchResidents = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/admin/residents', config);
            setResidents(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load resident list.');
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

    // 1. Lọc theo tìm kiếm
    const filteredResidents = residents.filter(resident =>
        resident.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resident.email && resident.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // [MỚI] 2. Xử lý Sắp xếp (Sort)
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedResidents = useMemo(() => {
        let sortableItems = [...filteredResidents];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Xử lý riêng cho cột 'apartment_number' (để gom nhóm Assigned/Not Assigned)
                if (sortConfig.key === 'apartment_number') {
                    // Nếu không có phòng (null/empty), gán giá trị đặc biệt để sort
                    aValue = aValue || ''; 
                    bValue = bValue || '';
                }

                // Chuyển về chữ thường nếu là chuỗi để so sánh chính xác
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredResidents, sortConfig]);

    // 3. Phân trang (Dựa trên danh sách đã sort)
    const indexOfLastResident = currentPage * residentsPerPage;
    const indexOfFirstResident = indexOfLastResident - residentsPerPage;
    const currentResidents = sortedResidents.slice(indexOfFirstResident, indexOfLastResident);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Helper hiển thị icon sort
    const getSortIcon = (columnName) => {
        if (sortConfig.key !== columnName) return <span className="sort-icon-placeholder">↕</span>; // Icon mờ khi chưa sort
        return sortConfig.direction === 'ascending' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>;
    };

    return (
        <div className="management-page-container fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="page-main-title mb-0">Resident Management</h2>
                <div className="text-muted small">Total: <strong>{residents.length}</strong></div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            
            <Card className="residem-card">
                <Card.Body>
                    <div className="mb-4" style={{maxWidth: '400px'}}>
                        <InputGroup>
                            <InputGroup.Text className="bg-light border-end-0">
                                <Search className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                className="residem-search-bar border-start-0 ps-0 bg-light"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </InputGroup>
                    </div>
                    
                    <div className="table-wrapper">
                        <Table hover striped className="residem-table align-middle">
                            <colgroup>
                                <col style={{ width: '30%' }} />
                                <col style={{ width: '30%' }} />
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '15%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    {/* [MỚI] Thêm onClick để sort */}
                                    <th className="sortable-header" onClick={() => requestSort('full_name')}>
                                        Full Name <span className="ms-1">{getSortIcon('full_name')}</span>
                                    </th>
                                    <th className="sortable-header" onClick={() => requestSort('email')}>
                                        Email <span className="ms-1">{getSortIcon('email')}</span>
                                    </th>
                                    <th className="sortable-header" onClick={() => requestSort('apartment_number')}>
                                        Current Apartment <span className="ms-1">{getSortIcon('apartment_number')}</span>
                                    </th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentResidents.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-5 text-muted">No residents found matching your search.</td></tr>
                                ) : (
                                    currentResidents.map(resident => (
                                        <tr key={resident.id}>
                                            <td>
                                                <div className="fw-bold text-dark">{resident.full_name}</div>
                                            </td>
                                            <td className="text-muted">{resident.email}</td>
                                            <td>
                                                {resident.apartment_number ? (
                                                    <span className="status-badge status-assigned">
                                                        <HouseCheck size={16}/> {resident.apartment_number}
                                                    </span>
                                                ) : (
                                                    <span className="status-badge status-unassigned">
                                                        <ExclamationCircle size={14}/> Not Assigned
                                                    </span>
                                                )}
                                            </td>
                                            <td className="col-actions">
                                                <button 
                                                    className="btn btn-residem-primary btn-sm d-inline-flex align-items-center gap-2" 
                                                    onClick={() => handleShowModal(resident)}
                                                >
                                                    <HouseAdd /> Assign Room
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {currentResidents.length > 0 && currentResidents.length < residentsPerPage && Array.from({ length: residentsPerPage - currentResidents.length }).map((_, idx) => (
                                    <tr key={`placeholder-${idx}`} className="placeholder-row">
                                        <td colSpan="4" style={{height: '65px'}}></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

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
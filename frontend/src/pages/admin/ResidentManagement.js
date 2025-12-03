import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AssignRoomModal from '../../components/admin/AssignRoomModal';
import Pagination from '../../components/admin/Pagination';
import { Card, Form, Table, Alert, InputGroup, Button, Spinner } from 'react-bootstrap';
import { Search, HouseAdd, HouseCheck, ExclamationCircle, ArrowUp, ArrowDown, PersonDash } from 'react-bootstrap-icons';
import './ResidentManagement.css';

const ResidentManagement = () => {
    const [residents, setResidents] = useState([]);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedResident, setSelectedResident] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [residentsPerPage] = useState(10);

    // State cho sắp xếp
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    // State loading cho hành động Unassign
    const [unassignLoading, setUnassignLoading] = useState(null);

    // [MỚI] Hàm xóa dấu tiếng Việt để tìm kiếm thông minh
    const removeVietnameseTones = (str) => {
        if (!str) return '';
        str = str.toLowerCase();
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
        str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ă, Ơ
        return str;
    };

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

    // Hàm xử lý Unassign (Trả phòng)
    const handleUnassignRoom = async (resident) => {
        if (!window.confirm(`Are you sure you want to remove resident "${resident.full_name}" from room ${resident.apartment_number}?`)) {
            return;
        }

        setUnassignLoading(resident.id);
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            await axios.post('http://localhost:5000/api/admin/unassign-room', {
                residentId: resident.id
            }, config);

            // Refresh danh sách sau khi thành công
            await fetchResidents();
            alert('Resident unassigned successfully.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unassign room.');
        } finally {
            setUnassignLoading(null);
        }
    };

    // [UPDATED] 1. Lọc theo tìm kiếm (Hỗ trợ tiếng Việt không dấu)
    const filteredResidents = useMemo(() => {
        if (!searchTerm) return residents;
        const normalizedSearch = removeVietnameseTones(searchTerm);

        return residents.filter(resident => {
            const normalizedName = removeVietnameseTones(resident.full_name);
            const normalizedEmail = removeVietnameseTones(resident.email);
            
            return normalizedName.includes(normalizedSearch) || 
                   (normalizedEmail && normalizedEmail.includes(normalizedSearch));
        });
    }, [residents, searchTerm]);

    // 2. Xử lý Sắp xếp (Sort)
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

                // Xử lý riêng cho cột 'apartment_number'
                if (sortConfig.key === 'apartment_number') {
                    aValue = aValue || ''; 
                    bValue = bValue || '';
                }

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

    // 3. Phân trang
    const indexOfLastResident = currentPage * residentsPerPage;
    const indexOfFirstResident = indexOfLastResident - residentsPerPage;
    const currentResidents = sortedResidents.slice(indexOfFirstResident, indexOfLastResident);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Helper hiển thị icon sort
    const getSortIcon = (columnName) => {
        if (sortConfig.key !== columnName) return <span className="sort-icon-placeholder">↕</span>;
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
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '30%' }} />
                            </colgroup>
                            <thead>
                                <tr>
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
                                                {/* Hiển thị nút Gán Phòng nếu chưa có phòng */}
                                                {!resident.apartment_number && (
                                                    <button 
                                                        className="btn btn-residem-primary btn-sm d-inline-flex align-items-center gap-2" 
                                                        onClick={() => handleShowModal(resident)}
                                                    >
                                                        <HouseAdd /> Assign Room
                                                    </button>
                                                )}

                                                {/* Hiển thị nút Trả Phòng nếu ĐÃ có phòng */}
                                                {resident.apartment_number && (
                                                    <Button 
                                                        variant="outline-danger" 
                                                        size="sm" 
                                                        className="d-inline-flex align-items-center gap-2 ms-2"
                                                        onClick={() => handleUnassignRoom(resident)}
                                                        disabled={unassignLoading === resident.id}
                                                    >
                                                        {unassignLoading === resident.id ? (
                                                            <Spinner size="sm" animation="border" />
                                                        ) : (
                                                            <><PersonDash /> Unassign Room</>
                                                        )}
                                                    </Button>
                                                )}
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
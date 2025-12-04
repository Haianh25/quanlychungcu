import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // [MỚI] Import useNavigate
import EditUserModal from '../../components/admin/EditUserModal';
import Pagination from '../../components/admin/Pagination';
import { Card, Form, Table, Alert, InputGroup, Badge } from 'react-bootstrap';
import { Search, PencilSquare, ShieldLock, ShieldCheck, CheckCircleFill, XCircle, ArrowUp, ArrowDown, HouseExclamation } from 'react-bootstrap-icons';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);

    // State cho sắp xếp
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const navigate = useNavigate(); // [MỚI] Hook điều hướng

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // [QUERY] Lấy thêm thông tin apartment_number từ bảng users (nếu có API hỗ trợ)
            // Giả sử API /api/admin/users đã trả về trường này.
            const res = await axios.get('http://localhost:5000/api/admin/users', config);
            setUsers(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load user list.');
        }
    };
    
    const handleToggleStatus = async (user) => {
        const action = user.is_active ? 'DISABLE' : 'ENABLE';
        if (!window.confirm(`Are you sure you want to ${action} this user account?`)) return;

        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            await axios.patch(`http://localhost:5000/api/admin/users/${user.id}/status`, { 
                isActive: !user.is_active 
            }, config);

            setUsers(users.map(u => 
                u.id === user.id ? { ...u, is_active: !u.is_active } : u
            ));
            setSuccess(`User account has been ${action === 'ENABLE' ? 'enabled' : 'disabled'}.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user status.');
        }
    };
    
    const handleShowModal = (user) => { setSelectedUser(user); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setSelectedUser(null); };
    
    const handleUserUpdate = (updatedUser) => { 
        // Cập nhật danh sách
        setUsers(users.map(user => (user.id === updatedUser.id ? updatedUser : user)));

        // [MỚI - SMART WORKFLOW]
        // Nếu user vừa được nâng cấp lên Resident (từ User -> Resident)
        // -> Chuyển hướng sang trang Resident Management để gán phòng ngay
        if (selectedUser && selectedUser.role === 'user' && updatedUser.role === 'resident') {
            if (window.confirm(`User ${updatedUser.full_name} is now a Resident.\n\nDo you want to go to "Resident Management" to assign a room for them now?`)) {
                navigate('/admin/resident-management', { state: { searchName: updatedUser.full_name } });
            }
        }
    };
    
    // 1. Filter
    const filteredUsers = users.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 2. Sort Logic
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = useMemo(() => {
        let sortableItems = [...filteredUsers];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                aValue = aValue ? aValue.toString().toLowerCase() : '';
                bValue = bValue ? bValue.toString().toLowerCase() : '';

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
    }, [filteredUsers, sortConfig]);

    // 3. Pagination
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Helper icon sort
    const getSortIcon = (columnName) => {
        if (sortConfig.key !== columnName) return <span style={{opacity: 0.3, fontSize: '0.7em', marginLeft: '5px'}}>⇅</span>;
        return sortConfig.direction === 'ascending' ? <ArrowUp size={12} className="ms-1"/> : <ArrowDown size={12} className="ms-1"/>;
    };

    return (
        <div className="management-page-container fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="page-main-title mb-0">User Management</h2>
                <div className="text-muted small">Total Users: <strong>{users.length}</strong></div>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
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
                                placeholder="Search by name, email, phone..."
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
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '15%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th onClick={() => requestSort('full_name')}>Full Name {getSortIcon('full_name')}</th>
                                    <th onClick={() => requestSort('email')}>Email {getSortIcon('email')}</th>
                                    <th>Phone</th>
                                    <th onClick={() => requestSort('role')}>Role {getSortIcon('role')}</th>
                                    <th onClick={() => requestSort('is_active')}>Status {getSortIcon('is_active')}</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-5 text-muted">No users found.</td></tr>
                                ) : (
                                    currentUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="fw-bold text-dark">{user.full_name}</td>
                                            <td className="text-muted small">{user.email}</td>
                                            <td className="text-dark">{user.phone || <span className="text-muted small italic">N/A</span>}</td>
                                            <td>
                                                <span className={`role-badge ${user.role === 'resident' ? 'role-resident' : 'role-user'}`}>
                                                    {user.role}
                                                </span>
                                                {/* [TIP] Nếu là Resident mà chưa có phòng, hiện cảnh báo */}
                                                {user.role === 'resident' && !user.apartment_number && (
                                                    <div className="text-danger small mt-1" style={{fontSize: '0.7rem'}}>
                                                        <HouseExclamation className="me-1"/> No Room
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className={user.is_active ? 'status-active' : 'status-disabled'}>
                                                    {user.is_active ? 'Active' : 'Disabled'}
                                                </div>
                                                <div className={user.is_verified ? 'status-verified' : 'status-unverified'}>
                                                    {user.is_verified ? <><CheckCircleFill size={10}/> Verified</> : <><XCircle size={10}/> Unverified</>}
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <button 
                                                    className="btn btn-residem-warning btn-sm me-2" 
                                                    onClick={() => handleShowModal(user)}
                                                    title="Edit User"
                                                >
                                                    <PencilSquare />
                                                </button>
                                                
                                                <button 
                                                    className={`btn-toggle-status ${user.is_active ? 'disable' : 'enable'}`} 
                                                    onClick={() => handleToggleStatus(user)}
                                                    title={user.is_active ? "Lock Account" : "Unlock Account"}
                                                >
                                                    {user.is_active ? <ShieldLock /> : <ShieldCheck />}
                                                    <span className="ms-1">{user.is_active ? 'Lock' : 'Unlock'}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {sortedUsers.length > usersPerPage && (
                <div className="residem-pagination mt-4 d-flex justify-content-center">
                    <Pagination
                        itemsPerPage={usersPerPage}
                        totalItems={sortedUsers.length}
                        paginate={paginate}
                        currentPage={currentPage}
                    />
                </div>
            )}
            
            {selectedUser && (
                <EditUserModal 
                    show={showModal}
                    handleClose={handleCloseModal}
                    user={selectedUser}
                    onUserUpdate={handleUserUpdate}
                />
            )}
        </div>
    );
};

export default UserManagement;
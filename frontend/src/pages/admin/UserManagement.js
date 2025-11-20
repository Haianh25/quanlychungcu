import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditUserModal from '../../components/admin/EditUserModal';
import Pagination from '../../components/admin/Pagination';
import './UserManagement.css';
import { Card, Form, Table, Alert } from 'react-bootstrap';

const UserManagement = () => {
    // --- TOÀN BỘ LOGIC GỐC CỦA BẠN (GIỮ NGUYÊN) ---
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);
    
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('http://localhost:5000/api/admin/users', config);
                setUsers(res.data);
            } catch (err) {
                // Dịch lỗi
                setError(err.response?.data?.message || 'Failed to load user list.');
            }
        };
        fetchUsers();
    }, []);
    
    const handleDelete = async (userId) => {
        // Có thể thêm confirm ở đây nếu muốn: 
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, config);
            setUsers(users.filter(user => user.id !== userId));
        } catch (err) {
            // Dịch lỗi
            setError(err.response?.data?.message || 'Failed to delete user.');
        }
    };
    
    const handleShowModal = (user) => { setSelectedUser(user); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setSelectedUser(null); };
    const handleUserUpdate = (updatedUser) => { setUsers(users.map(user => (user.id === updatedUser.id ? updatedUser : user))); };
    const filteredUsers = users.filter(user => user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // --- JSX ĐÃ ĐƯỢC CHUYỂN NGỮ ---
    return (
        <div className="management-page-container fadeIn">
            <h2 className="page-main-title mb-4">User Management</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            {/* Bọc Card trắng chuyên nghiệp */}
            <Card className="residem-card">
                <Card.Body>
                    {/* Thanh tìm kiếm */}
                    <div className="mb-3">
                        <Form.Control
                            type="text"
                            className="residem-search-bar" 
                            placeholder="Search by full name..." // Dịch placeholder
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    
                    {/* Bọc bảng */}
                    <div className="table-wrapper">
                        <Table hover striped className="residem-table">
                            <colgroup>
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '30%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '15%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map(user => (
                                    <tr key={user.id}>
                                        <td title={user.full_name}>{user.full_name}</td>
                                        <td title={user.email}>{user.email}</td>
                                        <td>
                                            <span className={`status-badge ${user.role === 'resident' ? 'status-success' : 'status-secondary'}`}>
                                                {/* Viết hoa chữ cái đầu cho Role */}
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={user.is_verified ? 'status-text-success' : 'status-text-danger'}>
                                                {user.is_verified ? 'Verified' : 'Not Verified'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-residem-warning btn-sm me-2" 
                                                onClick={() => handleShowModal(user)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="btn btn-residem-danger btn-sm" 
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {/* Hàng giữ chỗ */}
                                {currentUsers.length < usersPerPage && Array.from({ length: usersPerPage - currentUsers.length }).map((_, idx) => (
                                    <tr key={`placeholder-${idx}`} className="placeholder-row">
                                        <td>&nbsp;</td>
                                        <td>&nbsp;</td>
                                        <td>&nbsp;</td>
                                        <td>&nbsp;</td>
                                        <td>&nbsp;</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Phân trang */}
            {filteredUsers.length > usersPerPage && (
                <div className="residem-pagination mt-4 d-flex justify-content-center">
                    <Pagination
                        itemsPerPage={usersPerPage}
                        totalItems={filteredUsers.length}
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
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditUserModal from '../../components/admin/EditUserModal';
import Pagination from '../../components/admin/Pagination';
import './UserManagement.css';
import { Card, Form, Table, Alert } from 'react-bootstrap';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);
    
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/admin/users', config);
            setUsers(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load user list.');
        }
    };
    
    // Toggle Status Feature (Replaces Delete)
    const handleToggleStatus = async (user) => {
        const action = user.is_active ? 'DISABLE' : 'ENABLE';
        if (!window.confirm(`Are you sure you want to ${action} this user account? \n(Disabled users cannot login, but data is preserved).`)) return;

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
        setUsers(users.map(user => (user.id === updatedUser.id ? updatedUser : user))); 
    };
    
    // Search filter (Including Phone)
    const filteredUsers = users.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm))
    );

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="management-page-container fadeIn">
            <h2 className="page-main-title mb-4">User Management</h2>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
            <Card className="residem-card">
                <Card.Body>
                    <div className="mb-3">
                        <Form.Control
                            type="text"
                            className="residem-search-bar" 
                            placeholder="Search by name or phone number..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    
                    <div className="table-wrapper">
                        <Table hover striped className="residem-table">
                            <colgroup>
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '15%' }} /> {/* Phone Column */}
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '25%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
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
                                        
                                        {/* Phone Data */}
                                        <td>{user.phone || <span className="text-muted small">N/A</span>}</td>

                                        <td>
                                            <span className={`status-badge ${user.role === 'resident' ? 'status-success' : 'status-secondary'}`}>
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={user.is_active ? 'status-text-success' : 'status-text-danger'}>
                                                {user.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                            <br/>
                                            <small className="text-muted">
                                                {user.is_verified ? 'Verified' : 'Not Verified'}
                                            </small>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-residem-warning btn-sm me-2" 
                                                onClick={() => handleShowModal(user)}
                                            >
                                                Edit
                                            </button>
                                            
                                            <button 
                                                className={`btn btn-sm ${user.is_active ? 'btn-secondary' : 'btn-success'}`} 
                                                onClick={() => handleToggleStatus(user)}
                                                title={user.is_active ? "Click to Lock Account" : "Click to Unlock Account"}
                                            >
                                                {user.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {currentUsers.length < usersPerPage && Array.from({ length: usersPerPage - currentUsers.length }).map((_, idx) => (
                                    <tr key={`placeholder-${idx}`} className="placeholder-row">
                                        <td>&nbsp;</td>
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
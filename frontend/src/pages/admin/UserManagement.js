// frontend/src/pages/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditUserModal from '../../components/admin/EditUserModal';
import Pagination from '../../components/admin/Pagination';

const UserManagement = () => {
    // ... tất cả state và hàm logic không thay đổi ...
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
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('http://localhost:5000/api/admin/users', config);
                setUsers(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
            }
        };
        fetchUsers();
    }, []);
    const handleDelete = async (userId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, config);
                setUsers(users.filter(user => user.id !== userId));
            } catch (err) {
                setError(err.response?.data?.message || 'Xóa người dùng thất bại.');
            }
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

    return (
        // Thẻ div này bây giờ chỉ có một nhiệm vụ
        <>
            <div className="admin-page-content">
                <h2>User Management</h2>
                {error && <p className="alert alert-danger">{error}</p>}
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm kiếm theo họ tên..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="table-container">
                <table className="table table-striped table-hover">
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
                                <td><span className={`badge ${user.role === 'resident' ? 'bg-success' : 'bg-secondary'}`}>{user.role}</span></td>
                                <td>{user.is_verified ? 'Đã xác thực' : 'Chưa xác thực'}</td>
                                <td>
                                    <button className="btn btn-primary btn-sm me-2 action-btn" onClick={() => handleShowModal(user)}>Edit</button>
                                    <button className="btn btn-danger btn-sm action-btn" onClick={() => handleDelete(user.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}

                        {/* Render placeholder rows so table height remains constant across pages */}
                        {currentUsers.length < usersPerPage && Array.from({ length: usersPerPage - currentUsers.length }).map((_, idx) => (
                            <tr key={`placeholder-${idx}`} className="placeholder-row">
                                <td className="col-fullname">&nbsp;</td>
                                <td className="col-email">&nbsp;</td>
                                <td className="col-role">&nbsp;</td>
                                <td className="col-status">&nbsp;</td>
                                <td className="col-actions">&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            <div className="pagination-container">
                <Pagination
                    itemsPerPage={usersPerPage}
                    totalItems={filteredUsers.length}
                    paginate={paginate}
                    currentPage={currentPage}
                />
            </div>
            
            {selectedUser && (
                <EditUserModal 
                    show={showModal}
                    handleClose={handleCloseModal}
                    user={selectedUser}
                    onUserUpdate={handleUserUpdate}
                />
            )}
        </>
    );
};

export default UserManagement;
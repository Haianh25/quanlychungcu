// frontend/src/components/admin/EditUserModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';

const EditUserModal = ({ show, handleClose, user, onUserUpdate }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        role: 'user',
        newPassword: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.full_name || '',
                role: user.role || 'user',
                newPassword: ''
            });
        }
    }, [user]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSave = async () => {
        try {
            // highlight-start
            // --- SỬA LỖI Ở ĐÂY ---
            // Lấy đúng 'adminToken' thay vì 'token'
            const token = localStorage.getItem('adminToken');
            // highlight-end
            
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const payload = {
                fullName: formData.fullName,
                role: formData.role,
            };

            if (formData.newPassword.trim() !== '') {
                payload.newPassword = formData.newPassword;
            }

            const res = await axios.put(`http://localhost:5000/api/admin/users/${user.id}`, payload, config);
            
            onUserUpdate(res.data.user);
            handleClose();
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            // Dịch thông báo lỗi sang Tiếng Anh cho đồng bộ
            alert(error.response?.data?.message || 'Update failed!');
        }
    };

    // Dịch các text sang Tiếng Anh
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit User Information</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control type="text" name="fullName" value={formData.fullName} onChange={onChange} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Role</Form.Label>
                        <Form.Select name="role" value={formData.role} onChange={onChange}>
                            <option value="user">User</option>
                            <option value="resident">Resident</option>
                        </Form.Select>
                    </Form.Group>
                    
                    <hr />

                    <Form.Group className="mb-3">
                        <Form.Label>Reset Password</Form.Label>
                        <Form.Control 
                            type="password" 
                            name="newPassword" 
                            value={formData.newPassword} 
                            onChange={onChange}
                            placeholder="Leave blank to keep current password" 
                        />
                         <Form.Text className="text-muted">
                            Password must be strong (uppercase, lowercase, number, special character).
                         </Form.Text>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save Changes</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditUserModal;
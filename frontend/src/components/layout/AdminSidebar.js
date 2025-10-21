// frontend/src/components/layout/AdminSidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = () => {
    return (
        <div className="list-group">
            <NavLink to="/admin/dashboard" className="list-group-item list-group-item-action">
                Tổng Quan
            </NavLink>
            <NavLink to="/admin/user-management" className="list-group-item list-group-item-action">
                Quản Lý Tài Khoản
            </NavLink>
            {/* LINK MỚI */}
            <NavLink to="/admin/resident-management" className="list-group-item list-group-item-action">
                Quản Lý Cư Dân
            </NavLink>
            <NavLink to="/admin/block-management" className="list-group-item list-group-item-action">
                Quản Lý Tòa Nhà
            </NavLink>
        </div>
    );
};

export default AdminSidebar;
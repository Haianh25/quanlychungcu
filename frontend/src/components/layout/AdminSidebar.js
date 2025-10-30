// frontend/src/components/layout/AdminSidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom'; // Bạn đang dùng NavLink, chính xác rồi

const AdminSidebar = () => {
    return (
        <div className="list-group"> {/* Dùng list-group */}
            <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => // Sử dụng function để thêm class 'active'
                    `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
                }
            >
                Tổng Quan
            </NavLink>
            <NavLink
                to="/admin/user-management"
                className={({ isActive }) =>
                    `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
                }
            >
                User Management
            </NavLink>
            <NavLink
                to="/admin/resident-management"
                className={({ isActive }) =>
                    `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
                }
            >
                Resident Management
            </NavLink>
            <NavLink
                to="/admin/block-management"
                className={({ isActive }) =>
                    `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
                }
            >
                Block Management
            </NavLink>
            <NavLink
                to="/admin/news-management"
                className={({ isActive }) =>
                    `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
                }
            >
                News Management
            </NavLink>

            {/* === THÊM LINK MỚI VÀO ĐÂY === */}
            {/* highlight-start */}
            <NavLink
                to="/admin/vehicle-management"
                className={({ isActive }) =>
                    `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
                }
            >
                Vehicle Management
            </NavLink>
            {/* highlight-end */}
            {/* === KẾT THÚC LINK MỚI === */}

        </div>
    );
};

export default AdminSidebar;
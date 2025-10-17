// frontend/src/components/layout/AdminLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = () => {
    return (
        <div>
            <AdminHeader />
            <div className="container mt-4">
                <div className="row">
                    <div className="col-md-3">
                        <AdminSidebar />
                    </div>
                    <div className="col-md-9">
                        {/* ÁP DỤNG CLASS WRAPPER Ở ĐÂY */}
                        <div className="admin-content-wrapper">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
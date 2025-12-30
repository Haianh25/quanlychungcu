import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = () => {
    return (
        <div style={{ backgroundColor: '#f8f6f3', minHeight: '100vh' }}> 
            <AdminHeader />
            <div className="container-fluid"> 
                <div className="row">
                    <div className="col-md-3 col-lg-2 p-0 bg-white border-end" style={{minHeight: 'calc(100vh - 70px)'}}> 
                        <AdminSidebar />
                    </div>
                    <div className="col-md-9 col-lg-10 p-4 admin-content-wrapper main-content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = () => {
    return (
        <div>
            <AdminHeader />
            {/* Sử dụng container-fluid để chiếm toàn bộ chiều rộng */}
            <div className="container-fluid"> 
                <div className="row">
                    {/* Cột Sidebar */}
                    <div className="col-md-3 col-lg-2 p-0"> 
                        <AdminSidebar />
                    </div>
                    
                    {/* Cột Nội dung */}
                    {/* THAY ĐỔI: Thêm className="main-content" vào đây */}
                    <div className="col-md-9 col-lg-10 p-4 admin-content-wrapper main-content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
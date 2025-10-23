// frontend/src/components/layout/AdminLayout.js
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
                    {/* Cột Sidebar:
                        - col-md-3 col-lg-2: Đặt chiều rộng (thường dùng cho sidebar)
                        - p-0: Xóa toàn bộ padding để nó sát mép trái
                    */}
                    <div className="col-md-3 col-lg-2 p-0"> 
                        <AdminSidebar />
                    </div>
                    
                    {/* Cột Nội dung:
                        - col-md-9 col-lg-10: Chiếm phần còn lại
                        - p-4: Thêm padding trở lại cho nội dung
                        - admin-content-wrapper: Class CSS cũ để giữ chân trang
                    */}
                    <div className="col-md-9 col-lg-10 p-4 admin-content-wrapper">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
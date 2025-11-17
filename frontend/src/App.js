import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Layouts & Guards
import AdminLayout from './components/layout/AdminLayout';
import ResidentLayout from './components/layout/ResidentLayout'; 
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/AdminLogin';
import Homepage from './pages/Homepage'; 
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import ProfilePage from './pages/ProfilePage';
import BillPage from './pages/BillPage';

// IMPORT CÁC TRANG DỊCH VỤ
import ServicePage from './pages/ServicePage';      // Trang chọn dịch vụ (Dashboard)
import VehicleService from './pages/VehicleService'; // Trang Gửi xe riêng
import AmenityService from './pages/AmenityService'; // Trang Đặt phòng riêng

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ResidentManagement from './pages/admin/ResidentManagement';
import BlockManagement from './pages/admin/BlockManagement';
import NewsManagement from './pages/admin/NewsManagement';
import VehicleManagement from './pages/admin/VehicleManagement';
import BillManagement from './pages/admin/BillManagement';
import FeeManagement from './pages/admin/FeeManagement';
import AmenityManagement from './pages/admin/AmenityManagement';

function App() {
  return (
    <Router>
      <div className="app-wrapper"> 
        <Routes>
          {/* === Resident Routes === */}
          <Route element={<ResidentLayout />}>
            <Route path="/" element={<Homepage />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            
            {/* --- TÁCH RIÊNG 3 ROUTE DỊCH VỤ --- */}
            <Route path="/services" element={<ServicePage />} />          {/* Màn hình chọn */}
            <Route path="/services/vehicle" element={<VehicleService />} /> {/* Vào thẳng Gửi xe */}
            <Route path="/services/amenity" element={<AmenityService />} /> {/* Vào thẳng Đặt phòng */}
            
            <Route path="profile" element={<ProfilePage />} />
            <Route path="/bill" element={<BillPage />} />
          </Route>

          {/* === Authentication Routes === */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* === Admin Routes === */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="resident-management" element={<ResidentManagement />} />
              <Route path="block-management" element={<BlockManagement />} />
              <Route path="news-management" element={<NewsManagement />} />
              <Route path="vehicle-management" element={<VehicleManagement />} />
              <Route path="bill-management" element={<BillManagement />} />
              <Route path="fee-management" element={<FeeManagement />} />
              <Route path="amenity-management" element={<AmenityManagement />} />
            </Route>
          </Route>

        </Routes>
      </div>
    </Router>
  );
}

export default App;
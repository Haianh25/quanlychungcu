import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Layouts & Guards
import AdminLayout from './components/layout/AdminLayout';
import ResidentLayout from './components/layout/ResidentLayout'; // <-- 1. IMPORT LAYOUT MỚI
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
import ServicePage from './pages/ServicePage';
import ProfilePage from './pages/ProfilePage';
// Admin Pages (Protected)
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ResidentManagement from './pages/admin/ResidentManagement';
import BlockManagement from './pages/admin/BlockManagement';
import NewsManagement from './pages/admin/NewsManagement';
import VehicleManagement from './pages/admin/VehicleManagement';
import BillManagement from './pages/admin/BillManagement';
function App() {
  return (
    <Router>
      <div>
        <Routes>
          {/* === Public & Resident Routes (Sử dụng ResidentLayout) === */}
          <Route element={<ResidentLayout />}> {/* <-- 2. TẠO ROUTE BỌC (LAYOUT) */}
            <Route path="/" element={<Homepage />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            {/* Thêm các trang khác của resident vào đây, ví dụ: */}
            <Route path="/services" element={<ServicePage />} />
            <Route path="profile" element={<ProfilePage />} />
            {/* <Route path="/bill" element={<BillPage />} /> */}
          </Route>

          {/* === Authentication Routes (Không dùng layout) === */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* === Protected Admin Routes (Sử dụng AdminLayout) === */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="resident-management" element={<ResidentManagement />} />
              <Route path="block-management" element={<BlockManagement />} />
              <Route path="news-management" element={<NewsManagement />} />
              <Route path="vehicle-management" element={<VehicleManagement />} />
              <Route path="bill-management" element={<BillManagement />} />
              
            </Route>
          </Route>
          {/* === End Protected Routes === */}

        </Routes>
      </div>
    </Router>
  );
}

export default App;
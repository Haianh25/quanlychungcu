// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Layouts & Guards
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/AdminLogin';
import Homepage from './pages/Homepage'; // Homepage giờ là Public

// Admin Pages (Protected)
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ResidentManagement from './pages/admin/ResidentManagement';
import BlockManagement from './pages/admin/BlockManagement';
import NewsManagement from './pages/admin/NewsManagement';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
function App() {
  return (
    <Router>
      <div> {/* Bỏ class container mt-5 ở đây */}
        <Routes>
          {/* === Public Routes === */}
          <Route path="/" element={<Homepage />} /> {/* Đặt Homepage ở đây */}
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* === Protected Routes === */}
          <Route element={<ProtectedRoute />}>
             {/* Các trang cần đăng nhập nhưng không phải admin (ví dụ: trang profile) sẽ đặt ở đây */}
             {/* <Route path="/profile" element={<ProfilePage />} /> */}

            {/* Khu vực Admin (vẫn cần đăng nhập) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="resident-management" element={<ResidentManagement />} />
              <Route path="block-management" element={<BlockManagement />} />
              <Route path="news-management" element={<NewsManagement />} />
              
            </Route>
          </Route>
          {/* === End Protected Routes === */}

        </Routes>
      </div>
    </Router>
  );
}

export default App;
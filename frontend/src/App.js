import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';

import AdminLayout from './components/layout/AdminLayout';
import ResidentLayout from './components/layout/ResidentLayout'; 
import ProtectedRoute from './components/ProtectedRoute';

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
import AboutUs from './pages/AboutUs';
import ServicePage from './pages/ServicePage';      
import VehicleService from './pages/VehicleService';
import AmenityService from './pages/AmenityService'; 

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
import PolicyManagement from './pages/admin/PolicyManagement'; 

const AppContent = () => {
    const navigate = useNavigate();
    const [showBlockModal, setShowBlockModal] = useState(false);

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 403) {
                    const msg = error.response.data?.message || '';
                    if (msg.toLowerCase().includes('disabled') || msg.toLowerCase().includes('locked')) {
                        setShowBlockModal(true);
                    }
                }
                return Promise.reject(error);
            }
        );

        
        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    const handleCloseBlockModal = () => {
        setShowBlockModal(false);
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        navigate('/login');
    };

    return (
        <>
            
            <Modal show={showBlockModal} onHide={handleCloseBlockModal} centered backdrop="static" keyboard={false}>
                <Modal.Header className="bg-danger text-white">
                    <Modal.Title>Account Locked</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-4">
                    <div className="mb-3 text-danger" style={{fontSize: '3rem'}}>
                        <i className="bi bi-shield-lock-fill"></i>
                    </div>
                    <h5 className="mb-3">Access Denied</h5>
                    <p>Your account has been disabled by the administrator.</p>
                    <p className="text-muted small">Please contact support if you believe this is a mistake.</p>
                </Modal.Body>
                <Modal.Footer className="justify-content-center">
                    <Button variant="danger" onClick={handleCloseBlockModal}>
                        Close & Logout
                    </Button>
                </Modal.Footer>
            </Modal>

            <div className="app-wrapper"> 
                <Routes>
                    {/* === Resident Routes === */}
                    <Route element={<ResidentLayout />}>
                        <Route path="/" element={<Homepage />} />
                        <Route path="/news" element={<News />} />
                        <Route path="/news/:id" element={<NewsDetail />} />
                        <Route path="/services" element={<ServicePage />} />          
                        <Route path="/services/vehicle" element={<VehicleService />} /> 
                        <Route path="/services/amenity" element={<AmenityService />} /> 
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="/bill" element={<BillPage />} />
                        <Route path="/about" element={<AboutUs />} />
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
                            <Route path="policy-management" element={<PolicyManagement />} /> 
                        </Route>
                    </Route>
                </Routes>
            </div>
        </>
    );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
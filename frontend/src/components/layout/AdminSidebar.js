import React from 'react';
import { NavLink } from 'react-router-dom';
import { Speedometer2, People, HouseDoor, Grid, Newspaper, Truck, Receipt, Wallet2, CalendarEvent, GearFill } from 'react-bootstrap-icons'; // [MỚI] Thêm GearFill

const AdminSidebar = () => {
 
    const getLinkClass = ({ isActive }) => {
        const baseClass = "d-flex align-items-center py-3 px-4 text-decoration-none fw-medium transition-all";

        return isActive 
            ? `${baseClass} bg-opacity-10 text-dark border-start border-4` 
            : `${baseClass} text-secondary hover-bg-light`;
    };

    const activeStyle = {
        borderColor: '#b99a7b',
        color: '#b99a7b',
        backgroundColor: 'rgba(185, 154, 123, 0.1)'
    };

    return (
        <div className="d-flex flex-column pt-3 h-100 bg-white">
            <div className="px-4 mb-3 text-uppercase text-muted fw-bold" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>Management</div>
            
            <NavLink to="/admin/dashboard" className={getLinkClass} style={({ isActive }) => isActive ? activeStyle : {}}>
                <Speedometer2 className="me-3 fs-5" /> General Dashboard
            </NavLink>
            <NavLink to="/admin/user-management" className={getLinkClass} style={({ isActive }) => isActive ? activeStyle : {}}>
                <People className="me-3 fs-5" /> User Management
            </NavLink>
            <NavLink to="/admin/resident-management" className={getLinkClass} style={({ isActive }) => isActive ? activeStyle : {}}>
                <HouseDoor className="me-3 fs-5" /> Resident Management
            </NavLink>
            <NavLink to="/admin/block-management" className={getLinkClass} style={({ isActive }) => isActive ? activeStyle : {}}>
                <Grid className="me-3 fs-5" /> Block Management
            </NavLink>
            <NavLink to="/admin/news-management" className={getLinkClass} style={({ isActive }) => isActive ? activeStyle : {}}>
                <Newspaper className="me-3 fs-5" /> News Management
            </NavLink>
            <NavLink to="/admin/vehicle-management" className={getLinkClass} style={({ isActive }) => isActive ? activeStyle : {}}>
                <Truck className="me-3 fs-5" /> Vehicle Management
            </NavLink>
            <NavLink to="/admin/bill-management" className={getLinkClass} style={({ isActive }) => isActive ? activeStyle : {}}>
                <Receipt className="me-3 fs-5" /> Bill Management
            </NavLink>
            <NavLink to="/admin/fee-management" className={getLinkClass} style={({ isActive }) => isActive ? activeStyle : {}}>
                <Wallet2 className="me-3 fs-5" /> Fee Management
            </NavLink>
            <NavLink to="/admin/amenity-management" className={getLinkClass} style={({ isActive }) => isActive ? activeStyle : {}}>
                <CalendarEvent className="me-3 fs-5" /> Amenity Management
            </NavLink>
            <NavLink to="/admin/policy-management" className={getLinkClass} style={({ isActive }) => isActive ? activeStyle : {}}>
                <GearFill className="me-3 fs-5" /> Policy Management
            </NavLink>
        </div>
    );
};

export default AdminSidebar;
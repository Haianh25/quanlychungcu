import React from 'react';
import { Outlet } from 'react-router-dom';
import ResidentHeader from './ResidentHeader';
import ResidentFooter from './ResidentFooter';

const ResidentLayout = () => {
    return (
        
        <div className="homepage-container"> 
            <ResidentHeader />
            {/* THAY ĐỔI: Thêm className="main-content" vào đây */}
            <main className="main-content">
                {/* Outlet sẽ render Homepage, News, NewsDetail... */}
                <Outlet /> 
            </main>
            <ResidentFooter />
        </div>
    );
};

export default ResidentLayout;
// frontend/src/components/layout/ResidentLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import ResidentHeader from './ResidentHeader';
import ResidentFooter from './ResidentFooter';

const ResidentLayout = () => {
    return (
        
        <div className="homepage-container"> 
            <ResidentHeader />
            <main>
                {/* Outlet sẽ render Homepage, News, NewsDetail... */}
                <Outlet /> 
            </main>
            <ResidentFooter />
        </div>
    );
};

export default ResidentLayout;
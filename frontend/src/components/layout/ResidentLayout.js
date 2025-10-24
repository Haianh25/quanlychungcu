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
                <Outlet /> {/* Nội dung trang (Homepage, News...) sẽ được chèn vào đây */}
            </main>
            <ResidentFooter />
        </div>
    );
};

export default ResidentLayout;
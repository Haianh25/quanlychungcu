import React from 'react';
import { Outlet } from 'react-router-dom';
import ResidentHeader from './ResidentHeader';
import ResidentFooter from './ResidentFooter';

const ResidentLayout = () => {
    return (
        
        <div className="homepage-container"> 
            <ResidentHeader />
           
            <main className="main-content">
            
                <Outlet /> 
            </main>
            <ResidentFooter />
        </div>
    );
};

export default ResidentLayout;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios'; 
import '../../pages/Homepage.css';

const ResidentFooter = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [apartmentNumber, setApartmentNumber] = useState(null);

    useEffect(() => {
        let intervalId;
        const token = localStorage.getItem('token');

        const fetchStatus = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('http://localhost:5000/api/profile/status', config);
                if (res.data.apartment_number !== apartmentNumber) {
                    setApartmentNumber(res.data.apartment_number);
                }
            } catch (e) { /* Ignore */ }
        };

        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp < Date.now() / 1000) {
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                } else {
                    setIsLoggedIn(true);

                    const rawRole = decoded.role || decoded.roles || decoded.user?.role;
                    let normalizedRole = null;
                    if (Array.isArray(rawRole)) {
                         const lowerRoles = rawRole.map(r => String(r).toLowerCase());
                         if (lowerRoles.includes('resident')) normalizedRole = 'resident';
                         else normalizedRole = lowerRoles[0] || null;
                    } else if (rawRole) {
                        normalizedRole = String(rawRole).toLowerCase();
                    }
                    setUserRole(normalizedRole);

                    if (decoded.apartment_number) setApartmentNumber(decoded.apartment_number);

                    intervalId = setInterval(fetchStatus, 5000);
                }
            } catch (e) {
                localStorage.removeItem('token');
                setIsLoggedIn(false);
            }
        } else {
            setIsLoggedIn(false);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    const isResident = isLoggedIn && userRole === 'resident';
    const hasRoom = isResident && apartmentNumber;

    const handleRestrictedLinkClick = (e, path) => {
        e.preventDefault(); 
        
        if (isResident) {
            if (hasRoom) {
                navigate(path);
            } else {
                alert("Access Denied: You have not been assigned an apartment yet. Please contact Admin to use this service.");
            }
        } else if (isLoggedIn) {
            alert("Access Denied: You must be a verified Resident to access this feature.");
        } else {
            const confirmLogin = window.confirm("Please login to access this feature. Go to login page?");
            if (confirmLogin) navigate('/login');
        }
    };

    return (
        <footer className="resident-footer new-footer-compact mt-5">
            <div className="container">
                <div className="row">
                    <div className="col-lg-5 col-md-12 mb-4 mb-lg-0">
                        <div className="footer-logo-compact">
                            <img src="/images/logoo.png" alt="PTIT Apartment Logo" className="new-logo" />
                            <span>PTIT Apartment</span>
                        </div>
                        <p className="footer-address-compact">
                            Posts and Telecommunications Institute of Technology (PTIT)
                            <br />
                            Km10, Nguyen Trai Street, Ha Dong District, Hanoi
                        </p>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
                        <h5 className="footer-heading-compact">Quick Links</h5>
                        <ul className="footer-links-list">
                            <li><Link to="/">Home</Link></li>
                            <li>
                                <a href="/services" onClick={(e) => handleRestrictedLinkClick(e, '/services')} className={!isResident ? 'text-muted' : ''}>
                                    Services {!isResident && <i className="bi bi-lock-fill ms-1" style={{fontSize: '0.8em'}}></i>}
                                </a>
                            </li>
                            <li>
                                <a href="/bill" onClick={(e) => handleRestrictedLinkClick(e, '/bill')} className={!isResident ? 'text-muted' : ''}>
                                    Bill {!isResident && <i className="bi bi-lock-fill ms-1" style={{fontSize: '0.8em'}}></i>}
                                </a>
                            </li>
                            
                            <li>
                                <a href="/news" onClick={(e) => {
                                    e.preventDefault();
                                    if(isResident) navigate('/news');
                                    else if(isLoggedIn) alert("Access Denied.");
                                    else {
                                        if(window.confirm("Please login.")) navigate('/login');
                                    }
                                }} className={!isResident ? 'text-muted' : ''}>
                                    News {!isResident && <i className="bi bi-lock-fill ms-1" style={{fontSize: '0.8em'}}></i>}
                                </a>
                            </li>

                            <li><Link to="/about">About Us</Link></li>
                        </ul>
                    </div>

                    <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
                        <h5 className="footer-heading-compact">Contact Us</h5>
                        <ul className="footer-contact-list">
                            <li>
                                <i className="bi bi-envelope-fill"></i>
                                <span>contact.ptit@apartment.com</span>
                            </li>
                            <li>
                                <i className="bi bi-telephone-fill"></i>
                                <span>(024) 3352 8122</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom-bar">
                    <span className="copyright-text">
                        Copyright © {new Date().getFullYear()} PTIT Apartment. All rights reserved.
                    </span>
                    <div className="social-icons-compact">
                        <a href="#!" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
                        <a href="#!" aria-label="Twitter"><i className="bi bi-twitter"></i></a>
                        <a href="#!" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
                        <a href="#!" aria-label="YouTube"><i className="bi bi-youtube"></i></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default ResidentFooter;
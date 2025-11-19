import React from 'react';
import { Link } from 'react-router-dom';
import '../../pages/Homepage.css'; // Import CSS

const ResidentFooter = () => {
    return (
        <footer className="resident-footer new-footer-compact mt-5">
            <div className="container">
                <div className="row">
                    
                    {/* COLUMN 1: LOGO AND ADDRESS */}
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

                    {/* COLUMN 2: QUICK LINKS */}
                    <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
                        <h5 className="footer-heading-compact">Quick Links</h5>
                        <ul className="footer-links-list">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/services">Services</Link></li>
                            <li><Link to="/bill">Bill</Link></li> 
                            <li><Link to="/news">News</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                        </ul>
                    </div>

                    {/* COLUMN 3: CONTACT US */}
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

                {/* COPYRIGHT BAR */}
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
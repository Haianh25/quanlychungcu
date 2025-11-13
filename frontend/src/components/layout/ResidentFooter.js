import React from 'react';
import { Link } from 'react-router-dom';
import '../../pages/Homepage.css'; // Import CSS

const ResidentFooter = () => {
    return (
        <footer className="resident-footer new-footer-compact mt-5">
            <div className="container">
                <div className="row">
                    
                    {/* CỘT 1: LOGO VÀ ĐỊA CHỈ */}
                    <div className="col-lg-5 col-md-12 mb-4 mb-lg-0">
                        <div className="footer-logo-compact">
                            <img src="/images/logoo.png" alt="PTIT Apartment Logo" className="new-logo" />
                            <span>PTIT Apartment</span>
                        </div>
                        <p className="footer-address-compact">
                            Học viện Công nghệ Bưu chính Viễn thông (PTIT)
                            <br />
                            Km10, Đường Nguyễn Trãi, Q. Hà Đông, Hà Nội
                        </p>
                    </div>

                    {/* CỘT 2: LINK NHANH */}
                    <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
                        <h5 className="footer-heading-compact">Quick Links</h5>
                        <ul className="footer-links-list">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/services">Services</Link></li>
                            {/* Đã giữ lại các link bạn có */}
                            <li><Link to="/bill">Bill</Link></li> 
                            <li><Link to="/news">News</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                        </ul>
                    </div>

                    {/* CỘT 3: LIÊN HỆ (Đã bỏ "Call Us" và "Opening Hours" để gọn hơn, giữ Email) */}
                    <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
                        <h5 className="footer-heading-compact">Contact Us</h5>
                        <ul className="footer-contact-list">
                            {/* Đã bỏ "Call Us" để gọn hơn */}
                            <li>
                                <i className="bi bi-envelope-fill"></i>
                                <span>contact.ptit@apartment.com</span>
                            </li>
                             {/* Chỉ giữ số điện thoại và email, bỏ giờ mở cửa để gọn hơn */}
                            <li>
                                <i className="bi bi-telephone-fill"></i>
                                <span>(024) 3352 8122</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* THANH COPYRIGHT */}
                <div className="footer-bottom-bar">
                    <span className="copyright-text">
                        Copyright © {new Date().getFullYear()} PTIT Apartment. Đã đăng ký bản quyền.
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
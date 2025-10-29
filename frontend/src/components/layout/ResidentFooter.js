// frontend/src/components/layout/ResidentFooter.js
import React from 'react';
// Bạn có thể tạo file CSS riêng cho Footer nếu muốn
// import './ResidentFooter.css'; 

const ResidentFooter = () => {
    return (
        <footer className="resident-footer mt-5">
            <div className="container">
                <div className="row">
                    <div className="col-md-4">
                        <div className="footer-logo">PTIT Apartment</div>
                        <p>Placeholder text about the apartment complex. Lorem ipsum dolor sit amet...</p>
                        <div className="social-icons">
                            {/* Thay <i> bằng icon thật nếu dùng FontAwesome/Bootstrap */}
                            <a href="#!"><i className="fab fa-facebook-f"></i></a>
                            <a href="#!"><i className="fab fa-twitter"></i></a>
                            <a href="#!"><i className="fab fa-instagram"></i></a>
                        </div>
                    </div>
                    <div className="col-md-2">
                        <h5>Accommodations</h5>
                        <ul>
                            <li><a href="#!">Deluxe Room</a></li>
                            <li><a href="#!">Premium Suite</a></li>
                        </ul>
                    </div>
                    <div className="col-md-2">
                        <h5>Support</h5>
                        <ul>
                            <li><a href="#!">Customer Support</a></li>
                            <li><a href="#!">Privacy Policy</a></li>
                            <li><a href="#!">Contact Us</a></li>
                        </ul>
                    </div>
                    <div className="col-md-4">
                        <h5>Information</h5>
                        <p>Number: 012-345-6789</p>
                        <p>Email: info@ptitapartment.com</p>
                        <p>Address: 123 Code St, Hanoi</p>
                    </div>
                </div>
                <div className="copyright">
                    Copyright © {new Date().getFullYear()} PTIT Apartment. All Rights Reserved.
                </div>
            </div>
        </footer>
    );
};

export default ResidentFooter;
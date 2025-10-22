// frontend/src/pages/Homepage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Homepage.css';
// QUAN TRỌNG: Đảm bảo bạn đã import CSS của icon library ở đây hoặc trong index.js/App.js
// Ví dụ với Bootstrap Icons:
import 'bootstrap-icons/font/bootstrap-icons.css'; // <- THÊM DÒNG NÀY NẾU CHƯA CÓ VÀ DÙNG BOOTSTRAP ICONS

const Homepage = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('');
    const [userAvatar, setUserAvatar] = useState('/images/default-avatar.jpg'); // Đặt ảnh avatar mặc định vào public/images/

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                // (Tùy chọn) Kiểm tra token hết hạn
                const currentTime = Date.now() / 1000;
                if (decodedToken.exp < currentTime) {
                    console.log("Token expired");
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                    setUserRole(null);
                    setUserName('');
                    setUserAvatar('/images/default-avatar.jpg');
                } else {
                    setIsLoggedIn(true);
                    setUserRole(decodedToken.role);
                    setUserName(decodedToken.full_name || decodedToken.email);
                    setUserAvatar(decodedToken.avatar_url || '/images/default-avatar.jpg');
                }
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('token');
                setIsLoggedIn(false);
                setUserRole(null);
                setUserName('');
                setUserAvatar('/images/default-avatar.jpg');
            }
        } else {
            setIsLoggedIn(false);
            setUserRole(null);
            setUserName('');
            setUserAvatar('/images/default-avatar.jpg');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserRole(null);
        setUserName('');
        setUserAvatar('/images/default-avatar.jpg');
        // Không navigate, ở lại trang chủ
    };

    const handleBellClick = () => {
        alert('Show notifications!'); // Placeholder action
        // navigate('/notifications');
    };

    const handleAvatarClick = () => {
        alert('Open user profile menu!'); // Placeholder action
        // navigate('/profile');
    };

    return (
        <div className="homepage-container">
            {/* --- Header --- */}
            <header className="resident-header sticky-top">
                <nav className="container navbar navbar-expand-lg navbar-dark">
                    {/* Logo & Site Name */}
                    <Link className="navbar-brand" to={isLoggedIn ? "/" : "/login"}>
                        {/* Ensure logo image is in public/images/logo.png */}
                        <img src="/images/logo.png" alt="PTIT Apartment Logo" style={{ height: '30px' }} />
                        PTIT Apartment
                    </Link>

                    {/* Navbar Toggler (for mobile) */}
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#residentNavbar" aria-controls="residentNavbar" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* Navbar Links */}
                    <div className="collapse navbar-collapse" id="residentNavbar">
                        <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link className="nav-link active" aria-current="page" to="/">Homepage</Link>
                            </li>
                            {/* Always show these links, actual page content can be protected later */}
                            <li className="nav-item">
                                <Link className="nav-link" to="/services">Services</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/bill">Bill</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/news">News</Link>
                            </li>
                        </ul>

                        {/* Right side items */}
                        <div className="header-right-items">
                            {isLoggedIn ? (
                                <>
                                    {/* Notification Bell Icon */}
                                    <button className="icon-btn" onClick={handleBellClick} title="Notifications">
                                        <i className="bi bi-bell-fill"></i> {/* Bootstrap Icons class */}
                                        {/* Or Font Awesome: <i className="fas fa-bell"></i> */}
                                    </button>
                                    {/* User Avatar */}
                                    <img src={userAvatar} alt={userName} className="avatar" onClick={handleAvatarClick} title={userName} />
                                    {/* Logout Button */}
                                    <button className="btn btn-auth" onClick={handleLogout}>Logout</button>
                                </>
                            ) : (
                                // Login Button if not logged in
                                <Link className="btn btn-auth" to="/login">Login</Link>
                            )}
                        </div>
                    </div>
                </nav>
            </header>

            {/* --- Hero Section --- */}
            <section className="hero-section container my-4">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <p className="sub-heading">Stay Beyond Ordinary</p>
                    <h1>Discover Your Sanctuary Of Comfort And Elegance, Where Every Moment Feels Like A Dream</h1>
                    <button className="btn btn-talk">Let's Talk With Us</button>
                    <button className="btn btn-play">▶</button>
                </div>
                 <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems:'center', justifyContent: 'center', backgroundColor: '#555', zIndex: 0, color: '#aaa'}}>Background Image Here</div>
            </section>

            {/* --- Services Section --- */}
            <section className="services-section container my-4">
                 <h5>Featured Services</h5>
                 <h2>Elevate Your Stay With Our Unique Offerings</h2>
                <div className="row">
                    <div className="col-md-4">
                        <div className="service-card">
                             <div className="img-placeholder">Image Here</div>
                            <h4>Farm-To-Table Mountain Dining</h4>
                            <p>Enjoy fresh, locally-sourced meals inspired by the region's flavors, served with breathtaking alpine backdrops.</p>
                            <button className="btn btn-read-more">Read More &rarr;</button>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="service-card">
                             <div className="img-placeholder">Image Here</div>
                            <h4>Mountain View Suites</h4>
                            <p>Wake up to stunning panoramic views of the mountains from the comfort of your private suite, designed for peace and serenity.</p>
                            <button className="btn btn-read-more">Read More &rarr;</button>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="service-card">
                             <div className="img-placeholder">Image Here</div>
                            <h4>Forest Spa Retreat</h4>
                            <p>Unwind with signature spa treatments nestled among the trees, where nature's calm enhances every moment of relaxation.</p>
                            <button className="btn btn-read-more">Read More &rarr;</button>
                        </div>
                    </div>
                </div>
            </section>

             {/* --- About Section --- */}
            <section className="about-section container my-4">
                <div className="row align-items-center">
                    <div className="col-md-6">
                         <h5>About Us</h5>
                         <h2>For Us, It's Not Just About Where You Sleep — It's About How You Feel While You're Here.</h2>
                         <p>Quisque sodales non nibh vel interdum. Pellentesque rutrum posuere metus non pulvinar. Fusce hendrerit at nisi eget ultricies. Praesent egestas commodo est...</p>
                         <p>Quisque vestibulum tortor non leo tempus viverra. Suspendisse placerat risus venenatis sapien rutrum, sed sodales dolor tristique...</p>
                    </div>
                     <div className="col-md-6">
                        <div className="row">
                            <div className="col-lg-6">
                                 <div className="img-placeholder-small">Image Here</div>
                            </div>
                            <div className="col-lg-6">
                                 <div className="img-placeholder-small">Image Here</div>
                                 <blockquote>
                                     "A stay with us is more than a break — it's a carefully crafted experience where every detail is designed to soothe your soul and elevate your journey."
                                     <footer>Dyas Kardinal, Owner</footer>
                                 </blockquote>
                            </div>
                        </div>
                        <button className="btn btn-read-more mt-3">Read More</button>
                    </div>
                </div>
            </section>

            {/* --- Footer Section --- */}
            <footer className="resident-footer mt-5">
                <div className="container">
                    <div className="row">
                        <div className="col-md-4">
                            <div className="footer-logo">PTIT Apartment</div>
                            <p>Placeholder text about the apartment complex. Lorem ipsum dolor sit amet...</p>
                             <div className="social-icons">
                                {/* Replace #! with actual links and <i> with actual icon components/classes */}
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
        </div>
    );
};

export default Homepage;
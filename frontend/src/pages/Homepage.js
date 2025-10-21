// frontend/src/pages/Homepage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Homepage.css';
// Import Font Awesome hoặc Bootstrap Icons CSS nếu chưa có
// Ví dụ với Bootstrap Icons:
// import 'bootstrap-icons/font/bootstrap-icons.css';

const Homepage = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState(''); // Thêm state cho tên người dùng
    const [userAvatar, setUserAvatar] = useState('/images/default-avatar.jpg'); // Avatar mặc định

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setIsLoggedIn(true);
                setUserRole(decodedToken.role);
                setUserName(decodedToken.full_name || decodedToken.email); // Lấy tên hoặc email
                // Giả sử token có trường 'avatar_url', nếu không thì dùng mặc định
                setUserAvatar(decodedToken.avatar_url || '/images/default-avatar.jpg');
            } catch (error) {
                console.error("Token không hợp lệ:", error);
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
        alert('Hiển thị thông báo mới!'); // Logic xử lý thông báo
        // navigate('/notifications'); // Hoặc chuyển hướng đến trang thông báo
    };

    const handleAvatarClick = () => {
        alert('Mở menu hồ sơ người dùng!'); // Logic xử lý avatar/profile
        // navigate('/profile'); // Hoặc chuyển hướng đến trang hồ sơ
    };

    return (
        <div className="homepage-container">
            {/* --- Header --- */}
            <header className="resident-header sticky-top">
                <nav className="container navbar navbar-expand-lg navbar-dark">
                    {/* Logo & Tên Trang */}
                    <Link className="navbar-brand" to={isLoggedIn ? "/" : "/login"}>
                        {/* Đảm bảo có ảnh logo ở public/images/logo.png */}
                        <img src="/images/logo.png" alt="PTIT Apartment Logo" style={{ height: '30px' }} />
                        PTIT Apartment
                    </Link>

                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#residentNavbar" aria-controls="residentNavbar" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="residentNavbar">
                        <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link className="nav-link active" aria-current="page" to="/">Homepage</Link>
                            </li>
                            {/* Các mục này luôn hiện, nhưng nội dung chi tiết bên trong có thể phụ thuộc role */}
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

                        {/* Các item bên phải header */}
                        <div className="header-right-items">
                            {isLoggedIn ? (
                                <>
                                    {/* Icon chuông thông báo (chỉ hiện khi đăng nhập) */}
                                    <button className="icon-btn" onClick={handleBellClick} title="Thông báo">
                                        <i className="bi bi-bell-fill"></i> {/* Sử dụng Bootstrap Icons */}
                                        {/* Hoặc Font Awesome: <i className="fas fa-bell"></i> */}
                                    </button>
                                    {/* Avatar người dùng (chỉ hiện khi đăng nhập) */}
                                    <img src={userAvatar} alt={userName} className="avatar" onClick={handleAvatarClick} title={userName} />

                                    {/* Nút Logout */}
                                    <button className="btn btn-auth" onClick={handleLogout}>Logout</button>
                                </>
                            ) : (
                                // Nút Login nếu chưa đăng nhập
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
                 <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems:'center', justifyContent: 'center', backgroundColor: '#555', zIndex: 0}}>Ảnh Here (Background)</div>
            </section>

            {/* --- Services Section --- */}
            <section className="services-section container my-4">
                 <h5>Featured Services</h5>
                 <h2>Elevate Your Stay With Our Unique Offerings</h2>
                <div className="row">
                    <div className="col-md-4">
                        <div className="service-card">
                             <div className="img-placeholder">Ảnh Here</div>
                            <h4>Farm-To-Table Mountain Dining</h4>
                            <p>Enjoy fresh, locally-sourced meals inspired by the region's flavors, served with breathtaking alpine backdrops.</p>
                            <button className="btn btn-read-more">Read More &rarr;</button>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="service-card">
                             <div className="img-placeholder">Ảnh Here</div>
                            <h4>Mountain View Suites</h4>
                            <p>Wake up to stunning panoramic views of the mountains from the comfort of your private suite, designed for peace and serenity.</p>
                            <button className="btn btn-read-more">Read More &rarr;</button>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="service-card">
                             <div className="img-placeholder">Ảnh Here</div>
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
                                 <div className="img-placeholder-small">Ảnh Here</div>
                            </div>
                            <div className="col-lg-6">
                                 <div className="img-placeholder-small">Ảnh Here</div>
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
                            <div className="footer-logo">PTIT Apartment</div> {/* Cập nhật tên */}
                            <p>Placeholder text about the apartment complex. Lorem ipsum dolor sit amet...</p>
                             <div className="social-icons">
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
                            <p>Email: info@ptitapartment.com</p> {/* Cập nhật email */}
                            <p>Address: 123 Code St, Hanoi</p>
                        </div>
                    </div>
                    <div className="copyright">
                        Copyright © {new Date().getFullYear()} PTIT Apartment. All Rights Reserved. {/* Cập nhật tên */}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Homepage;
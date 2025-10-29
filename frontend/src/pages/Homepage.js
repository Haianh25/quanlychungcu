// frontend/src/pages/Homepage.js
import React from 'react';
// XÓA: useState, useEffect, Link, jwtDecode
import './Homepage.css';
// XÓA: Import 'bootstrap-icons/font/bootstrap-icons.css' (đã chuyển sang Header)

const Homepage = () => {
    // TOÀN BỘ LOGIC (useState, useEffect, handleLogout...) ĐÃ BỊ XÓA

    return (
        // Chúng ta không cần div.homepage-container ở đây nữa vì nó đã ở ResidentLayout
        // Thay bằng React.Fragment
        <>
            {/* --- Header ĐÃ BỊ XÓA --- */}

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

            {/* --- Footer Section ĐÃ BỊ XÓA --- */}
        </>
    );
};

export default Homepage;
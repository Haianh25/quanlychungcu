import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

const Homepage = () => {

    const galleryImages = [
        { src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDEzfHxsaXZpbmclMjByb29tfGVufDB8fHx8MTcwMTU4NTYyMnww&ixlib=rb-4.0.3&q=80&w=800", alt: "Living room interior" },
        { src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDEwfHxkaW5pbmclMjByb29tfGVufDB8fHx8MTcwMTU4NTY1M3ww&ixlib=rb-4.0.3&q=80&w=800", alt: "Dining room interior" },
        { src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDEzfHxsaXZpbmclMjByb29tfGVufDB8fHx8MTcwMTU4NTYyMnww&ixlib=rb-4.0.3&q=80&w=800", alt: "Living room interior" },
        { src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDEwfHxkaW5pbmclMjByb29tfGVufDB8fHx8MTcwMTU4NTY1M3ww&ixlib=rb-4.0.3&q=80&w=800", alt: "Dining room interior" },
        { src: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDExfHxiZWRyb29tfGVufDB8fHx8MTcwMTU4NTcyMnww&ixlib=rb-4.0.3&q=80&w=800", alt: "Bedroom" },
        { src: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDR8fGFwYXJ0bWVudCUyMGV4dGVyaW9yfGVufDB8fHx8MTcwMTU4NTc0N3ww&ixlib=rb-4.0.3&q=80&w=800", alt: "Apartment exterior" },
        { src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDEwfHxhcGFydG1lbnQlMjBleHRlcmlvcnxlbnwwfHx8fDE3MDE1ODU3NDd8MA&ixlib=rb-4.0.3&q=80&w=800", alt: "Modern home exterior" },
        { src: "https://images.unsplash.com/photo-1448630360428-65456885c650?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDE2fHxhcGFydG1lbnQlMjBleHRlcmlvcnxlbnwwfHx8fDE3MDE1ODU3NDd8MA&ixlib=rb-4.0.3&q=80&w=800", alt: "Balcony exterior" },
        { src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDEwfHxhcGFydG1lbnQlMjBleHRlcmlvcnxlbnwwfHx8fDE3MDE1ODU3NDd8MA&ixlib=rb-4.0.3&q=80&w=800", alt: "Modern home exterior" },
        { src: "https://images.unsplash.com/photo-1448630360428-65456885c650?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDE2fHxhcGFydG1lbnQlMjBleHRlcmlvcnxlbnwwfHx8fDE3MDE1ODU3NDd8MA&ixlib=rb-4.0.3&q=80&w=800", alt: "Balcony exterior" },
        { src: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDR8fHN3aW1taW5nJTIwcG9vbCUyMGhvZGlkYXl8ZW58MHx8fHwxNzAxNTg1ODE1fDA&ixlib=rb-4.0.3&q=80&w=800", alt: "Swimming pool" },
        { src: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDR8fHN3aW1taW5nJTIwcG9vbCUyMGhvZGlkYXl8ZW58MHx8fHwxNzAxNTg1ODE1fDA&ixlib=rb-4.0.3&q=80&w=800", alt: "Swimming pool" },
    ];

    return (
        <>
            {/* --- HERO SECTION MỚI --- */}
            <section 
                className="hero-section residem-hero" 
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjkzN3wwfDF8c2VhcmNofDR8fGFwYXJ0bWVudCUyMGV4dGVyaW9yfGVufDB8fHx8MTcwMTU4NTc0N3ww&ixlib=rb-4.0.3&q=80&w=1800')` }}
            >
                <div className="hero-overlay"></div>
                
                {/* Wrapper để căn lề nội dung */}
                <div className="hero-content-wrapper">
                    <div className="hero-content">
                        {/* SỬA: Text mô tả về PTIT Apartment */}
                        <h1>Modern Living, Thoughtfully Designed</h1>
                        
                        
                        {/* SỬA: Địa chỉ */}
                        <p className="hero-address">Km10, Nguyen Trai Street, Ha Dong District, Hanoi</p>
                        
                        <div className="hero-buttons">
                            {/* SỬA: Nút điều hướng */}
                            <Link to="/about" className="btn btn-residem-primary">ABOUT US</Link>
                            <Link to="/news" className="btn btn-residem-secondary">LATEST NEWS</Link>
                        </div>
                    </div>
                </div>
                
                {/* Thanh bottom bar */}
                <div className="hero-bottom-bar">
                    <div className="container">
                        <div className="row">
                            <div className="col-md-3">Spacious Rooms</div>
                            <div className="col-md-3">Private Garden</div>
                            <div className="col-md-3">Walk-in Closets</div>
                            <div className="col-md-3">Swimming Pool</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- GALLERY SECTION (THEME SÁNG) --- */}
            <section className="gallery-section-light container my-5">
                <div className="text-center mb-4">
                    <p className="sub-heading">Discover Gallery</p>
                    <h2>Exterior & Interior</h2>
                </div>
                <div className="filter-buttons text-center mb-4">
                    <button className="btn btn-residem-filter active">View All</button>
                    <button className="btn btn-residem-filter">Exterior</button>
                    <button className="btn btn-residem-filter">Interior</button>
                    <button className="btn btn-residem-filter">Facilities</button>
                </div>
                <div className="row g-3">
                    {galleryImages.map((image, index) => (
                        <div className="col-lg-3 col-md-4 col-sm-6" key={index}>
                            <div className="gallery-image-wrapper">
                                <img src={image.src} alt={image.alt} className="img-fluid gallery-image" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
};

export default Homepage;
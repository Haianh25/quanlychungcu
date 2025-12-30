import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

const Homepage = () => {

    const galleryImages = [

        { src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Asian modern apartment living room" },
        { src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Bright apartment interior" },
        { src: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Cozy apartment space" },
        { src: "https://images.unsplash.com/photo-1752543523195-aa4916950b40?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzl8fGFzaWFuJTIwYXBhcnRtZW50fGVufDB8fDB8fHww", alt: "Modern kitchen apartment" },
        

        { src: "https://images.unsplash.com/photo-1515263487990-61b07816b324?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "High-rise apartment complex" },
        { src: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Modern residential building" },
        { src: "https://images.unsplash.com/photo-1460317442991-0ec209397118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Apartment balcony view" },
        { src: "https://images.unsplash.com/photo-1486325212027-8081e485255e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Urban apartment exterior" },
        
        { src: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Apartment Gym" },
        { src: "https://images.unsplash.com/photo-1621949913544-e5c1f817a050?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTEzfHxhc2lhbiUyMGFwYXJ0bWVudHxlbnwwfHwwfHx8MA%3D%3D", alt: "Rooftop pool" },
        { src: "https://images.unsplash.com/photo-1738638728584-66f72bd47f6e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzN8fGFzaWFuJTIwYXBhcnRtZW50fGVufDB8fDB8fHww", alt: "Apartment lobby hallway" },
        { src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Community meeting room" },
    ];

    return (
        <>
            <section 
                className="hero-section residem-hero" 
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1800&q=80')` }}
            >
                <div className="hero-overlay"></div>

                <div className="hero-content-wrapper">
                    <div className="hero-content">

                        <h1>Modern Living, Thoughtfully Designed</h1>

                        <p className="hero-address">Km10, Nguyen Trai Street, Ha Dong District, Hanoi</p>
                        
                        <div className="hero-buttons">
                            <Link to="/about" className="btn btn-residem-primary">ABOUT US</Link>
                            <Link to="/news" className="btn btn-residem-secondary">LATEST NEWS</Link>
                        </div>
                    </div>
                </div>
                
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

            <section className="gallery-section-light container my-5">
                <div className="text-center mb-4">
                    <p className="sub-heading">Discover Gallery</p>

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
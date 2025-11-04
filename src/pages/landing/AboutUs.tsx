import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Carousel } from "react-bootstrap";
import { FormatQuote } from "@mui/icons-material";

type Props = {
  showHero?: boolean;
  showStats?: boolean;
  showIntro?: boolean;
  showServices?: boolean;
  showInstagram?: boolean;
};

const AboutUs: React.FC<Props> = ({
  showHero = true,
  showStats = true,
  showIntro = true,
  showServices = true,
  showInstagram = true,
}) => {
  const stats = [
    { label: "Happy Guests", value: 50000 },
    { label: "Rooms", value: 3000 },
    { label: "Staffs", value: 1000 },
    { label: "Destination", value: 100 },
  ];

  const [counts, setCounts] = useState(stats.map(() => 0));
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!showStats) return;
    const handleScroll = () => {
      if (!sectionRef.current || hasAnimated.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        hasAnimated.current = true;
        stats.forEach((stat, index) => {
          let start = 0;
          const end = stat.value;
          const duration = 2000;
          const stepTime = Math.max(Math.floor(duration / end), 1);
          const timer = setInterval(() => {
            start += Math.ceil(end / 100);
            if (start >= end) {
              start = end;
              clearInterval(timer);
            }
            setCounts((prev) => {
              const updated = [...prev];
              updated[index] = start;
              return updated;
            });
          }, stepTime);
        });
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showStats]);

  return (
    <>
      <style>{`
        .about-hero {
          position: relative;
          width: 100%;
          height: 420px;
          background-image: url('/src/assets/images/bg_2.jpg');
          background-size: cover;
          background-position: center center;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          color: white;
          text-align: center;
        }

        .about-hero::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.45);
        }

        .about-hero-content {
          position: relative;
          z-index: 2;
        }

        /* ---------------- BREADCRUMB (UI giống ảnh) ---------------- */
        .breadcrumb {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(6px);
          padding: 6px 20px;
          border-radius: 30px;
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
          margin-bottom: 12px;
        }

        .breadcrumb a {
          color: #fff;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .breadcrumb a:hover {
          color: #f5d48f;
        }

        .breadcrumb span {
          color: #fff;
          opacity: 0.85;
        }

        .about-hero-content h1 {
          font-size: 58px;
          font-weight: 600;
          margin: 0;
        }

        /* ---------- STATS ---------- */
        .stats-section {
          width: 100%;
          background-color: #9c7c3f;
          color: white;
          text-align: center;
          padding: 65px 20px 55px;
        }

        .stats-grid {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 100px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .stat-item {
          min-width: 150px;
        }

        .stat-number {
          font-size: 34px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .stat-label {
          font-size: 15px;
          opacity: 0.9;
        }

        /* ---------- ABOUT INTRO ---------- */
        .about-intro {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 80px;
          max-width: 1200px;
          margin: 120px auto;
          padding: 0 60px;
          flex-wrap: wrap;
        }

        .intro-video {
          flex: 1;
          min-width: 420px;
        }

        .intro-video iframe {
          width: 100%;
          height: 440px;
          border: none;
          border-radius: 6px;
        }

        .intro-text {
          flex: 1;
          min-width: 420px;
        }

        .intro-subtitle {
          color: #9c7c3f;
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 10px;
        }

        .intro-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          font-weight: 600;
          color: #000;
          margin-bottom: 25px;
        }

        .intro-text p {
          color: #666;
          line-height: 1.8;
          margin-bottom: 20px;
        }

        .social-icons {
          display: flex;
          gap: 16px;
          margin-top: 10px;
        }

        .social-icons i {
          color: #9c7c3f;
          font-size: 16px;
          transition: 0.2s;
          cursor: pointer;
        }

        .social-icons i:hover {
          color: #b28c4c;
        }

        /* ---------- SERVICES ---------- */
        .services-section {
          margin-top: 100px;
          text-align: center;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
        }

        .service-card {
          padding: 30px 15px;
        }

        .service-icon {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background-color: #f8f5f0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .service-icon i {
          font-size: 38px;
          color: #b99365;
        }

        .service-card h4 {
          font-size: 20px;
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          color: #000;
          margin-bottom: 10px;
        }

        .service-card p {
          font-size: 15px;
          color: #777;
          max-width: 250px;
          margin: 0 auto;
        }

        /* ---------- INSTAGRAM ---------- */
        .instagram-section {
          margin-top: 100px;
        }

        .instagram-section h3 {
          text-align: center;
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 40px;
        }

        .insta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .insta-grid img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          transition: 0.3s;
        }

        .insta-grid img:hover { transform: scale(1.05); }

        /* ---------- TESTIMONIALS ---------- */
        .testimonials-section-landing {
          padding: 80px 20px;
          background: #ffffff;
        }

        .testimonials-section-landing h3 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
        }

        .testimonials-carousel-landing {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px 0;
        }

        .testimonials-carousel-landing .carousel-inner {
          min-height: 400px;
        }

        .testimonials-carousel-landing .carousel-item {
          min-height: 400px;
        }

        .testimonials-carousel-landing .carousel-control-prev,
        .testimonials-carousel-landing .carousel-control-next {
          width: 50px;
          height: 50px;
          background-color: rgba(198, 166, 103, 0.9);
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
          opacity: 1;
        }

        .testimonials-carousel-landing .carousel-control-prev:hover,
        .testimonials-carousel-landing .carousel-control-next:hover {
          background-color: #c6a667;
        }

        .testimonials-carousel-landing .carousel-control-prev {
          left: -60px;
        }

        .testimonials-carousel-landing .carousel-control-next {
          right: -60px;
        }

        .testimonials-carousel-landing .carousel-indicators {
          margin-bottom: -40px;
        }

        .testimonials-carousel-landing .carousel-indicators button {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #c6a667;
          border: none;
          margin: 0 5px;
        }

        .testimonial-card-landing {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          padding: 60px 50px;
          border-radius: 20px;
          text-align: center;
          min-height: 380px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          margin: 0 auto;
          max-width: 800px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .testimonial-card-landing:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
        }

        .quote-icon-landing {
          color: #c6a667;
          margin-bottom: 20px;
          opacity: 0.3;
        }

        .testimonial-text-landing {
          font-size: 1.2rem;
          line-height: 1.9;
          color: #495057;
          font-style: italic;
          margin-bottom: 30px;
        }

        .testimonial-author-landing {
          font-size: 1.1rem;
          margin-top: 20px;
          color: #2c3e50;
        }

        .testimonial-author-landing strong {
          font-weight: 600;
          color: #1a1a1a;
        }

        .testimonial-author-landing span {
          color: #6c757d;
        }

        .rating-landing {
          margin-top: 15px;
          font-size: 1.3rem;
        }

        @media (max-width: 992px) {
          .testimonials-carousel-landing .carousel-control-prev,
          .testimonials-carousel-landing .carousel-control-next {
            display: none;
          }

          .testimonial-card-landing {
            padding: 40px 30px;
            min-height: 320px;
          }

          .testimonial-text-landing {
            font-size: 1.05rem;
          }
        }

        @media (max-width: 768px) {
          .testimonials-section-landing {
            padding: 60px 15px;
          }

          .testimonials-section-landing h3 {
            font-size: 2rem;
          }

          .testimonial-card-landing {
            padding: 30px 20px;
            min-height: auto;
          }

          .testimonial-text-landing {
            font-size: 1rem;
          }
        }

        @media (max-width: 992px) {
          .about-intro {
            flex-direction: column;
            text-align: center;
            gap: 50px;
          }
          .intro-video iframe {
            height: 360px;
          }
        }
      `}</style>

      {/* ---------- HERO ---------- */}
      {showHero && (
        <section className="about-hero">
          <div className="about-hero-content">
            <div className="breadcrumb">
              <Link to="/">Home</Link>
              <span>›</span>
              <span>About</span>
            </div>
            <h1>About Us</h1>
          </div>
        </section>
      )}

      {/* ---------- STATS ---------- */}
      {showStats && (
        <section className="stats-section" ref={sectionRef}>
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div className="stat-item" key={i}>
                <div className="stat-number">{counts[i].toLocaleString()}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- ABOUT INTRO ---------- */}
      {showIntro && (
        <section className="about-intro">
          <div className="intro-video">
            <iframe
              src="https://player.vimeo.com/video/45830194"
              title="Hotel Video"
              allowFullScreen
            ></iframe>
          </div>
          <div className="intro-text">
            <h2 className="intro-title">Welcome To Our Hotel</h2>
            <p>
              On her way she met a copy. The copy warned the Little Blind Text,
              that where it came from it would have been rewritten a thousand
              times and everything that was left from its origin would be the word
              "and" and the Little Blind Text should turn around and return to its
              own, safe country. But nothing the copy said could convince her and
              so it didn’t take long until a few insidious Copy Writers ambushed
              her, made her drunk with Longe and Parole and dragged her into their
              agency, where they abused her for their.
            </p>
            <p>
              When she reached the first hills of the Italic Mountains, she had a
              last view back on the skyline of her hometown Bookmarksgrove, the
              headline of Alphabet Village and the subline of her own road, the
              Line Lane. Pityful a rethoric question ran over her cheek, then she
              continued her way.
            </p>
            <div className="social-icons">
              <i className="fab fa-twitter"></i>
              <i className="fab fa-facebook-f"></i>
              <i className="fab fa-google-plus-g"></i>
              <i className="fab fa-instagram"></i>
            </div>
          </div>
        </section>
      )}

      {/* ---------- SERVICES ---------- */}
      {showServices && (
        <section className="services-section">
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-concierge-bell"></i></div>
              <h4>24/7 Front Desk</h4>
              <p>A small river named Duden flows by their place and supplies.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-utensils"></i></div>
              <h4>Restaurant Bar</h4>
              <p>A small river named Duden flows by their place and supplies.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-car"></i></div>
              <h4>Transfer Services</h4>
              <p>A small river named Duden flows by their place and supplies.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-spa"></i></div>
              <h4>Spa Suites</h4>
              <p>A small river named Duden flows by their place and supplies.</p>
            </div>
          </div>
        </section>
      )}

      {/* ---------- INSTAGRAM ---------- */}
      {showInstagram && (
        <section className="instagram-section">
          <h3>Instagram</h3>
          <div className="insta-grid">
            <img src="https://themewagon.github.io/deluxe/images/insta-1.jpg" alt="insta1" />
            <img src="https://themewagon.github.io/deluxe/images/insta-2.jpg" alt="insta2" />
            <img src="https://themewagon.github.io/deluxe/images/insta-3.jpg" alt="insta3" />
            <img src="https://themewagon.github.io/deluxe/images/insta-4.jpg" alt="insta4" />
          </div>
        </section>
      )}

      {/* ---------- TESTIMONIALS CAROUSEL ---------- */}
      <section className="testimonials-section-landing">
        <div className="container">
          <h3 className="text-center mb-5">What Our Guests Say</h3>
          <Carousel 
            interval={4000} 
            pause="hover" 
            indicators={true}
            controls={true}
            className="testimonials-carousel-landing"
          >
            <Carousel.Item>
              <div className="testimonial-card-landing">
                <div className="quote-icon-landing">
                  <FormatQuote sx={{ fontSize: 60 }} />
                </div>
                <p className="testimonial-text-landing">
                  "An exceptional experience from start to finish. The attention to detail and 
                  personalized service made our anniversary celebration truly memorable. The rooms 
                  are beautifully designed with a perfect blend of luxury and comfort."
                </p>
                <div className="testimonial-author-landing">
                  <strong>Sarah & Michael Chen</strong>
                  <span> • Singapore</span>
                </div>
                <div className="rating-landing">⭐⭐⭐⭐⭐</div>
              </div>
            </Carousel.Item>

            <Carousel.Item>
              <div className="testimonial-card-landing">
                <div className="quote-icon-landing">
                  <FormatQuote sx={{ fontSize: 60 }} />
                </div>
                <p className="testimonial-text-landing">
                  "The perfect blend of modern amenities and timeless elegance. Every staff member 
                  went above and beyond to ensure our stay was flawless. The location is ideal, 
                  and the dining experience exceeded all expectations."
                </p>
                <div className="testimonial-author-landing">
                  <strong>James Anderson</strong>
                  <span> • London, UK</span>
                </div>
                <div className="rating-landing">⭐⭐⭐⭐⭐</div>
              </div>
            </Carousel.Item>

            <Carousel.Item>
              <div className="testimonial-card-landing">
                <div className="quote-icon-landing">
                  <FormatQuote sx={{ fontSize: 60 }} />
                </div>
                <p className="testimonial-text-landing">
                  "I've stayed at many luxury hotels around the world, but Grande Hotel stands out 
                  for its genuine warmth and impeccable service. The spa facilities are world-class, 
                  and the breakfast spread is absolutely divine. Will definitely return!"
                </p>
                <div className="testimonial-author-landing">
                  <strong>Dr. Emily Nguyen</strong>
                  <span> • New York, USA</span>
                </div>
                <div className="rating-landing">⭐⭐⭐⭐⭐</div>
              </div>
            </Carousel.Item>

            <Carousel.Item>
              <div className="testimonial-card-landing">
                <div className="quote-icon-landing">
                  <FormatQuote sx={{ fontSize: 60 }} />
                </div>
                <p className="testimonial-text-landing">
                  "A tranquil oasis in the heart of the city. The rooms are spacious and beautifully 
                  appointed, the staff is incredibly professional yet friendly, and the overall 
                  atmosphere is one of refined luxury. Highly recommended for business or leisure."
                </p>
                <div className="testimonial-author-landing">
                  <strong>Robert & Lisa Martinez</strong>
                  <span> • Sydney, Australia</span>
                </div>
                <div className="rating-landing">⭐⭐⭐⭐⭐</div>
              </div>
            </Carousel.Item>

            <Carousel.Item>
              <div className="testimonial-card-landing">
                <div className="quote-icon-landing">
                  <FormatQuote sx={{ fontSize: 60 }} />
                </div>
                <p className="testimonial-text-landing">
                  "From the moment we arrived, we felt welcomed and valued. The concierge team 
                  provided excellent recommendations for local attractions. Our suite had stunning 
                  views, and every detail was thoughtfully curated. An unforgettable stay!"
                </p>
                <div className="testimonial-author-landing">
                  <strong>Sophie Dubois</strong>
                  <span> • Paris, France</span>
                </div>
                <div className="rating-landing">⭐⭐⭐⭐⭐</div>
              </div>
            </Carousel.Item>
          </Carousel>
        </div>
      </section>
    </>
  );
};

export default AboutUs;

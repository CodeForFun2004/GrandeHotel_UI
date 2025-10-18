import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const AboutUs: React.FC = () => {
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
  }, []);

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

        .breadcrumb {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .breadcrumb a {
          color: #fff;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 1px;
          transition: 0.2s;
        }

        .breadcrumb a:hover {
          color: #f5d48f;
        }

        .breadcrumb span {
          color: #fff;
          font-weight: 600;
          font-size: 15px;
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
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="breadcrumb">
            <Link to="/">HOME</Link>
            <span>/</span>
            <span>ABOUT</span>
          </div>
          <h1>About Us</h1>
        </div>
      </section>

      {/* ---------- STATS ---------- */}
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

      {/* ---------- ABOUT INTRO ---------- */}
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

      {/* ---------- SERVICES ---------- */}
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

      {/* ---------- INSTAGRAM ---------- */}
      <section className="instagram-section">
        <h3>Instagram</h3>
        <div className="insta-grid">
          <img src="https://themewagon.github.io/deluxe/images/insta-1.jpg" alt="insta1" />
          <img src="https://themewagon.github.io/deluxe/images/insta-2.jpg" alt="insta2" />
          <img src="https://themewagon.github.io/deluxe/images/insta-3.jpg" alt="insta3" />
          <img src="https://themewagon.github.io/deluxe/images/insta-4.jpg" alt="insta4" />
        </div>
      </section>
    </>
  );
};

export default AboutUs;

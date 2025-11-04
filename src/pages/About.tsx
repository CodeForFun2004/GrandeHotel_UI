import React, { useEffect, useMemo, useRef, useState } from "react";
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

type Stat = { label: string; value: number };

const AboutUs: React.FC<Props> = ({
  showHero = true,
  showStats = true,
  showIntro = true,
  showServices = true,
  showInstagram = true,
}) => {
  // Data tách riêng cho gọn
  const stats: Stat[] = useMemo(
    () => [
      { label: "Happy Guests", value: 50000 },
      { label: "Rooms", value: 3000 },
      { label: "Staffs", value: 1000 },
      { label: "Destination", value: 100 },
    ],
    []
  );

  const testimonials = useMemo(
    () => [
      {
        text:
          "An exceptional experience from start to finish. The attention to detail and personalized service made our anniversary truly memorable. The rooms blend luxury and comfort perfectly.",
        author: "Sarah & Michael Chen",
        where: "Singapore",
      },
      {
        text:
          "The perfect balance of modern amenities and timeless elegance. Staff went above and beyond; location is ideal; dining exceeded expectations.",
        author: "James Anderson",
        where: "London, UK",
      },
      {
        text:
          "Among many luxury hotels worldwide, Grande Hotel stands out for its genuine warmth and impeccable service. World-class spa and a divine breakfast.",
        author: "Dr. Emily Nguyen",
        where: "New York, USA",
      },
      {
        text:
          "A tranquil oasis in the city. Spacious rooms, professional yet friendly staff, and an atmosphere of refined luxury. Great for business or leisure.",
        author: "Robert & Lisa Martinez",
        where: "Sydney, Australia",
      },
      {
        text:
          "We felt welcomed the moment we arrived. Concierge gave great local tips. Stunning views and thoughtful details. Unforgettable stay!",
        author: "Sophie Dubois",
        where: "Paris, France",
      },
    ],
    []
  );

  // ------- Count-up (mượt, chính xác, không giật) -------
  const [counts, setCounts] = useState<number[]>(stats.map(() => 0));
  const statsRef = useRef<HTMLDivElement | null>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!showStats || !statsRef.current) return;

    const el = statsRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        if (isVisible && !animatedRef.current) {
          animatedRef.current = true;

          const duration = 1600;
          const start = performance.now();
          const from = counts.slice();
          const to = stats.map((s) => s.value);

          const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - t, 3);

            setCounts(
              to.map((end, i) => Math.round(from[i] + (end - from[i]) * eased))
            );

            if (t < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }
      },
      { rootMargin: "0px 0px -20% 0px", threshold: [0, 0.15, 0.3] }
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStats, stats.length]);

  return (
    <>
      {/* ------- PAGE-LEVEL CSS: tách style quan trọng để tránh xung đột ------- */}
      <style>{`
        /* ---------- HERO ---------- */
        .about-hero {
          position: relative;
          width: 100%;
          min-height: 460px;
          background-image: linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.45)), url('/src/assets/images/bg_2.jpg');
          background-size: cover;
          background-position: center;
          display: grid;
          place-items: center;
          text-align: center;
          color: #fff;
          overflow: hidden;
        }
        .about-hero-content {
          padding: 24px;
          backdrop-filter: blur(2px);
          animation: fadeUp .6s ease both;
        }
        .breadcrumb-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 18px;
          border-radius: 999px;
          background: rgba(255,255,255,.16);
          border: 1px solid rgba(255,255,255,.18);
          box-shadow: 0 8px 24px rgba(0,0,0,.15) inset;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .breadcrumb-chip a { color: #fff; text-decoration: none; }
        .breadcrumb-chip a:hover { color: #f5d48f; }
        .about-title {
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 700;
          letter-spacing: .5px;
          margin: 6px 0 4px;
        }
        .about-subtitle {
          opacity: .9;
          font-size: 16px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ---------- STATS (glass) ---------- */
        .stats-wrap {
          background: linear-gradient(180deg, #9c7c3f, #b69554);
          color: #fff;
          padding: 64px 20px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(140px, 1fr));
          gap: clamp(24px, 6vw, 80px);
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (max-width: 992px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }
        .stat-card {
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 16px;
          padding: 22px 18px;
          text-align: center;
          box-shadow: 0 6px 18px rgba(0,0,0,.12);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,.18); }
        .stat-number { font-size: 34px; font-weight: 800; letter-spacing: .4px; }
        .stat-label { opacity: .95; margin-top: 6px; }

        /* ---------- ABOUT INTRO ---------- */
        .about-intro {
          max-width: 1200px;
          margin: 90px auto;
          padding: 0 clamp(16px, 4vw, 60px);
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: clamp(24px, 6vw, 64px);
        }
        @media (max-width: 992px) {
          .about-intro { grid-template-columns: 1fr; margin: 70px auto; }
        }
        .intro-video iframe {
          width: 100%;
          aspect-ratio: 16/9;
          border: none;
          border-radius: 14px;
          box-shadow: 0 14px 36px rgba(0,0,0,.18);
        }
        .intro-subtitle { color: #9c7c3f; font-weight: 600; letter-spacing: .4px; }
        .intro-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 3.4vw, 44px);
          margin: 8px 0 14px;
          color: #101010;
        }
        .intro-text p { color: #5c5c5c; line-height: 1.9; margin-bottom: 14px; }
        .social-icons { display: flex; gap: 14px; margin-top: 10px; }
        .social-icons i {
          width: 38px; height: 38px; display: inline-grid; place-items: center;
          border-radius: 50%;
          background: #f7f2ea;
          color: #b99365;
          transition: transform .2s ease, filter .2s ease;
        }
        .social-icons i:hover { transform: translateY(-2px); filter: brightness(0.95); }

        /* ---------- SERVICES ---------- */
        .services-section { margin-top: 80px; padding: 0 clamp(16px, 4vw, 60px); }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(220px, 1fr));
          gap: clamp(16px, 3vw, 28px);
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (max-width: 1100px) { .services-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px)  { .services-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px)  { .services-grid { grid-template-columns: 1fr; } }

        .service-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 18px;
          padding: 26px 18px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(0,0,0,.06);
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .service-card:hover { transform: translateY(-6px); box-shadow: 0 14px 36px rgba(0,0,0,.12); border-color: #ead9bd; }
        .service-icon {
          width: 90px; height: 90px; margin: 0 auto 16px;
          border-radius: 50%;
          background: #fbf7ef;
          display: grid; place-items: center;
        }
        .service-icon i { font-size: 36px; color: #b99365; }
        .service-card h4 {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          color: #141414;
          margin-bottom: 8px;
        }
        .service-card p { color: #6f6f6f; max-width: 260px; margin: 0 auto; }

        /* ---------- INSTAGRAM ---------- */
        .instagram-section { margin-top: 90px; padding: 0 clamp(16px, 4vw, 60px); }
        .instagram-section h3 { text-align: center; font-weight: 700; margin-bottom: 28px; }
        .insta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px; max-width: 1100px; margin: 0 auto;
        }
        @media (max-width: 992px) { .insta-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .insta-grid { grid-template-columns: repeat(2, 1fr); } }
        .insta-grid img {
          width: 100%; height: 220px; object-fit: cover; border-radius: 12px;
          transition: transform .3s ease, box-shadow .3s ease, filter .3s ease;
          box-shadow: 0 10px 24px rgba(0,0,0,.08);
        }
        .insta-grid img:hover { transform: translateY(-4px) scale(1.03); filter: saturate(1.05); }

        /* ---------- TESTIMONIALS (Landing) ---------- */
        .testimonials-section-landing {
          padding: 80px clamp(16px, 4vw, 60px);
          background: #ffffff;
        }
        .testimonials-title {
          font-size: clamp(26px, 3vw, 40px);
          font-weight: 800;
          text-align: center;
          color: #2c3e50;
          margin-bottom: 36px;
        }
        .testimonials-carousel-landing {
          max-width: 940px; margin: 0 auto; position: relative;
        }
        .testimonial-card-landing {
          background: #f9fafb;
          border: 1px solid #e9e9e9;
          padding: clamp(32px, 4.4vw, 64px);
          border-radius: 22px;
          text-align: center;
          min-height: 340px;
          display: flex; flex-direction: column; justify-content: center;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.08);
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .testimonial-card-landing:hover {
          transform: translateY(-6px);
          box-shadow: 0 22px 48px rgba(0,0,0,.12);
          border-color: #e3d1ad;
        }
        .quote-icon-landing { color: #c6a667; opacity: .35; margin-bottom: 16px; }
        .testimonial-text-landing { color: #4b5563; line-height: 1.9; font-size: 1.12rem; font-style: italic; }
        .testimonial-author-landing { margin-top: 16px; color: #1f2937; }
        .testimonial-author-landing span { color: #6b7280; }
        .rating-landing { margin-top: 10px; font-size: 1.2rem; letter-spacing: 1px; }

        /* Carousel buttons/indicators custom */
        .testimonials-carousel-landing .carousel-control-prev,
        .testimonials-carousel-landing .carousel-control-next {
          width: 52px; height: 52px;
          background: rgba(198,166,103,.95);
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
          opacity: 1 !important;
          box-shadow: 0 10px 20px rgba(0,0,0,.18);
        }
        .testimonials-carousel-landing .carousel-control-prev:hover,
        .testimonials-carousel-landing .carousel-control-next:hover {
          filter: brightness(0.95);
        }
        .testimonials-carousel-landing .carousel-control-prev { left: -62px; }
        .testimonials-carousel-landing .carousel-control-next { right: -62px; }

        @media (max-width: 992px) {
          .testimonials-carousel-landing .carousel-control-prev,
          .testimonials-carousel-landing .carousel-control-next { display: none; }
        }

        .testimonials-carousel-landing .carousel-indicators { margin-bottom: -34px; }
        .testimonials-carousel-landing .carousel-indicators button {
          width: 10px; height: 10px; border-radius: 999px; border: 0;
          background: #d7c39a; opacity: .9; transition: transform .2s ease;
        }
        .testimonials-carousel-landing .carousel-indicators .active {
          transform: scale(1.18);
          background: #c6a667;
        }
      `}</style>

      {/* ---------- HERO ---------- */}
      {showHero && (
        <section className="about-hero">
          <div className="about-hero-content">
            <div className="breadcrumb-chip">
              <Link to="/">Home</Link>
              <span>›</span>
              <span>About</span>
            </div>
            <h1 className="about-title">About Us</h1>
            <p className="about-subtitle">Grande Hotel • Since 1998 • Crafted Luxury</p>
          </div>
        </section>
      )}

      {/* ---------- STATS ---------- */}
      {showStats && (
        <section className="stats-wrap" ref={statsRef}>
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-number">{counts[i].toLocaleString()}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- INTRO ---------- */}
      {showIntro && (
        <section className="about-intro">
          <div className="intro-video">
            <iframe
              src="https://player.vimeo.com/video/45830194"
              title="Hotel Video"
              allowFullScreen
            />
          </div>

          <div className="intro-text">
            <div className="intro-subtitle">Our Story</div>
            <h2 className="intro-title">Welcome To Our Hotel</h2>
            <p>
              On her way she met a copy. The copy warned the Little Blind Text,
              that where it came from it would have been rewritten a thousand times…
              But nothing the copy said could convince her until a few insidious
              Copy Writers dragged her into their agency.
            </p>
            <p>
              When she reached the first hills of the Italic Mountains, she had a
              last view back on the skyline of Bookmarksgrove and continued her way.
            </p>
            <div className="social-icons" aria-label="Socials">
              <i className="fab fa-twitter" aria-hidden />
              <i className="fab fa-facebook-f" aria-hidden />
              <i className="fab fa-google-plus-g" aria-hidden />
              <i className="fab fa-instagram" aria-hidden />
            </div>
          </div>
        </section>
      )}

      {/* ---------- SERVICES ---------- */}
      {showServices && (
        <section className="services-section">
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-concierge-bell" /></div>
              <h4>24/7 Front Desk</h4>
              <p>Dedicated concierge and seamless check-in around the clock.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-utensils" /></div>
              <h4>Restaurant & Bar</h4>
              <p>Signature menus, curated wines, and ambient live music.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-car" /></div>
              <h4>Transfer Services</h4>
              <p>Private airport pickups and bespoke city rides on demand.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-spa" /></div>
              <h4>Spa Suites</h4>
              <p>World-class therapies, sauna & steam for total rejuvenation.</p>
            </div>
          </div>
        </section>
      )}

      {/* ---------- INSTAGRAM ---------- */}
      {showInstagram && (
        <section className="instagram-section">
          <h3>Instagram</h3>
          <div className="insta-grid">
            <img src="https://themewagon.github.io/deluxe/images/insta-1.jpg" alt="Insta 1" />
            <img src="https://themewagon.github.io/deluxe/images/insta-2.jpg" alt="Insta 2" />
            <img src="https://themewagon.github.io/deluxe/images/insta-3.jpg" alt="Insta 3" />
            <img src="https://themewagon.github.io/deluxe/images/insta-4.jpg" alt="Insta 4" />
          </div>
        </section>
      )}

      {/* ---------- TESTIMONIALS CAROUSEL (đẹp hơn) ---------- */}
      <section className="testimonials-section-landing">
        <h3 className="testimonials-title">What Our Guests Say</h3>

        <Carousel
          className="testimonials-carousel-landing"
          fade
          touch
          keyboard
          interval={5200}
          pause="hover"
          indicators
          controls
          prevIcon={<span aria-hidden="true" className="carousel-control-prev-icon" />}
          nextIcon={<span aria-hidden="true" className="carousel-control-next-icon" />}
        >
          {testimonials.map((t, idx) => (
            <Carousel.Item key={idx}>
              <div className="testimonial-card-landing">
                <div className="quote-icon-landing">
                  <FormatQuote sx={{ fontSize: 56 }} />
                </div>
                <p className="testimonial-text-landing">“{t.text}”</p>
                <div className="testimonial-author-landing">
                  <strong>{t.author}</strong>
                  <span> • {t.where}</span>
                </div>
                <div className="rating-landing" aria-label="5 star rating">
                  ★★★★★
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </section>
    </>
  );
};

export default AboutUs;

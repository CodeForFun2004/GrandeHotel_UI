import React from "react";
import { Link } from "react-router-dom";

type Props = {
  showHero?: boolean;
};

const Contact: React.FC<Props> = ({ showHero = true }) => {
  const mapQuery = "198 West 21th Street, Suite 721, New York, NY 10016";

  const styles = {
    page: {
      fontFamily: "'Poppins', sans-serif",
      color: "#666",
      backgroundColor: "#fff",
      display: "flex",
      flexDirection: "column" as const,
      minHeight: "100vh",
    },

    /* HERO — đồng bộ với AboutUs */
    hero: {
      position: "relative" as const,
      width: "100%",
      height: 420,
      backgroundImage: "url('/src/assets/images/bg_2.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column" as const,
      color: "#fff",
      textAlign: "center" as const,
    },
    overlay: {
      content: '""',
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.45)",
    },
    heroInner: { position: "relative" as const, zIndex: 2 },

    breadcrumb: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      background: "rgba(255,255,255,0.12)",
      backdropFilter: "blur(6px)",
      padding: "6px 20px",
      borderRadius: 30,
      color: "#fff",
      fontSize: 15,
      fontWeight: 500,
      boxShadow: "0 0 8px rgba(0,0,0,0.2)",
      marginBottom: 12,
    },
    breadcrumbLink: {
      color: "#fff",
      textDecoration: "none",
      fontWeight: 500,
      transition: "color 0.2s ease",
    },
    breadcrumbSep: { opacity: 0.85 },
    heroTitle: {
      fontSize: 58,
      fontWeight: 600,
      margin: 0,
    },

    /* BODY */
    section: { background: "#f8f9fb", padding: "70px 10%" },

    sectionTitle: {
      fontSize: 32,
      fontWeight: 600,
      color: "#222",
      marginBottom: 26,
    },

    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 28,
      marginBottom: 40,
    },
    infoCard: {
      background: "#fff",
      borderRadius: 6,
      boxShadow: "0 1px 0 rgba(0,0,0,.03)",
      border: "1px solid #eee",
      padding: "22px 24px",
      minHeight: 110,
      display: "flex",
      alignItems: "center",
    },
    infoLabel: { color: "#888", marginRight: 8 },
    infoValue: { color: "#222", fontWeight: 600 },

    bottomGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 40,
      alignItems: "start",
    },

    mapWrap: {
      position: "relative" as const,
      background: "#e9ecef",
      height: 420,
      borderRadius: 6,
      overflow: "hidden",
      border: "1px solid #eee",
    } as React.CSSProperties,
    iframe: {
      position: "absolute" as const,
      inset: 0,
      width: "100%",
      height: "100%",
      border: 0,
      display: "block",
    } as React.CSSProperties,

    formWrap: {
      background: "#fff",
      borderRadius: 6,
      border: "1px solid #eee",
      padding: 30,
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      border: "1px solid #dfe3e8",
      borderRadius: 4,
      fontSize: 15,
      outline: "none",
      marginBottom: 16,
      transition: "border-color .2s",
    } as React.CSSProperties,
    textarea: {
      width: "100%",
      padding: "12px 14px",
      border: "1px solid #dfe3e8",
      borderRadius: 4,
      fontSize: 15,
      outline: "none",
      minHeight: 160,
      resize: "vertical" as const,
      marginBottom: 16,
      transition: "border-color .2s",
    },
    submit: {
      display: "inline-block",
      background: "#b6895b",
      color: "#fff",
      border: "none",
      padding: "12px 26px",
      borderRadius: 4,
      fontWeight: 600,
      cursor: "pointer",
      transition: "background .25s, transform .05s",
    } as React.CSSProperties,
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "#b6895b");
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "#dfe3e8");

  return (
    <div style={styles.page}>
      {/* ---------- HERO ---------- */}
      {showHero && (
        <header style={styles.hero}>
          <div style={styles.overlay} />
          <div style={styles.heroInner}>
            <div style={styles.breadcrumb as React.CSSProperties}>
              <Link to="/" style={styles.breadcrumbLink}>
                Home
              </Link>
              <span style={styles.breadcrumbSep}>›</span>
              <span>Contact</span>
            </div>
            <h1 style={styles.heroTitle}>Contact Us</h1>
          </div>
        </header>
      )}

      {/* ---------- BODY ---------- */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Contact Information</h2>

        <div style={styles.infoGrid as React.CSSProperties}>
          <div style={styles.infoCard}>
            <div>
              <div>
                <span style={styles.infoLabel}>Address:</span>
              </div>
              <div style={{ whiteSpace: "pre-line" as const }}>
                <span style={styles.infoValue}>
                  198 West 21th Street, Suite 721 New York{"\n"}NY 10016
                </span>
              </div>
            </div>
          </div>

          <div style={styles.infoCard}>
            <div>
              <span style={styles.infoLabel}>Phone:</span>
              <a
                href="tel:+1235235598"
                style={{
                  ...styles.infoValue,
                  color: "#b6895b",
                  textDecoration: "none",
                }}
              >
                + 1235 2355 98
              </a>
            </div>
          </div>

          <div style={styles.infoCard}>
            <div>
              <span style={styles.infoLabel}>Email:</span>
              <a
                href="mailto:info@yoursite.com"
                style={{
                  ...styles.infoValue,
                  color: "#b6895b",
                  textDecoration: "none",
                }}
              >
                info@yoursite.com
              </a>
            </div>
          </div>

          <div style={styles.infoCard}>
            <div>
              <span style={styles.infoLabel}>Website:</span>{" "}
              <a
                href="#"
                style={{
                  ...styles.infoValue,
                  color: "#b6895b",
                  textDecoration: "none",
                }}
              >
                yoursite.com
              </a>
            </div>
          </div>
        </div>

        {/* MAP + FORM */}
        <div
          style={{
            ...(styles.bottomGrid as React.CSSProperties),
            ...(typeof window !== "undefined" && window.innerWidth <= 992
              ? { gridTemplateColumns: "1fr", gap: 26 }
              : {}),
          }}
        >
          <div style={styles.mapWrap}>
            <iframe
              style={styles.iframe}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                mapQuery
              )}&output=embed`}
              title="map"
            />
          </div>

          <div style={styles.formWrap}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <input
                style={styles.input}
                type="text"
                placeholder="Your Name"
                required
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <input
                style={styles.input}
                type="email"
                placeholder="Your Email"
                required
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <input
                style={styles.input}
                type="text"
                placeholder="Subject"
                required
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <textarea
                style={styles.textarea}
                placeholder="Message"
                required
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <input
                type="submit"
                value="Send Message"
                style={styles.submit}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#9b7544")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#b6895b")
                }
                onMouseDown={(e) =>
                  (e.currentTarget.style.transform = "scale(.98)")
                }
                onMouseUp={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              />
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

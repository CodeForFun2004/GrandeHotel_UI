import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Hotel, Restaurant, SupportAgent, LocationOn } from "@mui/icons-material";
import "./InfoPages.css";

const About: React.FC = () => {
  return (
    <div>
      <section className="info-hero">
        <div className="container text-center">
          <h1 className="mb-2">About Grande Hotel</h1>
          <p className="lead mb-2">Minimal luxury, meaningful comfort.</p>
          <div className="accent-bar"></div>
        </div>
      </section>

      <Container className="section">
        <Row className="g-4 align-items-stretch">
          <Col md={6}>
            <div className="feature-card">
              <div className="feature-icon"><Hotel fontSize="small" /></div>
              <h5>Thoughtful Spaces</h5>
              <p>
                Elegant rooms and suites curated with warm textures and calm tones, designed to help
                you feel rested and restored.
              </p>
            </div>
          </Col>
          <Col md={6}>
            <div className="feature-card">
              <div className="feature-icon"><Restaurant fontSize="small" /></div>
              <h5>Curated Dining</h5>
              <p>
                Seasonal menus and elevated classics—crafted to be savored, whether it’s a quiet
                breakfast or an intimate dinner.
              </p>
            </div>
          </Col>
          <Col md={6}>
            <div className="feature-card">
              <div className="feature-icon"><LocationOn fontSize="small" /></div>
              <h5>Central Locations</h5>
              <p>
                Stay close to the city’s best—business districts, cultural landmarks, and coastal views
                are always within reach.
              </p>
            </div>
          </Col>
          <Col md={6}>
            <div className="feature-card">
              <div className="feature-icon"><SupportAgent fontSize="small" /></div>
              <h5>Dedicated Service</h5>
              <p>
                A discreet team available 24/7—attentive when you need us, invisible when you don’t.
              </p>
            </div>
          </Col>
        </Row>

        <div className="mt-5 cta-box text-center">
          <h4 className="mb-2">Experience the difference</h4>
          <p className="mb-3">Reserve your next stay and feel the quiet confidence of true hospitality.</p>
          <Button href="/rooms" className="btn-accent px-4">View rooms</Button>
        </div>
      </Container>
    </div>
  );
};

export default About;

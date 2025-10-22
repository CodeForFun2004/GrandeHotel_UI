import React from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { Phone, Email, Room } from "@mui/icons-material";
import "./InfoPages.css";

const Contact: React.FC = () => {
  return (
    <div>
      <section className="info-hero">
        <div className="container text-center">
          <h1 className="mb-2">Contact Us</h1>
          <p className="lead mb-2">We’re here to help—reservations, events, or any assistance.</p>
          <div className="accent-bar"></div>
        </div>
      </section>

      <Container className="section">
        <Row className="g-4 align-items-stretch mb-2">
          <Col md={4}>
            <div className="contact-card text-center">
              <div className="contact-icon"><Phone fontSize="small" /></div>
              <h5>Phone</h5>
              <p className="mb-0">+84 123 456 789</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="contact-card text-center">
              <div className="contact-icon"><Email fontSize="small" /></div>
              <h5>Email</h5>
              <p className="mb-0">support@grandehotel.example</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="contact-card text-center">
              <div className="contact-icon"><Room fontSize="small" /></div>
              <h5>Address</h5>
              <p className="mb-0">123 Ocean View Blvd, Hà Nội</p>
            </div>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={6}>
            <div className="cta-box h-100">
              <h4 className="mb-2">Send us a message</h4>
              <p className="mb-3">We typically reply within one business day.</p>
              <Form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                <Form.Group className="mb-3" controlId="contactName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" placeholder="Your name" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="contactEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" placeholder="you@example.com" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="contactPhone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control type="tel" placeholder="+84 123 456 789" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="contactSubject">
                  <Form.Label>Subject</Form.Label>
                  <Form.Select>
                    <option value="">Select a subject</option>
                    <option value="room-price">Room & Pricing</option>
                    <option value="reservation">Reservation</option>
                    <option value="services">Services</option>
                    <option value="events">Events</option>
                    <option value="complaint">Complaint</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="contactMsg">
                  <Form.Label>Message</Form.Label>
                  <Form.Control as="textarea" rows={4} placeholder="How can we help?" />
                </Form.Group>
                <Button type="submit" className="btn-accent">Send</Button>
              </Form>
            </div>
          </Col>
          <Col md={6}>
            <div className="cta-box h-100">
              <h4 className="mb-2">Prefer to call?</h4>
              <p className="mb-0">Our guest services team is available 24/7.</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Contact;

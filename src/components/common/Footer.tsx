import React from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTwitter,
  faFacebookF,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";
import {
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import "./Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-white-50 py-5">
      <Container>
        <Row className="mb-5">
          {/* Deluxe Hotel Section */}
          <Col md={3} className="footer-text-block hehe">
            <h2 className="text-white">Grand Hotel</h2>
            <p className="left-align">
              Far far away, behind the word mountains, far from the countries
              Vokalia and Consonantia, there live the blind texts.
            </p>
            <ul className="list-unstyled d-flex mt-5 icon-list">
              <li>
                <a href="#" className="me-3 text-white">
                  <FontAwesomeIcon icon={faTwitter} size="lg" />
                </a>
              </li>
              <li>
                <a href="#" className="me-3 text-white">
                  <FontAwesomeIcon icon={faFacebookF} size="lg" />
                </a>
              </li>
              <li>
                <a href="#" className="me-3 text-white">
                  <FontAwesomeIcon icon={faInstagram} size="lg" />
                </a>
              </li>
            </ul>
          </Col>

          {/* Useful Links Section */}
          <Col className="hehe useful-links" md={{ span: 2, offset: 1 }}>
            <h2 className="text-white text-form">Useful Links</h2>
            <Nav className="flex-column">
              <Nav.Link href="#" className=" text-white-50 left-align">
                Blog 
              </Nav.Link>
              <Nav.Link href="#" className=" text-white-50 left-align">
                Rooms
              </Nav.Link>
              <Nav.Link href="#" className=" text-white-50 left-align">
                Amenities
              </Nav.Link>
              <Nav.Link href="#" className="py-2 text-white-50 left-align">
                Gift Card
              </Nav.Link>
            </Nav>
          </Col>

          {/* Privacy Section */}
          <Col className="hehe privacy" md={2}>
            <h2 className="text-white">Privacy</h2>
            <Nav className="flex-column">
              <Nav.Link href="#" className="text-white-50 left-align">
                Career
              </Nav.Link>
              <Nav.Link href="#" className="left-align text-white-50">
                About Us
              </Nav.Link>
              <Nav.Link href="#" className="left-align text-white-50">
                Contact Us
              </Nav.Link>
              <Nav.Link href="#" className="left-align text-white-50">
                Services
              </Nav.Link>
            </Nav>
          </Col>

          {/* Have a Questions? Section */}
          <Col md={3} className="hehe offset-md-1">
            <h2 className="text-white">Have a Questions?</h2>
            <ul className="list-unstyled">
              <li className="d-flex mb-3">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-3 mt-1" />
                <span className="text-white-50">
                  203 Fake St. Mountain View, San Francisco, California, USA
                </span>
              </li>
              <li className="d-flex mb-3">
                <FontAwesomeIcon icon={faPhone} className="me-3 mt-1" />
                <a href="tel:+23923929210" className="text-white-50">
                  +2 392 3929 210
                </a>
              </li>
              <li className="d-flex">
                <FontAwesomeIcon icon={faEnvelope} className="me-3 mt-1" />
                <a href="mailto:info@yourdomain.com" className="text-white-50">
                  info@yourdomain.com
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        <Row>
          <Col md={12} className="text-center">
            <p className="small text-white-50 mb-0">
              Copyright &copy;{new Date().getFullYear()} All rights reserved
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;

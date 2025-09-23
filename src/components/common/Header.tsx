import { Navbar, Nav, Container } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
const Header = () => {
  return (
    <Navbar expand="lg" variant="dark" className="deluxe-navbar" fixed="top">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="brand">
          GRAND
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="deluxe-nav" />

        <Navbar.Collapse id="deluxe-nav" className="justify-content-end">
          <Nav className="gap-2">
            <Nav.Link as={NavLink} to="/" end>Home</Nav.Link>
            <Nav.Link as={NavLink} to="/rooms">Rooms</Nav.Link>
            <Nav.Link as={NavLink} to="/restaurant">Restaurant</Nav.Link>
            <Nav.Link as={NavLink} to="/about">About</Nav.Link>
            <Nav.Link as={NavLink} to="/blog">Blog</Nav.Link>
            <Nav.Link as={NavLink} to="/contact">Contact</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header

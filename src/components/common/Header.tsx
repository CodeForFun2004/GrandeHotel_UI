import { useEffect, useState } from 'react';
import { Navbar, Nav, Container, NavLink } from 'react-bootstrap';
import './NavBar.css';

const Header = () => {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Navbar
      expand="lg"
      variant="dark"
      fixed="top"
      className={`deluxe-navbar ${solid ? 'solid' : ''}`}
    >
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
};
export default Header;

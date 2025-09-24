import { useEffect, useState } from "react";
import {
  Navbar,
  Nav,
  Container,
  Button,
  NavDropdown,
  Image,
} from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";

import "./Navbar.css";

type User = {
  username: string;
  avatar?: string; // url
};

type Props = {
  isAuthenticated: boolean;
  user?: User | null;
  onLogout?: () => void;
  /** selector của HeroSlider để xác định khi nào navbar rời khỏi hero */
  heroSelector?: string; // ví dụ "#hero"
};

const Header: React.FC<Props> = ({
  isAuthenticated,
  user,
  onLogout,
  heroSelector = "#hero",
}) => {
  const [overHero, setOverHero] = useState(true);

  useEffect(() => {
    const heroEl = document.querySelector(heroSelector);

    // Nếu tìm thấy Hero -> dùng IntersectionObserver chuẩn
    if (heroEl) {
      const io = new IntersectionObserver(
        ([entry]) => setOverHero(entry.isIntersecting),
        { threshold: 0 }
      );
      io.observe(heroEl);
      return () => io.disconnect();
    }

    // Fallback: đổi trạng thái theo scrollY
    const onScroll = () => setOverHero(window.scrollY < 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [heroSelector]);


  return (
    <Navbar
      expand="lg"
      variant="dark"
      fixed="top"
      className={`deluxe-navbar ${overHero ? "over-hero" : "scrolled"}`}
    >
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="brand">
          GRAND
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="deluxe-nav" />
        <Navbar.Collapse id="deluxe-nav" className="justify-content-center">
          {/* MENU center */}
          <Nav className="gap-3 deluxe-menu">
            <Nav.Link as={NavLink} to="/" end className="deluxe-link">
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/rooms" className="deluxe-link">
              Rooms
            </Nav.Link>
            <Nav.Link as={NavLink} to="/service" className="deluxe-link">
              Service
            </Nav.Link>
            <Nav.Link
              as={NavLink}
              to="/blog"
              className="deluxe-link"
            ></Nav.Link>
            <Nav.Link as={NavLink} to="/about" className="deluxe-link">
              About
            </Nav.Link>
            <Nav.Link as={NavLink} to="/contact" className="deluxe-link">
              Contact
            </Nav.Link>
          </Nav>

          {/* RIGHT area */}
        </Navbar.Collapse>
        <div className="d-flex align-items-center gap-2 ms-lg-4 py-10">
          {!isAuthenticated ? (
            <>
              {/* Dùng LinkContainer để tránh lỗi TS 2322 */}
              <LinkContainer to="/auth/login">
                <Button className="btn-pill btn-login" variant="outline-light">
                  Login
                </Button>
              </LinkContainer>

              <LinkContainer to="/auth/register">
                <Button className="btn-pill btn-signup" variant="light">
                  Sign Up
                </Button>
              </LinkContainer>
            </>
          ) : (
            <Nav>
              <NavDropdown
                align="end"
                id="user-menu"
                className="no-caret"
                title={
                  <span className="user-chip" role="button" tabIndex={0}>
                    <Image
                      roundedCircle
                      src={
                        user?.avatar ||
                        "https://ui-avatars.com/api/?name=G+H&background=baa07a&color=fff"
                      }
                      alt="avatar"
                      width={32}
                      height={32}
                      className="me-2 user-chip__avatar"
                    />
                    <span className="user-chip__name">
                      {user?.username || "User"}
                    </span>
                  </span>
                }
              >
                <LinkContainer to="/profile">
                  <NavDropdown.Item>
                    <PersonOutlineIcon fontSize="small" className="me-2" />
                    Profile
                  </NavDropdown.Item>
                </LinkContainer>

                <LinkContainer to="/notifications">
                  <NavDropdown.Item>
                    <NotificationsNoneIcon fontSize="small" className="me-2" />
                    Notification
                  </NavDropdown.Item>
                </LinkContainer>

                <NavDropdown.Divider />
                <NavDropdown.Item onClick={onLogout}>
                  <LogoutIcon fontSize="small" className="me-2" />
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          )}
        </div>
      </Container>
    </Navbar>
  );
};

export default Header;

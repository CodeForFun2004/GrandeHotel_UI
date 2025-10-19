
// src/components/common/Header.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Navbar,
  Nav,
  Container,
  Button,
  NavDropdown,
  Image,
} from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../redux/store";
import { logout } from "../../redux/slices/authSlice";
import { routes } from "../../routes/AppRouter";
import { toast } from "react-toastify";

import "./Navbar.css";

type Props = {
  /** selector của HeroSlider để xác định khi nào navbar rời khỏi hero */
  heroSelector?: string; // ví dụ "#hero"
};

const Header: React.FC<Props> = ({ heroSelector = "#hero" }) => {
  const [overHero, setOverHero] = useState(true);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Lấy auth từ Redux
  const { user, accessToken } = useSelector((s: RootState) => s.auth);
  const isAuthenticated = useMemo(() => !!accessToken, [accessToken]);

  useEffect(() => {
    const heroEl = document.querySelector(heroSelector);

    if (heroEl) {
      const io = new IntersectionObserver(
        ([entry]) => setOverHero(entry.isIntersecting),
        { threshold: 0 }
      );
      io.observe(heroEl);
      return () => io.disconnect();
    }

    // Fallback theo scroll
    const onScroll = () => setOverHero(window.scrollY < 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [heroSelector]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("You’ve been signed out.");
    navigate(routes.HOME_PATH, { replace: true });
  };

  // ---- SAFE NARROWING user ----
  // Không cần import type User; chỉ cần ép về object generic rồi tự narrow.
  const u = (user ?? null) as { username?: unknown; avatar?: unknown } | null;

  const username =
    u?.username && typeof u.username === "string" && u.username.trim() !== ""
      ? u.username
      : "User";

  const avatarSrc =
    u?.avatar && typeof u.avatar === "string" && u.avatar.trim() !== ""
      ? u.avatar
      : "https://ui-avatars.com/api/?name=G+H&background=baa07a&color=fff";

  return (
    <Navbar
      expand="lg"
      variant="dark"
      fixed="top"
      className={`deluxe-navbar ${overHero ? "over-hero" : "scrolled"}`}
    >
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="brand">
          GRAND DELUXE
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="deluxe-nav" />
        <Navbar.Collapse id="deluxe-nav" className="justify-content-center">
          {/* MENU center */}
          <Nav className="gap-3 deluxe-menu">
            <Nav.Link as={NavLink} to="/" end className="deluxe-link">
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/hotels" className="deluxe-link">
              Hotels
            </Nav.Link>
            <Nav.Link as={NavLink} to="/service" className="deluxe-link">
              Service
            </Nav.Link>
            <Nav.Link as={NavLink} to="/blog" className="deluxe-link"></Nav.Link>
            <Nav.Link as={NavLink} to="/about" className="deluxe-link">
              About
            </Nav.Link>
            <Nav.Link as={NavLink} to="/contact" className="deluxe-link">
              Contact
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>

        {/* RIGHT area */}
        <div className="d-flex align-items-center gap-2 ms-lg-4 py-10">
          {!isAuthenticated ? (
            <>
              <LinkContainer to={routes.LOGIN_PATH}>
                <Button className="btn-pill btn-login" variant="outline-light">
                  Login
                </Button>
              </LinkContainer>

              <LinkContainer to={routes.REGISTER_PATH}>
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
                      src={avatarSrc}           
                      alt="avatar"
                      width={32}
                      height={32}
                      className="me-2 user-chip__avatar"
                    />
                    <span className="user-chip__name">{username}</span>
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
                <NavDropdown.Item onClick={handleLogout}>
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

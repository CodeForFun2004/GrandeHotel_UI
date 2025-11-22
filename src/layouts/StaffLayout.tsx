import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  Chip,
  Alert,
  Stack,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BarChartIcon from "@mui/icons-material/BarChart";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleIcon from "@mui/icons-material/People";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PersonIcon from "@mui/icons-material/Person";

import { useMemo, useState, Fragment } from "react";
import type { ReactNode } from "react";
import Logo from "../assets/logo.png";
import { STAFF_PATHS } from "../utils/constant/enum";
import { useAppDispatch } from "../redux/hooks";
import { logout } from "../redux/slices/authSlice";
import { routes } from "../routes/AppRouter";
import { toast } from "react-toastify";

/* =======================
   UI constants & mock
   ======================= */
const DRAWER_EXPANDED = 280;
const DRAWER_COLLAPSED = 80;

type NavItem = { title: string; icon: ReactNode; path: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        title: "Dashboard",
        icon: <BarChartIcon />,
        path: STAFF_PATHS.DASHBOARD,
      },
      { title: "Check-in", icon: <LoginIcon />, path: STAFF_PATHS.CHECKIN },
      { title: "Check-out", icon: <LogoutIcon />, path: STAFF_PATHS.CHECKOUT },
    ],
  },
  {
    label: "Inventory & Booking",
    items: [
      { title: "Rooms", icon: <MeetingRoomIcon />, path: STAFF_PATHS.ROOMS },
      // {
      //   title: "Bookings",
      //   icon: <BookOnlineIcon />,
      //   path: STAFF_PATHS.BOOKINGS,
      // },
      {
        title: "Calendar",
        icon: <CalendarMonthIcon />,
        path: STAFF_PATHS.CALENDAR,
      },
    ],
  },
  {
    label: "Support",
    items: [
      { title: "Customers", icon: <PeopleIcon />, path: STAFF_PATHS.CUSTOMERS },
      { title: "Chat", icon: <HeadsetMicIcon />, path: STAFF_PATHS.CHAT },
    ],
  },
  // {
  //   label: "Admin",
  //   items: [
  //     { title: "Tasks", icon: <ChecklistIcon />, path: STAFF_PATHS.TASKS },
  //     { title: "Profile", icon: <PersonIcon />, path: STAFF_PATHS.PROFILE },
  //   ],
  // },
];

/** Các màn cần có hotel trước khi thao tác (chỉ để hiển thị toast UI) */
const REQUIRE_HOTEL_PATHS = new Set<string>([
  STAFF_PATHS.CHECKIN,
  STAFF_PATHS.CHECKOUT,
  STAFF_PATHS.ROOMS,
  STAFF_PATHS.BOOKINGS,
  STAFF_PATHS.CALENDAR,
  STAFF_PATHS.FOLIO,
  STAFF_PATHS.REFUNDS,
  STAFF_PATHS.REPORTS,
  STAFF_PATHS.TASKS,
]);

type Hotel = { id: string; name: string };

/** MOCK: staff chỉ có 1 khách sạn
 *  - Bạn có thể set null để test trạng thái “chưa được gắn KS”
 */
const CURRENT_HOTEL: Hotel | null = {
  id: "HCM-RIVERSIDE",
  // name: "Riverside Hotel Saigon",
  // đặt null để thử: null
};

const theme = createTheme({
  palette: { primary: { main: "#0049a9ff" }, secondary: { main: "#b8192b" } },
  typography: {
    // Robust system font stack to avoid webfont loading issues and ensure Vietnamese compatibility
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        },
        body: {
          fontFeatureSettings: '"liga" 1, "kern" 1',
          fontSynthesis: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: "#f5f5f5", borderRight: "none" },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          margin: "4px 8px",
          borderRadius: 8,
          "&.Mui-selected": {
            backgroundColor: "rgba(184,25,43,0.10)",
            borderLeft: "3px solid #b8192b",
            "&:hover": { backgroundColor: "rgba(184,25,43,0.15)" },
          },
          "&:hover": { backgroundColor: "rgba(184,25,43,0.05)" },
        },
      },
    },
  },
});

export default function StaffLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isMdDown = useMediaQuery("(max-width:900px)");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // UI-only: sử dụng mock hotel
  const [currentHotel] = useState<Hotel | null>(CURRENT_HOTEL);

  const currentDrawerWidth = expanded ? DRAWER_EXPANDED : DRAWER_COLLAPSED;


  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const toggleMobile = () => setMobileOpen((v) => !v);
  const toggleExpand = () => setExpanded((v) => !v);

  const pageTitle = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "dashboard";
    return last.charAt(0).toUpperCase() + last.slice(1).replaceAll("-", " ");
  }, [location.pathname]);

  const DrawerList = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Brand */}
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "space-between" : "center",
          backgroundColor: "#fff",
          minHeight: "64px !important",
        }}
      >
        {expanded && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <img src={Logo} alt="Logo" style={{ height: 40 }} />
            <Typography variant="h6" sx={{ color: "#b8192b", fontWeight: 800 }}>
              Staff Panel
            </Typography>
          </Box>
        )}
        <IconButton onClick={toggleExpand} sx={{ color: "#b8192b" }}>
          {expanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>

      <Divider />

      {/* Groups */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {NAV.map((group) => (
          <Fragment key={group.label}>
            {expanded ? (
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  pt: 1.5,
                  pb: 0.5,
                  color: "text.secondary",
                  display: "block",
                }}
              >
                {group.label}
              </Typography>
            ) : (
              <Box sx={{ height: 12 }} />
            )}
            <List dense disablePadding>
              {group.items.map((item) => {
                const blocked =
                  REQUIRE_HOTEL_PATHS.has(item.path) && !currentHotel;
                const btn = (
                  <ListItemButton
                    selected={isActive(item.path)}
                    onClick={() => {
                      if (blocked) return; // UI: chặn click nếu chưa có hotel
                      navigate(item.path);
                      if (isMdDown) setMobileOpen(false);
                    }}
                    sx={{ px: expanded ? 2 : 1.2 }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive(item.path)
                          ? "#b8192b"
                          : blocked
                          ? "rgba(0,0,0,0.3)"
                          : "inherit",
                        minWidth: expanded ? 40 : "auto",
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {expanded && (
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          fontWeight: isActive(item.path) ? 700 : 500,
                          color: blocked
                            ? "rgba(0,0,0,0.3)"
                            : isActive(item.path)
                            ? "#b8192b"
                            : "inherit",
                        }}
                      />
                    )}
                  </ListItemButton>
                );
                return (
                  <ListItem key={item.path} disablePadding>
                    {expanded ? (
                      blocked ? (
                        <Tooltip title="Chưa gắn khách sạn">
                          <span>{btn}</span>
                        </Tooltip>
                      ) : (
                        btn
                      )
                    ) : blocked ? (
                      <Tooltip title="Chưa gắn khách sạn">{btn}</Tooltip>
                    ) : (
                      btn
                    )}
                  </ListItem>
                );
              })}
            </List>
            <Divider sx={{ my: 1 }} />
          </Fragment>
        ))}

        {/* Logout */}
        <List dense disablePadding>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                dispatch(logout());
                toast.success("You've been signed out.");
                navigate(routes.HOME_PATH, { replace: true });
              }}
              sx={{ px: expanded ? 2 : 1.2 }}
            >
              <ListItemIcon
                sx={{
                  minWidth: expanded ? 40 : "auto",
                  justifyContent: "center",
                }}
              >
                <PowerSettingsNewIcon color="error" />
              </ListItemIcon>
              {expanded && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{ color: "error" }}
                />
              )}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex" }}>
        {/* HEADER đơn giản */}
        <AppBar
          position="fixed"
          elevation={1}
          sx={{
            width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
            ml: { sm: `${currentDrawerWidth}px` },
            backgroundColor: "#fff",
            color: "#1f2937",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <Toolbar sx={{ minHeight: 64, px: 2, gap: 1.5 }}>
            {/* Mobile hamburger */}
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleMobile}
              sx={{ display: { sm: "none" }, mr: 1 }}
              aria-label="open drawer"
            >
              <MenuIcon />
            </IconButton>

            {/* Khi drawer thu gọn, hiện logo nhỏ */}
            {!expanded && (
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  alignItems: "center",
                  gap: 1.5,
                  mr: 1,
                }}
              >
                <img src={Logo} alt="Logo" style={{ height: 32 }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: "#b8192b" }}
                >
                  Staff
                </Typography>
              </Box>
            )}

            {/* Tiêu đề trang */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {pageTitle}
            </Typography>

            <Box sx={{ flex: 1 }} />

            {/* Hotel (read-only) */}
            {currentHotel ? (
              <Chip
                color="primary"
                variant="outlined"
                label={currentHotel.name}
                // sx={{ maxWidth: 360 }}
              />
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Alert severity="warning" sx={{ py: 0.5 }}>
                  Chưa gắn khách sạn cho tài khoản (UI demo)
                </Alert>
              </Stack>
            )}

            {/* User menu */}
            <UserMenu onProfile={() => navigate(STAFF_PATHS.PROFILE)} />
          </Toolbar>
        </AppBar>

        {/* DRAWER */}
        <Box
          component="nav"
          sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={toggleMobile}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: DRAWER_EXPANDED,
              },
            }}
          >
            {DrawerList}
          </Drawer>

          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            open
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: currentDrawerWidth,
                overflowX: "hidden",
                transition: "width .2s ease",
              },
            }}
          >
            {DrawerList}
          </Drawer>
        </Box>

        {/* MAIN — truyền currentHotel cho trang con */}
        <Box
          component="main"
          sx={{ flexGrow: 1, minWidth: 0, p: 3, mt: "64px" }}
        >
          <Outlet context={{ currentHotel }} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

/* =============== small user menu =============== */
function UserMenu({ onProfile }: { onProfile: () => void }) {
  const [el, setEl] = useState<null | HTMLElement>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.success("You've been signed out.");
    navigate(routes.HOME_PATH, { replace: true });
  };

  return (
    <>
      <IconButton onClick={(e) => setEl(e.currentTarget)}>
        <Avatar sx={{ width: 36, height: 36 }}>S</Avatar>
      </IconButton>
      <Menu
        anchorEl={el}
        open={Boolean(el)}
        onClose={() => setEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setEl(null);
            onProfile();
          }}
        >
          <PersonIcon fontSize="small" style={{ marginRight: 8 }} /> Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <PowerSettingsNewIcon
            fontSize="small"
            color="error"
            style={{ marginRight: 8 }}
          />
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}

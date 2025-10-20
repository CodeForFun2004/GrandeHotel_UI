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
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import HotelIcon from "@mui/icons-material/Hotel";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import GroupIcon from "@mui/icons-material/Group";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./DashboardLayout.css";
import Logo from "../assets/logo.png";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { toast } from "react-toastify";
import { MANAGER_PATHS } from "../utils/constant/enum";

const drawerWidth = 280;
const collapsedDrawerWidth = 80;

const managerNavigationItems = [
  { title: "Dashboard", icon: <BarChartIcon />, path: MANAGER_PATHS.DASHBOARD },
  { title: "Hotel Info", icon: <HotelIcon />, path: MANAGER_PATHS.HOTEL_INFO },
  { title: "Rooms", icon: <MeetingRoomIcon />, path: MANAGER_PATHS.ROOMS },
  { title: "Booking Management", icon: <BookOnlineIcon />, path: MANAGER_PATHS.BOOKINGS },
  { title: "Staff Management", icon: <GroupIcon />, path: MANAGER_PATHS.STAFF_MANAGEMENT },
  { title: "Profile", icon: <PersonIcon />, path: MANAGER_PATHS.PROFILE },
  { title: "Logout", icon: <LogoutIcon />, path: "/logout" },
];

const theme = createTheme({
  palette: {
    primary: {
      main: "#0049a9ff",
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#f5f5f5",
          borderRight: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          margin: "4px 8px",
          borderRadius: "8px",
          "&.Mui-selected": {
            backgroundColor: "rgba(184, 25, 43, 0.1)",
            borderLeft: "3px solid #b8192b",
            "&:hover": {
              backgroundColor: "rgba(184, 25, 43, 0.15)",
            },
          },
          "&:hover": {
            backgroundColor: "rgba(184, 25, 43, 0.05)",
          },
        },
      },
    },
  },
});

export default function ManagerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavigation = (path: string) => {
    if (path !== "#") {
      navigate(path);
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("You've been signed out.");
    navigate("/", { replace: true });
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "space-between" : "center",
          backgroundColor: "#fff",
          minHeight: "64px !important",
        }}
      >
        {isExpanded && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <img src={Logo} alt="Logo" style={{ height: "40px" }} />
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ color: "#b8192b", fontWeight: "bold" }}
              >
                Manager Panel
              </Typography>
            </Box>
          </>
        )}

        <IconButton onClick={handleToggleExpand} sx={{ color: "#b8192b" }}>
          {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>
      <Divider />

      <Box sx={{ p: isExpanded ? 2 : 1 }}>
        {isExpanded ? (
          <List>
            {managerNavigationItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => item.path === "/logout" ? handleLogout() : handleNavigation(item.path)}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? "#b8192b" : "inherit",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    sx={{
                      "& .MuiTypography-root": {
                        fontWeight: isActive(item.path) ? "bold" : "normal",
                        color: isActive(item.path) ? "#b8192b" : "inherit",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <List>
            {managerNavigationItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => item.path === "/logout" ? handleLogout() : handleNavigation(item.path)}
                  sx={{
                    minWidth: "auto",
                    justifyContent: "center",
                    px: 1,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? "#b8192b" : "inherit",
                      minWidth: "auto",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );

  const currentDrawerWidth = isExpanded ? drawerWidth : collapsedDrawerWidth;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
            ml: { sm: `${currentDrawerWidth}px` },
            backgroundColor: "#fff",
            color: "#333",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: currentDrawerWidth,
                overflowX: "hidden",
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            p: 3,
            mt: "64px",
            backgroundColor: "#ffffff",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

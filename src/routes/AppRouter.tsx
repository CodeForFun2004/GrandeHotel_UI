﻿import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import NotFoundPage from "../pages/NotFoundPage";
import { PrivateRoute } from "./PrivateRoute";
import { RoleBasedRoute, RoleBasedRedirect } from "./RoleBasedRoute";
import LandingLayout from "../layouts/LandingLayout";
import AboutUs from "../pages/landing/AboutUs";
import Contact from "../pages/landing/Contact";

import AdminLayout from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";
import StaffLayout from "../layouts/StaffLayout";
import LandingPage from "../pages/landing/LandingPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Logout from "../pages/auth/Logout";

import AdminUserManagement from "../pages/admin/AdminUserManagement";
import AdminHotelList from "../pages/admin/AdminHotelList";

import ForgotPass from "../pages/auth/ForgotPass";
import VerifyEmail from "../pages/auth/VerifyEmail";
import Profile from "../pages/customer/Profile";

import Rooms from "../pages/Rooms";
// import RoomDetail from "../pages/RoomDetail";
import BookingWizard from "../pages/BookingWizard";

import ManagerDashboard from "../pages/admin/ManagerDashboard";
import HotelInfoForm from "../pages/admin/HotelInfoForm";
import RoomTable from "../pages/admin/rooms/RoomTable";

// Staff components
import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffRooms from "../pages/staff/StaffRooms";
import StaffRoomDetail from "../pages/staff/StaffRoomDetail";
import StaffBookings from "../pages/staff/StaffBookings";
import StaffCustomers from "../pages/staff/StaffCustomers";
import CheckIn from "../pages/staff/Check-in";
import CheckOut from "../pages/staff/Check-out";
import StaffChat from "../pages/staff/StaffChat";
import StaffProfile from "../pages/staff/StaffProfile";
import StaffCalendar from "../pages/staff/StaffCalendar";
import StaffTasks from "../pages/staff/StaffTasks";

import AuthLayout from "../layouts/AuthLayout";
import AuthCallback from "../pages/AuthCallPage";

import { USER_ROLES, ADMIN_PATHS, MANAGER_PATHS, STAFF_PATHS } from "../utils/constant/enum";



// eslint-disable-next-line react-refresh/only-export-components
export const routes = {
  ALL_PATH: "*",
  HOME_PATH: "/",
  ABOUT_PATH: "/about",
  AUTH_PATH: "/auth",
  LOGIN_PATH: "/auth/login",
  REGISTER_PATH: "/auth/register",
  LOGOUT_PATH: "/logout",
  PROFILE_PATH: "/profile",
  NEWSFEED_PATH: "/news-feeds",
  SHOPPING_PATH: "/shopping",
  PRODUCT_DETAIL_PATH: "/product/:id",

  GOOGLE_CALLBACK_PATH: "/auth/callback",
  RESET_PASS_PATH: "/reset-password",
  FORGOT_PASS_PATH: "/auth/forgot-password",
  VERIFY_EMAIL_PATH: "/auth/verify-email",
  CHANGE_PASS_PATH: "/change-password",

  ROOMS_PATH: "/rooms",
  BOOK_PATH: "/book",
  ROOM_DETAIL_PATH: "/rooms/:id",

  // Role-based paths
  ADMIN_DASHBOARD_PATH: ADMIN_PATHS.DASHBOARD,
  ADMIN_USER_MANAGEMENT_PATH: ADMIN_PATHS.USER_MANAGEMENT,
  ADMIN_HOTEL_LIST_PATH: ADMIN_PATHS.HOTEL_LIST,
  ADMIN_PROJECTS_PATH: ADMIN_PATHS.PROJECTS,
  ADMIN_PROJECTS_CREATE_PATH: ADMIN_PATHS.PROJECTS_CREATE,
  ADMIN_PROFILE_PATH: ADMIN_PATHS.PROFILE,

  MANAGER_DASHBOARD_PATH: MANAGER_PATHS.DASHBOARD,
  MANAGER_HOTEL_INFO_PATH: MANAGER_PATHS.HOTEL_INFO,
  MANAGER_ROOMS_PATH: MANAGER_PATHS.ROOMS,
  MANAGER_BOOKINGS_PATH: MANAGER_PATHS.BOOKINGS,
  MANAGER_STAFF_PATH: MANAGER_PATHS.STAFF_MANAGEMENT,
  MANAGER_PROFILE_PATH: MANAGER_PATHS.PROFILE,

  STAFF_DASHBOARD_PATH: STAFF_PATHS.DASHBOARD,
  STAFF_ROOMS_PATH: STAFF_PATHS.ROOMS,
  STAFF_BOOKINGS_PATH: STAFF_PATHS.BOOKINGS,
  STAFF_CUSTOMERS_PATH: STAFF_PATHS.CUSTOMERS,
  STAFF_PROFILE_PATH: STAFF_PATHS.PROFILE,
};
// eslint-disable-next-line react-refresh/only-export-components
export const router = createBrowserRouter([
  {
    path: routes.AUTH_PATH,
    element: <AuthLayout />,
    children: [
      { path: routes.LOGIN_PATH, element: <LoginPage /> },
      { path: routes.REGISTER_PATH, element: <RegisterPage /> },
      { path: routes.FORGOT_PASS_PATH, element: <ForgotPass /> },
      { path: routes.VERIFY_EMAIL_PATH, element: <VerifyEmail /> },
      { path: routes.GOOGLE_CALLBACK_PATH, element: <AuthCallback /> },
    ],
  },

  {
    path: routes.HOME_PATH,
    element: <LandingLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "about", element: <AboutUs /> },
      { path: "contact", element: <Contact /> },
      { path: routes.PROFILE_PATH, element: <Profile /> },
      { path: routes.ROOMS_PATH, element: <Rooms /> },
      // { path: routes.ROOM_DETAIL_PATH, element: <RoomDetail /> },
      { path: routes.BOOK_PATH, element: <BookingWizard /> },
      { path: routes.ALL_PATH, element: <NotFoundPage /> },
    ],
  },

  // Admin Routes
  {
    path: "/admin",
    element: (
      <PrivateRoute>
        <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
          <AdminLayout />
        </RoleBasedRoute>
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <RoleBasedRedirect /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "user-management", element: <AdminUserManagement /> },
      { path: "hotel-list", element: <AdminHotelList /> },
      { path: "projects", element: <AdminDashboard /> },
      { path: "projects/create", element: <AdminDashboard /> },
      { path: "profile", element: <AdminDashboard /> },
    ],
  },

  // Manager Routes
  {
    path: "/manager",
    element: (
      <PrivateRoute>
        <RoleBasedRoute allowedRoles={[USER_ROLES.HOTEL_MANAGER]}>
          <ManagerLayout />
        </RoleBasedRoute>
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <RoleBasedRedirect /> },
      { path: "dashboard", element: <ManagerDashboard /> },
      { path: "hotel-info", element: <HotelInfoForm /> },
      { path: "rooms", element: <RoomTable /> },
      { path: "bookings", element: <ManagerDashboard /> },
      { path: "staff", element: <ManagerDashboard /> },
      { path: "profile", element: <ManagerDashboard /> },
    ],
  },

  // Staff Routes
  {
    path: "/staff",
    element: (
      <PrivateRoute>
        <RoleBasedRoute allowedRoles={[USER_ROLES.STAFF]}>
          <StaffLayout />
        </RoleBasedRoute>
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <RoleBasedRedirect /> },
      { path: "dashboard", element: <StaffDashboard /> },
      { path: "checkin", element: <CheckIn /> },
      { path: "checkout", element: <CheckOut /> },
      { path: "rooms", element: <StaffRooms /> },
      { path: "rooms/:roomId", element: <StaffRoomDetail /> },
      { path: "bookings", element: <StaffBookings /> },
      { path: "calendar", element: <StaffCalendar /> },
  { path: "tasks", element: <StaffTasks /> },
      { path: "chat", element: <StaffChat /> },
      { path: "customers", element: <StaffCustomers /> },
      { path: "profile", element: <StaffProfile /> },
    ],
  },

  // Legacy dashboard route - redirect based on role
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <RoleBasedRedirect />
      </PrivateRoute>
    ),
  },

  { path: routes.LOGOUT_PATH, element: <Logout /> },
  { path: routes.ALL_PATH, element: <NotFoundPage /> },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
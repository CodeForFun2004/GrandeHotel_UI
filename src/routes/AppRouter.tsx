import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import { PrivateRoute } from "./PrivateRoute";
import LandingLayout from "../layouts/LandingLayout";
import DashboardLayoutBasic from "../layouts/DashboardLayout";
import LandingPage from "../pages/landing/LandingPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Logout from "../pages/auth/Logout";
import Rooms from "../pages/Rooms";
// import RoomDetail from "../pages/RoomDetail";
import BookingWizard from "../pages/BookingWizard";
import ManagerDashboard from "../pages/admin/ManagerDashboard";
import HotelInfoForm from "../pages/admin/HotelInfoForm";
import RoomTable from "../pages/admin/rooms/RoomTable";

// eslint-disable-next-line react-refresh/only-export-components
export const routes = {
  ALL_PATH: "*",
  HOME_PATH: "/",
  LOGIN_PATH: "/login",
  REGISTER_PATH: "/register",
  LOGOUT_PATH: "/logout",
  DASHBOARD_PATH: "/dashboard",
  ADMIN_PROFILE_PATH: "/dashboard/admin-profile",
  PROJECTS_PATH: "/dashboard/project",
  PROFILE_PATH: "/profile",
  NEWSFEED_PATH: "/news-feeds",
  PROJECTS_CREATE_PATH: "/dashboard/project/create",
  SHOPPING_PATH: "/shopping",
  PRODUCT_DETAIL_PATH: "/product/:id",
  ROOMS_PATH: "/rooms",
  BOOK_PATH: "/book",
  ROOM_DETAIL_PATH: "/rooms/:id",
};
// eslint-disable-next-line react-refresh/only-export-components
export const router = createBrowserRouter([
  {
    path: routes.HOME_PATH,
    element: <LandingLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: routes.LOGIN_PATH, element: <LoginPage /> },
      { path: routes.ALL_PATH, element: <NotFoundPage /> },
      { path: routes.ROOMS_PATH, element: <Rooms /> },
      // { path: routes.ROOM_DETAIL_PATH, element: <RoomDetail /> },
      { path: routes.BOOK_PATH, element: <BookingWizard /> },
    ],
  },
  {
    path: routes.DASHBOARD_PATH,
    element: (
      <PrivateRoute>
        <DashboardLayoutBasic />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <ManagerDashboard /> },
      { path: routes.ADMIN_PROFILE_PATH, element: <AdminDashboard /> },
      { path: "/dashboard/hotel", element: <HotelInfoForm /> },
      { path: "/dashboard/rooms", element: <RoomTable /> }
    ],
  },
  { path: routes.LOGOUT_PATH, element: <Logout /> },
  { path: routes.ALL_PATH, element: <NotFoundPage /> },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
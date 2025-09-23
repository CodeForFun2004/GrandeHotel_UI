import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import { PrivateRoute } from "./PrivateRoute";
import LandingLayout from "../layouts/LandingLayout";
import DashboardLayoutBasic from "../layouts/DashboardLayout";
import LandingPage from "../pages/landing/LandingPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Logout from "../pages/auth/Logout";
import AdminUserManagement from "../pages/admin/AdminUserManagement";
import AdminHotelList from "../pages/admin/AdminHotelList";

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
  USER_MANAGEMENT_PATH: "/dashboard/user-management",
  HOTEL_LIST_PATH: "/dashboard/hotel-list",
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
      { index: true, element: <AdminDashboard /> },
      { path: routes.ADMIN_PROFILE_PATH, element: <AdminDashboard /> },
      { path: routes.PROJECTS_PATH, element: <AdminDashboard /> },
      { path: routes.PROJECTS_CREATE_PATH, element: <AdminDashboard /> },
      { path: routes.USER_MANAGEMENT_PATH, element: <AdminUserManagement /> },
      { path: routes.HOTEL_LIST_PATH, element: <AdminHotelList /> },
    ],
  },
  { path: routes.LOGOUT_PATH, element: <Logout /> },
  { path: routes.ALL_PATH, element: <NotFoundPage /> },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
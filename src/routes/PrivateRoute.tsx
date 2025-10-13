import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { routes } from './AppRouter';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {

  const location = useLocation();

  // Đồng bộ đúng key đã dùng trong authSlice/axios
  const isAuthenticated = !!localStorage.getItem('accessToken');

  if (!isAuthenticated) {
    if (location.pathname !== routes.LOGIN_PATH && location.pathname !== routes.LOGOUT_PATH) {
      alert('Authentication required. Please sign in.');
    }
    // Redirect đúng route login hiện tại
    return <Navigate to={routes.LOGIN_PATH} replace />;
  }


  return <>{children}</>;
};

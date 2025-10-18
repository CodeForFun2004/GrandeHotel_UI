import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const user = useSelector((state: RootState) => state.auth.user);

  // Đồng bộ đúng key đã dùng trong authSlice/axios
  const isAuthenticated = !!localStorage.getItem('accessToken');

  if (!isAuthenticated) {
    // Không hiển thị alert, chỉ redirect về home
    return <Navigate to="/" replace />;
  }

  // Nếu đã đăng nhập nhưng chưa có thông tin user, redirect về home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

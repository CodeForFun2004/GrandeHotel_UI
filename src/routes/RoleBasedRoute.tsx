import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { USER_ROLES, ADMIN_PATHS, MANAGER_PATHS, STAFF_PATHS } from '../utils/constant/enum';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

export const RoleBasedRoute = ({ children, allowedRoles }: RoleBasedRouteProps) => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Kiểm tra cả token và user state - đảm bảo không redirect khi đang refresh token
  const accessToken = localStorage.getItem('accessToken');
  const hasToken = !!accessToken;
  
  // Nếu không có token và không có user, redirect về login
  if (!hasToken && !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Nếu có token nhưng chưa có user trong Redux, thử load user từ localStorage
  if (!user && hasToken) {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        // Nếu có user trong localStorage, check role
        if (parsedUser?.role && allowedRoles.includes(parsedUser.role)) {
          // Cho phép truy cập tạm thời, user sẽ được sync vào Redux sau
          return <>{children}</>;
        }
      }
    } catch {
      // Parse error - không có user hợp lệ
    }
  }

  // Nếu không có user sau khi check cả localStorage, redirect về login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const userRole = user.role;
  
  // Kiểm tra role có được phép truy cập không
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect về dashboard tương ứng với role
    switch (userRole) {
      case USER_ROLES.ADMIN:
        return <Navigate to={ADMIN_PATHS.DASHBOARD} replace />;
      case USER_ROLES.HOTEL_MANAGER:
        return <Navigate to={MANAGER_PATHS.DASHBOARD} replace />;
      case USER_ROLES.STAFF:
        return <Navigate to={STAFF_PATHS.DASHBOARD} replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

// Helper component để redirect user đến dashboard phù hợp với role
export const RoleBasedRedirect = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  console.log('🔍 RoleBasedRedirect - Current User:', user);
  console.log('🔍 User role:', user?.role);
  console.log('🔍 User username:', user?.username);
  
  
  if (!user || !user.role) {
    return <Navigate to="/auth/login" replace />;
  }

  switch (user.role) {
    case USER_ROLES.ADMIN:
      return <Navigate to={ADMIN_PATHS.DASHBOARD} replace />;
    case USER_ROLES.HOTEL_MANAGER:
      return <Navigate to={MANAGER_PATHS.DASHBOARD} replace />;
    case USER_ROLES.STAFF:
      return <Navigate to={STAFF_PATHS.DASHBOARD} replace />;
    case USER_ROLES.CUSTOMER:
      return <Navigate to="/" replace />; // Customer về trang chủ
    default:
      return <Navigate to="/" replace />; // Default về trang chủ
  }
};

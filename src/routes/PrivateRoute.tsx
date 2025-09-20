
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  

  if (!isAuthenticated) {
    if (location.pathname !== '/login' && location.pathname !== '/logout') {
      alert("Authentication required. Please sign in.");
    }
    return <Navigate to="/login" replace />;
  }
  return children;
    

};
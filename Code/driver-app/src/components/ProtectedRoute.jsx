import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export const ProtectedRoute = ({ roles = [], children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="full-page-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.some(role => 
    (role === 'admin' && isAdmin) || 
    (role === 'user' && !isAdmin)
  )) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};
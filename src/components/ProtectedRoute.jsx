import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - Protects routes that require authentication
 * Usage: <ProtectedRoute element={<Dashboard />} requiredRole="sme" />
 */
export const ProtectedRoute = ({ element, requiredRole = null }) => {
  const { isAuthenticated, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userProfile?.user_type !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;

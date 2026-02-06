import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import InfluencerDashboard from './dashboards/InfluencerDashboard';
import SMEDashboard from './dashboards/SMEDashboard';

/**
 * DashboardRouter - Routes users to appropriate dashboard based on their user_type
 */
const DashboardRouter = () => {
  const { userProfile, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Handle authenticated but no profile (and not loading)
  if (isAuthenticated && !userProfile && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Profile Error</h1>
          <p className="text-gray-600 mb-6">
            We couldn't load your profile. This might be a connection issue or your account setup is incomplete.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary w-full"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Route based on user type
  switch (userProfile?.user_type) {
    case 'admin':
      return <AdminDashboard />;
    case 'influencer':
      return <InfluencerDashboard />;
    case 'sme':
      return <SMEDashboard />;
    default:
      // Fallback: show generic message if user_type is not set
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Incomplete</h1>
            <p className="text-gray-600 mb-6">
              Your account doesn't have a specific role assigned. Please contact support.
            </p>
            <p className="text-sm text-gray-500">User ID: {userProfile?.id}</p>
          </div>
        </div>
      );
  }
};

export default DashboardRouter;

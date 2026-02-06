import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faStar, faChartLine, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { getOrders } from '../../services/api';
import InfluencerEditProfile from './InfluencerEditProfile';

const InfluencerDashboard = () => {
  const { userProfile, user, setUserProfile } = useAuth(); // Added setUserProfile to refresh context
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, [userProfile]); // Refresh orders when profile changes (e.g. price update)

  const fetchOrders = async () => {
    try {
      const { data } = await getOrders();
      if (data) {
        // Filter orders for this influencer
        const influencerOrders = data.filter((order) => order.influencer_id === userProfile?.id);
        setOrders(influencerOrders);

        // Calculate stats
        const active = influencerOrders.filter((o) => o.order_status === 'in_progress').length;
        const completed = influencerOrders.filter((o) => o.order_status === 'completed').length;
        const earnings = influencerOrders
          .filter((o) => o.order_status === 'completed')
          .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

        setStats({
          activeOrders: active,
          completedOrders: completed,
          totalEarnings: earnings,
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    // Reload page or re-fetch profile to show updates
    // Ideally AuthContext should provide a refreshProfile function
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Influencer Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userProfile?.name}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Active Campaigns */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Campaigns</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.activeOrders}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FontAwesomeIcon icon={faChartLine} className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.completedOrders}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <FontAwesomeIcon icon={faShoppingCart} className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : `Rp ${stats.totalEarnings.toLocaleString('id-ID')}`}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <FontAwesomeIcon icon={faStar} className="text-2xl text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Campaigns</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No campaigns yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Campaign</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{order.campaign_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        Rp {Number(order.total_price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.order_status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.order_status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.order_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Profile</h2>
          <div className="flex items-center gap-4">
            <div className="bg-gray-200 rounded-full p-4 w-20 h-20 flex items-center justify-center overflow-hidden">
               {userProfile?.profile_image ? (
                 <img src={userProfile.profile_image} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <FontAwesomeIcon icon={faUser} className="text-3xl text-gray-600" />
               )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">{userProfile?.name}</h3>
              <p className="text-gray-500">@{userProfile?.username || 'user'}</p>
              <p className="text-sm text-gray-400 mt-1">{userProfile?.email}</p>
            </div>
            <button 
              onClick={() => setShowEditProfile(true)}
              className="btn btn-outline"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <InfluencerEditProfile 
            userProfile={userProfile} 
            onClose={() => setShowEditProfile(false)}
            onUpdateSuccess={handleProfileUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default InfluencerDashboard;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faShoppingCart, faDollarSign, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { getPlatformStats } from '../../services/api';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalInfluencers: 0,
    totalOrders: 0,
    totalSMEs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await getPlatformStats();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userProfile?.name}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Influencers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Influencers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalInfluencers}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FontAwesomeIcon icon={faUsers} className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total SMEs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total SMEs</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalSMEs}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <FontAwesomeIcon icon={faChartLine} className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalOrders}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <FontAwesomeIcon icon={faShoppingCart} className="text-2xl text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">Manage influencers and SME accounts</p>
              </div>
              <Link to="/influencers" className="btn btn-outline text-sm">
                View All
              </Link>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">Orders & Campaigns</h3>
                <p className="text-sm text-gray-600">Monitor all platform activities</p>
              </div>
              <button className="btn btn-outline text-sm">View Orders</button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="font-semibold text-gray-900">Platform Analytics</h3>
                <p className="text-sm text-gray-600">View detailed statistics and reports</p>
              </div>
              <button className="btn btn-outline text-sm">View Analytics</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

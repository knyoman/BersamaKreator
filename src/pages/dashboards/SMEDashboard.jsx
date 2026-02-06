import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faSearch, faChartBar, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { getOrders } from '../../services/api';

const SMEDashboard = () => {
  const { userProfile, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await getOrders();
      if (data) {
        // Filter orders created by this SME
        const smeOrders = data.filter((order) => order.sme_id === user?.id);
        setOrders(smeOrders);

        // Calculate stats
        setStats({
          totalOrders: smeOrders.length,
          activeOrders: smeOrders.filter((o) => o.order_status === 'in_progress').length,
          completedOrders: smeOrders.filter((o) => o.order_status === 'completed').length,
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SME Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userProfile?.name}!</p>
        </div>

        {/* Quick Action */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Find the Perfect Influencer</h2>
          <p className="mb-4 text-gray-200">Browse our network of verified nano influencers</p>
          <Link to="/influencers" className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            <FontAwesomeIcon icon={faSearch} className="mr-2" />
            Browse Influencers
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalOrders}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FontAwesomeIcon icon={faShoppingCart} className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Orders</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.activeOrders}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <FontAwesomeIcon icon={faChartBar} className="text-2xl text-yellow-600" />
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
                <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Orders</h2>
            {orders.length > 0 && (
              <button className="text-sm text-gray-900 hover:underline font-medium">View All</button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">You haven't placed any orders yet</p>
              <Link to="/influencers" className="btn btn-primary">
                Find Influencers
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Campaign</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Influencer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{order.campaign_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{order.influencer_username || 'N/A'}</td>
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
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SMEDashboard;

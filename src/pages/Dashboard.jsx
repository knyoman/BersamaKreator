import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrders } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile, user, isInfluencer, isSME } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userProfile) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [userProfile, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error: ordersError } = await getOrders();

      if (ordersError) throw ordersError;

      // Filter orders by user type
      if (isSME) {
        // Show only orders created by this SME
        const filteredOrders = data?.filter((order) => order.sme_id === user?.id) || [];
        setOrders(filteredOrders);
      } else if (isInfluencer) {
        // Show only orders for this influencer
        const filteredOrders = data?.filter((order) => order.influencer_id === userProfile?.id) || [];
        setOrders(filteredOrders);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {userProfile?.name}!</h1>
          <p className="text-gray-600">
            {isSME && 'Manage your campaigns and orders'}
            {isInfluencer && 'Manage your campaigns'}
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="text-lg font-semibold text-gray-900">{userProfile?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="text-lg font-semibold text-gray-900">{userProfile?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Type</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{userProfile?.user_type === 'sme' ? 'Business Owner' : 'Influencer'}</p>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{isSME ? 'Your Orders' : 'Your Campaigns'}</h2>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">{isSME ? 'No orders yet' : 'No campaigns yet'}</p>
              {isSME && (
                <a href="/influencers" className="inline-block bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                  Browse Influencers
                </a>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Campaign Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{order.campaign_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">Rp {Number(order.total_price || 0).toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.order_status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.order_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.order_status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                          }`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : order.payment_status === 'unpaid' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
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

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
            <p className="font-semibold mb-2">Debug Info (Development Only)</p>
            <p>User ID: {user?.id}</p>
            <p>Email: {user?.email}</p>
            <p>User Type: {userProfile?.user_type}</p>
            <p>Is SME: {isSME ? 'Yes' : 'No'}</p>
            <p>Is Influencer: {isInfluencer ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

import { getPackageTitleFromOrder } from '../../../features/influencer/earnings';

const STATUS_LABELS = {
  pending: 'Menunggu',
  in_progress: 'Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const STATUS_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const InfluencerCampaignTable = ({ loading, orders }) => (
  <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Promosi Terbaru</h2>
        <p className="text-sm text-gray-500 mt-1">Pantau ringkasan dan status promosi yang masuk.</p>
      </div>
    </div>

    {loading ? (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto" />
      </div>
    ) : orders.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <p className="font-semibold text-gray-900">Belum ada promosi</p>
        <p className="text-sm text-gray-500 mt-1">Lengkapi profil agar peluang ditemukan UMKM semakin besar.</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Promosi</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Harga</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Deadline</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map((order) => (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">
                  <div className="font-semibold">{order.campaign_name}</div>
                  {order.sme_name && <div className="text-xs text-gray-500 mt-1">oleh {order.sme_name}</div>}
                  <div className="text-xs text-gray-500 mt-1">Paket: {getPackageTitleFromOrder(order)}</div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(order.total_price)}</td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {order.deadline
                    ? new Date(order.deadline).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                    : '-'}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[order.order_status] || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[order.order_status] || order.order_status || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

export default InfluencerCampaignTable;

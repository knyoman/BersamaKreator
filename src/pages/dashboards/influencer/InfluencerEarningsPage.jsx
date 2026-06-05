import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBriefcase,
  faCheckCircle,
  faClock,
  faCreditCard,
  faSpinner,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import {
  calculateInfluencerEarnings,
  formatEarningsCurrency,
  getPackageTitleFromOrder,
  sortOrdersByNewest,
} from '../../../features/influencer/earnings';
import {
  ORDER_STATUS_CLASSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
} from '../../../features/influencer/campaigns';

const paymentStatusClasses = {
  unpaid: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
};

const MetricCard = ({ label, value, icon, iconClassName, caption }) => (
  <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        {caption && <p className="text-xs text-gray-500 mt-2">{caption}</p>}
      </div>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconClassName}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  </article>
);

const StatusBadge = ({ label, className }) => (
  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${className}`}>
    {label}
  </span>
);

const InfluencerEarningsPage = ({ orders = [], loading = false, error = null }) => {
  const earnings = useMemo(() => calculateInfluencerEarnings(orders), [orders]);
  const paymentHistory = useMemo(() => sortOrdersByNewest(orders), [orders]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-gray-500 uppercase">Penghasilan</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Penghasilan & Riwayat Pembayaran</h1>
        <p className="text-gray-600 mt-2">
          Pantau nilai promosi, status pembayaran, promosi selesai, dan estimasi saldo dari pekerjaan influencer.
        </p>
      </header>

      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          label="Total Pendapatan"
          value={formatEarningsCurrency(earnings.grossCompletedEarnings)}
          icon={faWallet}
          iconClassName="bg-green-100 text-green-700"
          caption={`${earnings.completedCampaigns} promosi selesai`}
        />
        <MetricCard
          label="Promosi Belum Dibayar"
          value={formatEarningsCurrency(earnings.unpaidCampaignValue)}
          icon={faClock}
          iconClassName="bg-yellow-100 text-yellow-700"
          caption={`${earnings.unpaidCampaigns} promosi`}
        />
        <MetricCard
          label="Promosi Selesai"
          value={earnings.completedCampaigns}
          icon={faCheckCircle}
          iconClassName="bg-blue-100 text-blue-700"
          caption={`${earnings.paidCompletedCampaigns} sudah dibayar`}
        />
        <MetricCard
          label="Estimasi Saldo"
          value={formatEarningsCurrency(earnings.estimatedBalance)}
          icon={faCreditCard}
          iconClassName="bg-gray-900 text-white"
          caption={`Fee platform ${formatEarningsCurrency(earnings.estimatedPlatformFee)}`}
        />
      </section>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Riwayat Pembayaran</h2>
            <p className="text-sm text-gray-500 mt-1">Daftar promosi dan status pembayaran terbaru.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-900" />
            <p className="text-sm text-gray-500 mt-3">Memuat riwayat pembayaran...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Riwayat belum bisa dimuat</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : paymentHistory.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <FontAwesomeIcon icon={faBriefcase} className="text-4xl text-gray-300 mb-3" />
            <p className="font-semibold text-gray-900">Belum ada riwayat pembayaran</p>
            <p className="text-sm text-gray-500 mt-1">Riwayat akan muncul setelah UMKM membuat promosi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Promosi</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Paket</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Nilai</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Pembayaran</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div className="font-semibold">{order.campaign_name}</div>
                      {order.sme_name && <div className="text-xs text-gray-500 mt-1">oleh {order.sme_name}</div>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{getPackageTitleFromOrder(order)}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatEarningsCurrency(order.total_price)}</td>
                    <td className="py-3 px-4 text-sm">
                      <StatusBadge
                        label={PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status || '-'}
                        className={paymentStatusClasses[order.payment_status] || 'bg-gray-100 text-gray-700'}
                      />
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <StatusBadge
                        label={ORDER_STATUS_LABELS[order.order_status] || order.order_status || '-'}
                        className={ORDER_STATUS_CLASSES[order.order_status] || 'bg-gray-100 text-gray-700'}
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default InfluencerEarningsPage;

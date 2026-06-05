import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faSpinner, faWallet } from '@fortawesome/free-solid-svg-icons';
import {
  SME_PAYMENT_FILTERS,
  SME_PAYMENT_STATUS_CLASSES,
  SME_PAYMENT_STATUS_LABELS,
  formatSMECurrency,
  formatSMEDate,
  getSMEPackageTitle,
} from '../../../features/sme/campaigns';

const PaymentSummaryCard = ({ label, value, caption, icon }) => (
  <article className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        {caption && <p className="text-sm text-gray-500 mt-1">{caption}</p>}
      </div>
      <div className="w-11 h-11 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  </article>
);

const SMEPaymentsPage = ({ orders = [], loading = false, stats = {} }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredOrders = useMemo(() => (
    activeFilter === 'all'
      ? orders
      : orders.filter((order) => order.payment_status === activeFilter)
  ), [activeFilter, orders]);

  const unpaidValue = useMemo(() => (
    orders
      .filter((order) => order.payment_status === 'unpaid')
      .reduce((total, order) => total + Number(order.total_price || 0), 0)
  ), [orders]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-gray-500 uppercase">Pembayaran</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Riwayat Pembayaran</h1>
        <p className="text-gray-600 mt-2">Pantau nilai promosi, status pembayaran, dan pengeluaran UMKM.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <PaymentSummaryCard
          label="Total Dibayar"
          value={formatSMECurrency(stats.totalSpend || 0)}
          caption={`${stats.paidCampaigns || 0} promosi`}
          icon={faWallet}
        />
        <PaymentSummaryCard
          label="Belum Dibayar"
          value={formatSMECurrency(unpaidValue)}
          caption={`${stats.unpaidCampaigns || 0} promosi`}
          icon={faCreditCard}
        />
        <PaymentSummaryCard
          label="Anggaran Promosi"
          value={formatSMECurrency(stats.committedBudget || 0)}
          caption="Total nilai semua promosi"
          icon={faWallet}
        />
      </div>

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap gap-2">
          {SME_PAYMENT_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeFilter === filter.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Daftar Pembayaran</h2>
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
            Memuat pembayaran...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <p className="font-semibold text-gray-900">Tidak ada pembayaran di filter ini</p>
            <p className="text-sm text-gray-500 mt-1">Riwayat akan muncul setelah promosi dibuat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Promosi</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Paket</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Metode</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Tanggal</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{order.campaign_name}</div>
                      <div className="text-xs text-gray-500 mt-1">@{order.influencer_username || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{getSMEPackageTitle(order)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{order.payment_method || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${SME_PAYMENT_STATUS_CLASSES[order.payment_status] || 'bg-gray-100 text-gray-700'}`}>
                        {SME_PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatSMEDate(order.created_at)}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatSMECurrency(order.total_price)}</td>
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

export default SMEPaymentsPage;

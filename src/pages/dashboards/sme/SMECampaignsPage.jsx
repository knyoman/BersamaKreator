import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';
import {
  SME_CAMPAIGN_FILTERS,
  SME_ORDER_STATUS_CLASSES,
  SME_ORDER_STATUS_LABELS,
  SME_PAYMENT_STATUS_CLASSES,
  SME_PAYMENT_STATUS_LABELS,
  formatSMECurrency,
  formatSMEDate,
  getSMEPackageTitle,
} from '../../../features/sme/campaigns';

const SMECampaignsPage = ({ orders = [], loading = false, error = null, onRefresh }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const filteredOrders = useMemo(() => (
    activeFilter === 'all'
      ? orders
      : orders.filter((order) => order.order_status === activeFilter)
  ), [activeFilter, orders]);

  const selectedOrder = useMemo(() => (
    orders.find((order) => order.id === selectedOrderId) || filteredOrders[0] || null
  ), [filteredOrders, orders, selectedOrderId]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase">Promosi Saya</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Kelola Promosi</h1>
          <p className="text-gray-600 mt-2">Pantau promosi dari pesanan masuk sampai selesai.</p>
        </div>
        <Link to="/dashboard/influencers" className="btn btn-primary inline-flex items-center justify-center">
          <FontAwesomeIcon icon={faSearch} className="mr-2" />
          Buat Promosi
        </Link>
      </header>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error.message || 'Gagal memuat promosi.'}
        </div>
      )}

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap gap-2">
          {SME_CAMPAIGN_FILTERS.map((filter) => (
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

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Daftar Promosi</h2>
              <p className="text-sm text-gray-500 mt-1">{filteredOrders.length} promosi ditemukan.</p>
            </div>
            {onRefresh && (
              <button type="button" onClick={onRefresh} className="text-sm font-semibold text-gray-700 hover:text-gray-900">
                Refresh
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
              Memuat promosi...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <p className="font-semibold text-gray-900">Belum ada promosi di status ini</p>
              <p className="text-sm text-gray-500 mt-1">Ubah filter atau mulai promosi baru dari katalog influencer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Promosi</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Influencer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Deadline</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 ${
                        selectedOrder?.id === order.id ? 'bg-gray-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{order.campaign_name}</div>
                        <div className="text-xs text-gray-500 mt-1">{getSMEPackageTitle(order)}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">@{order.influencer_username || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatSMEDate(order.deadline)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${SME_ORDER_STATUS_CLASSES[order.order_status] || 'bg-gray-100 text-gray-700'}`}>
                          {SME_ORDER_STATUS_LABELS[order.order_status] || order.order_status || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatSMECurrency(order.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900">Detail Promosi</h2>
          {!selectedOrder ? (
            <p className="text-sm text-gray-500 mt-3">Pilih promosi untuk melihat detail.</p>
          ) : (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Nama Promosi</p>
                <p className="font-bold text-gray-900 mt-1">{selectedOrder.campaign_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Ringkasan</p>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{selectedOrder.campaign_description || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold mt-2 ${SME_ORDER_STATUS_CLASSES[selectedOrder.order_status] || 'bg-gray-100 text-gray-700'}`}>
                    {SME_ORDER_STATUS_LABELS[selectedOrder.order_status] || selectedOrder.order_status || '-'}
                  </span>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">Pembayaran</p>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold mt-2 ${SME_PAYMENT_STATUS_CLASSES[selectedOrder.payment_status] || 'bg-gray-100 text-gray-700'}`}>
                    {SME_PAYMENT_STATUS_LABELS[selectedOrder.payment_status] || selectedOrder.payment_status || '-'}
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Influencer</p>
                <p className="font-semibold text-gray-900 mt-1">{selectedOrder.influencer_name || selectedOrder.influencer_username || '-'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Nilai Promosi</p>
                <p className="font-bold text-gray-900 mt-1">{formatSMECurrency(selectedOrder.total_price)}</p>
              </div>
              {selectedOrder.influencer_username && (
                <Link
                  to={`/influencer/${selectedOrder.influencer_username}`}
                  className="btn btn-outline w-full inline-flex items-center justify-center"
                >
                  Lihat Profil
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2" />
                </Link>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SMECampaignsPage;

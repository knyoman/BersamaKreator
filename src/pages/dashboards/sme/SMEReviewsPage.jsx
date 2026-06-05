import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner, faStar } from '@fortawesome/free-solid-svg-icons';
import {
  SME_ORDER_STATUS_CLASSES,
  SME_ORDER_STATUS_LABELS,
  formatSMECurrency,
  formatSMEDate,
} from '../../../features/sme/campaigns';

const SMEReviewsPage = ({ orders = [], loading = false }) => {
  const completedOrders = useMemo(() => (
    orders.filter((order) => order.order_status === 'completed')
  ), [orders]);

  const pendingReviewOrders = completedOrders;

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase">Ulasan</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Penilaian Promosi</h1>
          <p className="text-gray-600 mt-2">Kelola penilaian dan komentar untuk influencer setelah promosi selesai.</p>
        </div>
        <Link to="/dashboard/campaigns" className="btn btn-outline inline-flex items-center justify-center">
          Lihat Promosi
        </Link>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <article className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-500">Promosi Selesai</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : completedOrders.length}</p>
        </article>
        <article className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-500">Siap Diulas</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : pendingReviewOrders.length}</p>
        </article>
        <article className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-500">Rata-rata Penilaian</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
        </article>
      </div>

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center">
            <FontAwesomeIcon icon={faStar} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Promosi Untuk Diulas</h2>
            <p className="text-sm text-gray-500 mt-1">Ulasan membantu reputasi influencer dan kualitas platform.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
            Memuat ulasan...
          </div>
        ) : pendingReviewOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <p className="font-semibold text-gray-900">Belum ada promosi selesai</p>
            <p className="text-sm text-gray-500 mt-1">Ulasan bisa diberikan setelah promosi ditandai selesai.</p>
            <Link to="/dashboard/influencers" className="btn btn-primary inline-flex mt-4">
              <FontAwesomeIcon icon={faSearch} className="mr-2" />
              Cari Influencer
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {pendingReviewOrders.map((order) => (
              <article key={order.id} className="rounded-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-900">{order.campaign_name}</p>
                    <p className="text-sm text-gray-500 mt-1">@{order.influencer_username || '-'}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${SME_ORDER_STATUS_CLASSES[order.order_status] || 'bg-gray-100 text-gray-700'}`}>
                    {SME_ORDER_STATUS_LABELS[order.order_status] || order.order_status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                    <p className="text-xs text-gray-500">Nilai</p>
                    <p className="font-semibold text-gray-900 mt-1">{formatSMECurrency(order.total_price)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                    <p className="text-xs text-gray-500">Selesai</p>
                    <p className="font-semibold text-gray-900 mt-1">{formatSMEDate(order.created_at)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="mt-4 w-full rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed"
                >
                  Beri Ulasan
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SMEReviewsPage;

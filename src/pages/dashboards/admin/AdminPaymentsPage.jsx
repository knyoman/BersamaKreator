import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faCreditCard,
  faFileInvoiceDollar,
  faMagnifyingGlass,
  faMoneyBillWave,
  faReceipt,
  faRotateRight,
  faTriangleExclamation,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import {
  SME_ORDER_STATUS_CLASSES,
  SME_ORDER_STATUS_LABELS,
  SME_PAYMENT_STATUS_CLASSES,
  SME_PAYMENT_STATUS_LABELS,
} from '../../../features/sme/campaigns';
import { getAdminPayments } from '../../../services/api';

const paymentStatusOptions = [
  { value: 'all', label: 'Semua Pembayaran' },
  { value: 'unpaid', label: 'Belum Dibayar' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'failed', label: 'Gagal' },
  { value: 'refunded', label: 'Refund' },
];

const orderStatusOptions = [
  { value: 'all', label: 'Semua Campaign' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'in_progress', label: 'Berjalan' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const emptyStats = {
  totalTransactions: 0,
  paidTransactions: 0,
  unpaidTransactions: 0,
  failedTransactions: 0,
  refundedTransactions: 0,
  totalValue: 0,
  paidValue: 0,
  unpaidValue: 0,
  failedValue: 0,
  refundedValue: 0,
  estimatedPlatformFee: 0,
  platformFeePercent: 0,
};

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const StatCard = ({ label, value, caption, icon, tone, loading }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-950">{loading ? '...' : value}</p>
        <p className="mt-1 text-xs text-gray-500">{caption}</p>
      </div>
      <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  </div>
);

const PaymentBadge = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${SME_PAYMENT_STATUS_CLASSES[status] || 'bg-gray-100 text-gray-700'}`}>
    {SME_PAYMENT_STATUS_LABELS[status] || status || '-'}
  </span>
);

const OrderBadge = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${SME_ORDER_STATUS_CLASSES[status] || 'bg-gray-100 text-gray-700'}`}>
    {SME_ORDER_STATUS_LABELS[status] || status || '-'}
  </span>
);

const LoadingRows = () => (
  <>
    {[1, 2, 3, 4].map((item) => (
      <tr key={item} className="border-t border-gray-100">
        <td className="px-4 py-4"><div className="h-14 w-72 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-14 w-56 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-32 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-36 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-32 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-8 w-24 rounded bg-gray-100" /></td>
      </tr>
    ))}
  </>
);

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState({
    search: '',
    paymentStatus: 'all',
    orderStatus: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminPayments(filters);

    if (error) {
      setErrorMessage(error.message || 'Data pembayaran belum bisa dimuat.');
    }

    setPayments(data?.payments || []);
    setStats(data?.stats || emptyStats);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, refreshIndex]);

  const failedAndRefundedValue = Number(stats.failedValue || 0) + Number(stats.refundedValue || 0);
  const failedAndRefundedCount = Number(stats.failedTransactions || 0) + Number(stats.refundedTransactions || 0);

  const statCards = useMemo(() => ([
    {
      label: 'Total Transaksi',
      value: formatNumber(stats.totalTransactions),
      caption: formatCurrency(stats.totalValue),
      icon: faReceipt,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Sudah Dibayar',
      value: formatCurrency(stats.paidValue),
      caption: `${formatNumber(stats.paidTransactions)} transaksi paid`,
      icon: faCircleCheck,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Belum Dibayar',
      value: formatCurrency(stats.unpaidValue),
      caption: `${formatNumber(stats.unpaidTransactions)} transaksi unpaid`,
      icon: faWallet,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Gagal / Refund',
      value: formatCurrency(failedAndRefundedValue),
      caption: `${formatNumber(failedAndRefundedCount)} transaksi perlu audit`,
      icon: faTriangleExclamation,
      tone: 'bg-red-50 text-red-700',
    },
    {
      label: 'Estimasi Fee',
      value: formatCurrency(stats.estimatedPlatformFee),
      caption: stats.platformFeePercent > 0
        ? `${stats.platformFeePercent}% dari transaksi paid`
        : 'Atur VITE_PLATFORM_FEE_PERCENT',
      icon: faFileInvoiceDollar,
      tone: 'bg-violet-50 text-violet-700',
    },
  ]), [failedAndRefundedCount, failedAndRefundedValue, stats]);

  const unpaidPriority = useMemo(() => payments
    .filter((payment) => payment.needs_follow_up)
    .sort((first, second) => Number(second.total_price || 0) - Number(first.total_price || 0))
    .slice(0, 4), [payments]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      paymentStatus: 'all',
      orderStatus: 'all',
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Pusat Pembayaran</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Pantau transaksi campaign, status pembayaran, nilai paid/unpaid, refund, dan pembayaran yang perlu follow-up.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshIndex((current) => current + 1)}
          className="btn btn-outline inline-flex items-center justify-center gap-2 text-xs"
          disabled={loading}
        >
          <FontAwesomeIcon icon={faRotateRight} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_170px_auto_auto]">
            <label className="relative">
              <span className="sr-only">Cari pembayaran</span>
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari campaign, UMKM, influencer"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gray-900"
              />
            </label>

            <select
              value={filters.paymentStatus}
              onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {paymentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={filters.orderStatus}
              onChange={(event) => setFilters((current) => ({ ...current, orderStatus: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {orderStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <button type="submit" className="btn btn-primary inline-flex items-center justify-center gap-2 text-xs">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Cari
            </button>
            <button type="button" onClick={handleResetFilters} className="btn btn-outline text-xs">
              Reset
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{formatNumber(payments.length)} transaksi ditampilkan</span>
            {filters.search && <span>Keyword: "{filters.search}"</span>}
            {filters.paymentStatus !== 'all' && <span>Pembayaran: {SME_PAYMENT_STATUS_LABELS[filters.paymentStatus]}</span>}
            {filters.orderStatus !== 'all' && <span>Campaign: {SME_ORDER_STATUS_LABELS[filters.orderStatus]}</span>}
          </div>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <FontAwesomeIcon icon={faCreditCard} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950">Prioritas Unpaid</h2>
              <p className="text-xs text-gray-500">Transaksi unpaid terbesar yang perlu ditindaklanjuti.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-gray-100" />
                <div className="h-16 rounded-lg bg-gray-100" />
                <div className="h-16 rounded-lg bg-gray-100" />
              </div>
            ) : unpaidPriority.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-500">
                Tidak ada transaksi unpaid pada filter saat ini.
              </p>
            ) : (
              unpaidPriority.map((payment) => (
                <div key={payment.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-950">{payment.campaign_name || 'Campaign tanpa nama'}</p>
                      <p className="truncate text-[11px] text-gray-500">{payment.sme_name || 'UMKM'} - {payment.influencer_name || payment.influencer_username || 'Influencer'}</p>
                    </div>
                    <PaymentBadge status={payment.payment_status} />
                  </div>
                  <p className="mt-2 text-xs font-bold text-gray-950">{formatCurrency(payment.total_price)}</p>
                  <p className="mt-1 text-[11px] text-gray-500">Dibuat {formatDate(payment.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-950">Daftar Pembayaran</h2>
          <p className="mt-1 text-xs text-gray-500">Semua transaksi campaign dari UMKM ke influencer.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">Transaksi</th>
                <th className="px-4 py-3 font-bold">Pihak</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Metode & Tanggal</th>
                <th className="px-4 py-3 font-bold">Nilai</th>
                <th className="px-4 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <LoadingRows />
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <FontAwesomeIcon icon={faReceipt} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">Belum ada pembayaran yang cocok</p>
                    <p className="mt-1 text-xs text-gray-500">Coba ubah pencarian, status pembayaran, atau status campaign.</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70">
                    <td className="px-4 py-4">
                      <div className="min-w-[280px]">
                        <p className="text-sm font-bold text-gray-950">{payment.campaign_name || 'Campaign tanpa nama'}</p>
                        <p className="mt-1 text-xs text-gray-500">{payment.package_title}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase text-gray-400">Order #{String(payment.id).slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[220px] space-y-2 text-xs">
                        <div>
                          <p className="font-bold text-gray-950">{payment.sme_name || 'UMKM'}</p>
                          <p className="text-gray-500">Pembayar</p>
                        </div>
                        <div>
                          <p className="font-bold text-gray-950">{payment.influencer_name || payment.influencer_username || 'Influencer'}</p>
                          <p className="text-gray-500">@{payment.influencer_username || 'username-belum-ada'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <PaymentBadge status={payment.payment_status} />
                        <OrderBadge status={payment.order_status} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[150px] text-xs text-gray-600">
                        <p className="font-bold text-gray-950">{payment.payment_method || 'Metode belum tersedia'}</p>
                        <p className="mt-1">Dibuat {formatDate(payment.created_at)}</p>
                        <p className="mt-1">Deadline {formatDate(payment.deadline)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[140px] text-xs">
                        <p className="text-sm font-bold text-gray-950">{formatCurrency(payment.total_price)}</p>
                        {payment.needs_follow_up && (
                          <p className="mt-1 font-semibold text-amber-700">Perlu follow-up</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {payment.influencer_username ? (
                        <Link
                          to={`/influencer/${payment.influencer_username}`}
                          className="btn btn-outline inline-flex items-center gap-2 text-xs"
                        >
                          Profil
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                        </Link>
                      ) : (
                        <span className="inline-flex rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-400">
                          Profil
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPaymentsPage;

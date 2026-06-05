import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faBullhorn,
  faCircleCheck,
  faClock,
  faMagnifyingGlass,
  faMoneyBillWave,
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
import { getAdminCampaigns } from '../../../services/api';

const orderStatusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'in_progress', label: 'Berjalan' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const paymentStatusOptions = [
  { value: 'all', label: 'Semua Pembayaran' },
  { value: 'unpaid', label: 'Belum Dibayar' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'failed', label: 'Gagal' },
  { value: 'refunded', label: 'Refund' },
];

const timingOptions = [
  { value: 'all', label: 'Semua Deadline' },
  { value: 'overdue', label: 'Lewat Deadline' },
  { value: 'due_soon', label: 'Jatuh Tempo Dekat' },
  { value: 'on_track', label: 'Masih Aman' },
  { value: 'no_deadline', label: 'Tanpa Deadline' },
  { value: 'closed', label: 'Sudah Ditutup' },
];

const timingMeta = {
  overdue: {
    label: 'Lewat deadline',
    className: 'border-red-100 bg-red-50 text-red-700',
  },
  due_soon: {
    label: 'Jatuh tempo dekat',
    className: 'border-amber-100 bg-amber-50 text-amber-700',
  },
  on_track: {
    label: 'Masih aman',
    className: 'border-blue-100 bg-blue-50 text-blue-700',
  },
  no_deadline: {
    label: 'Tanpa deadline',
    className: 'border-gray-200 bg-gray-50 text-gray-600',
  },
  closed: {
    label: 'Ditutup',
    className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  },
};

const emptyStats = {
  totalCampaigns: 0,
  pendingCampaigns: 0,
  activeCampaigns: 0,
  completedCampaigns: 0,
  cancelledCampaigns: 0,
  paidCampaigns: 0,
  unpaidCampaigns: 0,
  overdueCampaigns: 0,
  dueSoonCampaigns: 0,
  totalValue: 0,
  paidValue: 0,
  unpaidValue: 0,
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

const getTimingLabel = (value) => timingMeta[value]?.label || 'Tidak diketahui';
const getTimingClassName = (value) => timingMeta[value]?.className || 'border-gray-200 bg-gray-50 text-gray-600';

const getDeadlineSortValue = (campaign) => {
  if (!campaign.deadline) return Number.MAX_SAFE_INTEGER;
  const value = new Date(campaign.deadline).getTime();
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
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

const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${SME_ORDER_STATUS_CLASSES[status] || 'bg-gray-100 text-gray-700'}`}>
    {SME_ORDER_STATUS_LABELS[status] || status || '-'}
  </span>
);

const PaymentBadge = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${SME_PAYMENT_STATUS_CLASSES[status] || 'bg-gray-100 text-gray-700'}`}>
    {SME_PAYMENT_STATUS_LABELS[status] || status || '-'}
  </span>
);

const TimingBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getTimingClassName(status)}`}>
    <FontAwesomeIcon icon={status === 'overdue' ? faTriangleExclamation : faClock} />
    {getTimingLabel(status)}
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
        <td className="px-4 py-4"><div className="h-12 w-36 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-8 w-24 rounded bg-gray-100" /></td>
      </tr>
    ))}
  </>
);

const AdminCampaignsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOwner = searchParams.get('owner') || '';
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState({
    search: '',
    orderStatus: 'all',
    paymentStatus: 'all',
    timingStatus: 'all',
    smeId: initialOwner,
  });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminCampaigns(filters);

    if (error) {
      setErrorMessage(error.message || 'Data campaign belum bisa dimuat.');
    }

    setCampaigns(data?.campaigns || []);
    setStats(data?.stats || emptyStats);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns, refreshIndex]);

  const statCards = useMemo(() => ([
    {
      label: 'Total Campaign',
      value: formatNumber(stats.totalCampaigns),
      caption: `${formatNumber(stats.pendingCampaigns)} menunggu - ${formatNumber(stats.activeCampaigns)} berjalan`,
      icon: faBullhorn,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Campaign Selesai',
      value: formatNumber(stats.completedCampaigns),
      caption: `${formatNumber(stats.cancelledCampaigns)} dibatalkan`,
      icon: faCircleCheck,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Lewat Deadline',
      value: formatNumber(stats.overdueCampaigns),
      caption: `${formatNumber(stats.dueSoonCampaigns)} jatuh tempo dekat`,
      icon: faTriangleExclamation,
      tone: 'bg-red-50 text-red-700',
    },
    {
      label: 'Belum Dibayar',
      value: formatNumber(stats.unpaidCampaigns),
      caption: formatCurrency(stats.unpaidValue),
      icon: faWallet,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Nilai Campaign',
      value: formatCurrency(stats.totalValue),
      caption: `${formatNumber(stats.paidCampaigns)} sudah dibayar`,
      icon: faMoneyBillWave,
      tone: 'bg-violet-50 text-violet-700',
    },
  ]), [stats]);

  const followUpCampaigns = useMemo(() => campaigns
    .filter((campaign) => (
      campaign.timing_status === 'overdue'
      || campaign.timing_status === 'due_soon'
      || campaign.payment_status === 'unpaid'
    ))
    .sort((first, second) => {
      if (first.timing_status === 'overdue' && second.timing_status !== 'overdue') return -1;
      if (second.timing_status === 'overdue' && first.timing_status !== 'overdue') return 1;
      return getDeadlineSortValue(first) - getDeadlineSortValue(second);
    })
    .slice(0, 4), [campaigns]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams({});
    setFilters({
      search: '',
      orderStatus: 'all',
      paymentStatus: 'all',
      timingStatus: 'all',
      smeId: '',
    });
  };

  const clearOwnerFilter = () => {
    setSearchParams({});
    setFilters((current) => ({ ...current, smeId: '' }));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Monitoring Campaign</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Pantau seluruh campaign dari UMKM ke influencer, termasuk status pengerjaan, pembayaran, deadline, dan nilai transaksi.
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
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_160px_180px_180px_auto_auto]">
            <label className="relative">
              <span className="sr-only">Cari campaign</span>
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
              value={filters.orderStatus}
              onChange={(event) => setFilters((current) => ({ ...current, orderStatus: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {orderStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

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
              value={filters.timingStatus}
              onChange={(event) => setFilters((current) => ({ ...current, timingStatus: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {timingOptions.map((option) => (
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
            <span className="font-semibold text-gray-700">{formatNumber(campaigns.length)} campaign ditampilkan</span>
            {filters.search && <span>Keyword: "{filters.search}"</span>}
            {filters.orderStatus !== 'all' && <span>Status: {SME_ORDER_STATUS_LABELS[filters.orderStatus]}</span>}
            {filters.paymentStatus !== 'all' && <span>Pembayaran: {SME_PAYMENT_STATUS_LABELS[filters.paymentStatus]}</span>}
            {filters.timingStatus !== 'all' && <span>Deadline: {getTimingLabel(filters.timingStatus)}</span>}
            {filters.smeId && (
              <button type="button" onClick={clearOwnerFilter} className="font-semibold text-gray-900 underline">
                Hapus filter UMKM
              </button>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950">Prioritas Follow-up</h2>
              <p className="text-xs text-gray-500">Deadline dekat, lewat deadline, atau unpaid.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-gray-100" />
                <div className="h-16 rounded-lg bg-gray-100" />
                <div className="h-16 rounded-lg bg-gray-100" />
              </div>
            ) : followUpCampaigns.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-500">
                Tidak ada campaign yang perlu follow-up dari filter saat ini.
              </p>
            ) : (
              followUpCampaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-950">{campaign.campaign_name || 'Campaign tanpa nama'}</p>
                      <p className="truncate text-[11px] text-gray-500">{campaign.sme_name || 'UMKM'} - {campaign.influencer_name || campaign.influencer_username || 'Influencer'}</p>
                    </div>
                    <TimingBadge status={campaign.timing_status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-gray-700">{formatDate(campaign.deadline)}</span>
                    <span className="font-bold text-gray-950">{formatCurrency(campaign.total_price)}</span>
                  </div>
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
          <h2 className="text-sm font-bold text-gray-950">Daftar Campaign</h2>
          <p className="mt-1 text-xs text-gray-500">Data campaign lintas UMKM dan influencer dari order platform.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">Campaign</th>
                <th className="px-4 py-3 font-bold">UMKM & Influencer</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Deadline</th>
                <th className="px-4 py-3 font-bold">Pembayaran</th>
                <th className="px-4 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <LoadingRows />
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <FontAwesomeIcon icon={faBullhorn} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">Belum ada campaign yang cocok</p>
                    <p className="mt-1 text-xs text-gray-500">Coba ubah pencarian, status, pembayaran, atau filter deadline.</p>
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70">
                    <td className="px-4 py-4">
                      <div className="min-w-[280px]">
                        <p className="text-sm font-bold text-gray-950">{campaign.campaign_name || 'Campaign tanpa nama'}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
                          {campaign.campaign_description || 'Deskripsi campaign belum tersedia.'}
                        </p>
                        <p className="mt-2 text-[11px] font-semibold uppercase text-gray-400">{campaign.package_title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[220px] space-y-2 text-xs">
                        <div>
                          <p className="font-bold text-gray-950">{campaign.sme_name || 'UMKM'}</p>
                          <p className="text-gray-500">Pemilik campaign</p>
                        </div>
                        <div>
                          <p className="font-bold text-gray-950">{campaign.influencer_name || campaign.influencer_username || 'Influencer'}</p>
                          <p className="text-gray-500">@{campaign.influencer_username || 'username-belum-ada'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <StatusBadge status={campaign.order_status} />
                        <TimingBadge status={campaign.timing_status} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[140px] text-xs text-gray-600">
                        <p className="font-bold text-gray-950">{formatDate(campaign.deadline)}</p>
                        <p className="mt-1">Dibuat {formatDate(campaign.created_at)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[150px] space-y-2 text-xs">
                        <PaymentBadge status={campaign.payment_status} />
                        <p className="font-bold text-gray-950">{formatCurrency(campaign.total_price)}</p>
                        <p className="text-gray-500">{campaign.payment_method || 'Metode belum tersedia'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {campaign.influencer_username ? (
                        <Link
                          to={`/influencer/${campaign.influencer_username}`}
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

export default AdminCampaignsPage;

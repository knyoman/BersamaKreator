import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faBullhorn,
  faClock,
  faEnvelope,
  faMagnifyingGlass,
  faMoneyBillWave,
  faRotateRight,
  faStore,
  faUserCheck,
  faUserSlash,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { getAdminSMEs } from '../../../services/api';

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
];

const activityOptions = [
  { value: 'all', label: 'Semua Aktivitas' },
  { value: 'with_campaigns', label: 'Punya Campaign' },
  { value: 'no_campaigns', label: 'Belum Campaign' },
  { value: 'active_campaigns', label: 'Campaign Aktif' },
  { value: 'unpaid', label: 'Belum Dibayar' },
];

const emptyStats = {
  totalSMEs: 0,
  activeSMEs: 0,
  inactiveSMEs: 0,
  totalCampaigns: 0,
  paidCampaigns: 0,
  unpaidCampaigns: 0,
  completedCampaigns: 0,
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

const getInitials = (name = '', email = '') => {
  const source = name || email || 'UMKM';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
};

const getActivityLabel = (value) => (
  activityOptions.find((option) => option.value === value)?.label || 'Aktivitas'
);

const StatCard = ({ label, value, caption, icon, tone, loading }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-950">{loading ? '...' : formatNumber(value)}</p>
        <p className="mt-1 text-xs text-gray-500">{caption}</p>
      </div>
      <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ isActive }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
    isActive
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : 'border-red-100 bg-red-50 text-red-700'
  }`}
  >
    <FontAwesomeIcon icon={isActive ? faUserCheck : faUserSlash} />
    {isActive ? 'Aktif' : 'Nonaktif'}
  </span>
);

const SMEAvatar = ({ sme }) => {
  if (sme.profile_image) {
    return (
      <img
        src={sme.profile_image}
        alt={sme.name || sme.email}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-950 text-xs font-bold text-white">
      {getInitials(sme.name, sme.email)}
    </div>
  );
};

const CampaignSummary = ({ summary }) => (
  <div className="grid min-w-[240px] grid-cols-2 gap-2 text-xs">
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="font-bold text-gray-950">{formatNumber(summary.totalCampaigns)}</p>
      <p className="text-gray-500">total</p>
    </div>
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="font-bold text-gray-950">{formatNumber(summary.activeCampaigns)}</p>
      <p className="text-gray-500">aktif</p>
    </div>
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="font-bold text-gray-950">{formatNumber(summary.completedCampaigns)}</p>
      <p className="text-gray-500">selesai</p>
    </div>
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="font-bold text-gray-950">{formatNumber(summary.unpaidCampaigns)}</p>
      <p className="text-gray-500">unpaid</p>
    </div>
  </div>
);

const LoadingRows = () => (
  <>
    {[1, 2, 3, 4].map((item) => (
      <tr key={item} className="border-t border-gray-100">
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100" />
            <div className="space-y-2">
              <div className="h-3 w-40 rounded bg-gray-100" />
              <div className="h-3 w-56 rounded bg-gray-100" />
            </div>
          </div>
        </td>
        <td className="px-4 py-4"><div className="h-6 w-20 rounded-full bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-16 w-56 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-10 w-40 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-3 w-24 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-8 w-20 rounded bg-gray-100" /></td>
      </tr>
    ))}
  </>
);

const AdminSMEsPage = () => {
  const [smes, setSMEs] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    activity: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchSMEs = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminSMEs(filters);

    if (error) {
      setErrorMessage(error.message || 'Data UMKM belum bisa dimuat.');
    }

    setSMEs(data?.smes || []);
    setStats(data?.stats || emptyStats);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchSMEs();
  }, [fetchSMEs, refreshIndex]);

  const statCards = useMemo(() => ([
    {
      label: 'Total UMKM',
      value: stats.totalSMEs,
      caption: 'Akun bisnis di platform.',
      icon: faStore,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'UMKM Aktif',
      value: stats.activeSMEs,
      caption: 'Akun bisnis yang bisa memakai platform.',
      icon: faUserCheck,
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Total Campaign',
      value: stats.totalCampaigns,
      caption: 'Campaign dari seluruh UMKM.',
      icon: faBullhorn,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Campaign Selesai',
      value: stats.completedCampaigns,
      caption: 'Campaign yang sudah selesai.',
      icon: faClock,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Belum Dibayar',
      value: stats.unpaidCampaigns,
      caption: 'Campaign yang perlu follow-up.',
      icon: faWallet,
      tone: 'bg-amber-50 text-amber-700',
    },
  ]), [stats]);

  const paymentPrioritySMEs = useMemo(() => smes
    .filter((sme) => sme.order_summary.unpaidCampaigns > 0)
    .sort((first, second) => second.order_summary.unpaidValue - first.order_summary.unpaidValue)
    .slice(0, 3), [smes]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      status: 'all',
      activity: 'all',
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Manajemen UMKM</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Pantau akun bisnis, aktivitas campaign, status pembayaran, dan UMKM yang perlu dukungan operasional.
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
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_170px_190px_auto_auto]">
            <label className="relative">
              <span className="sr-only">Cari UMKM</span>
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nama bisnis atau email"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gray-900"
              />
            </label>

            <label>
              <span className="sr-only">Filter status</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Filter aktivitas</span>
              <select
                value={filters.activity}
                onChange={(event) => setFilters((current) => ({ ...current, activity: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
              >
                {activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <button type="submit" className="btn btn-primary inline-flex items-center justify-center gap-2 text-xs">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Cari
            </button>
            <button type="button" onClick={handleResetFilters} className="btn btn-outline text-xs">
              Reset
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{formatNumber(smes.length)} UMKM ditampilkan</span>
            {filters.search && <span>Keyword: "{filters.search}"</span>}
            {filters.status !== 'all' && <span>Status: {filters.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>}
            {filters.activity !== 'all' && <span>Aktivitas: {getActivityLabel(filters.activity)}</span>}
          </div>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <FontAwesomeIcon icon={faMoneyBillWave} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950">Prioritas Pembayaran</h2>
              <p className="text-xs text-gray-500">UMKM dengan nilai unpaid terbesar.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="space-y-2">
                <div className="h-14 rounded-lg bg-gray-100" />
                <div className="h-14 rounded-lg bg-gray-100" />
                <div className="h-14 rounded-lg bg-gray-100" />
              </div>
            ) : paymentPrioritySMEs.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-500">
                Tidak ada UMKM dengan pembayaran tertunda pada filter saat ini.
              </p>
            ) : (
              paymentPrioritySMEs.map((sme) => (
                <div key={sme.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-950">{sme.name || 'Nama bisnis belum diisi'}</p>
                      <p className="truncate text-[11px] text-gray-500">{sme.email || 'Email belum tersedia'}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-700">{formatNumber(sme.order_summary.unpaidCampaigns)}</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-gray-950">{formatCurrency(sme.order_summary.unpaidValue)}</p>
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
          <h2 className="text-sm font-bold text-gray-950">Daftar UMKM</h2>
          <p className="mt-1 text-xs text-gray-500">Data akun bisnis diperkaya dengan ringkasan campaign dan pembayaran.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">UMKM</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Campaign</th>
                <th className="px-4 py-3 font-bold">Pembayaran</th>
                <th className="px-4 py-3 font-bold">Aktivitas Terakhir</th>
                <th className="px-4 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <LoadingRows />
              ) : smes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <FontAwesomeIcon icon={faStore} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">Belum ada UMKM yang cocok</p>
                    <p className="mt-1 text-xs text-gray-500">Coba ubah keyword pencarian, status, atau filter aktivitas.</p>
                  </td>
                </tr>
              ) : (
                smes.map((sme) => (
                  <tr key={sme.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70">
                    <td className="px-4 py-4">
                      <div className="flex min-w-[260px] items-center gap-3">
                        <SMEAvatar sme={sme} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-950">{sme.name || 'Nama bisnis belum diisi'}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500">
                            <FontAwesomeIcon icon={faEnvelope} />
                            {sme.email || 'Email belum tersedia'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-400">Daftar {formatDate(sme.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge isActive={sme.is_active} />
                    </td>
                    <td className="px-4 py-4">
                      <CampaignSummary summary={sme.order_summary} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[170px] space-y-1 text-xs text-gray-600">
                        <p className="font-bold text-gray-950">{formatCurrency(sme.order_summary.totalCampaignValue)}</p>
                        <p>Paid: {formatCurrency(sme.order_summary.paidSpend)}</p>
                        <p className={sme.order_summary.unpaidValue > 0 ? 'font-bold text-amber-700' : 'text-gray-500'}>
                          Unpaid: {formatCurrency(sme.order_summary.unpaidValue)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[190px] text-xs text-gray-600">
                        {sme.order_summary.latestCampaign ? (
                          <>
                            <p className="font-bold text-gray-950">{sme.order_summary.latestCampaign.campaign_name || 'Campaign tanpa nama'}</p>
                            <p className="mt-1">Influencer: {sme.order_summary.latestCampaign.influencer_name || '-'}</p>
                            <p className="mt-1">Tanggal: {formatDate(sme.order_summary.latestCampaign.created_at)}</p>
                          </>
                        ) : (
                          <p className="rounded-lg bg-gray-50 px-3 py-2 text-gray-500">Belum membuat campaign.</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/dashboard/campaigns?owner=${encodeURIComponent(sme.id)}`}
                        className="btn btn-outline inline-flex items-center gap-2 text-xs"
                      >
                        Campaign
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                      </Link>
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

export default AdminSMEsPage;

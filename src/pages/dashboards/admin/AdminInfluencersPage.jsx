import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faChartLine,
  faCircleCheck,
  faCircleXmark,
  faEye,
  faMagnifyingGlass,
  faMoneyBillWave,
  faRotateRight,
  faStar,
  faUserCheck,
  faUserSlash,
  faUserTie,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { getAdminInfluencers } from '../../../services/api';

const verificationOptions = [
  { value: 'all', label: 'Semua Verifikasi' },
  { value: 'verified', label: 'Terverifikasi' },
  { value: 'unverified', label: 'Belum Verified' },
];

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
];

const emptyStats = {
  totalInfluencers: 0,
  verifiedInfluencers: 0,
  unverifiedInfluencers: 0,
  activeInfluencerAccounts: 0,
  inactiveInfluencerAccounts: 0,
};

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

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

const getInitials = (name = '', username = '') => {
  const source = name || username || 'Influencer';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'I';
};

const getCompletenessTone = (value) => {
  if (value >= 80) return 'bg-emerald-500';
  if (value >= 55) return 'bg-amber-500';
  return 'bg-red-500';
};

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

const VerificationBadge = ({ isVerified }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
    isVerified
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : 'border-amber-100 bg-amber-50 text-amber-700'
  }`}
  >
    <FontAwesomeIcon icon={isVerified ? faCircleCheck : faCircleXmark} />
    {isVerified ? 'Terverifikasi' : 'Belum verified'}
  </span>
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

const CompletenessBar = ({ value }) => (
  <div className="min-w-[120px]">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold text-gray-900">{value}%</span>
      <span className="text-[11px] text-gray-500">lengkap</span>
    </div>
    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${getCompletenessTone(value)}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const InfluencerAvatar = ({ influencer }) => {
  if (influencer.profile_image) {
    return (
      <img
        src={influencer.profile_image}
        alt={influencer.display_name}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-950 text-xs font-bold text-white">
      {getInitials(influencer.display_name, influencer.username)}
    </div>
  );
};

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
        <td className="px-4 py-4"><div className="h-3 w-24 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-6 w-28 rounded-full bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-10 w-40 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-3 w-24 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-8 w-28 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-8 w-20 rounded bg-gray-100" /></td>
      </tr>
    ))}
  </>
);

const AdminInfluencersPage = () => {
  const [influencers, setInfluencers] = useState([]);
  const [niches, setNiches] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState({
    search: '',
    niche: 'all',
    verification: 'all',
    status: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchInfluencers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminInfluencers(filters);

    if (error) {
      setErrorMessage(error.message || 'Data influencer belum bisa dimuat.');
    }

    setInfluencers(data?.influencers || []);
    setNiches(data?.niches || []);
    setStats(data?.stats || emptyStats);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchInfluencers();
  }, [fetchInfluencers, refreshIndex]);

  const statCards = useMemo(() => ([
    {
      label: 'Total Influencer',
      value: stats.totalInfluencers,
      caption: 'Kreator yang punya profil influencer.',
      icon: faUserTie,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Terverifikasi',
      value: stats.verifiedInfluencers,
      caption: 'Siap diprioritaskan di marketplace.',
      icon: faCircleCheck,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Belum Verified',
      value: stats.unverifiedInfluencers,
      caption: 'Perlu validasi profil dan media sosial.',
      icon: faCircleXmark,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Akun Aktif',
      value: stats.activeInfluencerAccounts,
      caption: 'Influencer yang bisa memakai platform.',
      icon: faUserCheck,
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Akun Nonaktif',
      value: stats.inactiveInfluencerAccounts,
      caption: 'Akun yang perlu dicek admin.',
      icon: faUserSlash,
      tone: 'bg-red-50 text-red-700',
    },
  ]), [stats]);

  const priorityInfluencers = useMemo(() => influencers
    .filter((influencer) => !influencer.is_verified)
    .sort((first, second) => second.profile_completeness - first.profile_completeness)
    .slice(0, 3), [influencers]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      niche: 'all',
      verification: 'all',
      status: 'all',
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Manajemen Influencer</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Pantau kualitas kreator, status verifikasi, performa, harga, dan kesiapan profil untuk menerima campaign UMKM.
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
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1fr)_170px_170px_150px_auto_auto]">
            <label className="relative">
              <span className="sr-only">Cari influencer</span>
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nama, email, username, niche"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gray-900"
              />
            </label>

            <label>
              <span className="sr-only">Filter niche</span>
              <select
                value={filters.niche}
                onChange={(event) => setFilters((current) => ({ ...current, niche: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
              >
                <option value="all">Semua Niche</option>
                {niches.map((niche) => (
                  <option key={niche} value={niche}>{niche}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Filter verifikasi</span>
              <select
                value={filters.verification}
                onChange={(event) => setFilters((current) => ({ ...current, verification: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
              >
                {verificationOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
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

            <button type="submit" className="btn btn-primary inline-flex items-center justify-center gap-2 text-xs">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Cari
            </button>
            <button type="button" onClick={handleResetFilters} className="btn btn-outline text-xs">
              Reset
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{formatNumber(influencers.length)} influencer ditampilkan</span>
            {filters.search && <span>Keyword: "{filters.search}"</span>}
            {filters.niche !== 'all' && <span>Niche: {filters.niche}</span>}
            {filters.verification !== 'all' && <span>Verifikasi: {filters.verification === 'verified' ? 'Terverifikasi' : 'Belum verified'}</span>}
            {filters.status !== 'all' && <span>Status: {filters.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>}
          </div>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <FontAwesomeIcon icon={faEye} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950">Prioritas Verifikasi</h2>
              <p className="text-xs text-gray-500">Belum verified dengan profil paling siap.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="space-y-2">
                <div className="h-12 rounded-lg bg-gray-100" />
                <div className="h-12 rounded-lg bg-gray-100" />
                <div className="h-12 rounded-lg bg-gray-100" />
              </div>
            ) : priorityInfluencers.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-500">
                Tidak ada influencer dalam antrean verifikasi dari filter saat ini.
              </p>
            ) : (
              priorityInfluencers.map((influencer) => (
                <div key={influencer.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-950">{influencer.display_name}</p>
                      <p className="truncate text-[11px] text-gray-500">@{influencer.username || 'username-belum-diisi'}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{influencer.profile_completeness}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${getCompletenessTone(influencer.profile_completeness)}`}
                      style={{ width: `${influencer.profile_completeness}%` }}
                    />
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
          <h2 className="text-sm font-bold text-gray-950">Daftar Influencer</h2>
          <p className="mt-1 text-xs text-gray-500">Data profil kreator, akun user, harga, rating, dan status verifikasi.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">Influencer</th>
                <th className="px-4 py-3 font-bold">Niche</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Performa</th>
                <th className="px-4 py-3 font-bold">Harga</th>
                <th className="px-4 py-3 font-bold">Kesiapan</th>
                <th className="px-4 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <LoadingRows />
              ) : influencers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">Belum ada influencer yang cocok</p>
                    <p className="mt-1 text-xs text-gray-500">Coba ubah keyword, niche, verifikasi, atau status akun.</p>
                  </td>
                </tr>
              ) : (
                influencers.map((influencer) => (
                  <tr key={influencer.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70">
                    <td className="px-4 py-4">
                      <div className="flex min-w-[260px] items-center gap-3">
                        <InfluencerAvatar influencer={influencer} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-950">{influencer.display_name}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">@{influencer.username || 'username-belum-diisi'}</p>
                          <p className="mt-0.5 truncate text-[11px] text-gray-400">{influencer.email || 'Email belum tersedia'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="min-w-[120px] text-xs font-semibold text-gray-900">{influencer.niche || 'Belum diisi'}</p>
                      <p className="mt-1 text-[11px] text-gray-500">Daftar {formatDate(influencer.joined_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <VerificationBadge isVerified={influencer.is_verified} />
                        <StatusBadge isActive={influencer.is_active} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[160px] space-y-1 text-xs text-gray-600">
                        <p className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faChartLine} className="text-gray-400" />
                          {formatNumber(influencer.followers_count)} followers
                        </p>
                        <p className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faStar} className="text-gray-400" />
                          Rating {Number(influencer.rating_average || 0).toFixed(1)} - {formatNumber(influencer.total_orders)} campaign
                        </p>
                        <p className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faEye} className="text-gray-400" />
                          Engagement {formatPercent(influencer.engagement_rate)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="min-w-[110px] text-xs font-bold text-gray-950">{formatCurrency(influencer.price_per_post)}</p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="mr-1 text-gray-400" />
                        per post
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <CompletenessBar value={influencer.profile_completeness} />
                    </td>
                    <td className="px-4 py-4">
                      {influencer.username ? (
                        <Link
                          to={`/influencer/${influencer.username}`}
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

export default AdminInfluencersPage;

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faBoxOpen,
  faCircleCheck,
  faEyeSlash,
  faMagnifyingGlass,
  faPhotoFilm,
  faRotateRight,
  faTags,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { getAdminContentModeration } from '../../../services/api';

const emptyStats = {
  totalInfluencers: 0,
  cleanInfluencers: 0,
  needsReview: 0,
  highRisk: 0,
  inactiveInfluencers: 0,
  totalPortfolioItems: 0,
  privatePortfolioItems: 0,
  totalPricingPackages: 0,
  privatePricingPackages: 0,
};

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'clean', label: 'Bersih' },
  { value: 'needs_review', label: 'Perlu Review' },
  { value: 'high_risk', label: 'Prioritas Tinggi' },
  { value: 'inactive', label: 'Akun Nonaktif' },
];

const visibilityOptions = [
  { value: 'all', label: 'Semua Konten' },
  { value: 'public_ready', label: 'Siap Publik' },
  { value: 'has_private', label: 'Ada Privat' },
];

const statusMeta = {
  clean: { label: 'Bersih', className: 'border-emerald-100 bg-emerald-50 text-emerald-700', icon: faCircleCheck },
  needs_review: { label: 'Perlu Review', className: 'border-amber-100 bg-amber-50 text-amber-700', icon: faTriangleExclamation },
  high_risk: { label: 'Prioritas Tinggi', className: 'border-red-100 bg-red-50 text-red-700', icon: faTriangleExclamation },
  inactive: { label: 'Nonaktif', className: 'border-gray-200 bg-gray-50 text-gray-600', icon: faEyeSlash },
};

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

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

const StatusBadge = ({ status }) => {
  const meta = statusMeta[status] || statusMeta.needs_review;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
      <FontAwesomeIcon icon={meta.icon} />
      {meta.label}
    </span>
  );
};

const LoadingRows = () => (
  <>
    {[1, 2, 3, 4].map((item) => (
      <tr key={item} className="border-t border-gray-100">
        <td className="px-4 py-4"><div className="h-14 w-64 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-14 w-48 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-36 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-48 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-8 w-24 rounded bg-gray-100" /></td>
      </tr>
    ))}
  </>
);

const AdminContentModerationPage = () => {
  const [items, setItems] = useState([]);
  const [niches, setNiches] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    visibility: 'all',
    niche: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminContentModeration(filters);

    if (error) {
      setErrorMessage(error.message || 'Data moderasi konten belum bisa dimuat.');
    }

    setItems(data?.items || []);
    setNiches(data?.niches || []);
    setStats(data?.stats || emptyStats);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent, refreshIndex]);

  const statCards = useMemo(() => ([
    {
      label: 'Influencer',
      value: formatNumber(stats.totalInfluencers),
      caption: `${formatNumber(stats.cleanInfluencers)} profil bersih`,
      icon: faCircleCheck,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Perlu Review',
      value: formatNumber(stats.needsReview + stats.highRisk),
      caption: `${formatNumber(stats.highRisk)} prioritas tinggi`,
      icon: faTriangleExclamation,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Portfolio',
      value: formatNumber(stats.totalPortfolioItems),
      caption: `${formatNumber(stats.privatePortfolioItems)} konten privat`,
      icon: faPhotoFilm,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Paket Harga',
      value: formatNumber(stats.totalPricingPackages),
      caption: `${formatNumber(stats.privatePricingPackages)} paket privat`,
      icon: faTags,
      tone: 'bg-violet-50 text-violet-700',
    },
  ]), [stats]);

  const priorityItems = useMemo(() => items
    .filter((item) => item.moderation_status === 'high_risk' || item.moderation_status === 'needs_review')
    .slice(0, 4), [items]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      status: 'all',
      visibility: 'all',
      niche: 'all',
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Moderasi Konten Influencer</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Tinjau portfolio, paket harga, link sosial, dan kelengkapan konten publik influencer agar marketplace tetap rapi.
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

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => <StatCard key={card.label} {...card} loading={loading} />)}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_160px_160px_160px_auto_auto]">
            <label className="relative">
              <span className="sr-only">Cari konten</span>
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari influencer, niche, portfolio"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-900"
              />
            </label>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select
              value={filters.visibility}
              onChange={(event) => setFilters((current) => ({ ...current, visibility: event.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select
              value={filters.niche}
              onChange={(event) => setFilters((current) => ({ ...current, niche: event.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              <option value="all">Semua Niche</option>
              {niches.map((niche) => <option key={niche} value={niche}>{niche}</option>)}
            </select>
            <button type="submit" className="btn btn-primary inline-flex items-center justify-center gap-2 text-xs">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Cari
            </button>
            <button type="button" onClick={handleResetFilters} className="btn btn-outline text-xs">
              Reset
            </button>
          </form>
          <p className="mt-3 text-xs font-semibold text-gray-600">{formatNumber(items.length)} influencer ditampilkan</p>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-950">Prioritas Moderasi</h2>
          <p className="mt-1 text-xs text-gray-500">Profil dengan issue terbanyak tampil lebih dulu.</p>
          <div className="mt-4 space-y-3">
            {priorityItems.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-500">Tidak ada prioritas dari filter saat ini.</p>
            ) : (
              priorityItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-950">{item.display_name}</p>
                      <p className="truncate text-[11px] text-gray-500">{item.niche || 'Tanpa niche'}</p>
                    </div>
                    <StatusBadge status={item.moderation_status} />
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500">{item.moderation_issues[0] || 'Perlu pengecekan konten.'}</p>
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
          <h2 className="text-sm font-bold text-gray-950">Daftar Konten Influencer</h2>
          <p className="mt-1 text-xs text-gray-500">Ringkasan portfolio, paket, dan issue moderasi per influencer.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">Influencer</th>
                <th className="px-4 py-3 font-bold">Konten</th>
                <th className="px-4 py-3 font-bold">Harga Dasar</th>
                <th className="px-4 py-3 font-bold">Issue</th>
                <th className="px-4 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <LoadingRows />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <FontAwesomeIcon icon={faBoxOpen} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">Tidak ada konten yang cocok</p>
                    <p className="mt-1 text-xs text-gray-500">Coba ubah filter status, niche, atau pencarian.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70">
                    <td className="px-4 py-4">
                      <div className="min-w-[220px]">
                        <p className="text-sm font-bold text-gray-950">{item.display_name}</p>
                        <p className="mt-1 text-xs text-gray-500">@{item.username || 'username-belum-ada'}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.email || 'Email belum tersedia'}</p>
                        <StatusBadge status={item.moderation_status} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[200px] space-y-1 text-xs text-gray-600">
                        <p><span className="font-bold text-gray-950">{formatNumber(item.public_portfolio_count)}</span> portfolio publik</p>
                        <p><span className="font-bold text-gray-950">{formatNumber(item.public_package_count)}</span> paket publik</p>
                        <p>{formatNumber(item.private_portfolio_count + item.private_package_count)} item privat</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="min-w-[130px] text-xs font-bold text-gray-950">{formatCurrency(item.price_per_post)}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatNumber(item.followers_count)} followers</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[280px] space-y-2">
                        {item.moderation_issues.length === 0 ? (
                          <p className="text-xs font-semibold text-emerald-700">Tidak ada issue utama.</p>
                        ) : (
                          item.moderation_issues.slice(0, 3).map((issue) => (
                            <div key={issue} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                              {issue}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {item.username ? (
                        <Link to={`/influencer/${item.username}`} className="btn btn-outline inline-flex items-center gap-2 text-xs">
                          Profil
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">Profil belum siap</span>
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

export default AdminContentModerationPage;

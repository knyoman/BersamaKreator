import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faBriefcase,
  faCircleCheck,
  faCircleXmark,
  faClipboardCheck,
  faIdBadge,
  faLink,
  faListCheck,
  faMagnifyingGlass,
  faRotateRight,
  faShieldHalved,
  faTags,
  faTriangleExclamation,
  faUserCheck,
} from '@fortawesome/free-solid-svg-icons';
import {
  getAdminVerificationQueue,
  updateAdminInfluencerVerification,
} from '../../../services/api';

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'ready', label: 'Siap Direview' },
  { value: 'needs_info', label: 'Perlu Data' },
  { value: 'verified', label: 'Terverifikasi' },
  { value: 'inactive', label: 'Akun Nonaktif' },
];

const emptyStats = {
  totalInfluencers: 0,
  verifiedInfluencers: 0,
  unverifiedInfluencers: 0,
  readyForReview: 0,
  needsInfo: 0,
  inactiveInfluencers: 0,
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

const getInitials = (name = '', username = '') => {
  const source = name || username || 'Influencer';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'I';
};

const getReadinessTone = (score) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 55) return 'bg-amber-500';
  return 'bg-red-500';
};

const getQueueStatus = (influencer) => {
  if (!influencer.is_active) return 'inactive';
  if (influencer.is_verified) return 'verified';
  if (influencer.verification_readiness.score >= 80) return 'ready';
  return 'needs_info';
};

const getStatusMeta = (status) => {
  const meta = {
    ready: {
      label: 'Siap direview',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      icon: faClipboardCheck,
    },
    needs_info: {
      label: 'Perlu data',
      className: 'border-amber-100 bg-amber-50 text-amber-700',
      icon: faTriangleExclamation,
    },
    verified: {
      label: 'Terverifikasi',
      className: 'border-blue-100 bg-blue-50 text-blue-700',
      icon: faShieldHalved,
    },
    inactive: {
      label: 'Akun nonaktif',
      className: 'border-red-100 bg-red-50 text-red-700',
      icon: faCircleXmark,
    },
  };

  return meta[status] || meta.needs_info;
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

const StatusBadge = ({ status }) => {
  const meta = getStatusMeta(status);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
      <FontAwesomeIcon icon={meta.icon} />
      {meta.label}
    </span>
  );
};

const ReadinessBar = ({ readiness }) => (
  <div className="min-w-[140px]">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold text-gray-900">{readiness.score}%</span>
      <span className="text-[11px] text-gray-500">
        {readiness.completedChecks}/{readiness.totalChecks}
      </span>
    </div>
    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${getReadinessTone(readiness.score)}`} style={{ width: `${readiness.score}%` }} />
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

const ChecklistPreview = ({ checks }) => {
  const incompleteChecks = checks.filter((check) => !check.isComplete).slice(0, 4);

  if (incompleteChecks.length === 0) {
    return (
      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
        Semua item utama sudah lengkap.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {incompleteChecks.map((check) => (
        <div key={check.key} className="flex items-start gap-2 text-xs text-gray-600">
          <FontAwesomeIcon icon={faCircleXmark} className="mt-0.5 text-red-400" />
          <span>{check.label}</span>
        </div>
      ))}
    </div>
  );
};

const LoadingRows = () => (
  <>
    {[1, 2, 3, 4].map((item) => (
      <tr key={item} className="border-t border-gray-100">
        <td className="px-4 py-4"><div className="h-14 w-72 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-40 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-40 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-20 w-64 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-10 w-48 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-8 w-28 rounded bg-gray-100" /></td>
      </tr>
    ))}
  </>
);

const AdminVerificationPage = () => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminVerificationQueue(filters);

    if (error) {
      setErrorMessage(error.message || 'Data antrean verifikasi belum bisa dimuat.');
    }

    setQueue(data?.queue || []);
    setStats(data?.stats || emptyStats);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue, refreshIndex]);

  const statCards = useMemo(() => ([
    {
      label: 'Total Influencer',
      value: stats.totalInfluencers,
      caption: 'Semua kreator di sistem.',
      icon: faIdBadge,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Terverifikasi',
      value: stats.verifiedInfluencers,
      caption: 'Siap diprioritaskan di marketplace.',
      icon: faShieldHalved,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Siap Direview',
      value: stats.readyForReview,
      caption: 'Belum verified dengan data cukup.',
      icon: faClipboardCheck,
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Perlu Data',
      value: stats.needsInfo,
      caption: 'Profil belum memenuhi syarat utama.',
      icon: faTriangleExclamation,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Nonaktif',
      value: stats.inactiveInfluencers,
      caption: 'Akun kreator perlu dicek.',
      icon: faCircleXmark,
      tone: 'bg-red-50 text-red-700',
    },
  ]), [stats]);

  const priorityQueue = useMemo(() => queue
    .filter((influencer) => getQueueStatus(influencer) === 'ready')
    .sort((first, second) => second.verification_readiness.score - first.verification_readiness.score)
    .slice(0, 4), [queue]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      status: 'all',
    });
  };

  const handleVerificationUpdate = async (influencer, isVerified) => {
    setUpdatingId(influencer.id);
    setErrorMessage('');
    setSuccessMessage('');

    const { error } = await updateAdminInfluencerVerification(influencer.id, isVerified);

    if (error) {
      setErrorMessage(
        error.message || 'Status verifikasi belum bisa diperbarui. Pastikan schema grant is_verified sudah diterapkan.',
      );
      setUpdatingId(null);
      return;
    }

    setSuccessMessage(`${influencer.display_name} ${isVerified ? 'ditandai terverifikasi' : 'dibatalkan verifikasinya'}.`);
    setUpdatingId(null);
    setRefreshIndex((current) => current + 1);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Verifikasi Influencer</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Tinjau kelengkapan profil, portfolio, paket harga, link sosial, dan kesiapan kreator sebelum diberi badge verified.
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
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_190px_auto_auto]">
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

            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {statusOptions.map((option) => (
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
            <span className="font-semibold text-gray-700">{formatNumber(queue.length)} influencer ditampilkan</span>
            {filters.search && <span>Keyword: "{filters.search}"</span>}
            {filters.status !== 'all' && (
              <span>Status: {statusOptions.find((option) => option.value === filters.status)?.label}</span>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <FontAwesomeIcon icon={faListCheck} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950">Prioritas Review</h2>
              <p className="text-xs text-gray-500">Belum verified dengan score tertinggi.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-gray-100" />
                <div className="h-16 rounded-lg bg-gray-100" />
                <div className="h-16 rounded-lg bg-gray-100" />
              </div>
            ) : priorityQueue.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-500">
                Tidak ada influencer siap direview pada filter saat ini.
              </p>
            ) : (
              priorityQueue.map((influencer) => (
                <div key={influencer.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-950">{influencer.display_name}</p>
                      <p className="truncate text-[11px] text-gray-500">@{influencer.username || 'username-belum-diisi'}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{influencer.verification_readiness.score}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${getReadinessTone(influencer.verification_readiness.score)}`}
                      style={{ width: `${influencer.verification_readiness.score}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-950">Antrean Verifikasi</h2>
          <p className="mt-1 text-xs text-gray-500">Score dihitung dari identitas, profil, metrik, sosial, portfolio, dan paket harga.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">Influencer</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Readiness</th>
                <th className="px-4 py-3 font-bold">Checklist Kurang</th>
                <th className="px-4 py-3 font-bold">Data Pendukung</th>
                <th className="px-4 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <LoadingRows />
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <FontAwesomeIcon icon={faClipboardCheck} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">Belum ada influencer yang cocok</p>
                    <p className="mt-1 text-xs text-gray-500">Coba ubah pencarian atau filter status verifikasi.</p>
                  </td>
                </tr>
              ) : (
                queue.map((influencer) => {
                  const status = getQueueStatus(influencer);
                  const isUpdating = updatingId === influencer.id;

                  return (
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
                        <div className="space-y-2">
                          <StatusBadge status={status} />
                          <p className="text-[11px] text-gray-500">Daftar {formatDate(influencer.joined_at)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <ReadinessBar readiness={influencer.verification_readiness} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[240px]">
                          <ChecklistPreview checks={influencer.verification_readiness.checks} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[190px] space-y-1.5 text-xs text-gray-600">
                          <p className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faBriefcase} className="text-gray-400" />
                            Portfolio: {formatNumber(influencer.portfolio_count)}
                          </p>
                          <p className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faTags} className="text-gray-400" />
                            Paket harga: {formatNumber(influencer.pricing_package_count)}
                          </p>
                          <p className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faLink} className="text-gray-400" />
                            Niche: {influencer.niche || '-'}
                          </p>
                          <p className="font-bold text-gray-950">{formatCurrency(influencer.price_per_post)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[220px] flex-wrap gap-2">
                          {influencer.is_verified ? (
                            <button
                              type="button"
                              onClick={() => handleVerificationUpdate(influencer, false)}
                              disabled={isUpdating}
                              className="btn btn-outline inline-flex items-center gap-2 text-xs"
                            >
                              <FontAwesomeIcon icon={faCircleXmark} />
                              Batalkan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleVerificationUpdate(influencer, true)}
                              disabled={isUpdating || !influencer.is_active}
                              className="btn btn-primary inline-flex items-center gap-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <FontAwesomeIcon icon={faUserCheck} />
                              Verifikasi
                            </button>
                          )}
                          {influencer.username && (
                            <Link
                              to={`/influencer/${influencer.username}`}
                              className="btn btn-outline inline-flex items-center gap-2 text-xs"
                            >
                              Profil
                              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminVerificationPage;

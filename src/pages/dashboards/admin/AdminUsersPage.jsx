import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faEnvelope,
  faMagnifyingGlass,
  faRotateRight,
  faShieldHalved,
  faStore,
  faUserCheck,
  faUserSlash,
  faUserTie,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { getAdminUsers } from '../../../services/api';

const roleOptions = [
  { value: 'all', label: 'Semua Role' },
  { value: 'sme', label: 'UMKM' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'admin', label: 'Admin' },
];

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
];

const roleMeta = {
  sme: {
    label: 'UMKM',
    icon: faStore,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  influencer: {
    label: 'Influencer',
    icon: faUserTie,
    tone: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  admin: {
    label: 'Admin',
    icon: faShieldHalved,
    tone: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

const emptyStats = {
  totalUsers: 0,
  totalSMEs: 0,
  totalInfluencers: 0,
  totalAdmins: 0,
  activeUsers: 0,
  inactiveUsers: 0,
};

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

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
  const source = name || email || 'User';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
};

const getRoleMeta = (role) => roleMeta[role] || {
  label: 'User',
  icon: faUsers,
  tone: 'bg-gray-50 text-gray-700 border-gray-200',
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

const RoleBadge = ({ role }) => {
  const meta = getRoleMeta(role);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.tone}`}>
      <FontAwesomeIcon icon={meta.icon} />
      {meta.label}
    </span>
  );
};

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

const UserAvatar = ({ user }) => {
  if (user.profile_image) {
    return (
      <img
        src={user.profile_image}
        alt={user.name || user.email}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-950 text-xs font-bold text-white">
      {getInitials(user.name, user.email)}
    </div>
  );
};

const UserRoleDetail = ({ user }) => {
  if (user.user_type === 'influencer') {
    const profile = user.influencer_profile;

    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-900">
          @{profile?.username || 'username-belum-diisi'}
        </p>
        <p className="text-xs text-gray-500">
          {profile?.niche || 'Niche belum diisi'}
          {profile?.is_verified ? ' - Terverifikasi' : ' - Belum verified'}
        </p>
      </div>
    );
  }

  if (user.user_type === 'sme') {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-900">Pemilik bisnis</p>
        <p className="text-xs text-gray-500">Akun untuk membuat campaign dan mencari influencer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-900">Operator platform</p>
      <p className="text-xs text-gray-500">Akun internal untuk mengelola sistem.</p>
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
        <td className="px-4 py-4"><div className="h-6 w-20 rounded-full bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-6 w-20 rounded-full bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-8 w-40 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-3 w-24 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-8 w-20 rounded bg-gray-100" /></td>
      </tr>
    ))}
  </>
);

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState({
    search: '',
    userType: 'all',
    status: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminUsers(filters);

    if (error) {
      setErrorMessage(error.message || 'Data user belum bisa dimuat.');
    }

    setUsers(data?.users || []);
    setStats(data?.stats || emptyStats);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshIndex]);

  const statCards = useMemo(() => ([
    {
      label: 'Total User',
      value: stats.totalUsers,
      caption: 'Semua akun yang terdaftar.',
      icon: faUsers,
      tone: 'bg-gray-100 text-gray-800',
    },
    {
      label: 'User Aktif',
      value: stats.activeUsers,
      caption: 'Akun yang bisa memakai platform.',
      icon: faUserCheck,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'UMKM',
      value: stats.totalSMEs,
      caption: 'Akun pemilik bisnis.',
      icon: faStore,
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Influencer',
      value: stats.totalInfluencers,
      caption: 'Kreator yang masuk ekosistem.',
      icon: faUserTie,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Admin',
      value: stats.totalAdmins,
      caption: 'Akun internal operasional.',
      icon: faShieldHalved,
      tone: 'bg-violet-50 text-violet-700',
    },
  ]), [stats]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      userType: 'all',
      status: 'all',
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Manajemen User</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Pantau akun UMKM, influencer, dan admin dari satu halaman operasional yang rapi.
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

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_180px_auto_auto]">
          <label className="relative">
            <span className="sr-only">Cari user</span>
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nama atau email"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gray-900"
            />
          </label>

          <label>
            <span className="sr-only">Filter role</span>
            <select
              value={filters.userType}
              onChange={(event) => setFilters((current) => ({ ...current, userType: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {roleOptions.map((option) => (
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
          <span className="font-semibold text-gray-700">{formatNumber(users.length)} user ditampilkan</span>
          {filters.search && <span>Keyword: "{filters.search}"</span>}
          {filters.userType !== 'all' && <span>Role: {getRoleMeta(filters.userType).label}</span>}
          {filters.status !== 'all' && <span>Status: {filters.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>}
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-950">Daftar User Platform</h2>
          <p className="mt-1 text-xs text-gray-500">Data diambil dari tabel user dan diperkaya dengan profil influencer jika tersedia.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">User</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Detail</th>
                <th className="px-4 py-3 font-bold">Tanggal Daftar</th>
                <th className="px-4 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <LoadingRows />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">Belum ada user yang cocok</p>
                    <p className="mt-1 text-xs text-gray-500">Coba ubah keyword pencarian, role, atau status.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70">
                    <td className="px-4 py-4">
                      <div className="flex min-w-[260px] items-center gap-3">
                        <UserAvatar user={user} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-950">{user.name || 'Nama belum diisi'}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500">
                            <FontAwesomeIcon icon={faEnvelope} />
                            {user.email || 'Email belum tersedia'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge role={user.user_type} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge isActive={user.is_active} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[220px]">
                        <UserRoleDetail user={user} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      {user.user_type === 'influencer' && user.influencer_profile?.username ? (
                        <Link
                          to={`/influencer/${user.influencer_profile.username}`}
                          className="btn btn-outline inline-flex items-center gap-2 text-xs"
                        >
                          Profil
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                        </Link>
                      ) : (
                        <span className="inline-flex rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-400">
                          Detail
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

export default AdminUsersPage;

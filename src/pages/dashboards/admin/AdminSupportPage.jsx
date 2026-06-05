import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation,
  faClock,
  faCreditCard,
  faHeadset,
  faMagnifyingGlass,
  faRotateRight,
  faStar,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { getAdminSupportCases } from '../../../services/api';

const emptyStats = {
  totalCases: 0,
  highSeverity: 0,
  mediumSeverity: 0,
  lowSeverity: 0,
  openCases: 0,
  reviewCases: 0,
  totalExposure: 0,
};

const typeOptions = [
  { value: 'all', label: 'Semua Kasus' },
  { value: 'campaign_overdue', label: 'Campaign Terlambat' },
  { value: 'campaign_due_soon', label: 'Deadline Dekat' },
  { value: 'payment_unpaid', label: 'Pembayaran Unpaid' },
  { value: 'low_rating', label: 'Rating Rendah' },
  { value: 'unanswered_review', label: 'Review Belum Direspons' },
  { value: 'campaign_cancelled', label: 'Campaign Dibatalkan' },
];

const severityOptions = [
  { value: 'all', label: 'Semua Prioritas' },
  { value: 'high', label: 'Tinggi' },
  { value: 'medium', label: 'Sedang' },
  { value: 'low', label: 'Rendah' },
];

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'open', label: 'Open' },
  { value: 'review', label: 'Review' },
];

const typeMeta = {
  campaign_overdue: { label: 'Campaign Terlambat', icon: faClock },
  campaign_due_soon: { label: 'Deadline Dekat', icon: faClock },
  payment_unpaid: { label: 'Pembayaran Unpaid', icon: faCreditCard },
  low_rating: { label: 'Rating Rendah', icon: faStar },
  unanswered_review: { label: 'Review Belum Direspons', icon: faHeadset },
  campaign_cancelled: { label: 'Campaign Dibatalkan', icon: faCircleExclamation },
};

const severityMeta = {
  high: { label: 'Tinggi', className: 'border-red-100 bg-red-50 text-red-700' },
  medium: { label: 'Sedang', className: 'border-amber-100 bg-amber-50 text-amber-700' },
  low: { label: 'Rendah', className: 'border-gray-200 bg-gray-50 text-gray-600' },
};

const statusMeta = {
  open: { label: 'Open', className: 'border-blue-100 bg-blue-50 text-blue-700' },
  review: { label: 'Review', className: 'border-violet-100 bg-violet-50 text-violet-700' },
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

const Badge = ({ meta }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
    {meta.label}
  </span>
);

const LoadingRows = () => (
  <>
    {[1, 2, 3, 4].map((item) => (
      <tr key={item} className="border-t border-gray-100">
        <td className="px-4 py-4"><div className="h-16 w-72 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-36 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-52 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-32 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-32 rounded bg-gray-100" /></td>
      </tr>
    ))}
  </>
);

const AdminSupportPage = () => {
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    severity: 'all',
    status: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminSupportCases(filters);

    if (error) {
      setErrorMessage(error.message || 'Data support belum bisa dimuat.');
    }

    setCases(data?.cases || []);
    setStats(data?.stats || emptyStats);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases, refreshIndex]);

  const statCards = useMemo(() => ([
    {
      label: 'Total Kasus',
      value: formatNumber(stats.totalCases),
      caption: `${formatNumber(stats.openCases)} open - ${formatNumber(stats.reviewCases)} review`,
      icon: faHeadset,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Prioritas Tinggi',
      value: formatNumber(stats.highSeverity),
      caption: `${formatNumber(stats.mediumSeverity)} prioritas sedang`,
      icon: faTriangleExclamation,
      tone: 'bg-red-50 text-red-700',
    },
    {
      label: 'Nilai Terkait',
      value: formatCurrency(stats.totalExposure),
      caption: 'Total nilai campaign dalam kasus',
      icon: faCreditCard,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Prioritas Rendah',
      value: formatNumber(stats.lowSeverity),
      caption: 'Tetap perlu pemantauan',
      icon: faCircleExclamation,
      tone: 'bg-gray-100 text-gray-700',
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
      type: 'all',
      severity: 'all',
      status: 'all',
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Support / Dispute Center</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Pantau potensi masalah antara UMKM dan influencer dari deadline, pembayaran, pembatalan, dan review.
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

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_160px_150px_auto_auto]">
          <label className="relative">
            <span className="sr-only">Cari kasus</span>
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari campaign, UMKM, influencer"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-900"
            />
          </label>
          <select
            value={filters.type}
            onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
          >
            {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select
            value={filters.severity}
            onChange={(event) => setFilters((current) => ({ ...current, severity: event.target.value }))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
          >
            {severityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
          >
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button type="submit" className="btn btn-primary inline-flex items-center justify-center gap-2 text-xs">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            Cari
          </button>
          <button type="button" onClick={handleResetFilters} className="btn btn-outline text-xs">
            Reset
          </button>
        </form>
        <p className="mt-3 text-xs font-semibold text-gray-600">{formatNumber(cases.length)} kasus ditampilkan</p>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-950">Daftar Kasus</h2>
          <p className="mt-1 text-xs text-gray-500">Kasus diturunkan otomatis dari data campaign, pembayaran, dan review.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">Kasus</th>
                <th className="px-4 py-3 font-bold">Tipe</th>
                <th className="px-4 py-3 font-bold">Pihak Terkait</th>
                <th className="px-4 py-3 font-bold">Prioritas</th>
                <th className="px-4 py-3 font-bold">Nilai</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <LoadingRows />
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <FontAwesomeIcon icon={faHeadset} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">Tidak ada kasus yang cocok</p>
                    <p className="mt-1 text-xs text-gray-500">Coba ubah filter tipe, prioritas, atau status.</p>
                  </td>
                </tr>
              ) : (
                cases.map((item) => {
                  const type = typeMeta[item.type] || { label: item.type, icon: faHeadset };

                  return (
                    <tr key={item.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70">
                      <td className="px-4 py-4">
                        <div className="min-w-[280px]">
                          <p className="text-sm font-bold text-gray-950">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{item.description}</p>
                          <p className="mt-2 text-[11px] font-semibold text-gray-400">Dibuat {formatDate(item.createdAt)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700">
                          <FontAwesomeIcon icon={type.icon} />
                          {type.label}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[200px] text-xs text-gray-600">
                          <p><span className="font-bold text-gray-950">UMKM:</span> {item.ownerName || '-'}</p>
                          <p className="mt-1"><span className="font-bold text-gray-950">Influencer:</span> {item.assigneeName || '-'}</p>
                          <div className="mt-2">
                            <Badge meta={statusMeta[item.status] || statusMeta.open} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge meta={severityMeta[item.severity] || severityMeta.low} />
                      </td>
                      <td className="px-4 py-4">
                        <p className="min-w-[120px] text-xs font-bold text-gray-950">{formatCurrency(item.amount)}</p>
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

export default AdminSupportPage;

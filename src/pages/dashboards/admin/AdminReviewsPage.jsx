import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faCommentDots,
  faEye,
  faEyeSlash,
  faMagnifyingGlass,
  faReply,
  faRotateRight,
  faStar,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  SME_ORDER_STATUS_CLASSES,
  SME_ORDER_STATUS_LABELS,
  SME_PAYMENT_STATUS_CLASSES,
  SME_PAYMENT_STATUS_LABELS,
} from '../../../features/sme/campaigns';
import { getAdminReviews } from '../../../services/api';

const ratingOptions = [
  { value: 'all', label: 'Semua Rating' },
  { value: 'low', label: 'Rating Rendah' },
  { value: '5', label: '5 Bintang' },
  { value: '4', label: '4 Bintang' },
  { value: '3', label: '3 Bintang' },
  { value: '2', label: '2 Bintang' },
  { value: '1', label: '1 Bintang' },
];

const publicationOptions = [
  { value: 'all', label: 'Semua Publikasi' },
  { value: 'published', label: 'Publik' },
  { value: 'unpublished', label: 'Privat' },
];

const responseOptions = [
  { value: 'all', label: 'Semua Respons' },
  { value: 'responded', label: 'Sudah Direspons' },
  { value: 'unanswered', label: 'Belum Direspons' },
];

const emptyStats = {
  totalReviews: 0,
  averageRating: 0,
  lowRatingReviews: 0,
  publishedReviews: 0,
  unpublishedReviews: 0,
  respondedReviews: 0,
  unansweredReviews: 0,
  distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: 0 })),
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

const getRatingLabel = (value) => ratingOptions.find((option) => option.value === value)?.label || 'Rating';
const getPublicationLabel = (value) => publicationOptions.find((option) => option.value === value)?.label || 'Publikasi';
const getResponseLabel = (value) => responseOptions.find((option) => option.value === value)?.label || 'Respons';

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

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <FontAwesomeIcon
        key={star}
        icon={faStar}
        className={star <= Number(rating || 0) ? 'text-yellow-400' : 'text-gray-300'}
      />
    ))}
  </div>
);

const PublicationBadge = ({ isPublished }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
    isPublished !== false
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : 'border-gray-200 bg-gray-50 text-gray-600'
  }`}
  >
    <FontAwesomeIcon icon={isPublished !== false ? faEye : faEyeSlash} />
    {isPublished !== false ? 'Publik' : 'Privat'}
  </span>
);

const ResponseBadge = ({ hasResponse }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
    hasResponse
      ? 'border-blue-100 bg-blue-50 text-blue-700'
      : 'border-amber-100 bg-amber-50 text-amber-700'
  }`}
  >
    <FontAwesomeIcon icon={hasResponse ? faCircleCheck : faReply} />
    {hasResponse ? 'Sudah direspons' : 'Belum direspons'}
  </span>
);

const RatingDistribution = ({ distribution, totalReviews }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-gray-950">Distribusi Rating</h2>
        <p className="mt-1 text-xs text-gray-500">Sebaran bintang dari review UMKM.</p>
      </div>
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700">
        <FontAwesomeIcon icon={faStar} />
      </div>
    </div>

    <div className="mt-4 space-y-3">
      {distribution.map((item) => {
        const percentage = totalReviews > 0 ? Math.round((item.count / totalReviews) * 100) : 0;

        return (
          <div key={item.rating} className="grid grid-cols-[52px_minmax(0,1fr)_42px] items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
              {item.rating}
              <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gray-900" style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-right text-xs font-semibold text-gray-500">{item.count}</p>
          </div>
        );
      })}
    </div>
  </div>
);

const LoadingRows = () => (
  <>
    {[1, 2, 3, 4].map((item) => (
      <tr key={item} className="border-t border-gray-100">
        <td className="px-4 py-4"><div className="h-16 w-72 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-14 w-52 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-32 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-14 w-64 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-12 w-36 rounded bg-gray-100" /></td>
        <td className="px-4 py-4"><div className="h-8 w-24 rounded bg-gray-100" /></td>
      </tr>
    ))}
  </>
);

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState({
    search: '',
    rating: 'all',
    publicationStatus: 'all',
    responseStatus: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminReviews(filters);

    if (error) {
      setErrorMessage(error.message || 'Data ulasan belum bisa dimuat.');
    }

    setReviews(data?.reviews || []);
    setStats(data?.stats || emptyStats);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshIndex]);

  const responseRate = stats.totalReviews > 0
    ? Math.round((stats.respondedReviews / stats.totalReviews) * 100)
    : 0;

  const statCards = useMemo(() => ([
    {
      label: 'Total Ulasan',
      value: formatNumber(stats.totalReviews),
      caption: `Rata-rata ${Number(stats.averageRating || 0).toFixed(1)} bintang`,
      icon: faCommentDots,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Rating Rendah',
      value: formatNumber(stats.lowRatingReviews),
      caption: 'Review 1-3 bintang untuk prioritas audit.',
      icon: faTriangleExclamation,
      tone: 'bg-red-50 text-red-700',
    },
    {
      label: 'Ulasan Publik',
      value: formatNumber(stats.publishedReviews),
      caption: `${formatNumber(stats.unpublishedReviews)} review privat`,
      icon: faEye,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Belum Direspons',
      value: formatNumber(stats.unansweredReviews),
      caption: `${responseRate}% sudah direspons`,
      icon: faReply,
      tone: 'bg-amber-50 text-amber-700',
    },
  ]), [responseRate, stats]);

  const lowRatingPriority = useMemo(() => reviews
    .filter((review) => review.is_low_rating)
    .sort((first, second) => Number(first.rating || 0) - Number(second.rating || 0))
    .slice(0, 4), [reviews]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      rating: 'all',
      publicationStatus: 'all',
      responseStatus: 'all',
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Moderasi Ulasan</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Pantau review UMKM, rating rendah, respons influencer, dan sinyal reputasi platform.
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
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_150px_170px_170px_auto_auto]">
            <label className="relative">
              <span className="sr-only">Cari ulasan</span>
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari campaign, UMKM, komentar"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gray-900"
              />
            </label>

            <select
              value={filters.rating}
              onChange={(event) => setFilters((current) => ({ ...current, rating: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {ratingOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={filters.publicationStatus}
              onChange={(event) => setFilters((current) => ({ ...current, publicationStatus: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {publicationOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={filters.responseStatus}
              onChange={(event) => setFilters((current) => ({ ...current, responseStatus: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              {responseOptions.map((option) => (
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
            <span className="font-semibold text-gray-700">{formatNumber(reviews.length)} ulasan ditampilkan</span>
            {filters.search && <span>Keyword: "{filters.search}"</span>}
            {filters.rating !== 'all' && <span>Rating: {getRatingLabel(filters.rating)}</span>}
            {filters.publicationStatus !== 'all' && <span>Publikasi: {getPublicationLabel(filters.publicationStatus)}</span>}
            {filters.responseStatus !== 'all' && <span>Respons: {getResponseLabel(filters.responseStatus)}</span>}
          </div>

          <div className="mt-4">
            <RatingDistribution distribution={stats.distribution} totalReviews={stats.totalReviews} />
          </div>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950">Prioritas Rating Rendah</h2>
              <p className="text-xs text-gray-500">Review 1-3 bintang yang perlu dipantau.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-gray-100" />
                <div className="h-16 rounded-lg bg-gray-100" />
                <div className="h-16 rounded-lg bg-gray-100" />
              </div>
            ) : lowRatingPriority.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-500">
                Tidak ada review rating rendah dari filter saat ini.
              </p>
            ) : (
              lowRatingPriority.map((review) => (
                <div key={review.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-950">{review.campaign_name || 'Campaign tanpa nama'}</p>
                      <p className="truncate text-[11px] text-gray-500">{review.sme_name || 'UMKM'} untuk {review.influencer_name}</p>
                    </div>
                    <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                      {review.rating}
                      <FontAwesomeIcon icon={faStar} className="ml-1 text-yellow-400" />
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-600">
                    {review.comment || 'Tidak ada komentar.'}
                  </p>
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
          <h2 className="text-sm font-bold text-gray-950">Daftar Ulasan</h2>
          <p className="mt-1 text-xs text-gray-500">Review UMKM terhadap campaign dan influencer.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">Review</th>
                <th className="px-4 py-3 font-bold">Campaign</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Komentar & Respons</th>
                <th className="px-4 py-3 font-bold">Nilai</th>
                <th className="px-4 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <LoadingRows />
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <FontAwesomeIcon icon={faCommentDots} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">Belum ada ulasan yang cocok</p>
                    <p className="mt-1 text-xs text-gray-500">Coba ubah pencarian, rating, publikasi, atau filter respons.</p>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70">
                    <td className="px-4 py-4">
                      <div className="min-w-[220px]">
                        <StarRating rating={review.rating} />
                        <p className="mt-2 text-xs font-bold text-gray-950">{review.sme_name || 'UMKM'}</p>
                        <p className="mt-1 text-xs text-gray-500">Untuk {review.influencer_name}</p>
                        <p className="mt-1 text-[11px] text-gray-400">{formatDate(review.created_at)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[220px] text-xs">
                        <p className="font-bold text-gray-950">{review.campaign_name || 'Campaign tanpa nama'}</p>
                        <p className="mt-1 text-gray-500">Order #{String(review.order_id).slice(0, 8)}</p>
                        <p className="mt-1 text-gray-500">Deadline {formatDate(review.deadline)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <PublicationBadge isPublished={review.is_published} />
                        <ResponseBadge hasResponse={review.has_response} />
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${SME_ORDER_STATUS_CLASSES[review.order_status] || 'bg-gray-100 text-gray-700'}`}>
                          {SME_ORDER_STATUS_LABELS[review.order_status] || review.order_status || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[280px] space-y-3 text-xs">
                        <div>
                          <p className="font-bold uppercase text-gray-400">Komentar UMKM</p>
                          <p className="mt-1 line-clamp-3 leading-relaxed text-gray-700">{review.comment || 'Tidak ada komentar.'}</p>
                        </div>
                        <div>
                          <p className="font-bold uppercase text-gray-400">Respons Influencer</p>
                          <p className="mt-1 line-clamp-3 leading-relaxed text-gray-700">{review.response || 'Belum ada respons.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[140px] space-y-2 text-xs">
                        <p className="font-bold text-gray-950">{formatCurrency(review.total_price)}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${SME_PAYMENT_STATUS_CLASSES[review.payment_status] || 'bg-gray-100 text-gray-700'}`}>
                          {SME_PAYMENT_STATUS_LABELS[review.payment_status] || review.payment_status || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {review.influencer_username ? (
                        <Link
                          to={`/influencer/${review.influencer_username}`}
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

export default AdminReviewsPage;

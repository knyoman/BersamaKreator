import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faComments,
  faEye,
  faEyeSlash,
  faReply,
  faSpinner,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import {
  REVIEW_FILTERS,
  REVIEW_RESPONSE_MAX_LENGTH,
  filterReviews,
  formatReviewDate,
  getReviewCampaignName,
  getReviewSmeName,
  sanitizeReviewResponse,
} from '../../../features/influencer/reviews';
import {
  ORDER_STATUS_CLASSES,
  ORDER_STATUS_LABELS,
  formatCurrency,
} from '../../../features/influencer/campaigns';
import { updateInfluencerReviewResponse } from '../../../services/api';

const emptyReviewStats = {
  totalReviews: 0,
  averageRating: 0,
  responseCount: 0,
  responseRate: 0,
  publishedCount: 0,
  unpublishedCount: 0,
  distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: 0 })),
};

const MetricCard = ({ label, value, caption, icon, iconClassName }) => (
  <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        {caption && <p className="text-xs text-gray-500 mt-2">{caption}</p>}
      </div>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconClassName}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  </article>
);

const StarRating = ({ rating, sizeClassName = 'text-sm' }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <FontAwesomeIcon
        key={star}
        icon={faStar}
        className={`${sizeClassName} ${star <= Number(rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

const RatingDistribution = ({ distribution, totalReviews }) => (
  <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center">
        <FontAwesomeIcon icon={faChartLine} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Distribusi Penilaian</h2>
        <p className="text-sm text-gray-500">Sebaran bintang dari semua ulasan UMKM.</p>
      </div>
    </div>

    <div className="space-y-3">
      {distribution.map((item) => {
        const percentage = totalReviews > 0 ? Math.round((item.count / totalReviews) * 100) : 0;

        return (
          <div key={item.rating} className="grid grid-cols-[64px_minmax(0,1fr)_48px] items-center gap-3">
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              {item.rating}
              <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-xs" />
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-gray-900" style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-right text-sm text-gray-500">{item.count}</p>
          </div>
        );
      })}
    </div>
  </section>
);

const ReviewCard = ({
  review,
  isEditing,
  responseDraft,
  responseError,
  saving,
  onEdit,
  onCancel,
  onDraftChange,
  onSubmitResponse,
}) => {
  const order = review.order || {};

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {order.sme?.profile_image ? (
              <img src={order.sme.profile_image} alt={getReviewSmeName(review)} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-gray-600">{getReviewSmeName(review).charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-gray-900">{getReviewSmeName(review)}</h3>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-sm text-gray-500">{formatReviewDate(review.created_at)}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{getReviewCampaignName(review)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StarRating rating={review.rating} />
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
            review.is_published !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            <FontAwesomeIcon icon={review.is_published !== false ? faEye : faEyeSlash} />
            {review.is_published !== false ? 'Publik' : 'Privat'}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-5">
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500">Nilai Promosi</p>
          <p className="font-semibold text-gray-900 mt-1">{formatCurrency(order.total_price)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500">Status Promosi</p>
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold mt-1 ${ORDER_STATUS_CLASSES[order.order_status] || 'bg-gray-100 text-gray-700'}`}>
            {ORDER_STATUS_LABELS[order.order_status] || order.order_status || '-'}
          </span>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500">Tanggal Promosi</p>
          <p className="font-semibold text-gray-900 mt-1">{formatReviewDate(order.created_at)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ulasan UMKM</p>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {review.comment || 'UMKM tidak menambahkan komentar.'}
        </p>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        {isEditing ? (
          <div>
            {responseError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-100 text-red-700 p-3 text-sm">
                {responseError}
              </div>
            )}
            <label className="block text-sm font-semibold text-gray-700 mb-2">Respons Anda</label>
            <textarea
              value={responseDraft}
              onChange={(event) => onDraftChange(event.target.value)}
              rows={4}
              maxLength={REVIEW_RESPONSE_MAX_LENGTH}
              placeholder="Tulis ucapan terima kasih atau klarifikasi singkat untuk UMKM."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
              <p className="text-xs text-gray-400">{responseDraft.length}/{REVIEW_RESPONSE_MAX_LENGTH} karakter</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => onSubmitResponse(review)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : 'Simpan Respons'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Respons Influencer</p>
              {review.response ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{review.response}</p>
              ) : (
                <p className="text-sm text-gray-500">Belum ada respons.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faReply} className="mr-2" />
              {review.response ? 'Edit Respons' : 'Balas Ulasan'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

const InfluencerReviewsPage = ({
  reviews = [],
  loading = false,
  error = null,
  stats = emptyReviewStats,
  onRefresh,
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [responseDraft, setResponseDraft] = useState('');
  const [responseError, setResponseError] = useState(null);
  const [savingReviewId, setSavingReviewId] = useState(null);

  const filteredReviews = useMemo(
    () => filterReviews(reviews, activeFilter),
    [reviews, activeFilter],
  );
  const filterCounts = useMemo(() => REVIEW_FILTERS.reduce((acc, filter) => {
    acc[filter.value] = filterReviews(reviews, filter.value).length;
    return acc;
  }, {}), [reviews]);

  const openResponseEditor = (review) => {
    setEditingReviewId(review.id);
    setResponseDraft(review.response || '');
    setResponseError(null);
  };

  const closeResponseEditor = () => {
    setEditingReviewId(null);
    setResponseDraft('');
    setResponseError(null);
  };

  const handleSubmitResponse = async (review) => {
    setSavingReviewId(review.id);
    setResponseError(null);

    try {
      const safeResponse = sanitizeReviewResponse(responseDraft);
      const { error: updateError } = await updateInfluencerReviewResponse(review.id, safeResponse);
      if (updateError) throw updateError;

      await onRefresh?.();
      closeResponseEditor();
    } catch (err) {
      setResponseError(err.message || 'Gagal menyimpan respons ulasan.');
    } finally {
      setSavingReviewId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-gray-500 uppercase">Ulasan & Penilaian</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Reputasi dari UMKM</h1>
        <p className="text-gray-600 mt-2">
          Pantau ulasan promosi, kualitas penilaian, dan respons yang tampil di profil publik.
        </p>
      </header>

      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          label="Penilaian Rata-rata"
          value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
          caption={`${stats.totalReviews} total ulasan`}
          icon={faStar}
          iconClassName="bg-yellow-100 text-yellow-700"
        />
        <MetricCard
          label="Ulasan Publik"
          value={stats.publishedCount}
          caption={`${stats.unpublishedCount} ulasan privat`}
          icon={faEye}
          iconClassName="bg-green-100 text-green-700"
        />
        <MetricCard
          label="Respons Terkirim"
          value={stats.responseCount}
          caption={`${stats.responseRate}% ulasan sudah direspons`}
          icon={faReply}
          iconClassName="bg-blue-100 text-blue-700"
        />
        <MetricCard
          label="Belum Direspons"
          value={filterCounts.unanswered || 0}
          caption="Prioritas untuk membangun reputasi"
          icon={faComments}
          iconClassName="bg-gray-900 text-white"
        />
      </section>

      <RatingDistribution distribution={stats.distribution} totalReviews={stats.totalReviews} />

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap gap-2">
          {REVIEW_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeFilter === filter.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              <span className={`ml-2 text-xs ${activeFilter === filter.value ? 'text-gray-200' : 'text-gray-500'}`}>
                {filterCounts[filter.value] || 0}
              </span>
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="py-16 text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-gray-900" />
          <p className="text-gray-500 mt-4">Memuat ulasan...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">Ulasan belum bisa dimuat</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <FontAwesomeIcon icon={faComments} className="text-4xl text-gray-300 mb-3" />
          <p className="font-semibold text-gray-900">Belum ada ulasan pada filter ini</p>
          <p className="text-sm text-gray-500 mt-1">Ulasan akan muncul setelah UMKM menyelesaikan promosi dan memberi penilaian.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isEditing={editingReviewId === review.id}
              responseDraft={responseDraft}
              responseError={responseError}
              saving={savingReviewId === review.id}
              onEdit={openResponseEditor}
              onCancel={closeResponseEditor}
              onDraftChange={setResponseDraft}
              onSubmitResponse={handleSubmitResponse}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InfluencerReviewsPage;

export const REVIEW_RESPONSE_MAX_LENGTH = 700;

export const REVIEW_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: '5', label: '5 Bintang' },
  { value: '4', label: '4 Bintang' },
  { value: '3', label: '3 Bintang' },
  { value: '2', label: '2 Bintang' },
  { value: '1', label: '1 Bintang' },
  { value: 'unanswered', label: 'Belum Direspons' },
];

export const formatReviewDate = (value) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
};

export const calculateReviewStats = (reviews = []) => {
  const totalReviews = reviews.length;
  const ratingTotal = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  const averageRating = totalReviews > 0 ? ratingTotal / totalReviews : 0;
  const responseCount = reviews.filter((review) => String(review.response || '').trim()).length;
  const publishedCount = reviews.filter((review) => review.is_published !== false).length;
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => Number(review.rating) === rating).length,
  }));

  return {
    totalReviews,
    averageRating,
    responseCount,
    responseRate: totalReviews > 0 ? Math.round((responseCount / totalReviews) * 100) : 0,
    publishedCount,
    unpublishedCount: totalReviews - publishedCount,
    distribution,
  };
};

export const filterReviews = (reviews = [], activeFilter = 'all') => {
  if (activeFilter === 'all') return reviews;

  if (activeFilter === 'unanswered') {
    return reviews.filter((review) => !String(review.response || '').trim());
  }

  return reviews.filter((review) => String(review.rating) === String(activeFilter));
};

export const sanitizeReviewResponse = (value) => {
  const response = String(value || '').trim();

  if (response.length > REVIEW_RESPONSE_MAX_LENGTH) {
    throw new Error(`Respons maksimal ${REVIEW_RESPONSE_MAX_LENGTH} karakter.`);
  }

  return response || null;
};

export const getReviewCampaignName = (review = {}) => (
  review.order?.campaign_name || 'Campaign tanpa nama'
);

export const getReviewSmeName = (review = {}) => (
  review.order?.sme?.name || 'UMKM'
);

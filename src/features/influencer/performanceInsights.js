import { calculateInfluencerEarnings } from './earnings';

export const formatInsightCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export const formatInsightNumber = (value) => Number(value || 0).toLocaleString('id-ID');

export const formatInsightPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

export const getCurrentPeriodStart = (date = new Date()) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
);

export const formatSnapshotPeriod = (periodStart) => {
  if (!periodStart) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${periodStart}T00:00:00`));
};

export const sortPerformanceSnapshots = (snapshots = []) => (
  [...snapshots].sort((first, second) => (
    new Date(second.period_start || 0) - new Date(first.period_start || 0)
  ))
);

export const getFollowersGrowth = (profile = {}, snapshots = []) => {
  const currentFollowers = Number(profile?.followers_count || 0);
  const currentPeriodStart = getCurrentPeriodStart();
  const sortedSnapshots = sortPerformanceSnapshots(snapshots);
  const baselineSnapshot = sortedSnapshots.find((snapshot) => (
    snapshot.period_start && snapshot.period_start < currentPeriodStart
  ));

  if (!baselineSnapshot) {
    return {
      currentFollowers,
      baselineFollowers: null,
      baselinePeriod: null,
      growth: null,
      growthRate: null,
      hasBaseline: false,
    };
  }

  const baselineFollowers = Number(baselineSnapshot.followers_count || 0);
  const growth = currentFollowers - baselineFollowers;
  const growthRate = baselineFollowers > 0 ? (growth / baselineFollowers) * 100 : null;

  return {
    currentFollowers,
    baselineFollowers,
    baselinePeriod: baselineSnapshot.period_start,
    growth,
    growthRate,
    hasBaseline: true,
  };
};

export const calculatePerformanceInsights = ({
  profile = {},
  orders = [],
  reviewStats = {},
  snapshots = [],
}) => {
  const earnings = calculateInfluencerEarnings(orders);
  const followersGrowth = getFollowersGrowth(profile, snapshots);
  const averageRating = Number(reviewStats.averageRating || profile.rating_average || 0);
  const engagementRate = Number(profile.engagement_rate || 0);

  return {
    totalCampaigns: orders.length,
    completedCampaigns: earnings.completedCampaigns,
    averageRating,
    totalEarnings: earnings.grossCompletedEarnings,
    engagementRate,
    followersGrowth,
  };
};

export const createPerformanceSnapshotPayload = (profile = {}, influencerId) => {
  if (!influencerId) {
    throw new Error('Profil influencer belum siap. Lengkapi profil terlebih dahulu.');
  }

  return {
    influencer_id: influencerId,
    period_start: getCurrentPeriodStart(),
    followers_count: Number(profile.followers_count || 0),
    engagement_rate: Number(profile.engagement_rate || 0),
    total_orders: Number(profile.total_orders || 0),
    rating_average: Number(profile.rating_average || 0),
  };
};

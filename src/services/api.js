import { supabase } from './supabase';
import { apiLogger } from '../utils/logger';

const DEFAULT_REQUEST_TIMEOUT_MS = 20000;
const PUBLIC_INFLUENCER_COLUMNS = `
  id,
  username,
  name,
  profile_image,
  niche,
  bio,
  price_per_post,
  followers_count,
  engagement_rate,
  rating_average,
  total_orders,
  instagram_url,
  tiktok_url,
  youtube_url,
  is_verified,
  created_at
`;
const ORDER_DETAILS_COLUMNS = `
  id,
  sme_id,
  influencer_id,
  campaign_name,
  campaign_description,
  total_price,
  deadline,
  notes,
  pricing_package_id,
  package_snapshot,
  order_status,
  payment_status,
  payment_method,
  created_at,
  sme_name,
  influencer_name,
  influencer_username
`;
const PORTFOLIO_ITEM_COLUMNS = `
  id,
  influencer_id,
  title,
  description,
  content_type,
  brand_name,
  content_url,
  thumbnail_url,
  published_at,
  is_public,
  sort_order,
  created_at,
  updated_at
`;
const AVAILABILITY_COLUMNS = `
  id,
  influencer_id,
  date,
  status,
  note,
  is_public,
  created_at,
  updated_at
`;
const PRICING_PACKAGE_COLUMNS = `
  id,
  influencer_id,
  title,
  description,
  package_type,
  deliverables,
  price,
  delivery_days,
  revision_count,
  is_public,
  is_featured,
  sort_order,
  created_at,
  updated_at
`;
const PERFORMANCE_SNAPSHOT_COLUMNS = `
  id,
  influencer_id,
  period_start,
  followers_count,
  engagement_rate,
  total_orders,
  rating_average,
  created_at,
  updated_at
`;
const INFLUENCER_REVIEW_COLUMNS = `
  id,
  order_id,
  influencer_id,
  rating,
  comment,
  response,
  is_published,
  created_at,
  campaign_name,
  total_price,
  deadline,
  order_status,
  payment_status,
  order_created_at,
  sme_name,
  sme_profile_image
`;
const USER_PROFILE_COLUMNS = 'id, name, email, phone, profile_image, role, user_type, is_active, created_at';
const ADMIN_PLATFORM_FEE_PERCENT = Number(import.meta.env.VITE_PLATFORM_FEE_PERCENT || 0);
const INFLUENCER_PROFILE_COLUMNS = `
  id,
  user_id,
  username,
  niche,
  bio,
  price_per_post,
  followers_count,
  engagement_rate,
  rating_average,
  total_orders,
  instagram_url,
  tiktok_url,
  youtube_url,
  is_verified,
  created_at
`;
const PUBLIC_SME_COUNT_ESTIMATE = Number(import.meta.env.VITE_PUBLIC_SME_COUNT_ESTIMATE || 0);
const PUBLIC_SUCCESS_RATE_ESTIMATE = Number(import.meta.env.VITE_PUBLIC_SUCCESS_RATE_ESTIMATE || 95);
const AI_ENDPOINT_PLACEHOLDER_MARKERS = ['your-production-domain', 'your-edgeone-domain'];

const isConfiguredEndpoint = (endpoint) => (
  Boolean(endpoint)
  && !AI_ENDPOINT_PLACEHOLDER_MARKERS.some((marker) => String(endpoint).includes(marker))
);

const isLoopbackUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
  } catch (error) {
    return false;
  }
};

const createLocalBackendError = (featureName) => new Error(
  `Tidak bisa terhubung ke ${featureName} lokal. Pastikan local API berjalan, URL .env.local benar, dan CORS mengizinkan port frontend.`,
);

const createInvalidAgentResponseError = (featureName, response, responseText, endpoint) => {
  const isLocalEndpoint = isLoopbackUrl(endpoint);
  const statusLabel = `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
  const preview = responseText.trim().replace(/\s+/g, ' ').slice(0, 160);
  const message = response.status === 404 && isLocalEndpoint
    ? `Endpoint ${featureName} belum aktif di backend lokal. Restart \`npm run dev:all\`, lalu cek GET http://127.0.0.1:8080/health.`
    : `Server ${featureName} mengirim respons non-JSON (${statusLabel}).${preview ? ` Preview: ${preview}` : ''}`;
  const error = new Error(message);

  error.status = response.status;
  error.responsePreview = preview;
  return error;
};

const withTimeout = async (promise, label, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request terlalu lama. Periksa koneksi Anda lalu coba lagi.'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const mapInfluencerReviewRow = (row) => ({
  id: row.id,
  order_id: row.order_id,
  rating: row.rating,
  comment: row.comment,
  response: row.response,
  is_published: row.is_published,
  created_at: row.created_at,
  order: {
    id: row.order_id,
    influencer_id: row.influencer_id,
    campaign_name: row.campaign_name,
    total_price: row.total_price,
    deadline: row.deadline,
    order_status: row.order_status,
    payment_status: row.payment_status,
    created_at: row.order_created_at,
    sme: {
      name: row.sme_name,
      profile_image: row.sme_profile_image,
    },
  },
});

// ============================================
// PLATFORM STATS
// ============================================

/**
 * Get platform statistics (total influencers, SMEs, etc)
 */
export const getPlatformStats = async () => {
  try {
    const { count: influencersCount, error: influencersError } = await supabase
      .from('v_influencer_profiles')
      .select('id', { count: 'exact', head: true });
    
    if (influencersError) throw influencersError;

    const { count: smeCount, error: smeError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'sme');

    let completedOrders = 0;
    try {
      const { count, error: completedError } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('order_status', 'completed');
      
      if (!completedError) {
        completedOrders = count || 0;
      }
    } catch (ignore) {}

    let totalOrders = 0;
    try {
      const { count, error: totalError } = await supabase
        .from('orders')
        .select('id', { count: 'exact' });
      
      if (!totalError) {
        totalOrders = count || 0;
      }
    } catch (ignore) {}

    const successRate = totalOrders > 0 
      ? Math.round((completedOrders / totalOrders) * 100) 
      : PUBLIC_SUCCESS_RATE_ESTIMATE;

    const safeSmeCount = smeError ? PUBLIC_SME_COUNT_ESTIMATE : (smeCount || 0);
    const safeInfluencersCount = influencersCount || 0;

    return {
      data: {
        influencersCount: safeInfluencersCount,
        smeCount: safeSmeCount,
        successRate,
        totalInfluencers: safeInfluencersCount,
        totalSMEs: safeSmeCount,
        totalOrders,
      },
      error: null
    };
  } catch (error) {
    apiLogger.error('Error fetching platform stats:', error.message);
    return { 
      data: {
        influencersCount: 0,
        smeCount: PUBLIC_SME_COUNT_ESTIMATE,
        successRate: PUBLIC_SUCCESS_RATE_ESTIMATE,
        totalInfluencers: 0,
        totalSMEs: PUBLIC_SME_COUNT_ESTIMATE,
        totalOrders: 0,
      }, 
      error 
    };
  }
};

const getAdminUsersCount = async (applyFilter) => {
  let query = supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  if (applyFilter) {
    query = applyFilter(query);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
};

const getAdminOrdersCount = async (applyFilter) => {
  let query = supabase
    .from('v_order_details')
    .select('id', { count: 'exact', head: true });

  if (applyFilter) {
    query = applyFilter(query);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
};

/**
 * Get user statistics for admin workspace.
 */
export const getAdminUserStats = async () => {
  try {
    const [
      totalUsers,
      totalSMEs,
      totalInfluencers,
      totalAdmins,
      activeUsers,
      inactiveUsers,
    ] = await Promise.all([
      getAdminUsersCount(),
      getAdminUsersCount((query) => query.eq('user_type', 'sme')),
      getAdminUsersCount((query) => query.eq('user_type', 'influencer')),
      getAdminUsersCount((query) => query.eq('user_type', 'admin')),
      getAdminUsersCount((query) => query.eq('is_active', true)),
      getAdminUsersCount((query) => query.eq('is_active', false)),
    ]);

    return {
      data: {
        totalUsers,
        totalSMEs,
        totalInfluencers,
        totalAdmins,
        activeUsers,
        inactiveUsers,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin user stats:', error.message);
    return {
      data: {
        totalUsers: 0,
        totalSMEs: 0,
        totalInfluencers: 0,
        totalAdmins: 0,
        activeUsers: 0,
        inactiveUsers: 0,
      },
      error,
    };
  }
};

const getSafeAdminSearchTerm = (search = '') => search
  .trim()
  .replace(/[,%]/g, ' ')
  .replace(/\s+/g, ' ')
  .slice(0, 80);

const mapAdminUserRow = (row, influencerProfileByUserId) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  profile_image: row.profile_image,
  role: row.role,
  user_type: row.user_type,
  is_active: row.is_active,
  created_at: row.created_at,
  influencer_profile: influencerProfileByUserId.get(row.id) || null,
});

/**
 * Get users for admin management page. RLS keeps this admin-only.
 */
export const getAdminUsers = async (filters = {}) => {
  try {
    const safeLimit = Math.min(Math.max(Number(filters.limit) || 200, 1), 500);
    const safeSearch = getSafeAdminSearchTerm(filters.search);

    let query = supabase
      .from('users')
      .select(USER_PROFILE_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (filters.userType && filters.userType !== 'all') {
      query = query.eq('user_type', filters.userType);
    }

    if (filters.status === 'active') {
      query = query.eq('is_active', true);
    }

    if (filters.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (safeSearch) {
      query = query.or(`name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`);
    }

    const [
      { data: users, error: usersError },
      { data: stats, error: statsError },
    ] = await Promise.all([
      withTimeout(query, 'Fetching admin users'),
      getAdminUserStats(),
    ]);

    if (usersError) throw usersError;
    if (statsError) {
      apiLogger.warn('Admin user stats returned fallback:', statsError.message);
    }

    const influencerUserIds = (users || [])
      .filter((user) => user.user_type === 'influencer')
      .map((user) => user.id);

    const influencerProfileByUserId = new Map();

    if (influencerUserIds.length > 0) {
      const { data: influencerProfiles, error: influencerProfilesError } = await supabase
        .from('influencers')
        .select('id, user_id, username, niche, is_verified, total_orders, rating_average')
        .in('user_id', influencerUserIds);

      if (influencerProfilesError) {
        apiLogger.warn('Unable to enrich admin users with influencer profiles:', influencerProfilesError.message);
      } else {
        (influencerProfiles || []).forEach((profile) => {
          influencerProfileByUserId.set(profile.user_id, profile);
        });
      }
    }

    return {
      data: {
        users: (users || []).map((user) => mapAdminUserRow(user, influencerProfileByUserId)),
        stats,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin users:', error.message);
    return {
      data: {
        users: [],
        stats: {
          totalUsers: 0,
          totalSMEs: 0,
          totalInfluencers: 0,
          totalAdmins: 0,
          activeUsers: 0,
          inactiveUsers: 0,
        },
      },
      error,
    };
  }
};

const getAdminInfluencersCount = async (applyFilter) => {
  let query = supabase
    .from('influencers')
    .select('id', { count: 'exact', head: true });

  if (applyFilter) {
    query = applyFilter(query);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
};

/**
 * Get influencer statistics for admin workspace.
 */
export const getAdminInfluencerStats = async () => {
  try {
    const [
      totalInfluencers,
      verifiedInfluencers,
      unverifiedInfluencers,
      activeInfluencerAccounts,
      inactiveInfluencerAccounts,
    ] = await Promise.all([
      getAdminInfluencersCount(),
      getAdminInfluencersCount((query) => query.eq('is_verified', true)),
      getAdminInfluencersCount((query) => query.eq('is_verified', false)),
      getAdminUsersCount((query) => query.eq('user_type', 'influencer').eq('is_active', true)),
      getAdminUsersCount((query) => query.eq('user_type', 'influencer').eq('is_active', false)),
    ]);

    return {
      data: {
        totalInfluencers,
        verifiedInfluencers,
        unverifiedInfluencers,
        activeInfluencerAccounts,
        inactiveInfluencerAccounts,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin influencer stats:', error.message);
    return {
      data: {
        totalInfluencers: 0,
        verifiedInfluencers: 0,
        unverifiedInfluencers: 0,
        activeInfluencerAccounts: 0,
        inactiveInfluencerAccounts: 0,
      },
      error,
    };
  }
};

const calculateInfluencerProfileCompleteness = (profile, user) => {
  const checks = [
    user?.name,
    user?.email,
    user?.profile_image,
    profile.username,
    profile.niche,
    profile.bio,
    Number(profile.price_per_post) > 0,
    Number(profile.followers_count) > 0,
    profile.instagram_url || profile.tiktok_url || profile.youtube_url,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};

const mapAdminInfluencerRow = (profile, userById) => {
  const user = userById.get(profile.user_id) || null;

  return {
    ...profile,
    user,
    display_name: user?.name || profile.username || 'Influencer',
    email: user?.email || '',
    profile_image: user?.profile_image || '',
    is_active: user?.is_active ?? false,
    joined_at: user?.created_at || profile.created_at,
    profile_completeness: calculateInfluencerProfileCompleteness(profile, user),
  };
};

const applyAdminInfluencerFilters = (influencers, filters, safeSearch) => influencers.filter((influencer) => {
  if (filters.verification === 'verified' && !influencer.is_verified) return false;
  if (filters.verification === 'unverified' && influencer.is_verified) return false;
  if (filters.status === 'active' && !influencer.is_active) return false;
  if (filters.status === 'inactive' && influencer.is_active) return false;
  if (filters.niche && filters.niche !== 'all' && influencer.niche !== filters.niche) return false;

  if (safeSearch) {
    const searchableText = [
      influencer.display_name,
      influencer.email,
      influencer.username,
      influencer.niche,
      influencer.bio,
    ].filter(Boolean).join(' ').toLowerCase();

    return searchableText.includes(safeSearch.toLowerCase());
  }

  return true;
});

/**
 * Get influencers for admin management page. Data is enriched with user profiles.
 */
export const getAdminInfluencers = async (filters = {}) => {
  try {
    const safeLimit = Math.min(Math.max(Number(filters.limit) || 500, 1), 500);
    const safeSearch = getSafeAdminSearchTerm(filters.search);

    const [
      { data: influencerProfiles, error: influencersError },
      { data: stats, error: statsError },
    ] = await Promise.all([
      withTimeout(
        supabase
          .from('influencers')
          .select(INFLUENCER_PROFILE_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(safeLimit),
        'Fetching admin influencers',
      ),
      getAdminInfluencerStats(),
    ]);

    if (influencersError) throw influencersError;
    if (statsError) {
      apiLogger.warn('Admin influencer stats returned fallback:', statsError.message);
    }

    const userIds = (influencerProfiles || [])
      .map((profile) => profile.user_id)
      .filter(Boolean);

    const userById = new Map();

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(USER_PROFILE_COLUMNS)
        .in('id', userIds);

      if (usersError) throw usersError;

      (users || []).forEach((user) => {
        userById.set(user.id, user);
      });
    }

    const enrichedInfluencers = (influencerProfiles || [])
      .map((profile) => mapAdminInfluencerRow(profile, userById));

    const niches = [...new Set(
      enrichedInfluencers
        .map((influencer) => influencer.niche)
        .filter(Boolean),
    )].sort((first, second) => first.localeCompare(second));

    return {
      data: {
        influencers: applyAdminInfluencerFilters(enrichedInfluencers, filters, safeSearch),
        niches,
        stats,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin influencers:', error.message);
    return {
      data: {
        influencers: [],
        niches: [],
        stats: {
          totalInfluencers: 0,
          verifiedInfluencers: 0,
          unverifiedInfluencers: 0,
          activeInfluencerAccounts: 0,
          inactiveInfluencerAccounts: 0,
        },
      },
      error,
    };
  }
};

const createVerificationChecks = (profile, user, portfolioCount, pricingPackageCount) => ([
  { key: 'identity', label: 'Nama dan email tersedia', isComplete: Boolean(user?.name && user?.email) },
  { key: 'avatar', label: 'Foto profil tersedia', isComplete: Boolean(user?.profile_image) },
  { key: 'username', label: 'Username publik tersedia', isComplete: Boolean(profile.username) },
  { key: 'niche', label: 'Niche sudah diisi', isComplete: Boolean(profile.niche) },
  { key: 'bio', label: 'Bio kreator sudah diisi', isComplete: Boolean(profile.bio) },
  { key: 'pricing', label: 'Harga dasar valid', isComplete: Number(profile.price_per_post || 0) > 0 },
  { key: 'followers', label: 'Jumlah followers valid', isComplete: Number(profile.followers_count || 0) > 0 },
  { key: 'engagement', label: 'Engagement rate valid', isComplete: Number(profile.engagement_rate || 0) > 0 },
  {
    key: 'social',
    label: 'Minimal satu link sosial tersedia',
    isComplete: Boolean(profile.instagram_url || profile.tiktok_url || profile.youtube_url),
  },
  { key: 'portfolio', label: 'Portfolio publik tersedia', isComplete: portfolioCount > 0 },
  { key: 'packages', label: 'Paket harga publik tersedia', isComplete: pricingPackageCount > 0 },
]);

const calculateVerificationReadiness = (profile, user, portfolioCount, pricingPackageCount) => {
  const checks = createVerificationChecks(profile, user, portfolioCount, pricingPackageCount);
  const completedChecks = checks.filter((check) => check.isComplete).length;

  return {
    checks,
    completedChecks,
    totalChecks: checks.length,
    score: Math.round((completedChecks / checks.length) * 100),
  };
};

const mapAdminVerificationRow = (profile, userById, portfolioCountByInfluencerId, pricingCountByInfluencerId) => {
  const user = userById.get(profile.user_id) || null;
  const portfolioCount = portfolioCountByInfluencerId.get(profile.id) || 0;
  const pricingPackageCount = pricingCountByInfluencerId.get(profile.id) || 0;
  const readiness = calculateVerificationReadiness(profile, user, portfolioCount, pricingPackageCount);

  return {
    ...profile,
    user,
    display_name: user?.name || profile.username || 'Influencer',
    email: user?.email || '',
    profile_image: user?.profile_image || '',
    is_active: user?.is_active ?? false,
    joined_at: user?.created_at || profile.created_at,
    portfolio_count: portfolioCount,
    pricing_package_count: pricingPackageCount,
    verification_readiness: readiness,
  };
};

const getVerificationQueueStatus = (influencer) => {
  if (!influencer.is_active) return 'inactive';
  if (influencer.is_verified) return 'verified';
  if (influencer.verification_readiness.score >= 80) return 'ready';
  return 'needs_info';
};

const applyAdminVerificationFilters = (queue, filters, safeSearch) => queue.filter((influencer) => {
  const status = getVerificationQueueStatus(influencer);

  if (filters.status && filters.status !== 'all' && status !== filters.status) return false;

  if (safeSearch) {
    const searchableText = [
      influencer.display_name,
      influencer.email,
      influencer.username,
      influencer.niche,
      influencer.bio,
    ].filter(Boolean).join(' ').toLowerCase();

    return searchableText.includes(safeSearch.toLowerCase());
  }

  return true;
});

const createEmptyAdminVerificationStats = () => ({
  totalInfluencers: 0,
  verifiedInfluencers: 0,
  unverifiedInfluencers: 0,
  readyForReview: 0,
  needsInfo: 0,
  inactiveInfluencers: 0,
});

/**
 * Get influencer verification queue for admin workspace.
 */
export const getAdminVerificationQueue = async (filters = {}) => {
  try {
    const safeLimit = Math.min(Math.max(Number(filters.limit) || 500, 1), 500);
    const safeSearch = getSafeAdminSearchTerm(filters.search);

    const { data: influencerProfiles, error: influencersError } = await withTimeout(
      supabase
        .from('influencers')
        .select(INFLUENCER_PROFILE_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(safeLimit),
      'Fetching admin verification queue',
    );

    if (influencersError) throw influencersError;

    const influencerIds = (influencerProfiles || []).map((profile) => profile.id).filter(Boolean);
    const userIds = (influencerProfiles || []).map((profile) => profile.user_id).filter(Boolean);

    const [
      { data: users, error: usersError },
      { data: portfolioItems, error: portfolioError },
      { data: pricingPackages, error: pricingError },
    ] = await Promise.all([
      userIds.length > 0
        ? supabase.from('users').select(USER_PROFILE_COLUMNS).in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      influencerIds.length > 0
        ? supabase.from('influencer_portfolio_items').select('id, influencer_id, is_public').in('influencer_id', influencerIds).eq('is_public', true)
        : Promise.resolve({ data: [], error: null }),
      influencerIds.length > 0
        ? supabase.from('influencer_pricing_packages').select('id, influencer_id, is_public').in('influencer_id', influencerIds).eq('is_public', true)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (usersError) throw usersError;
    if (portfolioError) throw portfolioError;
    if (pricingError) throw pricingError;

    const userById = new Map();
    (users || []).forEach((user) => {
      userById.set(user.id, user);
    });

    const portfolioCountByInfluencerId = new Map();
    (portfolioItems || []).forEach((item) => {
      portfolioCountByInfluencerId.set(
        item.influencer_id,
        (portfolioCountByInfluencerId.get(item.influencer_id) || 0) + 1,
      );
    });

    const pricingCountByInfluencerId = new Map();
    (pricingPackages || []).forEach((item) => {
      pricingCountByInfluencerId.set(
        item.influencer_id,
        (pricingCountByInfluencerId.get(item.influencer_id) || 0) + 1,
      );
    });

    const queue = (influencerProfiles || []).map((profile) => mapAdminVerificationRow(
      profile,
      userById,
      portfolioCountByInfluencerId,
      pricingCountByInfluencerId,
    ));

    const stats = queue.reduce((summary, influencer) => {
      const status = getVerificationQueueStatus(influencer);

      summary.totalInfluencers += 1;
      if (influencer.is_verified) summary.verifiedInfluencers += 1;
      if (!influencer.is_verified) summary.unverifiedInfluencers += 1;
      if (status === 'ready') summary.readyForReview += 1;
      if (status === 'needs_info') summary.needsInfo += 1;
      if (status === 'inactive') summary.inactiveInfluencers += 1;

      return summary;
    }, createEmptyAdminVerificationStats());

    return {
      data: {
        queue: applyAdminVerificationFilters(queue, filters, safeSearch),
        stats,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin verification queue:', error.message);
    return {
      data: {
        queue: [],
        stats: createEmptyAdminVerificationStats(),
      },
      error,
    };
  }
};

/**
 * Update influencer verification status. RLS must allow admin update.
 */
export const updateAdminInfluencerVerification = async (influencerId, isVerified) => {
  try {
    const { data, error } = await supabase
      .from('influencers')
      .update({ is_verified: Boolean(isVerified) })
      .eq('id', influencerId)
      .select('id, is_verified')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error updating influencer verification:', error.message);
    return { data: null, error };
  }
};

/**
 * Get SME statistics for admin workspace.
 */
export const getAdminSMEStats = async () => {
  try {
    const [
      totalSMEs,
      activeSMEs,
      inactiveSMEs,
      totalCampaigns,
      paidCampaigns,
      unpaidCampaigns,
      completedCampaigns,
    ] = await Promise.all([
      getAdminUsersCount((query) => query.eq('user_type', 'sme')),
      getAdminUsersCount((query) => query.eq('user_type', 'sme').eq('is_active', true)),
      getAdminUsersCount((query) => query.eq('user_type', 'sme').eq('is_active', false)),
      getAdminOrdersCount(),
      getAdminOrdersCount((query) => query.eq('payment_status', 'paid')),
      getAdminOrdersCount((query) => query.eq('payment_status', 'unpaid')),
      getAdminOrdersCount((query) => query.eq('order_status', 'completed')),
    ]);

    return {
      data: {
        totalSMEs,
        activeSMEs,
        inactiveSMEs,
        totalCampaigns,
        paidCampaigns,
        unpaidCampaigns,
        completedCampaigns,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin SME stats:', error.message);
    return {
      data: {
        totalSMEs: 0,
        activeSMEs: 0,
        inactiveSMEs: 0,
        totalCampaigns: 0,
        paidCampaigns: 0,
        unpaidCampaigns: 0,
        completedCampaigns: 0,
      },
      error,
    };
  }
};

const createEmptySMEOrderSummary = () => ({
  totalCampaigns: 0,
  activeCampaigns: 0,
  pendingCampaigns: 0,
  completedCampaigns: 0,
  cancelledCampaigns: 0,
  paidCampaigns: 0,
  unpaidCampaigns: 0,
  totalCampaignValue: 0,
  paidSpend: 0,
  unpaidValue: 0,
  latestCampaign: null,
});

const summarizeSMEOrders = (orders = []) => orders.reduce((summary, order) => {
  const totalPrice = Number(order.total_price || 0);

  summary.totalCampaigns += 1;
  summary.totalCampaignValue += totalPrice;

  if (order.order_status === 'pending') summary.pendingCampaigns += 1;
  if (order.order_status === 'in_progress') summary.activeCampaigns += 1;
  if (order.order_status === 'completed') summary.completedCampaigns += 1;
  if (order.order_status === 'cancelled') summary.cancelledCampaigns += 1;

  if (order.payment_status === 'paid') {
    summary.paidCampaigns += 1;
    summary.paidSpend += totalPrice;
  }

  if (order.payment_status === 'unpaid') {
    summary.unpaidCampaigns += 1;
    summary.unpaidValue += totalPrice;
  }

  if (
    !summary.latestCampaign
    || new Date(order.created_at).getTime() > new Date(summary.latestCampaign.created_at).getTime()
  ) {
    summary.latestCampaign = order;
  }

  return summary;
}, createEmptySMEOrderSummary());

const mapAdminSMERow = (user, ordersBySMEId) => {
  const orders = ordersBySMEId.get(user.id) || [];
  const orderSummary = summarizeSMEOrders(orders);

  return {
    ...user,
    order_summary: orderSummary,
    last_campaign_at: orderSummary.latestCampaign?.created_at || null,
  };
};

const applyAdminSMEFilters = (smes, filters) => smes.filter((sme) => {
  if (filters.activity === 'with_campaigns' && sme.order_summary.totalCampaigns === 0) return false;
  if (filters.activity === 'no_campaigns' && sme.order_summary.totalCampaigns > 0) return false;
  if (filters.activity === 'unpaid' && sme.order_summary.unpaidCampaigns === 0) return false;
  if (filters.activity === 'active_campaigns' && sme.order_summary.activeCampaigns === 0) return false;

  return true;
});

/**
 * Get SMEs for admin management page. Data is enriched with order activity.
 */
export const getAdminSMEs = async (filters = {}) => {
  try {
    const safeLimit = Math.min(Math.max(Number(filters.limit) || 500, 1), 500);
    const safeSearch = getSafeAdminSearchTerm(filters.search);

    let usersQuery = supabase
      .from('users')
      .select(USER_PROFILE_COLUMNS)
      .eq('user_type', 'sme')
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (filters.status === 'active') {
      usersQuery = usersQuery.eq('is_active', true);
    }

    if (filters.status === 'inactive') {
      usersQuery = usersQuery.eq('is_active', false);
    }

    if (safeSearch) {
      usersQuery = usersQuery.or(`name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`);
    }

    const [
      { data: smeUsers, error: usersError },
      { data: stats, error: statsError },
    ] = await Promise.all([
      withTimeout(usersQuery, 'Fetching admin SMEs'),
      getAdminSMEStats(),
    ]);

    if (usersError) throw usersError;
    if (statsError) {
      apiLogger.warn('Admin SME stats returned fallback:', statsError.message);
    }

    const smeIds = (smeUsers || []).map((user) => user.id);
    const ordersBySMEId = new Map();

    if (smeIds.length > 0) {
      const { data: orders, error: ordersError } = await supabase
        .from('v_order_details')
        .select('id, sme_id, campaign_name, total_price, order_status, payment_status, created_at, deadline, influencer_name')
        .in('sme_id', smeIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      (orders || []).forEach((order) => {
        const currentOrders = ordersBySMEId.get(order.sme_id) || [];
        currentOrders.push(order);
        ordersBySMEId.set(order.sme_id, currentOrders);
      });
    }

    const enrichedSMEs = (smeUsers || []).map((user) => mapAdminSMERow(user, ordersBySMEId));

    return {
      data: {
        smes: applyAdminSMEFilters(enrichedSMEs, filters),
        stats,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin SMEs:', error.message);
    return {
      data: {
        smes: [],
        stats: {
          totalSMEs: 0,
          activeSMEs: 0,
          inactiveSMEs: 0,
          totalCampaigns: 0,
          paidCampaigns: 0,
          unpaidCampaigns: 0,
          completedCampaigns: 0,
        },
      },
      error,
    };
  }
};

const getAdminCampaignTimingStatus = (campaign = {}) => {
  if (!campaign.deadline) return 'no_deadline';
  if (['completed', 'cancelled'].includes(campaign.order_status)) return 'closed';

  const deadlineTime = new Date(campaign.deadline).getTime();
  if (Number.isNaN(deadlineTime)) return 'no_deadline';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadlineTime);
  deadlineDate.setHours(0, 0, 0, 0);

  const dayDiff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff < 0) return 'overdue';
  if (dayDiff <= 7) return 'due_soon';
  return 'on_track';
};

/**
 * Get campaign/order statistics for admin workspace.
 */
export const getAdminCampaignStats = async () => {
  try {
    const { data: campaigns, error } = await supabase
      .from('v_order_details')
      .select('id, total_price, order_status, payment_status, deadline')
      .limit(5000);

    if (error) throw error;

    const stats = (campaigns || []).reduce((summary, campaign) => {
      const totalPrice = Number(campaign.total_price || 0);
      const timingStatus = getAdminCampaignTimingStatus(campaign);

      summary.totalCampaigns += 1;
      summary.totalValue += totalPrice;

      if (campaign.order_status === 'pending') summary.pendingCampaigns += 1;
      if (campaign.order_status === 'in_progress') summary.activeCampaigns += 1;
      if (campaign.order_status === 'completed') summary.completedCampaigns += 1;
      if (campaign.order_status === 'cancelled') summary.cancelledCampaigns += 1;

      if (campaign.payment_status === 'paid') {
        summary.paidCampaigns += 1;
        summary.paidValue += totalPrice;
      }

      if (campaign.payment_status === 'unpaid') {
        summary.unpaidCampaigns += 1;
        summary.unpaidValue += totalPrice;
      }

      if (timingStatus === 'overdue') summary.overdueCampaigns += 1;
      if (timingStatus === 'due_soon') summary.dueSoonCampaigns += 1;

      return summary;
    }, {
      totalCampaigns: 0,
      pendingCampaigns: 0,
      activeCampaigns: 0,
      completedCampaigns: 0,
      cancelledCampaigns: 0,
      paidCampaigns: 0,
      unpaidCampaigns: 0,
      overdueCampaigns: 0,
      dueSoonCampaigns: 0,
      totalValue: 0,
      paidValue: 0,
      unpaidValue: 0,
    });

    return { data: stats, error: null };
  } catch (error) {
    apiLogger.error('Error fetching admin campaign stats:', error.message);
    return {
      data: {
        totalCampaigns: 0,
        pendingCampaigns: 0,
        activeCampaigns: 0,
        completedCampaigns: 0,
        cancelledCampaigns: 0,
        paidCampaigns: 0,
        unpaidCampaigns: 0,
        overdueCampaigns: 0,
        dueSoonCampaigns: 0,
        totalValue: 0,
        paidValue: 0,
        unpaidValue: 0,
      },
      error,
    };
  }
};

const mapAdminCampaignRow = (campaign) => ({
  ...campaign,
  timing_status: getAdminCampaignTimingStatus(campaign),
  package_title: campaign.package_snapshot?.title || 'Harga dasar per post',
});

const applyAdminCampaignTimingFilter = (campaigns, timingStatus) => {
  if (!timingStatus || timingStatus === 'all') return campaigns;
  return campaigns.filter((campaign) => campaign.timing_status === timingStatus);
};

/**
 * Get campaigns/orders for admin monitoring page.
 */
export const getAdminCampaigns = async (filters = {}) => {
  try {
    const safeLimit = Math.min(Math.max(Number(filters.limit) || 500, 1), 500);
    const safeSearch = getSafeAdminSearchTerm(filters.search);

    let query = supabase
      .from('v_order_details')
      .select(ORDER_DETAILS_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (filters.smeId) {
      query = query.eq('sme_id', filters.smeId);
    }

    if (filters.orderStatus && filters.orderStatus !== 'all') {
      query = query.eq('order_status', filters.orderStatus);
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      query = query.eq('payment_status', filters.paymentStatus);
    }

    if (safeSearch) {
      query = query.or(
        `campaign_name.ilike.%${safeSearch}%,campaign_description.ilike.%${safeSearch}%,sme_name.ilike.%${safeSearch}%,influencer_name.ilike.%${safeSearch}%,influencer_username.ilike.%${safeSearch}%`,
      );
    }

    const [
      { data: campaigns, error: campaignsError },
      { data: stats, error: statsError },
    ] = await Promise.all([
      withTimeout(query, 'Fetching admin campaigns'),
      getAdminCampaignStats(),
    ]);

    if (campaignsError) throw campaignsError;
    if (statsError) {
      apiLogger.warn('Admin campaign stats returned fallback:', statsError.message);
    }

    const enrichedCampaigns = (campaigns || []).map(mapAdminCampaignRow);

    return {
      data: {
        campaigns: applyAdminCampaignTimingFilter(enrichedCampaigns, filters.timingStatus),
        stats,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin campaigns:', error.message);
    return {
      data: {
        campaigns: [],
        stats: {
          totalCampaigns: 0,
          pendingCampaigns: 0,
          activeCampaigns: 0,
          completedCampaigns: 0,
          cancelledCampaigns: 0,
          paidCampaigns: 0,
          unpaidCampaigns: 0,
          overdueCampaigns: 0,
          dueSoonCampaigns: 0,
          totalValue: 0,
          paidValue: 0,
          unpaidValue: 0,
        },
      },
      error,
    };
  }
};

const createEmptyAdminPaymentStats = () => ({
  totalTransactions: 0,
  paidTransactions: 0,
  unpaidTransactions: 0,
  failedTransactions: 0,
  refundedTransactions: 0,
  totalValue: 0,
  paidValue: 0,
  unpaidValue: 0,
  failedValue: 0,
  refundedValue: 0,
  estimatedPlatformFee: 0,
  platformFeePercent: ADMIN_PLATFORM_FEE_PERCENT,
});

/**
 * Get payment statistics for admin workspace.
 */
export const getAdminPaymentStats = async () => {
  try {
    const { data: payments, error } = await supabase
      .from('v_order_details')
      .select('id, total_price, payment_status')
      .limit(5000);

    if (error) throw error;

    const stats = (payments || []).reduce((summary, payment) => {
      const totalPrice = Number(payment.total_price || 0);

      summary.totalTransactions += 1;
      summary.totalValue += totalPrice;

      if (payment.payment_status === 'paid') {
        summary.paidTransactions += 1;
        summary.paidValue += totalPrice;
      }

      if (payment.payment_status === 'unpaid') {
        summary.unpaidTransactions += 1;
        summary.unpaidValue += totalPrice;
      }

      if (payment.payment_status === 'failed') {
        summary.failedTransactions += 1;
        summary.failedValue += totalPrice;
      }

      if (payment.payment_status === 'refunded') {
        summary.refundedTransactions += 1;
        summary.refundedValue += totalPrice;
      }

      return summary;
    }, createEmptyAdminPaymentStats());

    stats.estimatedPlatformFee = stats.paidValue * (ADMIN_PLATFORM_FEE_PERCENT / 100);

    return { data: stats, error: null };
  } catch (error) {
    apiLogger.error('Error fetching admin payment stats:', error.message);
    return { data: createEmptyAdminPaymentStats(), error };
  }
};

const mapAdminPaymentRow = (payment) => ({
  ...payment,
  package_title: payment.package_snapshot?.title || 'Harga dasar per post',
  needs_follow_up: payment.payment_status === 'unpaid' && payment.order_status !== 'cancelled',
});

/**
 * Get payment rows for admin payment center.
 */
export const getAdminPayments = async (filters = {}) => {
  try {
    const safeLimit = Math.min(Math.max(Number(filters.limit) || 500, 1), 500);
    const safeSearch = getSafeAdminSearchTerm(filters.search);

    let query = supabase
      .from('v_order_details')
      .select(ORDER_DETAILS_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      query = query.eq('payment_status', filters.paymentStatus);
    }

    if (filters.orderStatus && filters.orderStatus !== 'all') {
      query = query.eq('order_status', filters.orderStatus);
    }

    if (safeSearch) {
      query = query.or(
        `campaign_name.ilike.%${safeSearch}%,campaign_description.ilike.%${safeSearch}%,sme_name.ilike.%${safeSearch}%,influencer_name.ilike.%${safeSearch}%,influencer_username.ilike.%${safeSearch}%`,
      );
    }

    const [
      { data: payments, error: paymentsError },
      { data: stats, error: statsError },
    ] = await Promise.all([
      withTimeout(query, 'Fetching admin payments'),
      getAdminPaymentStats(),
    ]);

    if (paymentsError) throw paymentsError;
    if (statsError) {
      apiLogger.warn('Admin payment stats returned fallback:', statsError.message);
    }

    return {
      data: {
        payments: (payments || []).map(mapAdminPaymentRow),
        stats,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin payments:', error.message);
    return {
      data: {
        payments: [],
        stats: createEmptyAdminPaymentStats(),
      },
      error,
    };
  }
};

const createEmptyAdminReviewStats = () => ({
  totalReviews: 0,
  averageRating: 0,
  lowRatingReviews: 0,
  publishedReviews: 0,
  unpublishedReviews: 0,
  respondedReviews: 0,
  unansweredReviews: 0,
  distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: 0 })),
});

const hasReviewResponse = (review = {}) => Boolean(String(review.response || '').trim());

const calculateReviewDistribution = (reviews = []) => [5, 4, 3, 2, 1].map((rating) => ({
  rating,
  count: reviews.filter((review) => Number(review.rating || 0) === rating).length,
}));

/**
 * Get review statistics for admin workspace.
 */
export const getAdminReviewStats = async () => {
  try {
    const { data: reviews, error } = await supabase
      .from('v_influencer_reviews')
      .select('id, rating, response, is_published')
      .limit(5000);

    if (error) throw error;

    const safeReviews = reviews || [];
    const ratingSum = safeReviews.reduce((total, review) => total + Number(review.rating || 0), 0);
    const averageRating = safeReviews.length > 0 ? ratingSum / safeReviews.length : 0;

    return {
      data: {
        totalReviews: safeReviews.length,
        averageRating,
        lowRatingReviews: safeReviews.filter((review) => Number(review.rating || 0) <= 3).length,
        publishedReviews: safeReviews.filter((review) => review.is_published !== false).length,
        unpublishedReviews: safeReviews.filter((review) => review.is_published === false).length,
        respondedReviews: safeReviews.filter(hasReviewResponse).length,
        unansweredReviews: safeReviews.filter((review) => !hasReviewResponse(review)).length,
        distribution: calculateReviewDistribution(safeReviews),
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin review stats:', error.message);
    return { data: createEmptyAdminReviewStats(), error };
  }
};

const mapAdminReviewRow = (review, influencerById) => {
  const influencer = influencerById.get(review.influencer_id) || null;

  return {
    ...review,
    influencer,
    influencer_name: influencer?.name || influencer?.username || 'Influencer',
    influencer_username: influencer?.username || '',
    has_response: hasReviewResponse(review),
    is_low_rating: Number(review.rating || 0) <= 3,
  };
};

const applyAdminReviewFilters = (reviews, filters) => reviews.filter((review) => {
  if (filters.responseStatus === 'responded' && !review.has_response) return false;
  if (filters.responseStatus === 'unanswered' && review.has_response) return false;

  return true;
});

/**
 * Get reviews for admin moderation page.
 */
export const getAdminReviews = async (filters = {}) => {
  try {
    const safeLimit = Math.min(Math.max(Number(filters.limit) || 500, 1), 500);
    const safeSearch = getSafeAdminSearchTerm(filters.search);

    let query = supabase
      .from('v_influencer_reviews')
      .select(INFLUENCER_REVIEW_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (filters.rating === 'low') {
      query = query.lte('rating', 3);
    } else if (filters.rating && filters.rating !== 'all') {
      query = query.eq('rating', Number(filters.rating));
    }

    if (filters.publicationStatus === 'published') {
      query = query.eq('is_published', true);
    }

    if (filters.publicationStatus === 'unpublished') {
      query = query.eq('is_published', false);
    }

    if (safeSearch) {
      query = query.or(
        `comment.ilike.%${safeSearch}%,response.ilike.%${safeSearch}%,campaign_name.ilike.%${safeSearch}%,sme_name.ilike.%${safeSearch}%`,
      );
    }

    const [
      { data: reviews, error: reviewsError },
      { data: stats, error: statsError },
    ] = await Promise.all([
      withTimeout(query, 'Fetching admin reviews'),
      getAdminReviewStats(),
    ]);

    if (reviewsError) throw reviewsError;
    if (statsError) {
      apiLogger.warn('Admin review stats returned fallback:', statsError.message);
    }

    const influencerIds = [...new Set((reviews || []).map((review) => review.influencer_id).filter(Boolean))];
    const influencerById = new Map();

    if (influencerIds.length > 0) {
      const { data: influencers, error: influencersError } = await supabase
        .from('v_influencer_profiles')
        .select('id, username, name, niche, rating_average, is_verified')
        .in('id', influencerIds);

      if (influencersError) {
        apiLogger.warn('Unable to enrich admin reviews with influencer profiles:', influencersError.message);
      } else {
        (influencers || []).forEach((influencer) => {
          influencerById.set(influencer.id, influencer);
        });
      }
    }

    const enrichedReviews = (reviews || []).map((review) => mapAdminReviewRow(review, influencerById));

    return {
      data: {
        reviews: applyAdminReviewFilters(enrichedReviews, filters),
        stats,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin reviews:', error.message);
    return {
      data: {
        reviews: [],
        stats: createEmptyAdminReviewStats(),
      },
      error,
    };
  }
};

const groupRowsByKey = (rows = [], key) => rows.reduce((collection, row) => {
  const groupKey = row?.[key];
  if (!groupKey) return collection;

  const currentRows = collection.get(groupKey) || [];
  currentRows.push(row);
  collection.set(groupKey, currentRows);
  return collection;
}, new Map());

const isNonEmptyText = (value) => Boolean(String(value || '').trim());

const isValidHttpUrl = (value) => {
  if (!value) return true;

  try {
    const parsedUrl = new URL(value);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (error) {
    return false;
  }
};

const createContentModerationIssues = (influencer, portfolioItems = [], pricingPackages = []) => {
  const issues = [];
  const publicPortfolio = portfolioItems.filter((item) => item.is_public !== false);
  const publicPackages = pricingPackages.filter((item) => item.is_public !== false);

  if (!isNonEmptyText(influencer.bio)) issues.push('Bio influencer belum diisi.');
  if (!influencer.instagram_url && !influencer.tiktok_url && !influencer.youtube_url) {
    issues.push('Belum ada link media sosial.');
  }
  if (publicPortfolio.length === 0) issues.push('Belum ada portfolio publik.');
  if (publicPackages.length === 0) issues.push('Belum ada paket harga publik.');
  if (portfolioItems.some((item) => !isNonEmptyText(item.title) || !isNonEmptyText(item.description))) {
    issues.push('Ada portfolio dengan judul atau deskripsi kosong.');
  }
  if (portfolioItems.some((item) => !isValidHttpUrl(item.content_url) || !isValidHttpUrl(item.thumbnail_url))) {
    issues.push('Ada portfolio dengan URL tidak valid.');
  }
  if (pricingPackages.some((item) => Number(item.price || 0) <= 0)) {
    issues.push('Ada paket harga dengan nominal tidak valid.');
  }
  if (pricingPackages.some((item) => !Array.isArray(item.deliverables) || item.deliverables.length === 0)) {
    issues.push('Ada paket harga tanpa deliverables.');
  }

  return issues;
};

const getContentModerationStatus = (issues = [], influencer = {}) => {
  if (!influencer.is_active) return 'inactive';
  if (issues.length >= 3) return 'high_risk';
  if (issues.length > 0) return 'needs_review';
  return 'clean';
};

const createEmptyAdminContentStats = () => ({
  totalInfluencers: 0,
  cleanInfluencers: 0,
  needsReview: 0,
  highRisk: 0,
  inactiveInfluencers: 0,
  totalPortfolioItems: 0,
  privatePortfolioItems: 0,
  totalPricingPackages: 0,
  privatePricingPackages: 0,
});

const mapAdminContentModerationRow = (influencer, user, portfolioItems = [], pricingPackages = []) => {
  const issues = createContentModerationIssues(influencer, portfolioItems, pricingPackages);
  const isActive = user?.is_active ?? false;
  const row = {
    ...influencer,
    user,
    display_name: user?.name || influencer.username || 'Influencer',
    email: user?.email || '',
    profile_image: user?.profile_image || '',
    is_active: isActive,
    portfolio_items: portfolioItems,
    pricing_packages: pricingPackages,
    public_portfolio_count: portfolioItems.filter((item) => item.is_public !== false).length,
    private_portfolio_count: portfolioItems.filter((item) => item.is_public === false).length,
    public_package_count: pricingPackages.filter((item) => item.is_public !== false).length,
    private_package_count: pricingPackages.filter((item) => item.is_public === false).length,
    moderation_issues: issues,
  };

  return {
    ...row,
    moderation_status: getContentModerationStatus(issues, row),
  };
};

const applyAdminContentModerationFilters = (rows, filters, safeSearch) => rows.filter((row) => {
  if (filters.status && filters.status !== 'all' && row.moderation_status !== filters.status) return false;
  if (filters.niche && filters.niche !== 'all' && row.niche !== filters.niche) return false;
  if (filters.visibility === 'has_private' && row.private_portfolio_count + row.private_package_count === 0) return false;
  if (filters.visibility === 'public_ready' && (row.public_portfolio_count === 0 || row.public_package_count === 0)) return false;

  if (safeSearch) {
    const searchableText = [
      row.display_name,
      row.email,
      row.username,
      row.niche,
      row.bio,
      ...row.portfolio_items.map((item) => `${item.title || ''} ${item.brand_name || ''}`),
      ...row.pricing_packages.map((item) => item.title || ''),
    ].join(' ').toLowerCase();

    return searchableText.includes(safeSearch.toLowerCase());
  }

  return true;
});

/**
 * Get influencer public content moderation data for admin workspace.
 */
export const getAdminContentModeration = async (filters = {}) => {
  try {
    const safeLimit = Math.min(Math.max(Number(filters.limit) || 500, 1), 500);
    const safeSearch = getSafeAdminSearchTerm(filters.search);

    const { data: influencers, error: influencerError } = await withTimeout(
      supabase
        .from('influencers')
        .select(INFLUENCER_PROFILE_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(safeLimit),
      'Fetching admin content moderation influencers',
    );

    if (influencerError) throw influencerError;

    const influencerIds = (influencers || []).map((influencer) => influencer.id).filter(Boolean);
    const userIds = (influencers || []).map((influencer) => influencer.user_id).filter(Boolean);

    const [
      { data: users, error: usersError },
      { data: portfolioItems, error: portfolioError },
      { data: pricingPackages, error: pricingError },
    ] = await Promise.all([
      userIds.length > 0
        ? supabase.from('users').select(USER_PROFILE_COLUMNS).in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      influencerIds.length > 0
        ? supabase.from('influencer_portfolio_items').select(PORTFOLIO_ITEM_COLUMNS).in('influencer_id', influencerIds)
        : Promise.resolve({ data: [], error: null }),
      influencerIds.length > 0
        ? supabase.from('influencer_pricing_packages').select(PRICING_PACKAGE_COLUMNS).in('influencer_id', influencerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (usersError) throw usersError;
    if (portfolioError) throw portfolioError;
    if (pricingError) throw pricingError;

    const userById = new Map();
    (users || []).forEach((user) => userById.set(user.id, user));

    const portfolioByInfluencerId = groupRowsByKey(portfolioItems || [], 'influencer_id');
    const pricingByInfluencerId = groupRowsByKey(pricingPackages || [], 'influencer_id');

    const rows = (influencers || []).map((influencer) => mapAdminContentModerationRow(
      influencer,
      userById.get(influencer.user_id) || null,
      portfolioByInfluencerId.get(influencer.id) || [],
      pricingByInfluencerId.get(influencer.id) || [],
    ));

    const stats = rows.reduce((summary, row) => {
      summary.totalInfluencers += 1;
      summary.totalPortfolioItems += row.portfolio_items.length;
      summary.privatePortfolioItems += row.private_portfolio_count;
      summary.totalPricingPackages += row.pricing_packages.length;
      summary.privatePricingPackages += row.private_package_count;

      if (row.moderation_status === 'clean') summary.cleanInfluencers += 1;
      if (row.moderation_status === 'needs_review') summary.needsReview += 1;
      if (row.moderation_status === 'high_risk') summary.highRisk += 1;
      if (row.moderation_status === 'inactive') summary.inactiveInfluencers += 1;

      return summary;
    }, createEmptyAdminContentStats());

    const niches = [...new Set(rows.map((row) => row.niche).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second));

    return {
      data: {
        items: applyAdminContentModerationFilters(rows, filters, safeSearch),
        niches,
        stats,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin content moderation:', error.message);
    return {
      data: {
        items: [],
        niches: [],
        stats: createEmptyAdminContentStats(),
      },
      error,
    };
  }
};

const getMonthKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tidak diketahui';

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (monthKey) => {
  const [year, month] = String(monthKey).split('-').map(Number);
  if (!year || !month) return monthKey;

  return new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1));
};

const buildMonthSeries = (monthsBack = 6) => {
  const series = [];
  const start = new Date();
  start.setDate(1);

  for (let index = monthsBack - 1; index >= 0; index -= 1) {
    const date = new Date(start);
    date.setMonth(start.getMonth() - index);
    const key = getMonthKey(date);
    series.push({ key, label: getMonthLabel(key), value: 0, secondaryValue: 0 });
  }

  return series;
};

const incrementMonthSeries = (series, dateValue, amount = 1, secondaryAmount = 0) => {
  const key = getMonthKey(dateValue);
  const item = series.find((entry) => entry.key === key);
  if (!item) return;

  item.value += amount;
  item.secondaryValue += secondaryAmount;
};

const getTopItems = (rows, key, labelResolver, valueResolver, limit = 6) => {
  const collection = new Map();

  rows.forEach((row) => {
    const itemKey = row?.[key];
    if (!itemKey) return;

    const current = collection.get(itemKey) || {
      id: itemKey,
      label: labelResolver(row),
      value: 0,
      secondaryValue: 0,
    };

    current.value += Number(valueResolver(row).value || 0);
    current.secondaryValue += Number(valueResolver(row).secondaryValue || 0);
    collection.set(itemKey, current);
  });

  return Array.from(collection.values())
    .sort((first, second) => second.value - first.value)
    .slice(0, limit);
};

const createEmptyAdminPlatformInsights = () => ({
  stats: {
    totalUsers: 0,
    totalSMEs: 0,
    totalInfluencers: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    paidRevenue: 0,
    unpaidRevenue: 0,
    averageRating: 0,
  },
  usersByMonth: buildMonthSeries(),
  campaignsByMonth: buildMonthSeries(),
  revenueByMonth: buildMonthSeries(),
  ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: 0 })),
  campaignStatusDistribution: [],
  paymentStatusDistribution: [],
  topNiches: [],
  topSMEs: [],
  topInfluencers: [],
});

/**
 * Get platform-wide analytics for admin insight page.
 */
export const getAdminPlatformInsights = async () => {
  try {
    const [
      { data: users, error: usersError },
      { data: orders, error: ordersError },
      { data: reviews, error: reviewsError },
      { data: influencers, error: influencersError },
    ] = await Promise.all([
      withTimeout(
        supabase.from('users').select(USER_PROFILE_COLUMNS).order('created_at', { ascending: true }).limit(5000),
        'Fetching insight users',
      ),
      withTimeout(
        supabase.from('v_order_details').select(ORDER_DETAILS_COLUMNS).order('created_at', { ascending: true }).limit(5000),
        'Fetching insight campaigns',
      ),
      withTimeout(
        supabase.from('v_influencer_reviews').select(INFLUENCER_REVIEW_COLUMNS).order('created_at', { ascending: true }).limit(5000),
        'Fetching insight reviews',
      ),
      withTimeout(
        supabase.from('v_influencer_profiles').select(PUBLIC_INFLUENCER_COLUMNS).limit(5000),
        'Fetching insight influencers',
      ),
    ]);

    if (usersError) throw usersError;
    if (ordersError) throw ordersError;
    if (reviewsError) throw reviewsError;
    if (influencersError) throw influencersError;

    const safeUsers = users || [];
    const safeOrders = orders || [];
    const safeReviews = reviews || [];
    const safeInfluencers = influencers || [];
    const usersByMonth = buildMonthSeries(6);
    const campaignsByMonth = buildMonthSeries(6);
    const revenueByMonth = buildMonthSeries(6);

    safeUsers.forEach((user) => incrementMonthSeries(usersByMonth, user.created_at, 1));
    safeOrders.forEach((order) => {
      incrementMonthSeries(campaignsByMonth, order.created_at, 1);
      incrementMonthSeries(revenueByMonth, order.created_at, Number(order.total_price || 0), order.payment_status === 'paid' ? Number(order.total_price || 0) : 0);
    });

    const paidRevenue = safeOrders
      .filter((order) => order.payment_status === 'paid')
      .reduce((total, order) => total + Number(order.total_price || 0), 0);
    const unpaidRevenue = safeOrders
      .filter((order) => order.payment_status === 'unpaid')
      .reduce((total, order) => total + Number(order.total_price || 0), 0);
    const ratingSum = safeReviews.reduce((total, review) => total + Number(review.rating || 0), 0);

    const campaignStatusDistribution = ['pending', 'in_progress', 'completed', 'cancelled'].map((status) => ({
      status,
      count: safeOrders.filter((order) => order.order_status === status).length,
    }));

    const paymentStatusDistribution = ['unpaid', 'paid', 'failed', 'refunded'].map((status) => ({
      status,
      count: safeOrders.filter((order) => order.payment_status === status).length,
    }));

    const topNiches = getTopItems(
      safeInfluencers,
      'niche',
      (row) => row.niche || 'Tanpa niche',
      (row) => ({ value: 1, secondaryValue: Number(row.followers_count || 0) }),
    );

    const topSMEs = getTopItems(
      safeOrders,
      'sme_id',
      (row) => row.sme_name || 'UMKM',
      (row) => ({ value: 1, secondaryValue: Number(row.total_price || 0) }),
    );

    const topInfluencers = getTopItems(
      safeOrders,
      'influencer_id',
      (row) => row.influencer_name || row.influencer_username || 'Influencer',
      (row) => ({ value: 1, secondaryValue: Number(row.total_price || 0) }),
    );

    return {
      data: {
        stats: {
          totalUsers: safeUsers.length,
          totalSMEs: safeUsers.filter((user) => user.user_type === 'sme').length,
          totalInfluencers: safeInfluencers.length,
          totalCampaigns: safeOrders.length,
          activeCampaigns: safeOrders.filter((order) => order.order_status === 'in_progress').length,
          completedCampaigns: safeOrders.filter((order) => order.order_status === 'completed').length,
          paidRevenue,
          unpaidRevenue,
          averageRating: safeReviews.length > 0 ? ratingSum / safeReviews.length : 0,
        },
        usersByMonth,
        campaignsByMonth,
        revenueByMonth,
        ratingDistribution: calculateReviewDistribution(safeReviews),
        campaignStatusDistribution,
        paymentStatusDistribution,
        topNiches,
        topSMEs,
        topInfluencers,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin platform insights:', error.message);
    return { data: createEmptyAdminPlatformInsights(), error };
  }
};

const reportColumnSets = {
  users: [
    { key: 'name', label: 'Nama' },
    { key: 'email', label: 'Email' },
    { key: 'user_type', label: 'Role' },
    { key: 'is_active', label: 'Aktif' },
    { key: 'created_at', label: 'Tanggal Daftar' },
  ],
  influencers: [
    { key: 'display_name', label: 'Nama' },
    { key: 'email', label: 'Email' },
    { key: 'username', label: 'Username' },
    { key: 'niche', label: 'Niche' },
    { key: 'followers_count', label: 'Followers' },
    { key: 'engagement_rate', label: 'Engagement' },
    { key: 'rating_average', label: 'Rating' },
    { key: 'is_verified', label: 'Verified' },
  ],
  smes: [
    { key: 'name', label: 'Nama UMKM' },
    { key: 'email', label: 'Email' },
    { key: 'is_active', label: 'Aktif' },
    { key: 'totalCampaigns', label: 'Total Campaign' },
    { key: 'unpaidCampaigns', label: 'Campaign Unpaid' },
    { key: 'totalCampaignValue', label: 'Nilai Campaign' },
  ],
  campaigns: [
    { key: 'campaign_name', label: 'Campaign' },
    { key: 'sme_name', label: 'UMKM' },
    { key: 'influencer_name', label: 'Influencer' },
    { key: 'order_status', label: 'Status Order' },
    { key: 'payment_status', label: 'Status Pembayaran' },
    { key: 'total_price', label: 'Nilai' },
    { key: 'deadline', label: 'Deadline' },
    { key: 'created_at', label: 'Tanggal Dibuat' },
  ],
  payments: [
    { key: 'campaign_name', label: 'Campaign' },
    { key: 'sme_name', label: 'UMKM' },
    { key: 'influencer_name', label: 'Influencer' },
    { key: 'payment_status', label: 'Pembayaran' },
    { key: 'order_status', label: 'Order' },
    { key: 'total_price', label: 'Nilai' },
    { key: 'payment_method', label: 'Metode' },
  ],
  reviews: [
    { key: 'campaign_name', label: 'Campaign' },
    { key: 'sme_name', label: 'UMKM' },
    { key: 'influencer_name', label: 'Influencer' },
    { key: 'rating', label: 'Rating' },
    { key: 'comment', label: 'Komentar' },
    { key: 'has_response', label: 'Ada Respons' },
    { key: 'is_published', label: 'Publik' },
  ],
};

const normalizeReportRows = (reportType, rows = []) => {
  if (reportType === 'smes') {
    return rows.map((row) => ({
      ...row,
      totalCampaigns: row.order_summary?.totalCampaigns || 0,
      unpaidCampaigns: row.order_summary?.unpaidCampaigns || 0,
      totalCampaignValue: row.order_summary?.totalCampaignValue || 0,
    }));
  }

  return rows;
};

const getAdminReportDataset = async (reportType) => {
  if (reportType === 'users') {
    const { data, error } = await getAdminUsers({ limit: 500 });
    return { rows: data?.users || [], stats: data?.stats || {}, error };
  }

  if (reportType === 'influencers') {
    const { data, error } = await getAdminInfluencers({ limit: 500 });
    return { rows: data?.influencers || [], stats: data?.stats || {}, error };
  }

  if (reportType === 'smes') {
    const { data, error } = await getAdminSMEs({ limit: 500 });
    return { rows: normalizeReportRows('smes', data?.smes || []), stats: data?.stats || {}, error };
  }

  if (reportType === 'payments') {
    const { data, error } = await getAdminPayments({ limit: 500 });
    return { rows: data?.payments || [], stats: data?.stats || {}, error };
  }

  if (reportType === 'reviews') {
    const { data, error } = await getAdminReviews({ limit: 500 });
    return { rows: data?.reviews || [], stats: data?.stats || {}, error };
  }

  const { data, error } = await getAdminCampaigns({ limit: 500 });
  return { rows: data?.campaigns || [], stats: data?.stats || {}, error };
};

/**
 * Get report rows for export-ready admin reports.
 */
export const getAdminReportsData = async (reportType = 'campaigns') => {
  try {
    const safeType = reportColumnSets[reportType] ? reportType : 'campaigns';
    const dataset = await getAdminReportDataset(safeType);

    if (dataset.error) throw dataset.error;

    return {
      data: {
        reportType: safeType,
        columns: reportColumnSets[safeType],
        rows: dataset.rows,
        stats: dataset.stats,
        generatedAt: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin reports:', error.message);
    return {
      data: {
        reportType,
        columns: reportColumnSets[reportType] || reportColumnSets.campaigns,
        rows: [],
        stats: {},
        generatedAt: new Date().toISOString(),
      },
      error,
    };
  }
};

const createSupportCase = ({
  id,
  type,
  severity,
  title,
  description,
  ownerName,
  assigneeName,
  amount = 0,
  createdAt,
  status = 'open',
  source,
}) => ({
  id,
  type,
  severity,
  title,
  description,
  ownerName,
  assigneeName,
  amount,
  createdAt,
  status,
  source,
});

const getSupportCaseSeverityWeight = (severity) => ({
  high: 3,
  medium: 2,
  low: 1,
}[severity] || 0);

const createAdminSupportCases = (orders = [], reviews = []) => {
  const cases = [];

  orders.forEach((order) => {
    const timingStatus = getAdminCampaignTimingStatus(order);

    if (timingStatus === 'overdue') {
      cases.push(createSupportCase({
        id: `overdue-${order.id}`,
        type: 'campaign_overdue',
        severity: 'high',
        title: order.campaign_name || 'Campaign lewat deadline',
        description: `Deadline campaign sudah lewat untuk ${order.sme_name || 'UMKM'} dan ${order.influencer_name || 'influencer'}.`,
        ownerName: order.sme_name,
        assigneeName: order.influencer_name || order.influencer_username,
        amount: Number(order.total_price || 0),
        createdAt: order.deadline || order.created_at,
        source: order,
      }));
    }

    if (timingStatus === 'due_soon') {
      cases.push(createSupportCase({
        id: `due-${order.id}`,
        type: 'campaign_due_soon',
        severity: 'medium',
        title: order.campaign_name || 'Campaign mendekati deadline',
        description: 'Campaign mendekati deadline dan perlu dipastikan progresnya.',
        ownerName: order.sme_name,
        assigneeName: order.influencer_name || order.influencer_username,
        amount: Number(order.total_price || 0),
        createdAt: order.deadline || order.created_at,
        source: order,
      }));
    }

    if (order.payment_status === 'unpaid' && order.order_status !== 'cancelled') {
      cases.push(createSupportCase({
        id: `unpaid-${order.id}`,
        type: 'payment_unpaid',
        severity: order.order_status === 'completed' ? 'high' : 'medium',
        title: order.campaign_name || 'Pembayaran belum selesai',
        description: 'Campaign masih unpaid dan perlu follow-up pembayaran.',
        ownerName: order.sme_name,
        assigneeName: order.influencer_name || order.influencer_username,
        amount: Number(order.total_price || 0),
        createdAt: order.created_at,
        source: order,
      }));
    }

    if (order.order_status === 'cancelled') {
      cases.push(createSupportCase({
        id: `cancelled-${order.id}`,
        type: 'campaign_cancelled',
        severity: 'low',
        title: order.campaign_name || 'Campaign dibatalkan',
        description: 'Campaign dibatalkan dan bisa ditinjau bila ada pola masalah.',
        ownerName: order.sme_name,
        assigneeName: order.influencer_name || order.influencer_username,
        amount: Number(order.total_price || 0),
        createdAt: order.created_at,
        status: 'review',
        source: order,
      }));
    }
  });

  reviews.forEach((review) => {
    if (Number(review.rating || 0) <= 3) {
      cases.push(createSupportCase({
        id: `review-low-${review.id}`,
        type: 'low_rating',
        severity: Number(review.rating || 0) <= 2 ? 'high' : 'medium',
        title: review.campaign_name || 'Review rating rendah',
        description: review.comment || 'UMKM memberi rating rendah dan perlu ditinjau.',
        ownerName: review.sme_name,
        assigneeName: review.influencer_name,
        amount: Number(review.total_price || 0),
        createdAt: review.created_at,
        status: 'review',
        source: review,
      }));
    }

    if (!hasReviewResponse(review)) {
      cases.push(createSupportCase({
        id: `review-response-${review.id}`,
        type: 'unanswered_review',
        severity: 'low',
        title: review.campaign_name || 'Review belum direspons',
        description: 'Influencer belum memberi respons pada review UMKM.',
        ownerName: review.sme_name,
        assigneeName: review.influencer_name,
        amount: Number(review.total_price || 0),
        createdAt: review.created_at,
        source: review,
      }));
    }
  });

  return cases.sort((first, second) => {
    const severityDiff = getSupportCaseSeverityWeight(second.severity) - getSupportCaseSeverityWeight(first.severity);
    if (severityDiff !== 0) return severityDiff;
    return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
  });
};

const applyAdminSupportFilters = (cases, filters, safeSearch) => cases.filter((item) => {
  if (filters.type && filters.type !== 'all' && item.type !== filters.type) return false;
  if (filters.severity && filters.severity !== 'all' && item.severity !== filters.severity) return false;
  if (filters.status && filters.status !== 'all' && item.status !== filters.status) return false;

  if (safeSearch) {
    const searchableText = [
      item.title,
      item.description,
      item.ownerName,
      item.assigneeName,
      item.type,
    ].join(' ').toLowerCase();

    return searchableText.includes(safeSearch.toLowerCase());
  }

  return true;
});

const createEmptyAdminSupportStats = () => ({
  totalCases: 0,
  highSeverity: 0,
  mediumSeverity: 0,
  lowSeverity: 0,
  openCases: 0,
  reviewCases: 0,
  totalExposure: 0,
});

/**
 * Get derived support and dispute cases from campaign, payment, and review signals.
 */
export const getAdminSupportCases = async (filters = {}) => {
  try {
    const safeSearch = getSafeAdminSearchTerm(filters.search);

    const [
      { data: orders, error: ordersError },
      { data: reviews, error: reviewsError },
    ] = await Promise.all([
      withTimeout(
        supabase.from('v_order_details').select(ORDER_DETAILS_COLUMNS).order('created_at', { ascending: false }).limit(1000),
        'Fetching support orders',
      ),
      withTimeout(
        supabase.from('v_influencer_reviews').select(INFLUENCER_REVIEW_COLUMNS).order('created_at', { ascending: false }).limit(1000),
        'Fetching support reviews',
      ),
    ]);

    if (ordersError) throw ordersError;
    if (reviewsError) throw reviewsError;

    const influencerIds = [...new Set((reviews || []).map((review) => review.influencer_id).filter(Boolean))];
    const influencerById = new Map();

    if (influencerIds.length > 0) {
      const { data: influencers, error: influencersError } = await supabase
        .from('v_influencer_profiles')
        .select('id, username, name')
        .in('id', influencerIds);

      if (influencersError) {
        apiLogger.warn('Unable to enrich support cases with influencer profiles:', influencersError.message);
      } else {
        (influencers || []).forEach((influencer) => {
          influencerById.set(influencer.id, influencer);
        });
      }
    }

    const enrichedReviews = (reviews || []).map((review) => {
      const influencer = influencerById.get(review.influencer_id);

      return {
        ...review,
        influencer_name: influencer?.name || influencer?.username || 'Influencer',
        influencer_username: influencer?.username || '',
      };
    });

    const cases = createAdminSupportCases(orders || [], enrichedReviews);
    const stats = cases.reduce((summary, item) => {
      summary.totalCases += 1;
      summary.totalExposure += Number(item.amount || 0);
      if (item.severity === 'high') summary.highSeverity += 1;
      if (item.severity === 'medium') summary.mediumSeverity += 1;
      if (item.severity === 'low') summary.lowSeverity += 1;
      if (item.status === 'open') summary.openCases += 1;
      if (item.status === 'review') summary.reviewCases += 1;
      return summary;
    }, createEmptyAdminSupportStats());

    return {
      data: {
        cases: applyAdminSupportFilters(cases, filters, safeSearch),
        stats,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin support cases:', error.message);
    return {
      data: {
        cases: [],
        stats: createEmptyAdminSupportStats(),
      },
      error,
    };
  }
};

const getConfiguredFlag = (value) => Boolean(value) && !String(value).includes('your-');

/**
 * Get platform settings overview. This reads runtime configuration and derived categories.
 */
export const getAdminPlatformSettings = async () => {
  try {
    const [
      { data: influencers, error: influencersError },
      { data: aiMonitor, error: aiMonitorError },
    ] = await Promise.all([
      withTimeout(
        supabase.from('influencers').select('id, niche, is_verified').limit(5000),
        'Fetching platform setting categories',
      ),
      getAdminAIMonitor(),
    ]);

    if (influencersError) throw influencersError;
    if (aiMonitorError) {
      apiLogger.warn('Admin settings AI monitor returned fallback:', aiMonitorError.message);
    }

    const nicheRows = Array.from((influencers || []).reduce((collection, influencer) => {
      if (!influencer.niche) return collection;

      const current = collection.get(influencer.niche) || {
        niche: influencer.niche,
        totalInfluencers: 0,
        verifiedInfluencers: 0,
      };

      current.totalInfluencers += 1;
      if (influencer.is_verified) current.verifiedInfluencers += 1;
      collection.set(influencer.niche, current);
      return collection;
    }, new Map()).values()).sort((first, second) => second.totalInfluencers - first.totalInfluencers);

    return {
      data: {
        platform: {
          status: import.meta.env.VITE_PLATFORM_STATUS || 'active',
          platformFeePercent: ADMIN_PLATFORM_FEE_PERCENT,
          publicSMEEstimate: PUBLIC_SME_COUNT_ESTIMATE,
          publicSuccessRateEstimate: PUBLIC_SUCCESS_RATE_ESTIMATE,
        },
        integrations: [
          {
            key: 'supabase',
            label: 'Supabase',
            isConfigured: getConfiguredFlag(import.meta.env.VITE_SUPABASE_URL) && getConfiguredFlag(import.meta.env.VITE_SUPABASE_ANON_KEY),
            envNames: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
          },
          {
            key: 'create-order',
            label: 'Order Backend',
            isConfigured: isConfiguredEndpoint(import.meta.env.VITE_EDGE_FUNCTION_URL),
            envNames: ['VITE_EDGE_FUNCTION_URL'],
          },
          {
            key: 'order-status',
            label: 'Status Campaign Backend',
            isConfigured: isConfiguredEndpoint(import.meta.env.VITE_EDGE_FUNCTION_ORDER_STATUS_URL),
            envNames: ['VITE_EDGE_FUNCTION_ORDER_STATUS_URL'],
          },
          {
            key: 'ai',
            label: 'AI Features',
            isConfigured: Number(aiMonitor?.stats?.readyFeatures || 0) > 0,
            envNames: ['VITE_EDGE_FUNCTION_*_AI_URL'],
            detail: `${aiMonitor?.stats?.readyFeatures || 0} dari ${aiMonitor?.stats?.totalFeatures || 0} fitur siap`,
          },
        ],
        niches: nicheRows,
        recommendations: [
          'Gunakan VITE_PLATFORM_FEE_PERCENT untuk estimasi revenue platform di dashboard pembayaran.',
          'Jalankan npm run dev:api saat testing lokal fitur AI dan order backend.',
          'Review kategori niche yang jarang dipakai agar marketplace tetap mudah dicari UMKM.',
          'Simpan API key hanya di backend function, bukan di variable VITE.',
        ],
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error fetching admin platform settings:', error.message);
    return {
      data: {
        platform: {
          status: import.meta.env.VITE_PLATFORM_STATUS || 'active',
          platformFeePercent: ADMIN_PLATFORM_FEE_PERCENT,
          publicSMEEstimate: PUBLIC_SME_COUNT_ESTIMATE,
          publicSuccessRateEstimate: PUBLIC_SUCCESS_RATE_ESTIMATE,
        },
        integrations: [],
        niches: [],
        recommendations: [],
      },
      error,
    };
  }
};

// ============================================
// INFLUENCERS
// ============================================

/**
 * Get all verified influencers with profile data
 */
export const getInfluencers = async (filters = {}) => {
  try {
    apiLogger.debug('Fetching influencers with filters:', filters);
    apiLogger.debug('Supabase client initialized:', !!supabase);
    
    let query = supabase
      .from('v_influencer_profiles')
      .select(PUBLIC_INFLUENCER_COLUMNS)
      .order('rating_average', { ascending: false });

    // Apply filters
    if (filters.niche) {
      query = query.ilike('niche', `%${filters.niche}%`);
    }
    if (filters.minFollowers) {
      query = query.gte('followers_count', filters.minFollowers);
    }
    if (filters.maxPrice) {
      query = query.lte('price_per_post', filters.maxPrice);
    }
    if (filters.isVerified !== undefined) {
      query = query.eq('is_verified', filters.isVerified);
    }

    apiLogger.debug('Executing query...');
    const { data, error } = await withTimeout(query, 'Fetching influencers');

    apiLogger.debug('Query response:', { 
      dataCount: data?.length, 
      hasError: !!error,
      errorDetails: error ? {
        message: error.message,
        code: error.code
      } : null
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error fetching influencers:', error.message);
    return { data: null, error };
  }
};

/**
 * Get single influencer by ID
 */
export const getInfluencerById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('v_influencer_profiles')
      .select(PUBLIC_INFLUENCER_COLUMNS)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error fetching influencer:', error.message);
    return { data: null, error };
  }
};

/**
 * Get single influencer by Username
 */
export const getInfluencerByUsername = async (username) => {
  try {
    const { data, error } = await supabase
      .from('v_influencer_profiles')
      .select(PUBLIC_INFLUENCER_COLUMNS)
      .eq('username', username)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error fetching influencer by username:', error.message);
    return { data: null, error };
  }
};

/**
 * Get reviews for an influencer. Public pages only load published reviews by default.
 */
export const getInfluencerReviews = async (influencerId, options = {}) => {
  try {
    if (!influencerId) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('v_influencer_reviews')
      .select(INFLUENCER_REVIEW_COLUMNS)
      .eq('influencer_id', influencerId)
      .order('created_at', { ascending: false });

    if (!options.includeUnpublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await withTimeout(query, 'Fetching influencer reviews');

    if (error) throw error;
    return { data: (data || []).map(mapInfluencerReviewRow), error: null };
  } catch (error) {
    apiLogger.error('Error fetching reviews:', error.message);
    return { data: [], error };
  }
};

/**
 * Update influencer response for one review. RLS enforces ownership.
 */
export const updateInfluencerReviewResponse = async (reviewId, response) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({ response })
      .eq('id', reviewId)
      .select('id, response')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error updating influencer review response:', error.message);
    return { data: null, error };
  }
};

// ============================================
// INFLUENCER PORTFOLIO
// ============================================

/**
 * Get portfolio/media kit items for an influencer.
 */
export const getInfluencerPortfolioItems = async (influencerId, options = {}) => {
  try {
    if (!influencerId) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('influencer_portfolio_items')
      .select(PORTFOLIO_ITEM_COLUMNS)
      .eq('influencer_id', influencerId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!options.includePrivate) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await withTimeout(query, 'Fetching influencer portfolio');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    apiLogger.error('Error fetching influencer portfolio:', error.message);
    return { data: [], error };
  }
};

/**
 * Create portfolio/media kit item owned by the current influencer.
 */
export const createInfluencerPortfolioItem = async (portfolioData) => {
  try {
    const { data, error } = await supabase
      .from('influencer_portfolio_items')
      .insert([portfolioData])
      .select(PORTFOLIO_ITEM_COLUMNS)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error creating influencer portfolio:', error.message);
    return { data: null, error };
  }
};

/**
 * Update portfolio/media kit item owned by the current influencer.
 */
export const updateInfluencerPortfolioItem = async (portfolioItemId, updates) => {
  try {
    const { influencer_id: ignoredInfluencerId, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from('influencer_portfolio_items')
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', portfolioItemId)
      .select(PORTFOLIO_ITEM_COLUMNS)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error updating influencer portfolio:', error.message);
    return { data: null, error };
  }
};

/**
 * Delete portfolio/media kit item owned by the current influencer.
 */
export const deleteInfluencerPortfolioItem = async (portfolioItemId) => {
  try {
    const { error } = await supabase
      .from('influencer_portfolio_items')
      .delete()
      .eq('id', portfolioItemId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    apiLogger.error('Error deleting influencer portfolio:', error.message);
    return { error };
  }
};

// ============================================
// INFLUENCER AVAILABILITY
// ============================================

/**
 * Get availability marks for an influencer in an optional date range.
 */
export const getInfluencerAvailability = async (influencerId, options = {}) => {
  try {
    if (!influencerId) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('influencer_availability')
      .select(AVAILABILITY_COLUMNS)
      .eq('influencer_id', influencerId)
      .order('date', { ascending: true });

    if (options.startDate) {
      query = query.gte('date', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('date', options.endDate);
    }

    if (!options.includePrivate) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await withTimeout(query, 'Fetching influencer availability');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    apiLogger.error('Error fetching influencer availability:', error.message);
    return { data: [], error };
  }
};

/**
 * Create or update one availability mark for the current influencer.
 */
export const upsertInfluencerAvailability = async (availabilityData) => {
  try {
    const { data, error } = await supabase
      .from('influencer_availability')
      .upsert(
        {
          ...availabilityData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'influencer_id,date' },
      )
      .select(AVAILABILITY_COLUMNS)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error saving influencer availability:', error.message);
    return { data: null, error };
  }
};

/**
 * Remove an availability mark owned by the current influencer.
 */
export const deleteInfluencerAvailability = async (influencerId, date) => {
  try {
    const { error } = await supabase
      .from('influencer_availability')
      .delete()
      .eq('influencer_id', influencerId)
      .eq('date', date);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    apiLogger.error('Error deleting influencer availability:', error.message);
    return { error };
  }
};

// ============================================
// INFLUENCER PRICING PACKAGES
// ============================================

/**
 * Get service pricing packages for an influencer.
 */
export const getInfluencerPricingPackages = async (influencerId, options = {}) => {
  try {
    if (!influencerId) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('influencer_pricing_packages')
      .select(PRICING_PACKAGE_COLUMNS)
      .eq('influencer_id', influencerId)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('price', { ascending: true });

    if (!options.includePrivate) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await withTimeout(query, 'Fetching influencer pricing packages');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    apiLogger.error('Error fetching influencer pricing packages:', error.message);
    return { data: [], error };
  }
};

/**
 * Resolve the currently logged-in influencer profile from the auth session.
 * Used as a fallback when the dashboard profile context has not hydrated influencer_id yet.
 */
export const getCurrentInfluencerProfile = async () => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session?.user?.id) {
      throw new Error('Silakan login ulang untuk mengelola paket layanan.');
    }

    const { data: user, error: userError } = await withTimeout(
      supabase
        .from('users')
        .select(USER_PROFILE_COLUMNS)
        .eq('id', session.user.id)
        .single(),
      'Resolving influencer user profile',
    );

    if (userError) throw userError;
    if (user?.user_type !== 'influencer') {
      throw new Error('Akun ini bukan akun influencer, sehingga tidak bisa mengelola paket layanan.');
    }
    if (user?.is_active === false) {
      throw new Error('Akun influencer belum aktif. Hubungi admin untuk mengaktifkan akun terlebih dahulu.');
    }

    const { data: influencerData, error: influencerError } = await withTimeout(
      supabase
        .from('influencers')
        .select(INFLUENCER_PROFILE_COLUMNS)
        .eq('user_id', session.user.id)
        .maybeSingle(),
      'Resolving influencer profile',
    );

    if (influencerError) throw influencerError;
    if (!influencerData?.id) {
      throw new Error('Profil influencer belum tersedia. Lengkapi profil influencer terlebih dahulu sebelum membuat paket layanan.');
    }

    return {
      data: {
        ...user,
        ...influencerData,
        auth_user_id: user.id,
        influencer_id: influencerData.id,
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error resolving current influencer profile:', error.message);
    return { data: null, error };
  }
};

/**
 * Create service pricing package owned by the current influencer.
 */
export const createInfluencerPricingPackage = async (packageData) => {
  try {
    const { data, error } = await supabase
      .from('influencer_pricing_packages')
      .insert([packageData])
      .select(PRICING_PACKAGE_COLUMNS)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error creating influencer pricing package:', error.message);
    return { data: null, error };
  }
};

/**
 * Update service pricing package owned by the current influencer.
 */
export const updateInfluencerPricingPackage = async (packageId, updates) => {
  try {
    const { influencer_id: ignoredInfluencerId, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from('influencer_pricing_packages')
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', packageId)
      .select(PRICING_PACKAGE_COLUMNS)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error updating influencer pricing package:', error.message);
    return { data: null, error };
  }
};

/**
 * Delete service pricing package owned by the current influencer.
 */
export const deleteInfluencerPricingPackage = async (packageId) => {
  try {
    const { error } = await supabase
      .from('influencer_pricing_packages')
      .delete()
      .eq('id', packageId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    apiLogger.error('Error deleting influencer pricing package:', error.message);
    return { error };
  }
};

// ============================================
// INFLUENCER PERFORMANCE SNAPSHOTS
// ============================================

/**
 * Get monthly performance snapshots for an influencer.
 */
export const getInfluencerPerformanceSnapshots = async (influencerId, options = {}) => {
  try {
    if (!influencerId) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('influencer_performance_snapshots')
      .select(PERFORMANCE_SNAPSHOT_COLUMNS)
      .eq('influencer_id', influencerId)
      .order('period_start', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await withTimeout(query, 'Fetching influencer performance snapshots');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    apiLogger.error('Error fetching influencer performance snapshots:', error.message);
    return { data: [], error };
  }
};

/**
 * Create or update a monthly performance snapshot for the current influencer.
 */
export const upsertInfluencerPerformanceSnapshot = async (snapshotData) => {
  try {
    const { data, error } = await supabase
      .from('influencer_performance_snapshots')
      .upsert(
        {
          ...snapshotData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'influencer_id,period_start' },
      )
      .select(PERFORMANCE_SNAPSHOT_COLUMNS)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error saving influencer performance snapshot:', error.message);
    return { data: null, error };
  }
};

// ============================================
// ORDERS
// ============================================

/**
 * Get orders with details. RLS still enforces ownership on the database side.
 */
export const getOrders = async (filters = {}) => {
  try {
    let query = supabase
      .from('v_order_details')
      .select(ORDER_DETAILS_COLUMNS)
      .order('created_at', { ascending: false });

    if (filters.smeId) {
      query = query.eq('sme_id', filters.smeId);
    }

    if (filters.influencerId) {
      query = query.eq('influencer_id', filters.influencerId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error fetching orders:', error.message);
    return { data: null, error };
  }
};

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
  try {
    const edgeFunctionUrl = import.meta.env.VITE_EDGE_FUNCTION_URL;
    const isConfigured = edgeFunctionUrl && !edgeFunctionUrl.includes('your-edgeone-domain');

    if (!isConfigured) {
      throw new Error('Endpoint pesanan belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login terlebih dahulu untuk membuat pesanan.');
    }

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(orderData),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error('Server pesanan mengirim respons yang tidak valid.');
    }

    if (!response.ok) {
      throw new Error(result.error || 'Gagal membuat pesanan.');
    }

    return { data: result.data, error: null };
  } catch (error) {
    apiLogger.error('Error creating order:', error.message);
    return { data: null, error };
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('v_order_details')
      .select(ORDER_DETAILS_COLUMNS)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error fetching order:', error.message);
    return { data: null, error };
  }
};

/**
 * Update influencer order status through trusted server function.
 */
export const updateInfluencerOrderStatus = async (orderId, nextStatus) => {
  try {
    const endpoint = import.meta.env.VITE_EDGE_FUNCTION_ORDER_STATUS_URL;
    const isConfigured = endpoint && !endpoint.includes('your-production-domain') && !endpoint.includes('your-edgeone-domain');

    if (!isConfigured) {
      throw new Error('Endpoint status campaign belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_ORDER_STATUS_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login ulang untuk memperbarui status campaign.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        next_status: nextStatus,
      }),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error('Server campaign mengirim respons yang tidak valid.');
    }

    if (!response.ok) {
      throw new Error(result.error || 'Gagal memperbarui status campaign.');
    }

    return { data: result.data, error: null };
  } catch (error) {
    apiLogger.error('Error updating influencer order status:', error.message);
    return { data: null, error };
  }
};

/**
 * Generate AI-assisted content for influencer workflows through trusted server function.
 */
export const generateInfluencerAIContent = async (assistantPayload) => {
  let endpoint = '';

  try {
    endpoint = import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL;
    const isConfigured = endpoint && !endpoint.includes('your-production-domain') && !endpoint.includes('your-edgeone-domain');

    if (!isConfigured) {
      throw new Error('Endpoint AI Assistant belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_INFLUENCER_AI_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login ulang untuk menggunakan AI Assistant.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(assistantPayload),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error('Server AI Assistant mengirim respons yang tidak valid.');
    }

    if (!response.ok) {
      const error = new Error(result.error || 'Gagal membuat draft AI Assistant.');
      error.status = response.status;
      error.retryAfter = result.retryAfter || Number(response.headers.get('Retry-After')) || null;
      throw error;
    }

    return { data: result.data, error: null };
  } catch (error) {
    const handledError = error instanceof TypeError && isLoopbackUrl(endpoint)
      ? createLocalBackendError('AI Assistant')
      : error;

    apiLogger.error('Error generating influencer AI content:', handledError.message);
    return { data: null, error: handledError };
  }
};

const getContentStrategyEndpoint = () => {
  const explicitEndpoint = import.meta.env.VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL;
  if (explicitEndpoint && !explicitEndpoint.includes('your-production-domain') && !explicitEndpoint.includes('your-edgeone-domain')) {
    return explicitEndpoint;
  }

  const fallbackBaseEndpoint = import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL || import.meta.env.VITE_EDGE_FUNCTION_AI_URL;
  if (!fallbackBaseEndpoint || fallbackBaseEndpoint.includes('your-production-domain') || fallbackBaseEndpoint.includes('your-edgeone-domain')) {
    return '';
  }

  try {
    return new URL('/content-strategy-agent', fallbackBaseEndpoint).toString();
  } catch (error) {
    return '';
  }
};

/**
 * Generate content strategy plans for SME and influencer workflows.
 */
export const generateContentStrategyPlan = async (strategyPayload) => {
  let endpoint = '';

  try {
    endpoint = getContentStrategyEndpoint();

    if (!endpoint) {
      throw new Error('Endpoint Content Strategy Agent belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login ulang untuk menggunakan Content Strategy Agent.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(strategyPayload),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error('Server Content Strategy Agent mengirim respons yang tidak valid.');
    }

    if (!response.ok) {
      const error = new Error(result.error || 'Gagal membuat strategi konten.');
      error.status = response.status;
      error.retryAfter = result.retryAfter || Number(response.headers.get('Retry-After')) || null;
      throw error;
    }

    return { data: result.data, error: null };
  } catch (error) {
    const handledError = error instanceof TypeError && isLoopbackUrl(endpoint)
      ? createLocalBackendError('Content Strategy Agent')
      : error;

    apiLogger.error('Error generating content strategy:', handledError.message);
    return { data: null, error: handledError };
  }
};

const getMarketResearchEndpoint = () => {
  const explicitEndpoint = import.meta.env.VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL;
  if (explicitEndpoint && !explicitEndpoint.includes('your-production-domain') && !explicitEndpoint.includes('your-edgeone-domain')) {
    return explicitEndpoint;
  }

  const fallbackBaseEndpoint = (
    import.meta.env.VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_AI_URL
  );

  if (!fallbackBaseEndpoint || fallbackBaseEndpoint.includes('your-production-domain') || fallbackBaseEndpoint.includes('your-edgeone-domain')) {
    return '';
  }

  try {
    return new URL('/market-research-agent', fallbackBaseEndpoint).toString();
  } catch (error) {
    return '';
  }
};

/**
 * Generate role-aware market research for SME and influencer workflows.
 */
export const generateMarketResearchReport = async (researchPayload) => {
  let endpoint = '';

  try {
    endpoint = getMarketResearchEndpoint();

    if (!endpoint) {
      throw new Error('Endpoint Market Research Agent belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login ulang untuk menggunakan Market Research Agent.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(researchPayload),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw createInvalidAgentResponseError('Market Research Agent', response, responseText, endpoint);
    }

    if (!response.ok) {
      const error = new Error(result.error || 'Gagal membuat riset pasar.');
      error.status = response.status;
      error.retryAfter = result.retryAfter || Number(response.headers.get('Retry-After')) || null;
      throw error;
    }

    return { data: result.data, error: null };
  } catch (error) {
    const handledError = error instanceof TypeError && isLoopbackUrl(endpoint)
      ? createLocalBackendError('Market Research Agent')
      : error;

    apiLogger.error('Error generating market research:', handledError.message);
    return { data: null, error: handledError };
  }
};

const getICPEndpoint = () => {
  const explicitEndpoint = import.meta.env.VITE_EDGE_FUNCTION_ICP_AI_URL;
  if (explicitEndpoint && !explicitEndpoint.includes('your-production-domain') && !explicitEndpoint.includes('your-edgeone-domain')) {
    return explicitEndpoint;
  }

  const fallbackBaseEndpoint = (
    import.meta.env.VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_AI_URL
  );

  if (!fallbackBaseEndpoint || fallbackBaseEndpoint.includes('your-production-domain') || fallbackBaseEndpoint.includes('your-edgeone-domain')) {
    return '';
  }

  try {
    return new URL('/icp-agent', fallbackBaseEndpoint).toString();
  } catch (error) {
    return '';
  }
};

/**
 * Generate an ideal customer/audience profile for SME and influencer workflows.
 */
export const generateICPProfile = async (icpPayload) => {
  let endpoint = '';

  try {
    endpoint = getICPEndpoint();

    if (!endpoint) {
      throw new Error('Endpoint ICP Agent belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_ICP_AI_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login ulang untuk menggunakan ICP Agent.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(icpPayload),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error('Server ICP Agent mengirim respons yang tidak valid.');
    }

    if (!response.ok) {
      const error = new Error(result.error || 'Gagal membuat ICP.');
      error.status = response.status;
      error.retryAfter = result.retryAfter || Number(response.headers.get('Retry-After')) || null;
      throw error;
    }

    return { data: result.data, error: null };
  } catch (error) {
    const handledError = error instanceof TypeError && isLoopbackUrl(endpoint)
      ? createLocalBackendError('ICP Agent')
      : error;

    apiLogger.error('Error generating ICP:', handledError.message);
    return { data: null, error: handledError };
  }
};

const getCompetitorAnalysisEndpoint = () => {
  const explicitEndpoint = import.meta.env.VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL;
  if (explicitEndpoint && !explicitEndpoint.includes('your-production-domain') && !explicitEndpoint.includes('your-edgeone-domain')) {
    return explicitEndpoint;
  }

  const fallbackBaseEndpoint = (
    import.meta.env.VITE_EDGE_FUNCTION_ICP_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_AI_URL
  );

  if (!fallbackBaseEndpoint || fallbackBaseEndpoint.includes('your-production-domain') || fallbackBaseEndpoint.includes('your-edgeone-domain')) {
    return '';
  }

  try {
    return new URL('/competitor-analysis-agent', fallbackBaseEndpoint).toString();
  } catch (error) {
    return '';
  }
};

/**
 * Generate competitor analysis for SME and influencer workflows.
 */
export const generateCompetitorAnalysis = async (analysisPayload) => {
  let endpoint = '';

  try {
    endpoint = getCompetitorAnalysisEndpoint();

    if (!endpoint) {
      throw new Error('Endpoint Competitor Analysis Agent belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login ulang untuk menggunakan Competitor Analysis Agent.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(analysisPayload),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error('Server Competitor Analysis Agent mengirim respons yang tidak valid.');
    }

    if (!response.ok) {
      const error = new Error(result.error || 'Gagal membuat analisis kompetitor.');
      error.status = response.status;
      error.retryAfter = result.retryAfter || Number(response.headers.get('Retry-After')) || null;
      throw error;
    }

    return { data: result.data, error: null };
  } catch (error) {
    const handledError = error instanceof TypeError && isLoopbackUrl(endpoint)
      ? createLocalBackendError('Competitor Analysis Agent')
      : error;

    apiLogger.error('Error generating competitor analysis:', handledError.message);
    return { data: null, error: handledError };
  }
};

const getSocialPostEndpoint = () => {
  const explicitEndpoint = import.meta.env.VITE_EDGE_FUNCTION_SOCIAL_POST_AI_URL;
  if (explicitEndpoint && !explicitEndpoint.includes('your-production-domain') && !explicitEndpoint.includes('your-edgeone-domain')) {
    return explicitEndpoint;
  }

  const fallbackBaseEndpoint = (
    import.meta.env.VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_ICP_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_AI_URL
  );

  if (!fallbackBaseEndpoint || fallbackBaseEndpoint.includes('your-production-domain') || fallbackBaseEndpoint.includes('your-edgeone-domain')) {
    return '';
  }

  try {
    return new URL('/social-post-agent', fallbackBaseEndpoint).toString();
  } catch (error) {
    return '';
  }
};

/**
 * Generate social post drafts for SME and influencer workflows.
 */
export const generateSocialPostDraft = async (postPayload) => {
  let endpoint = '';

  try {
    endpoint = getSocialPostEndpoint();

    if (!endpoint) {
      throw new Error('Endpoint Social Post Agent belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_SOCIAL_POST_AI_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login ulang untuk menggunakan Social Post Agent.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(postPayload),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error('Server Social Post Agent mengirim respons yang tidak valid.');
    }

    if (!response.ok) {
      const error = new Error(result.error || 'Gagal membuat draft social post.');
      error.status = response.status;
      error.retryAfter = result.retryAfter || Number(response.headers.get('Retry-After')) || null;
      throw error;
    }

    return { data: result.data, error: null };
  } catch (error) {
    const handledError = error instanceof TypeError && isLoopbackUrl(endpoint)
      ? createLocalBackendError('Social Post Agent')
      : error;

    apiLogger.error('Error generating social post:', handledError.message);
    return { data: null, error: handledError };
  }
};

const getEmailCampaignEndpoint = () => {
  const explicitEndpoint = import.meta.env.VITE_EDGE_FUNCTION_EMAIL_CAMPAIGN_AI_URL;
  if (explicitEndpoint && !explicitEndpoint.includes('your-production-domain') && !explicitEndpoint.includes('your-edgeone-domain')) {
    return explicitEndpoint;
  }

  const fallbackBaseEndpoint = (
    import.meta.env.VITE_EDGE_FUNCTION_SOCIAL_POST_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_ICP_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_AI_URL
  );

  if (!fallbackBaseEndpoint || fallbackBaseEndpoint.includes('your-production-domain') || fallbackBaseEndpoint.includes('your-edgeone-domain')) {
    return '';
  }

  try {
    return new URL('/email-campaign-agent', fallbackBaseEndpoint).toString();
  } catch (error) {
    return '';
  }
};

/**
 * Generate email or WhatsApp campaign sequences for SME workflows.
 */
export const generateEmailCampaignPlan = async (campaignPayload) => {
  let endpoint = '';

  try {
    endpoint = getEmailCampaignEndpoint();

    if (!endpoint) {
      throw new Error('Endpoint Email Campaign Agent belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_EMAIL_CAMPAIGN_AI_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login ulang untuk menggunakan Email Campaign Agent.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(campaignPayload),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw createInvalidAgentResponseError('Email Campaign Agent', response, responseText, endpoint);
    }

    if (!response.ok) {
      const error = new Error(result.error || 'Gagal membuat email campaign.');
      error.status = response.status;
      error.retryAfter = result.retryAfter || Number(response.headers.get('Retry-After')) || null;
      throw error;
    }

    return { data: result.data, error: null };
  } catch (error) {
    const handledError = error instanceof TypeError && isLoopbackUrl(endpoint)
      ? createLocalBackendError('Email Campaign Agent')
      : error;

    apiLogger.error('Error generating email campaign:', handledError.message);
    return { data: null, error: handledError };
  }
};

const getAdCopyEndpoint = () => {
  const explicitEndpoint = import.meta.env.VITE_EDGE_FUNCTION_AD_COPY_AI_URL;
  if (explicitEndpoint && !explicitEndpoint.includes('your-production-domain') && !explicitEndpoint.includes('your-edgeone-domain')) {
    return explicitEndpoint;
  }

  const fallbackBaseEndpoint = (
    import.meta.env.VITE_EDGE_FUNCTION_EMAIL_CAMPAIGN_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_SOCIAL_POST_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_ICP_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_AI_URL
  );

  if (!fallbackBaseEndpoint || fallbackBaseEndpoint.includes('your-production-domain') || fallbackBaseEndpoint.includes('your-edgeone-domain')) {
    return '';
  }

  try {
    return new URL('/ad-copy-agent', fallbackBaseEndpoint).toString();
  } catch (error) {
    return '';
  }
};

/**
 * Generate ad copy angles and variations for SME workflows.
 */
export const generateAdCopyPlan = async (adPayload) => {
  let endpoint = '';

  try {
    endpoint = getAdCopyEndpoint();

    if (!endpoint) {
      throw new Error('Endpoint Ad Copy Agent belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_AD_COPY_AI_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login ulang untuk menggunakan Ad Copy Agent.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(adPayload),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw createInvalidAgentResponseError('Ad Copy Agent', response, responseText, endpoint);
    }

    if (!response.ok) {
      const error = new Error(result.error || 'Gagal membuat ad copy.');
      error.status = response.status;
      error.retryAfter = result.retryAfter || Number(response.headers.get('Retry-After')) || null;
      throw error;
    }

    return { data: result.data, error: null };
  } catch (error) {
    const handledError = error instanceof TypeError && isLoopbackUrl(endpoint)
      ? createLocalBackendError('Ad Copy Agent')
      : error;

    apiLogger.error('Error generating ad copy:', handledError.message);
    return { data: null, error: handledError };
  }
};

const getMarketingOpsEndpoint = () => {
  const explicitEndpoint = import.meta.env.VITE_EDGE_FUNCTION_MARKETING_OPS_AI_URL;
  if (explicitEndpoint && !explicitEndpoint.includes('your-production-domain') && !explicitEndpoint.includes('your-edgeone-domain')) {
    return explicitEndpoint;
  }

  const fallbackBaseEndpoint = (
    import.meta.env.VITE_EDGE_FUNCTION_AD_COPY_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_EMAIL_CAMPAIGN_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_SOCIAL_POST_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_ICP_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL
    || import.meta.env.VITE_EDGE_FUNCTION_AI_URL
  );

  if (!fallbackBaseEndpoint || fallbackBaseEndpoint.includes('your-production-domain') || fallbackBaseEndpoint.includes('your-edgeone-domain')) {
    return '';
  }

  try {
    return new URL('/marketing-ops-agent', fallbackBaseEndpoint).toString();
  } catch (error) {
    return '';
  }
};

const getEnvEndpointValue = (envName) => import.meta.env[envName];

const getEndpointHealthUrl = (endpoint) => {
  try {
    return new URL('/health', endpoint).toString();
  } catch (error) {
    return '';
  }
};

const isValidEndpointUrl = (endpoint) => {
  try {
    new URL(endpoint);
    return true;
  } catch (error) {
    return false;
  }
};

const createAIMonitorFeature = ({
  id,
  name,
  audience,
  description,
  envName = '',
  routePath = '',
  endpointResolver,
  fallbackEnvNames = [],
  featureType = 'server',
}) => {
  if (featureType === 'client') {
    return {
      id,
      name,
      audience,
      description,
      envName,
      routePath,
      endpoint: '',
      source: 'client',
      sourceLabel: 'Tool lokal',
      featureType,
      healthEndpoint: '',
    };
  }

  const envEndpoint = envName ? getEnvEndpointValue(envName) : '';
  const endpoint = endpointResolver ? endpointResolver() : (isConfiguredEndpoint(envEndpoint) ? envEndpoint : '');
  const hasExplicitEndpoint = isConfiguredEndpoint(envEndpoint);
  const fallbackEnvName = !hasExplicitEndpoint && endpoint
    ? fallbackEnvNames.find((candidateEnvName) => isConfiguredEndpoint(getEnvEndpointValue(candidateEnvName))) || ''
    : '';

  return {
    id,
    name,
    audience,
    description,
    envName,
    routePath,
    endpoint,
    source: hasExplicitEndpoint ? 'env' : endpoint ? 'fallback' : 'missing',
    sourceLabel: hasExplicitEndpoint ? envName : fallbackEnvName || 'Belum dikonfigurasi',
    fallbackEnvName,
    featureType,
    healthEndpoint: endpoint && isLoopbackUrl(endpoint) ? getEndpointHealthUrl(endpoint) : '',
  };
};

const getAdminAIMonitorFeatures = () => ([
  createAIMonitorFeature({
    id: 'ai-match',
    name: 'Rekomendasi Influencer',
    audience: 'UMKM',
    description: 'Mencocokkan kebutuhan campaign UMKM dengan influencer yang paling relevan.',
    envName: 'VITE_EDGE_FUNCTION_AI_URL',
    routePath: '/ai-match',
    endpointResolver: () => (isConfiguredEndpoint(import.meta.env.VITE_EDGE_FUNCTION_AI_URL)
      ? import.meta.env.VITE_EDGE_FUNCTION_AI_URL
      : ''),
  }),
  createAIMonitorFeature({
    id: 'influencer-assistant',
    name: 'Asisten AI Influencer',
    audience: 'Influencer',
    description: 'Membantu influencer membuat caption, ide konten, dan balasan proposal campaign.',
    envName: 'VITE_EDGE_FUNCTION_INFLUENCER_AI_URL',
    routePath: '/influencer-ai-assistant',
    endpointResolver: () => (isConfiguredEndpoint(import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL)
      ? import.meta.env.VITE_EDGE_FUNCTION_INFLUENCER_AI_URL
      : ''),
  }),
  createAIMonitorFeature({
    id: 'market-research',
    name: 'Riset Pasar',
    audience: 'UMKM dan Influencer',
    description: 'Membaca tren, pain point, search intent, dan peluang campaign sebelum membuat konten.',
    envName: 'VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL',
    routePath: '/market-research-agent',
    endpointResolver: getMarketResearchEndpoint,
    fallbackEnvNames: [
      'VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL',
      'VITE_EDGE_FUNCTION_INFLUENCER_AI_URL',
      'VITE_EDGE_FUNCTION_AI_URL',
    ],
  }),
  createAIMonitorFeature({
    id: 'icp',
    name: 'ICP Customer',
    audience: 'UMKM',
    description: 'Menyusun profil customer ideal, segmentasi bernilai, objection, dan pesan campaign.',
    envName: 'VITE_EDGE_FUNCTION_ICP_AI_URL',
    routePath: '/icp-agent',
    endpointResolver: getICPEndpoint,
    fallbackEnvNames: [
      'VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL',
      'VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL',
      'VITE_EDGE_FUNCTION_INFLUENCER_AI_URL',
      'VITE_EDGE_FUNCTION_AI_URL',
    ],
  }),
  createAIMonitorFeature({
    id: 'competitor-analysis',
    name: 'Analisis Kompetitor',
    audience: 'UMKM',
    description: 'Membandingkan positioning, offer, pesan, dan gap konten kompetitor.',
    envName: 'VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL',
    routePath: '/competitor-analysis-agent',
    endpointResolver: getCompetitorAnalysisEndpoint,
    fallbackEnvNames: [
      'VITE_EDGE_FUNCTION_ICP_AI_URL',
      'VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL',
      'VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL',
      'VITE_EDGE_FUNCTION_INFLUENCER_AI_URL',
      'VITE_EDGE_FUNCTION_AI_URL',
    ],
  }),
  createAIMonitorFeature({
    id: 'content-strategy',
    name: 'Strategi Konten',
    audience: 'UMKM dan Influencer',
    description: 'Menyusun pilar konten, angle, CTA, dan rencana mingguan untuk campaign.',
    envName: 'VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL',
    routePath: '/content-strategy-agent',
    endpointResolver: getContentStrategyEndpoint,
    fallbackEnvNames: [
      'VITE_EDGE_FUNCTION_INFLUENCER_AI_URL',
      'VITE_EDGE_FUNCTION_AI_URL',
    ],
  }),
  createAIMonitorFeature({
    id: 'social-post',
    name: 'Social Post',
    audience: 'UMKM dan Influencer',
    description: 'Mengubah ide produk atau campaign menjadi hook, caption, script, dan CTA.',
    envName: 'VITE_EDGE_FUNCTION_SOCIAL_POST_AI_URL',
    routePath: '/social-post-agent',
    endpointResolver: getSocialPostEndpoint,
    fallbackEnvNames: [
      'VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL',
      'VITE_EDGE_FUNCTION_ICP_AI_URL',
      'VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL',
      'VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL',
      'VITE_EDGE_FUNCTION_INFLUENCER_AI_URL',
      'VITE_EDGE_FUNCTION_AI_URL',
    ],
  }),
  createAIMonitorFeature({
    id: 'email-campaign',
    name: 'Email Campaign',
    audience: 'UMKM',
    description: 'Membuat subject line, sequence email atau WhatsApp, objection handling, dan CTA follow-up.',
    envName: 'VITE_EDGE_FUNCTION_EMAIL_CAMPAIGN_AI_URL',
    routePath: '/email-campaign-agent',
    endpointResolver: getEmailCampaignEndpoint,
    fallbackEnvNames: [
      'VITE_EDGE_FUNCTION_SOCIAL_POST_AI_URL',
      'VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL',
      'VITE_EDGE_FUNCTION_ICP_AI_URL',
      'VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL',
      'VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL',
      'VITE_EDGE_FUNCTION_INFLUENCER_AI_URL',
      'VITE_EDGE_FUNCTION_AI_URL',
    ],
  }),
  createAIMonitorFeature({
    id: 'ad-copy',
    name: 'Ad Copy',
    audience: 'UMKM',
    description: 'Membuat angle iklan, headline, body copy, CTA, dan variasi untuk A/B test.',
    envName: 'VITE_EDGE_FUNCTION_AD_COPY_AI_URL',
    routePath: '/ad-copy-agent',
    endpointResolver: getAdCopyEndpoint,
    fallbackEnvNames: [
      'VITE_EDGE_FUNCTION_EMAIL_CAMPAIGN_AI_URL',
      'VITE_EDGE_FUNCTION_SOCIAL_POST_AI_URL',
      'VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL',
      'VITE_EDGE_FUNCTION_ICP_AI_URL',
      'VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL',
      'VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL',
      'VITE_EDGE_FUNCTION_INFLUENCER_AI_URL',
      'VITE_EDGE_FUNCTION_AI_URL',
    ],
  }),
  createAIMonitorFeature({
    id: 'marketing-ops',
    name: 'Marketing Ops',
    audience: 'UMKM',
    description: 'Menyusun kalender campaign, checklist publish, asset tracker, metrik, dan outline report.',
    envName: 'VITE_EDGE_FUNCTION_MARKETING_OPS_AI_URL',
    routePath: '/marketing-ops-agent',
    endpointResolver: getMarketingOpsEndpoint,
    fallbackEnvNames: [
      'VITE_EDGE_FUNCTION_AD_COPY_AI_URL',
      'VITE_EDGE_FUNCTION_EMAIL_CAMPAIGN_AI_URL',
      'VITE_EDGE_FUNCTION_SOCIAL_POST_AI_URL',
      'VITE_EDGE_FUNCTION_COMPETITOR_ANALYSIS_AI_URL',
      'VITE_EDGE_FUNCTION_ICP_AI_URL',
      'VITE_EDGE_FUNCTION_MARKET_RESEARCH_AI_URL',
      'VITE_EDGE_FUNCTION_CONTENT_STRATEGY_AI_URL',
      'VITE_EDGE_FUNCTION_INFLUENCER_AI_URL',
      'VITE_EDGE_FUNCTION_AI_URL',
    ],
  }),
  createAIMonitorFeature({
    id: 'brief-builder',
    name: 'Pembuat Brief Promosi',
    audience: 'UMKM',
    description: 'Membuat draf brief promosi dari input form UMKM tanpa memanggil backend AI.',
    featureType: 'client',
  }),
]);

const checkAdminAIFeatureHealth = async (feature) => {
  if (feature.featureType === 'client') {
    return {
      ...feature,
      status: 'client_ready',
      statusLabel: 'Tool lokal',
      statusMessage: 'Berjalan di browser dan tidak membutuhkan endpoint backend.',
      isReady: true,
      isLocal: false,
      isProduction: false,
    };
  }

  if (!feature.endpoint) {
    return {
      ...feature,
      status: 'missing',
      statusLabel: 'Belum konfigurasi',
      statusMessage: `Isi ${feature.envName} di .env.local atau .env production.`,
      isReady: false,
      isLocal: false,
      isProduction: false,
    };
  }

  if (!isValidEndpointUrl(feature.endpoint)) {
    return {
      ...feature,
      status: 'invalid',
      statusLabel: 'URL tidak valid',
      statusMessage: `Periksa format ${feature.envName}. URL harus lengkap, misalnya http://127.0.0.1:8080${feature.routePath}.`,
      isReady: false,
      isLocal: false,
      isProduction: false,
    };
  }

  if (!isLoopbackUrl(feature.endpoint)) {
    return {
      ...feature,
      status: 'configured',
      statusLabel: 'Production siap',
      statusMessage: 'Endpoint production sudah terisi. Health check browser dilewati agar tidak bergantung pada CORS production.',
      isReady: true,
      isLocal: false,
      isProduction: true,
    };
  }

  try {
    const response = await withTimeout(fetch(feature.healthEndpoint), `Checking ${feature.name} health`, 5000);
    const responseText = await response.text();
    let payload = {};

    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      payload = {};
    }

    if (!response.ok) {
      return {
        ...feature,
        status: 'local_error',
        statusLabel: 'Local error',
        statusMessage: `Health check mengembalikan HTTP ${response.status}. Restart npm run dev:api atau npm run dev:all.`,
        isReady: false,
        isLocal: true,
        isProduction: false,
      };
    }

    const routeLabel = feature.routePath ? `POST ${feature.routePath}` : '';
    const routes = Array.isArray(payload.routes) ? payload.routes : [];
    const routeIsRegistered = !routeLabel || routes.includes(routeLabel);

    if (!routeIsRegistered) {
      return {
        ...feature,
        status: 'route_missing',
        statusLabel: 'Route belum aktif',
        statusMessage: `${routeLabel} belum muncul di health check lokal. Restart local API server.`,
        isReady: false,
        isLocal: true,
        isProduction: false,
      };
    }

    return {
      ...feature,
      status: 'healthy',
      statusLabel: 'Lokal sehat',
      statusMessage: 'Backend lokal berjalan dan route fitur tersedia.',
      isReady: true,
      isLocal: true,
      isProduction: false,
      localRoutesCount: routes.length,
    };
  } catch (error) {
    return {
      ...feature,
      status: 'local_unreachable',
      statusLabel: 'Local tidak terhubung',
      statusMessage: 'Tidak bisa menjangkau GET /health. Jalankan npm run dev:api atau npm run dev:all.',
      isReady: false,
      isLocal: true,
      isProduction: false,
    };
  }
};

const buildAdminAIMonitorStats = (features = []) => {
  const readyFeatures = features.filter((feature) => feature.isReady);
  const localFeatures = features.filter((feature) => feature.isLocal);
  const localHealthyFeatures = features.filter((feature) => feature.status === 'healthy');
  const issueFeatures = features.filter((feature) => !feature.isReady);

  return {
    totalFeatures: features.length,
    readyFeatures: readyFeatures.length,
    localFeatures: localFeatures.length,
    localHealthyFeatures: localHealthyFeatures.length,
    productionFeatures: features.filter((feature) => feature.isProduction).length,
    clientFeatures: features.filter((feature) => feature.featureType === 'client').length,
    missingFeatures: features.filter((feature) => feature.status === 'missing').length,
    issueFeatures: issueFeatures.length,
  };
};

/**
 * Monitor AI feature endpoint readiness for the admin workspace.
 */
export const getAdminAIMonitor = async () => {
  try {
    const features = await Promise.all(getAdminAIMonitorFeatures().map(checkAdminAIFeatureHealth));

    return {
      data: {
        generatedAt: new Date().toISOString(),
        features,
        stats: buildAdminAIMonitorStats(features),
      },
      error: null,
    };
  } catch (error) {
    apiLogger.error('Error checking admin AI monitor:', error.message);
    return {
      data: {
        generatedAt: new Date().toISOString(),
        features: [],
        stats: buildAdminAIMonitorStats([]),
      },
      error,
    };
  }
};

/**
 * Generate marketing operations plans for SME campaign workflows.
 */
export const generateMarketingOpsPlan = async (opsPayload) => {
  let endpoint = '';

  try {
    endpoint = getMarketingOpsEndpoint();

    if (!endpoint) {
      throw new Error('Endpoint Marketing Ops Agent belum dikonfigurasi. Periksa VITE_EDGE_FUNCTION_MARKETING_OPS_AI_URL.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error('Silakan login ulang untuk menggunakan Marketing Ops Agent.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(opsPayload),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw createInvalidAgentResponseError('Marketing Ops Agent', response, responseText, endpoint);
    }

    if (!response.ok) {
      const error = new Error(result.error || 'Gagal membuat marketing ops plan.');
      error.status = response.status;
      error.retryAfter = result.retryAfter || Number(response.headers.get('Retry-After')) || null;
      throw error;
    }

    return { data: result.data, error: null };
  } catch (error) {
    const handledError = error instanceof TypeError && isLoopbackUrl(endpoint)
      ? createLocalBackendError('Marketing Ops Agent')
      : error;

    apiLogger.error('Error generating marketing ops plan:', handledError.message);
    return { data: null, error: handledError };
  }
};

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Sign up new user and create user profile
 */
export const signUp = async (email, password, userData) => {
  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Pembuatan user gagal');

    // Step 2: Create user profile in users table
    const { error: profileError } = await supabase.from('users').insert([
      {
        id: authData.user.id,
        name: userData.name,
        email,
        password: '***supabase-auth***', // Placeholder - Supabase Auth manages actual password
        role: 'user',
        user_type: userData.user_type || 'sme',
        is_active: true,
      },
    ]);

    if (profileError) {
      throw new Error(`Pembuatan profil gagal: ${profileError.message}`);
    }

    return { data: authData, error: null };
  } catch (error) {
    apiLogger.error('Error signing up:', error.message);
    return { data: null, error: { message: error.message || 'Registrasi gagal' } };
  }
};

/**
 * Sign in user
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
      'Signing in',
    );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    apiLogger.error('Error signing in:', error.message);
    return { data: null, error: { message: error.message || 'Login gagal' } };
  }
};

/**
 * Sign out user
 */
export const signOut = async () => {
  try {
    const { error } = await withTimeout(supabase.auth.signOut(), 'Signing out');
    if (error) throw error;
    return { error: null };
  } catch (error) {
    apiLogger.error('Error signing out:', error.message);
    return { error };
  }
};

/**
 * Get current user from auth
 */
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return { data: user, error: null };
  } catch (error) {
    apiLogger.error('Error getting user:', error.message);
    return { data: null, error };
  }
};

/**
 * Get user profile from database
 */
export const getUserProfile = async (userId) => {
  try {
    // 1. Get base user data
    const { data: user, error } = await withTimeout(
      supabase.from('users').select(USER_PROFILE_COLUMNS).eq('id', userId).single(),
      'Fetching user profile',
    );

    if (error) throw error;

    // 2. If user is influencer, get extended profile
    if (user.user_type === 'influencer') {
      const { data: influencerData } = await withTimeout(
        supabase
          .from('influencers')
          .select(INFLUENCER_PROFILE_COLUMNS)
          .eq('user_id', userId)
          .single(),
        'Fetching influencer profile',
      );

      // Merge data (priority to influencer table for specific fields if any overlap)
      if (influencerData) {
        return {
          data: {
            ...user,
            ...influencerData,
            auth_user_id: user.id,
            influencer_id: influencerData.id,
          },
          error: null
        };
      }
    }

    return { data: user, error: null };
  } catch (error) {
    apiLogger.error('Error fetching user profile:', error.message);
    return { data: null, error };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    // 1. Separate data for 'users' and 'influencers' tables
    const userData = {};
    const influencerData = {};

    const userFields = ['name', 'phone', 'profile_image'];
    const influencerFields = ['username', 'niche', 'price_per_post', 'bio', 'instagram_url', 'tiktok_url', 'youtube_url'];

    Object.keys(updates).forEach(key => {
      if (userFields.includes(key)) userData[key] = updates[key];
      if (influencerFields.includes(key)) influencerData[key] = updates[key];
    });

    // 2. Update 'users' table
    if (Object.keys(userData).length > 0) {
      const { error: userError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId);
        
      if (userError) throw userError;
    }

    // 3. Update 'influencers' table
    if (Object.keys(influencerData).length > 0) {
      // Check if influencer record exists first
      const { data: existingInfluencer } = await supabase
        .from('influencers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingInfluencer) {
        const { error: infError } = await supabase
          .from('influencers')
          .update(influencerData)
          .eq('user_id', userId);
        if (infError) throw infError;
      } else {
        // Create if not exists (rare case, but safe)
        const { error: insertError } = await supabase
          .from('influencers')
          .insert([{ ...influencerData, user_id: userId }]);
        if (insertError) throw insertError;
      }
    }

    const { data: updatedProfile, error: updatedProfileError } = await getUserProfile(userId);
    if (updatedProfileError) {
      return { data: { success: true }, error: null };
    }

    return { data: { success: true, profile: updatedProfile }, error: null };
  } catch (error) {
    apiLogger.error('Error updating profile:', error.message);
    return { data: null, error };
  }
};


// ============================================
// STATS & ANALYTICS
// ============================================

/**
 * Get platform statistics
 */


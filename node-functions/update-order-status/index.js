import { createClient } from '@supabase/supabase-js';

const MAX_REQUEST_BODY_BYTES = 4 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const ALLOWED_NEXT_STATUSES = new Set(['in_progress', 'completed', 'cancelled']);
const ALLOWED_TRANSITIONS = {
  pending: new Set(['in_progress', 'cancelled']),
  in_progress: new Set(['completed']),
};

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://bersamakreator.edgeone.dev',
];

const rateLimitStore = new Map();

const baseCorsHeaders = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const getEnv = (context, key) => context.env?.[key] || process.env[key];

const getRequestHeader = (request, name) => (
  request.headers?.get?.(name)
  || request.headers?.get?.(name.toLowerCase())
  || request.headers?.[name.toLowerCase()]
  || ''
);

const getAllowedOrigins = (context) => {
  const configured = getEnv(context, 'ALLOWED_ORIGINS') || getEnv(context, 'VITE_ALLOWED_ORIGINS');
  if (!configured) return DEFAULT_ALLOWED_ORIGINS;

  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const isLoopbackOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  } catch (error) {
    return false;
  }
};

const getCorsHeaders = (context) => {
  const requestOrigin = getRequestHeader(context.request, 'Origin');
  const allowedOrigins = getAllowedOrigins(context);
  const allowOrigin = allowedOrigins.includes(requestOrigin) || isLoopbackOrigin(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0];

  return {
    ...baseCorsHeaders,
    'Access-Control-Allow-Origin': allowOrigin,
  };
};

const jsonResponse = (context, payload, status = 200, headers = {}) => new Response(JSON.stringify(payload), {
  status,
  headers: {
    ...getCorsHeaders(context),
    'Content-Type': 'application/json',
    ...headers,
  },
});

const createHttpError = (message, status, extra = {}) => {
  const error = new Error(message);
  error.status = status;
  Object.assign(error, extra);
  return error;
};

const getRequiredConfig = (context) => {
  const config = {
    supabaseUrl: getEnv(context, 'SUPABASE_URL') || getEnv(context, 'VITE_SUPABASE_URL'),
    supabaseAnonKey: getEnv(context, 'SUPABASE_ANON_KEY') || getEnv(context, 'VITE_SUPABASE_ANON_KEY'),
    supabaseServiceRoleKey: getEnv(context, 'SUPABASE_SERVICE_ROLE_KEY'),
  };

  const missingVars = [];
  if (!config.supabaseUrl) missingVars.push('SUPABASE_URL');
  if (!config.supabaseAnonKey) missingVars.push('SUPABASE_ANON_KEY');
  if (!config.supabaseServiceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

  return { config, missingVars };
};

const createSupabaseClient = (key, config, authHeader = '') => createClient(
  config.supabaseUrl,
  key,
  authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined,
);

const validateRequestEnvelope = (context) => {
  const contentType = getRequestHeader(context.request, 'Content-Type');
  if (!contentType.toLowerCase().includes('application/json')) {
    throw createHttpError('Content-Type harus application/json.', 415);
  }

  const contentLength = Number(getRequestHeader(context.request, 'Content-Length') || 0);
  if (contentLength > MAX_REQUEST_BODY_BYTES) {
    throw createHttpError('Ukuran request terlalu besar.', 413);
  }
};

const parseRequestBody = async (context) => {
  validateRequestEnvelope(context);

  try {
    return await context.request.json();
  } catch (error) {
    throw createHttpError('Format JSON request tidak valid.', 400);
  }
};

const getAuthenticatedInfluencer = async (context, config) => {
  const authHeader = getRequestHeader(context.request, 'Authorization');
  if (!authHeader.startsWith('Bearer ')) {
    throw createHttpError('Autentikasi diperlukan untuk memperbarui campaign.', 401);
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const authClient = createSupabaseClient(config.supabaseAnonKey, config, authHeader);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    throw createHttpError('Token autentikasi tidak valid.', 401);
  }

  const adminClient = createSupabaseClient(config.supabaseServiceRoleKey, config);
  const { data: profile, error: profileError } = await adminClient
    .from('users')
    .select('id, user_type, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_active) {
    throw createHttpError('Profil user tidak valid atau tidak aktif.', 403);
  }

  if (profile.user_type !== 'influencer') {
    throw createHttpError('Hanya influencer pemilik campaign yang dapat memperbarui status.', 403);
  }

  return { adminClient, user, profile };
};

const getClientIp = (context) => (
  getRequestHeader(context.request, 'CF-Connecting-IP')
  || getRequestHeader(context.request, 'X-Forwarded-For').split(',')[0].trim()
  || 'unknown'
);

const enforceRateLimit = (context, user) => {
  const now = Date.now();
  const key = `${user.id}:${getClientIp(context)}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    throw createHttpError('Terlalu banyak permintaan. Coba lagi nanti.', 429, { retryAfter });
  }
};

const validateBody = (body) => {
  const orderId = String(body.order_id || '').trim();
  const nextStatus = String(body.next_status || '').trim();

  if (!orderId) {
    throw createHttpError('Order ID wajib diisi.', 400);
  }

  if (!ALLOWED_NEXT_STATUSES.has(nextStatus)) {
    throw createHttpError('Status campaign tidak valid.', 400);
  }

  return { orderId, nextStatus };
};

const fetchOwnedOrder = async (adminClient, user, orderId) => {
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .select('id, influencer_id, order_status, payment_status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw createHttpError('Campaign tidak ditemukan.', 404);
  }

  const { data: influencer, error: influencerError } = await adminClient
    .from('influencers')
    .select('id, user_id')
    .eq('id', order.influencer_id)
    .single();

  if (influencerError || influencer?.user_id !== user.id) {
    throw createHttpError('Anda tidak memiliki akses ke campaign ini.', 403);
  }

  return order;
};

const validateTransition = (currentStatus, nextStatus) => {
  if (!ALLOWED_TRANSITIONS[currentStatus]?.has(nextStatus)) {
    throw createHttpError('Perubahan status campaign tidak diizinkan.', 409);
  }
};

const updateOrderStatus = async (adminClient, orderId, nextStatus) => {
  const { data, error } = await adminClient
    .from('orders')
    .update({ order_status: nextStatus })
    .eq('id', orderId)
    .select('id, influencer_id, campaign_name, total_price, deadline, order_status, payment_status, payment_method, created_at')
    .single();

  if (error) {
    throw createHttpError('Gagal memperbarui status campaign.', 500);
  }

  return data;
};

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(context) });
  }

  if (context.request.method !== 'POST') {
    return jsonResponse(context, { error: 'Method tidak didukung.' }, 405);
  }

  try {
    const { config, missingVars } = getRequiredConfig(context);
    if (missingVars.length > 0) {
      return jsonResponse(context, { error: 'Konfigurasi server belum lengkap.' }, 500);
    }

    const { adminClient, user } = await getAuthenticatedInfluencer(context, config);
    enforceRateLimit(context, user);

    const body = await parseRequestBody(context);
    const { orderId, nextStatus } = validateBody(body);
    const order = await fetchOwnedOrder(adminClient, user, orderId);
    validateTransition(order.order_status, nextStatus);

    const data = await updateOrderStatus(adminClient, orderId, nextStatus);

    return jsonResponse(context, {
      data,
      message: 'Status campaign berhasil diperbarui.',
    });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error('[update-order-status] Unexpected error:', error.message);
    }

    return jsonResponse(
      context,
      {
        error: error.message || 'Terjadi kesalahan saat memperbarui campaign.',
        retryAfter: error.retryAfter,
      },
      status,
      error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {},
    );
  }
}

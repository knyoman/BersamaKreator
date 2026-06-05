import { createClient } from '@supabase/supabase-js';

const MAX_REQUEST_BODY_BYTES = 10 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const MAX_CAMPAIGN_NAME_LENGTH = 120;
const MAX_CAMPAIGN_DESCRIPTION_LENGTH = 1200;
const MAX_NOTES_LENGTH = 1000;

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://bersamakreator.edgeone.dev',
];

const ALLOWED_PAYMENT_METHODS = new Set(['bca_va', 'mandiri_va', 'gopay', 'ovo', 'qris']);
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
    supabaseKey: getEnv(context, 'SUPABASE_ANON_KEY') || getEnv(context, 'VITE_SUPABASE_ANON_KEY'),
  };

  const missingVars = [];
  if (!config.supabaseUrl) missingVars.push('SUPABASE_URL');
  if (!config.supabaseKey) missingVars.push('SUPABASE_ANON_KEY');

  return { config, missingVars };
};

const createSupabaseClient = (config, authHeader = '') => createClient(
  config.supabaseUrl,
  config.supabaseKey,
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

const getAuthenticatedSme = async (context, config) => {
  const authHeader = getRequestHeader(context.request, 'Authorization');
  if (!authHeader.startsWith('Bearer ')) {
    throw createHttpError('Autentikasi diperlukan untuk membuat pesanan.', 401);
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const supabase = createSupabaseClient(config, authHeader);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw createHttpError('Token autentikasi tidak valid.', 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, user_type, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_active) {
    throw createHttpError('Profil user tidak valid atau tidak aktif.', 403);
  }

  if (profile.user_type !== 'sme') {
    throw createHttpError('Pesanan hanya dapat dibuat oleh akun UMKM.', 403);
  }

  return { supabase, user, profile };
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

const normalizeString = (value) => String(value || '').trim();

const validateDeadline = (value) => {
  const deadline = normalizeString(value);
  if (!deadline) {
    throw createHttpError('Batas waktu kampanye wajib diisi.', 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    throw createHttpError('Format batas waktu tidak valid.', 400);
  }

  const deadlineDate = new Date(`${deadline}T00:00:00.000Z`);
  if (Number.isNaN(deadlineDate.getTime())) {
    throw createHttpError('Tanggal batas waktu tidak valid.', 400);
  }

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (deadlineDate < todayUtc) {
    throw createHttpError('Batas waktu tidak boleh tanggal lampau.', 400);
  }

  return deadline;
};

const validateOrderBody = (body) => {
  const influencerId = Number(body.influencer_id);
  const pricingPackageId = body.pricing_package_id ? Number(body.pricing_package_id) : null;
  const campaignName = normalizeString(body.campaign_name);
  const campaignDescription = normalizeString(body.campaign_description);
  const notes = normalizeString(body.notes);
  const paymentMethod = normalizeString(body.payment_method);

  if (!Number.isInteger(influencerId) || influencerId <= 0) {
    throw createHttpError('Influencer tidak valid.', 400);
  }

  if (pricingPackageId !== null && (!Number.isInteger(pricingPackageId) || pricingPackageId <= 0)) {
    throw createHttpError('Paket harga tidak valid.', 400);
  }

  if (!campaignName || campaignName.length > MAX_CAMPAIGN_NAME_LENGTH) {
    throw createHttpError('Nama kampanye wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (!campaignDescription || campaignDescription.length > MAX_CAMPAIGN_DESCRIPTION_LENGTH) {
    throw createHttpError('Deskripsi kampanye wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (notes.length > MAX_NOTES_LENGTH) {
    throw createHttpError('Catatan terlalu panjang.', 400);
  }

  if (paymentMethod && !ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
    throw createHttpError('Metode pembayaran tidak valid.', 400);
  }

  return {
    influencerId,
    pricingPackageId,
    campaignName,
    campaignDescription,
    deadline: validateDeadline(body.deadline),
    notes,
    paymentMethod: paymentMethod || null,
  };
};

const fetchInfluencerPrice = async (supabase, influencerId) => {
  const { data, error } = await supabase
    .from('influencers')
    .select('id, price_per_post')
    .eq('id', influencerId)
    .single();

  if (error || !data) {
    throw createHttpError('Influencer tidak ditemukan.', 404);
  }

  const price = Number(data.price_per_post || 0);
  if (!Number.isFinite(price) || price < 0) {
    throw createHttpError('Harga influencer tidak valid.', 422);
  }

  return price;
};

const fetchPricingPackage = async (supabase, order) => {
  if (!order.pricingPackageId) {
    return {
      pricingPackageId: null,
      packageSnapshot: null,
      totalPrice: await fetchInfluencerPrice(supabase, order.influencerId),
    };
  }

  const { data, error } = await supabase
    .from('influencer_pricing_packages')
    .select('id, title, description, package_type, deliverables, price, delivery_days, revision_count')
    .eq('id', order.pricingPackageId)
    .eq('influencer_id', order.influencerId)
    .eq('is_public', true)
    .single();

  if (error || !data) {
    throw createHttpError('Paket harga tidak ditemukan atau tidak aktif.', 404);
  }

  const price = Number(data.price || 0);
  if (!Number.isFinite(price) || price < 0) {
    throw createHttpError('Harga paket tidak valid.', 422);
  }

  return {
    pricingPackageId: data.id,
    totalPrice: price,
    packageSnapshot: {
      id: data.id,
      title: data.title,
      description: data.description || null,
      package_type: data.package_type,
      deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
      price,
      delivery_days: Number(data.delivery_days || 0),
      revision_count: Number(data.revision_count || 0),
    },
  };
};

const createOrder = async (supabase, user, order, pricing) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      sme_id: user.id,
      influencer_id: order.influencerId,
      pricing_package_id: pricing.pricingPackageId,
      package_snapshot: pricing.packageSnapshot,
      campaign_name: order.campaignName,
      campaign_description: order.campaignDescription,
      total_price: pricing.totalPrice,
      deadline: order.deadline,
      notes: order.notes || null,
      order_status: 'pending',
      payment_status: 'unpaid',
      payment_method: order.paymentMethod,
    }])
    .select('id, influencer_id, pricing_package_id, package_snapshot, campaign_name, total_price, deadline, order_status, payment_status, payment_method, created_at')
    .single();

  if (error) {
    throw createHttpError('Gagal membuat pesanan. Coba lagi nanti.', 500);
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

    const { supabase, user } = await getAuthenticatedSme(context, config);
    enforceRateLimit(context, user);

    const body = await parseRequestBody(context);
    const order = validateOrderBody(body);
    const pricing = await fetchPricingPackage(supabase, order);
    const data = await createOrder(supabase, user, order, pricing);

    return jsonResponse(context, {
      data,
      message: 'Pesanan berhasil dibuat.',
    });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error('[create-order] Unexpected error:', error.message);
    }

    return jsonResponse(
      context,
      {
        error: error.message || 'Terjadi kesalahan saat membuat pesanan.',
        retryAfter: error.retryAfter,
      },
      status,
      error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {},
    );
  }
}

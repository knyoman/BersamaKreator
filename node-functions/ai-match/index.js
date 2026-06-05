import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
const AI_TIMEOUT_MS = 25000;
const MAX_CANDIDATES = 5;
const MAX_RECOMMENDATIONS = 3;
const MAX_REQUEST_BODY_BYTES = 8 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const MAX_BUDGET = 1_000_000_000;
const FIELD_LIMITS = {
  niche: 80,
  targetAudience: 300,
  campaignGoal: 500,
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

const isServerLoggingEnabled = (context) => (
  process.env.NODE_ENV === 'development' || getEnv(context, 'ENABLE_SERVER_LOGS') === 'true'
);

const logInfo = (context, ...args) => {
  if (isServerLoggingEnabled(context)) {
    console.log(...args);
  }
};

const logError = (context, ...args) => {
  if (isServerLoggingEnabled(context)) {
    console.error(...args);
  }
};

const getRequestHeader = (request, name) => request.headers?.get?.(name) || request.headers?.get?.(name.toLowerCase()) || '';

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

const getRequiredConfig = (context) => {
  const config = {
    supabaseUrl: getEnv(context, 'SUPABASE_URL') || getEnv(context, 'VITE_SUPABASE_URL'),
    supabaseKey: getEnv(context, 'SUPABASE_ANON_KEY') || getEnv(context, 'VITE_SUPABASE_ANON_KEY'),
    geminiKey: getEnv(context, 'GEMINI_API_KEY'),
    geminiModel: getEnv(context, 'GEMINI_MODEL') || DEFAULT_GEMINI_MODEL,
  };

  const missingVars = [];
  if (!config.supabaseUrl) missingVars.push('SUPABASE_URL');
  if (!config.supabaseKey) missingVars.push('SUPABASE_ANON_KEY');
  if (!config.geminiKey) missingVars.push('GEMINI_API_KEY');

  return { config, missingVars };
};

const createSupabaseClient = (config, authHeader = '') => createClient(
  config.supabaseUrl,
  config.supabaseKey,
  authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined,
);

const createHttpError = (message, status, extra = {}) => {
  const error = new Error(message);
  error.status = status;
  Object.assign(error, extra);
  return error;
};

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
    throw new Error('Format JSON request tidak valid.');
  }
};

const getAuthenticatedUser = async (context, config) => {
  const authHeader = getRequestHeader(context.request, 'Authorization');

  if (!authHeader.startsWith('Bearer ')) {
    throw createHttpError('Autentikasi diperlukan untuk menggunakan rekomendasi AI.', 401);
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

  if (!['sme', 'admin'].includes(profile.user_type)) {
    throw createHttpError('Rekomendasi AI hanya tersedia untuk akun bisnis.', 403);
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

const validateRequestBody = (body) => {
  if (body._honeypot && body._honeypot !== '') {
    throw createHttpError('Request tidak valid.', 403);
  }

  const budget = Number(body.budget);
  const niche = String(body.niche || '').trim();
  const targetAudience = String(body.targetAudience || '').trim();
  const campaignGoal = String(body.campaignGoal || '').trim();

  if (!Number.isFinite(budget) || budget <= 0) {
    throw createHttpError('Anggaran harus berupa angka positif.', 400);
  }

  if (budget > MAX_BUDGET) {
    throw createHttpError('Anggaran melebihi batas maksimal yang diizinkan.', 400);
  }

  if (!niche || !targetAudience || !campaignGoal) {
    throw createHttpError('Tujuan kampanye, niche, dan target audiens wajib diisi.', 400);
  }

  if (
    niche.length > FIELD_LIMITS.niche
    || targetAudience.length > FIELD_LIMITS.targetAudience
    || campaignGoal.length > FIELD_LIMITS.campaignGoal
  ) {
    throw createHttpError('Input kampanye terlalu panjang.', 400);
  }

  return {
    budget,
    niche,
    targetAudience,
    campaignGoal,
  };
};

const fetchCandidates = async (supabase, { budget, niche }) => {
  let query = supabase
    .from('influencers')
    .select(`
      id,
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
      users!inner(name, profile_image)
    `)
    .lte('price_per_post', budget)
    .limit(MAX_CANDIDATES);

  if (niche) {
    query = query.ilike('niche', `%${niche}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Terjadi kesalahan database: ${error.message}`);
  }

  return data || [];
};

const buildPrompt = ({ budget, niche, targetAudience, campaignGoal }, candidates) => `
Peran: Anda adalah Strategis Senior Influencer Marketing.
Gunakan Bahasa Indonesia yang natural, ringkas, dan profesional.
Semua nilai "reasoning" WAJIB ditulis dalam Bahasa Indonesia.

Detail Kampanye:
- Tujuan: "${campaignGoal}"
- Target Audiens: "${targetAudience}"
- Anggaran Maksimum: IDR ${budget}
- Niche Pilihan: "${niche}"

Daftar Kandidat:
${JSON.stringify(
  candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.users?.name,
    username: candidate.username,
    niche: candidate.niche,
    price: candidate.price_per_post,
    bio: candidate.bio,
    followers: candidate.followers_count,
    engagement_rate: candidate.engagement_rate,
    platforms: {
      instagram: Boolean(candidate.instagram_url),
      tiktok: Boolean(candidate.tiktok_url),
      youtube: Boolean(candidate.youtube_url),
    },
  })),
)}

Pilih ${MAX_RECOMMENDATIONS} influencer paling relevan.
Pertimbangkan kecocokan tujuan kampanye, target audiens, niche, harga, jumlah pengikut, interaksi, platform, dan bio.
Kembalikan hanya JSON valid dengan bentuk berikut:
{
  "recommendations": [
    {
      "id": 1,
      "match_score": 85,
      "reasoning": "Jelaskan dalam 2 kalimat singkat mengapa influencer ini cocok dengan tujuan dan audiens kampanye."
    }
  ]
}
`;

const extractJsonObject = (text) => {
  const cleanedText = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Respons AI tidak berisi JSON yang valid.');
    }

    return JSON.parse(cleanedText.slice(firstBrace, lastBrace + 1));
  }
};

const normalizeAiRecommendations = (aiResult) => {
  if (!Array.isArray(aiResult?.recommendations)) {
    throw new Error('Respons AI tidak memiliki daftar rekomendasi.');
  }

  return aiResult.recommendations
    .map((recommendation) => ({
      id: recommendation.id,
      match_score: Math.max(0, Math.min(100, Number(recommendation.match_score) || 0)),
      reasoning: String(recommendation.reasoning || '').trim(),
    }))
    .filter((recommendation) => recommendation.id !== undefined && recommendation.reasoning);
};

const runAiAnalysis = async (model, prompt) => {
  const completion = await Promise.race([
    model.generateContent({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request API timeout setelah 25 detik')), AI_TIMEOUT_MS)),
  ]);

  return extractJsonObject(completion.response.text());
};

const mergeRecommendations = (recommendations, candidates) => recommendations
  .map((recommendation) => {
    const fullProfile = candidates.find((candidate) => String(candidate.id) === String(recommendation.id));
    if (!fullProfile) return null;

    return {
      ...fullProfile,
      match_score: recommendation.match_score,
      reasoning: recommendation.reasoning,
    };
  })
  .filter(Boolean)
  .sort((a, b) => b.match_score - a.match_score);

const toPublicInfluencer = (influencer) => ({
  id: influencer.id,
  username: influencer.username,
  niche: influencer.niche,
  bio: influencer.bio,
  price_per_post: influencer.price_per_post,
  followers_count: influencer.followers_count,
  engagement_rate: influencer.engagement_rate,
  rating_average: influencer.rating_average,
  total_orders: influencer.total_orders,
  match_score: influencer.match_score,
  reasoning: influencer.reasoning,
  users: {
    name: influencer.users?.name,
    profile_image: influencer.users?.profile_image,
  },
});

const createAiErrorResponse = (context, error) => {
  logError(context, '[ai-match] AI error:', {
    type: error.constructor.name,
    message: error.message,
    status: error.status,
  });

  if (error.message.includes('timeout')) {
    return jsonResponse(context, { error: 'Layanan AI terlalu lama merespons. Coba beberapa saat lagi.' }, 504);
  }

  if (error.message.includes('401') || error.status === 401) {
    return jsonResponse(context, { error: 'Autentikasi gagal. Periksa GEMINI_API_KEY.' }, 401);
  }

  if (error.message.includes('429') || error.status === 429) {
    return jsonResponse(
      context,
      {
        error: 'Terlalu banyak permintaan. Coba lagi nanti.',
        retryAfter: 60,
      },
      429,
      { 'Retry-After': '60' },
    );
  }

  return jsonResponse(
    context,
    {
      error: 'Layanan pencocokan AI sementara tidak tersedia. Coba lagi nanti.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined,
    },
    500,
  );
};

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(context) });
  }

  try {
    const { config, missingVars } = getRequiredConfig(context);
    if (missingVars.length > 0) {
      return jsonResponse(
        context,
        {
          error: `Environment variable belum lengkap: ${missingVars.join(', ')}. Lengkapi konfigurasi di EdgeOne Project Settings.`,
        },
        500,
      );
    }

    const { supabase, user } = await getAuthenticatedUser(context, config);
    enforceRateLimit(context, user);

    const body = await parseRequestBody(context);
    const campaign = validateRequestBody(body);

    logInfo(context, '[ai-match] Request received:', {
      budget: campaign.budget,
      niche: campaign.niche,
    });

    const candidates = await fetchCandidates(supabase, campaign);

    if (candidates.length === 0) {
      return jsonResponse(context, {
        data: {
          message: 'Tidak ada influencer yang cocok dengan kriteria dasar (anggaran/niche). Coba ubah filter.',
          influencers: [],
        },
      });
    }

    logInfo(context, `[ai-match] Found ${candidates.length} candidate influencers`);

    try {
      const genAI = new GoogleGenerativeAI(config.geminiKey);
      const model = genAI.getGenerativeModel({ model: config.geminiModel });
      const prompt = buildPrompt(campaign, candidates);
      const aiResult = await runAiAnalysis(model, prompt);
      const recommendations = normalizeAiRecommendations(aiResult);
      const finalResults = mergeRecommendations(recommendations, candidates)
        .slice(0, MAX_RECOMMENDATIONS)
        .map(toPublicInfluencer);

      return jsonResponse(context, {
        data: {
          influencers: finalResults,
          message: 'Pencocokan AI selesai.',
        },
      });
    } catch (aiError) {
      return createAiErrorResponse(context, aiError);
    }
  } catch (error) {
    logError(context, '[ai-match] Unexpected error:', error.message);
    return jsonResponse(
      context,
      {
        error: error.message || 'Terjadi kesalahan tak terduga. Coba lagi nanti.',
        retryAfter: error.retryAfter,
      },
      error.status || 500,
      error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {},
    );
  }
}

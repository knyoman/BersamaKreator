import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
const DEFAULT_AI_PROVIDER = 'auto';
const AI_TIMEOUT_MS = 30000;
const MAX_REQUEST_BODY_BYTES = 12 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const ROLES = new Set(['sme']);
const PLATFORMS = new Set([
  'meta_ads',
  'instagram_story_ads',
  'tiktok_ads',
  'google_search_ads',
  'marketplace_ads',
  'multi_channel',
]);
const OBJECTIVES = new Set(['awareness', 'traffic', 'leads', 'sales', 'retargeting']);
const TONES = new Set(['friendly', 'professional', 'persuasive', 'premium', 'playful', 'educational']);
const FIELD_LIMITS = {
  offer: 500,
  audience: 350,
  objectiveDetail: 500,
  context: 800,
  constraints: 600,
  notes: 600,
};

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
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

const normalizeString = (value) => String(value || '').trim();

const normalizeProvider = (provider) => {
  const normalizedProvider = normalizeString(provider || DEFAULT_AI_PROVIDER).toLowerCase();
  return ['auto', 'openai', 'gemini'].includes(normalizedProvider)
    ? normalizedProvider
    : DEFAULT_AI_PROVIDER;
};

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
    openaiKey: getEnv(context, 'OPENAI_API_KEY'),
    openaiModel: getEnv(context, 'OPENAI_MODEL') || DEFAULT_OPENAI_MODEL,
    geminiKey: getEnv(context, 'GEMINI_API_KEY'),
    geminiModel: getEnv(context, 'GEMINI_MODEL') || DEFAULT_GEMINI_MODEL,
    aiProvider: normalizeProvider(getEnv(context, 'AI_ASSISTANT_PROVIDER')),
  };

  const missingVars = [];
  if (!config.supabaseUrl) missingVars.push('SUPABASE_URL');
  if (!config.supabaseKey) missingVars.push('SUPABASE_ANON_KEY');
  if (config.aiProvider === 'openai' && !config.openaiKey) missingVars.push('OPENAI_API_KEY');
  if (config.aiProvider === 'gemini' && !config.geminiKey) missingVars.push('GEMINI_API_KEY');
  if (config.aiProvider === 'auto' && !config.openaiKey && !config.geminiKey) {
    missingVars.push('OPENAI_API_KEY atau GEMINI_API_KEY');
  }

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

const getAuthenticatedProfile = async (context, config, requestedRole) => {
  const authHeader = getRequestHeader(context.request, 'Authorization');
  if (!authHeader.startsWith('Bearer ')) {
    throw createHttpError('Autentikasi diperlukan untuk menggunakan Ad Copy Agent.', 401);
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
    .select('id, name, email, user_type, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_active) {
    throw createHttpError('Profil user tidak valid atau tidak aktif.', 403);
  }

  if (profile.user_type !== requestedRole) {
    throw createHttpError('Ad Copy Agent hanya tersedia untuk akun UMKM.', 403);
  }

  return { user, profile };
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
    throw createHttpError('Batas percobaan lokal tercapai. Coba lagi nanti.', 429, {
      retryAfter,
      source: 'local_rate_limit',
    });
  }
};

const validateRequestBody = (body) => {
  const role = normalizeString(body.role);
  const offer = normalizeString(body.offer);
  const audience = normalizeString(body.audience);
  const objective = normalizeString(body.objective);
  const objectiveDetail = normalizeString(body.objective_detail);
  const platform = normalizeString(body.platform);
  const tone = normalizeString(body.tone);
  const context = normalizeString(body.context);
  const constraints = normalizeString(body.constraints);
  const notes = normalizeString(body.notes);
  const variationCount = Number(body.variation_count || 4);

  if (!ROLES.has(role)) {
    throw createHttpError('Role Ad Copy Agent tidak valid.', 400);
  }

  if (!offer || offer.length > FIELD_LIMITS.offer) {
    throw createHttpError('Produk, layanan, atau offer wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (!audience || audience.length > FIELD_LIMITS.audience) {
    throw createHttpError('Target audiens wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (!OBJECTIVES.has(objective)) {
    throw createHttpError('Objective iklan tidak valid.', 400);
  }

  if (!objectiveDetail || objectiveDetail.length > FIELD_LIMITS.objectiveDetail) {
    throw createHttpError('Detail objective wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (!PLATFORMS.has(platform)) {
    throw createHttpError('Platform iklan tidak valid.', 400);
  }

  if (!TONES.has(tone)) {
    throw createHttpError('Tone iklan tidak valid.', 400);
  }

  if (!Number.isInteger(variationCount) || variationCount < 2 || variationCount > 6) {
    throw createHttpError('Jumlah variasi harus antara 2 sampai 6.', 400);
  }

  if (context.length > FIELD_LIMITS.context) {
    throw createHttpError('Konteks brand atau campaign terlalu panjang.', 400);
  }

  if (constraints.length > FIELD_LIMITS.constraints) {
    throw createHttpError('Batasan atau negative prompt terlalu panjang.', 400);
  }

  if (notes.length > FIELD_LIMITS.notes) {
    throw createHttpError('Catatan tambahan terlalu panjang.', 400);
  }

  return {
    role,
    offer,
    audience,
    objective,
    objectiveDetail,
    platform,
    tone,
    context,
    constraints,
    notes,
    variationCount,
  };
};

const buildPrompt = (request, profile) => `
Anda adalah Ad Copy Agent untuk platform BersamaKreator.
Fokus utama Anda adalah membantu UMKM membuat variasi copy iklan yang siap dites.
Gunakan Bahasa Indonesia yang natural, jelas, dan profesional.
Jangan menyebut bahwa Anda adalah AI.
Jangan membuat klaim, diskon, testimoni, garansi, atau janji hasil yang tidak diberikan user.
Hindari bahasa manipulatif, menakut-nakuti, atau melanggar kebijakan iklan umum.

Profil UMKM:
- Nama akun: ${profile.name || '-'}
- Email akun: ${profile.email || '-'}

Input iklan:
- Offer/produk/layanan: ${request.offer}
- Target audiens: ${request.audience}
- Objective: ${request.objective}
- Detail objective: ${request.objectiveDetail}
- Platform: ${request.platform}
- Tone: ${request.tone}
- Jumlah variasi copy: ${request.variationCount}
- Konteks brand/campaign: ${request.context || '-'}
- Batasan atau negative prompt dari user: ${request.constraints || '-'}
- Catatan tambahan: ${request.notes || '-'}

Buat output yang bisa langsung dipakai UMKM:
- ringkasan arah iklan
- angle iklan yang berbeda untuk dites
- ${request.variationCount} variasi copy sesuai platform
- hook pendek untuk headline/opening
- negative prompts atau hal yang harus dihindari
- CTA alternatif
- catatan testing dan rekomendasi metrik

Kembalikan hanya JSON valid tanpa markdown:
{
  "title": "Judul singkat ad set",
  "summary": "Ringkasan strategi iklan 1-3 kalimat",
  "angles": [
    {
      "title": "Nama angle",
      "rationale": "Alasan angle ini dipakai",
      "best_for": "Kondisi atau audiens yang cocok"
    }
  ],
  "variations": [
    {
      "title": "Nama variasi",
      "platform": "Platform iklan",
      "angle": "Angle yang dipakai",
      "headline": "Headline atau hook",
      "primary_text": "Teks utama iklan",
      "description": "Deskripsi tambahan",
      "cta": "CTA utama",
      "creative_direction": "Arahan visual singkat"
    }
  ],
  "hooks": ["Hook pendek"],
  "negative_prompts": ["Hal yang harus dihindari"],
  "ctas": ["CTA alternatif"],
  "testing_notes": ["Catatan A/B test, metrik, atau optimasi"]
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

const normalizeTextList = (items, limit) => (
  Array.isArray(items)
    ? items.map(normalizeString).filter(Boolean).slice(0, limit)
    : []
);

const normalizeAngles = (items) => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeString(item?.title) || `Angle ${index + 1}`,
        rationale: normalizeString(item?.rationale),
        best_for: normalizeString(item?.best_for),
      }))
      .filter((item) => item.title || item.rationale || item.best_for)
      .slice(0, 8)
    : []
);

const normalizeVariations = (items, limit) => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeString(item?.title) || `Variasi ${index + 1}`,
        platform: normalizeString(item?.platform),
        angle: normalizeString(item?.angle),
        headline: normalizeString(item?.headline || item?.hook),
        primary_text: normalizeString(item?.primary_text || item?.body || item?.copy),
        description: normalizeString(item?.description),
        cta: normalizeString(item?.cta),
        creative_direction: normalizeString(item?.creative_direction),
      }))
      .filter((item) => item.headline || item.primary_text || item.cta)
      .slice(0, limit)
    : []
);

const normalizeAiResult = (result, request) => {
  const normalized = {
    title: normalizeString(result?.title) || 'Ad Copy Campaign UMKM',
    summary: normalizeString(result?.summary),
    angles: normalizeAngles(result?.angles),
    variations: normalizeVariations(result?.variations, request.variationCount),
    hooks: normalizeTextList(result?.hooks, 10),
    negative_prompts: normalizeTextList(result?.negative_prompts, 10),
    ctas: normalizeTextList(result?.ctas, 10),
    testing_notes: normalizeTextList(result?.testing_notes, 8),
  };

  if (!normalized.summary && normalized.variations.length === 0) {
    throw new Error('Respons AI kosong.');
  }

  return normalized;
};

const runOpenAI = async (context, config, prompt, request) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiKey}`,
      },
      body: JSON.stringify({
        model: config.openaiModel,
        temperature: 0.72,
        messages: [
          {
            role: 'system',
            content: 'Anda membantu UMKM membuat variasi ad copy yang siap dites dalam Bahasa Indonesia.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      throw createHttpError('OpenAI mengirim respons yang tidak valid.', 502, {
        provider: 'openai',
        source: 'provider',
      });
    }

    if (!response.ok) {
      const message = result.error?.message || 'Layanan OpenAI tidak tersedia.';
      const retryAfter = Number(response.headers.get('Retry-After')) || undefined;
      throw createHttpError(message, response.status || 500, {
        retryAfter,
        provider: 'openai',
        source: 'provider',
      });
    }

    const content = result.choices?.[0]?.message?.content;
    return normalizeAiResult(extractJsonObject(content), request);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw createHttpError('Layanan OpenAI terlalu lama merespons. Coba lagi nanti.', 504, {
        provider: 'openai',
        source: 'provider',
      });
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const runGemini = async (context, config, prompt, request) => {
  const genAI = new GoogleGenerativeAI(config.geminiKey);
  const model = genAI.getGenerativeModel({ model: config.geminiModel });
  let timeoutId;

  try {
    const completion = await Promise.race([
      model.generateContent({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(createHttpError('Layanan Gemini terlalu lama merespons. Coba lagi nanti.', 504, {
            provider: 'gemini',
            source: 'provider',
          }));
        }, AI_TIMEOUT_MS);
      }),
    ]);

    return normalizeAiResult(extractJsonObject(completion.response.text()), request);
  } catch (error) {
    if (error.status) throw error;

    const lowerMessage = String(error.message || '').toLowerCase();
    const isRateLimited = lowerMessage.includes('429') || lowerMessage.includes('quota');
    const isUnauthorized = lowerMessage.includes('401') || lowerMessage.includes('403');

    throw createHttpError(
      error.message || 'Layanan Gemini tidak tersedia.',
      isRateLimited ? 429 : isUnauthorized ? 401 : 502,
      {
        provider: 'gemini',
        source: 'provider',
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

const shouldFallbackToGemini = (error, config) => (
  config.aiProvider === 'auto'
  && Boolean(config.geminiKey)
  && error?.source === 'provider'
  && error?.provider === 'openai'
  && [401, 429, 500, 502, 503, 504].includes(Number(error.status))
);

const runAiProvider = async (context, config, prompt, request) => {
  if (config.aiProvider === 'gemini') {
    return { provider: 'gemini', result: await runGemini(context, config, prompt, request) };
  }

  if (config.aiProvider === 'openai') {
    return { provider: 'openai', result: await runOpenAI(context, config, prompt, request) };
  }

  if (!config.openaiKey && config.geminiKey) {
    return { provider: 'gemini', result: await runGemini(context, config, prompt, request) };
  }

  try {
    return { provider: 'openai', result: await runOpenAI(context, config, prompt, request) };
  } catch (error) {
    if (!shouldFallbackToGemini(error, config)) {
      throw error;
    }

    return { provider: 'gemini', result: await runGemini(context, config, prompt, request) };
  }
};

const createAiErrorResponse = (context, error) => {
  if (error.status === 401) {
    if (error.source !== 'provider') {
      return jsonResponse(context, { error: error.message || 'Autentikasi diperlukan.' }, 401);
    }

    const providerLabel = error.provider === 'gemini' ? 'Gemini' : 'OpenAI';
    const keyName = error.provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY';
    return jsonResponse(context, { error: `Autentikasi ${providerLabel} gagal. Periksa ${keyName}.` }, 401);
  }

  if (error.status === 429) {
    if (error.source === 'local_rate_limit') {
      return jsonResponse(
        context,
        {
          error: `Batas percobaan lokal tercapai. Tunggu ${error.retryAfter || 60} detik lalu coba lagi.`,
          retryAfter: error.retryAfter || 60,
        },
        429,
        { 'Retry-After': String(error.retryAfter || 60) },
      );
    }

    const providerLabel = error.provider === 'gemini' ? 'Gemini' : 'OpenAI';
    return jsonResponse(
      context,
      {
        error: `${providerLabel} sedang terkena rate limit atau kuota habis. Coba lagi nanti atau ganti provider AI Assistant.`,
        retryAfter: error.retryAfter || 60,
      },
      429,
      { 'Retry-After': String(error.retryAfter || 60) },
    );
  }

  if (error.status === 504) {
    return jsonResponse(context, { error: error.message }, 504);
  }

  return jsonResponse(
    context,
    { error: error.message || 'Ad Copy Agent sementara tidak tersedia.' },
    error.status || 500,
  );
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
      return jsonResponse(
        context,
        {
          error: `Environment variable belum lengkap: ${missingVars.join(', ')}. Lengkapi konfigurasi di EdgeOne Project Settings.`,
        },
        500,
      );
    }

    const body = await parseRequestBody(context);
    const request = validateRequestBody(body);
    const { user, profile } = await getAuthenticatedProfile(context, config, request.role);
    enforceRateLimit(context, user);

    const prompt = buildPrompt(request, profile);
    const { provider, result } = await runAiProvider(context, config, prompt, request);

    return jsonResponse(context, {
      data: {
        role: request.role,
        platform: request.platform,
        objective: request.objective,
        provider,
        result,
      },
    });
  } catch (error) {
    return createAiErrorResponse(context, error);
  }
}

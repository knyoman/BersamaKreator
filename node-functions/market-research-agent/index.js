import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
const DEFAULT_AI_PROVIDER = 'auto';
const AI_TIMEOUT_MS = 30000;
const MAX_REQUEST_BODY_BYTES = 12 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const ROLES = new Set(['influencer', 'sme']);
const TIMEFRAMES = new Set(['current', 'next_30_days', 'next_90_days']);
const FIELD_LIMITS = {
  focus: 180,
  targetAudience: 300,
  location: 120,
  objective: 500,
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
    throw createHttpError('Autentikasi diperlukan untuk menggunakan Market Research Agent.', 401);
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
    throw createHttpError('Role akun tidak sesuai dengan Market Research Agent yang diminta.', 403);
  }

  let influencer = null;
  if (requestedRole === 'influencer') {
    const { data } = await supabase
      .from('influencers')
      .select('id, username, niche, bio, followers_count, engagement_rate')
      .eq('user_id', user.id)
      .maybeSingle();

    influencer = data || null;
  }

  return { user, profile, influencer };
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
  const focus = normalizeString(body.focus);
  const targetAudience = normalizeString(body.target_audience);
  const location = normalizeString(body.location);
  const objective = normalizeString(body.objective);
  const timeframe = normalizeString(body.timeframe);
  const notes = normalizeString(body.notes);

  if (!ROLES.has(role)) {
    throw createHttpError('Role Market Research Agent tidak valid.', 400);
  }

  if (!focus || focus.length > FIELD_LIMITS.focus) {
    throw createHttpError('Industri, produk, layanan, atau niche wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (!targetAudience || targetAudience.length > FIELD_LIMITS.targetAudience) {
    throw createHttpError('Target audiens wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (location.length > FIELD_LIMITS.location) {
    throw createHttpError('Lokasi terlalu panjang.', 400);
  }

  if (!objective || objective.length > FIELD_LIMITS.objective) {
    throw createHttpError('Tujuan riset wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (!TIMEFRAMES.has(timeframe)) {
    throw createHttpError('Rentang riset tidak valid.', 400);
  }

  if (notes.length > FIELD_LIMITS.notes) {
    throw createHttpError('Catatan tambahan terlalu panjang.', 400);
  }

  return {
    role,
    focus,
    targetAudience,
    location,
    objective,
    timeframe,
    notes,
  };
};

const getRoleInstruction = (role) => {
  if (role === 'sme') {
    return `
Fokus untuk UMKM:
- Bantu bisnis memahami peluang campaign sebelum memilih influencer.
- Soroti pain point customer, search intent, angle campaign, dan quick wins promosi.
- Hasil harus praktis untuk menyusun brief, campaign, dan strategi konten.
- Jangan membuat klaim data real-time atau angka pasar yang tidak diberikan user.
`;
  }

  return `
Fokus untuk influencer:
- Bantu kreator memahami tren niche, keresahan audiens, dan peluang konten yang bernilai bagi brand.
- Soroti angle konten, topik yang bisa diuji, dan peluang positioning sebagai kreator.
- Hasil harus mudah diterjemahkan menjadi konten organik maupun sponsored content.
- Jangan membuat klaim data real-time atau angka pasar yang tidak diberikan user.
`;
};

const buildPrompt = (request, profile, influencer) => `
Anda adalah Market Research Agent untuk platform BersamaKreator.
Gunakan Bahasa Indonesia yang natural, profesional, ringkas, dan bisa langsung dipakai.
Anggap hasil sebagai hipotesis riset berbasis input user dan penalaran pemasaran umum.
Jangan mengaku melakukan browsing, scraping, atau riset real-time.
Jangan menyebut bahwa Anda adalah AI.

Role pengguna: ${request.role}
Nama akun: ${profile.name || '-'}
Niche/profil influencer: ${influencer?.niche || '-'}
Bio influencer: ${influencer?.bio || '-'}
Followers influencer: ${influencer?.followers_count || 0}
Engagement rate influencer: ${influencer?.engagement_rate || 0}%

Input riset:
- Fokus utama: ${request.focus}
- Target audiens: ${request.targetAudience}
- Lokasi: ${request.location || '-'}
- Tujuan: ${request.objective}
- Rentang riset: ${request.timeframe}
- Catatan tambahan: ${request.notes || '-'}

${getRoleInstruction(request.role)}

Buat riset yang berisi:
- ringkasan kondisi pasar
- tren atau pola minat yang masuk akal
- pain point audiens
- search intent/topik yang mungkin dicari audiens
- peluang campaign/konten
- angle konten
- aksi prioritas
- catatan risiko/validasi data

Kembalikan hanya JSON valid tanpa markdown:
{
  "title": "Judul singkat riset",
  "summary": "Ringkasan 2-4 kalimat",
  "trends": [
    { "title": "Nama tren", "description": "Penjelasan", "implication": "Dampak untuk user", "action": "Aksi praktis" }
  ],
  "pain_points": [
    { "title": "Pain point", "description": "Penjelasan", "implication": "Dampak", "action": "Aksi praktis" }
  ],
  "search_intents": [
    { "title": "Intent/topik", "description": "Yang dicari audiens", "implication": "Makna untuk campaign", "action": "Konten atau pesan yang cocok" }
  ],
  "opportunities": [
    { "title": "Peluang", "description": "Penjelasan", "implication": "Dampak", "action": "Quick win" }
  ],
  "content_angles": [
    { "title": "Angle", "description": "Cara memakai angle", "implication": "Kenapa relevan", "action": "Contoh eksekusi" }
  ],
  "recommended_actions": [
    { "title": "Aksi prioritas", "description": "Langkah konkret", "implication": "Tujuan aksi", "action": "Cara memulai" }
  ],
  "cautions": [
    "Catatan validasi data atau risiko"
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

const normalizeObjectList = (items, fallbackTitle, limit) => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeString(item?.title) || `${fallbackTitle} ${index + 1}`,
        description: normalizeString(item?.description || item?.text || item?.insight),
        implication: normalizeString(item?.implication),
        action: normalizeString(item?.action),
      }))
      .filter((item) => item.description || item.implication || item.action)
      .slice(0, limit)
    : []
);

const normalizeTextList = (items, limit) => (
  Array.isArray(items)
    ? items.map(normalizeString).filter(Boolean).slice(0, limit)
    : []
);

const normalizeAiResult = (result) => {
  const normalized = {
    title: normalizeString(result?.title) || 'Riset Pasar',
    summary: normalizeString(result?.summary),
    trends: normalizeObjectList(result?.trends, 'Tren', 5),
    pain_points: normalizeObjectList(result?.pain_points, 'Pain Point', 5),
    search_intents: normalizeObjectList(result?.search_intents, 'Search Intent', 5),
    opportunities: normalizeObjectList(result?.opportunities, 'Peluang', 5),
    content_angles: normalizeObjectList(result?.content_angles, 'Angle', 5),
    recommended_actions: normalizeObjectList(result?.recommended_actions, 'Aksi', 6),
    cautions: normalizeTextList(result?.cautions, 6),
  };

  if (!normalized.summary && normalized.trends.length === 0 && normalized.opportunities.length === 0) {
    throw new Error('Respons AI kosong.');
  }

  return normalized;
};

const runOpenAI = async (context, config, prompt) => {
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
        temperature: 0.65,
        messages: [
          {
            role: 'system',
            content: 'Anda membantu membuat riset pasar praktis untuk UMKM dan influencer dalam Bahasa Indonesia.',
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
    return normalizeAiResult(extractJsonObject(content));
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

const runGemini = async (context, config, prompt) => {
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

    return normalizeAiResult(extractJsonObject(completion.response.text()));
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

const runAiProvider = async (context, config, prompt) => {
  if (config.aiProvider === 'gemini') {
    return { provider: 'gemini', result: await runGemini(context, config, prompt) };
  }

  if (config.aiProvider === 'openai') {
    return { provider: 'openai', result: await runOpenAI(context, config, prompt) };
  }

  if (!config.openaiKey && config.geminiKey) {
    return { provider: 'gemini', result: await runGemini(context, config, prompt) };
  }

  try {
    return { provider: 'openai', result: await runOpenAI(context, config, prompt) };
  } catch (error) {
    if (!shouldFallbackToGemini(error, config)) {
      throw error;
    }

    return { provider: 'gemini', result: await runGemini(context, config, prompt) };
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
    { error: error.message || 'Market Research Agent sementara tidak tersedia.' },
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
    const { user, profile, influencer } = await getAuthenticatedProfile(context, config, request.role);
    enforceRateLimit(context, user);

    const prompt = buildPrompt(request, profile, influencer);
    const { provider, result } = await runAiProvider(context, config, prompt);

    return jsonResponse(context, {
      data: {
        role: request.role,
        timeframe: request.timeframe,
        provider,
        result,
      },
    });
  } catch (error) {
    return createAiErrorResponse(context, error);
  }
}

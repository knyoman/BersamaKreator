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
const PLATFORMS = new Set([
  'instagram_caption',
  'instagram_reels',
  'instagram_story',
  'tiktok_video',
  'linkedin_post',
  'x_post',
  'multi_platform',
]);
const TONES = new Set(['friendly', 'professional', 'persuasive', 'casual', 'premium', 'educational']);
const FIELD_LIMITS = {
  idea: 500,
  targetAudience: 300,
  context: 700,
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
    throw createHttpError('Autentikasi diperlukan untuk menggunakan Social Post Agent.', 401);
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
    throw createHttpError('Role akun tidak sesuai dengan Social Post Agent yang diminta.', 403);
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
  const idea = normalizeString(body.idea);
  const targetAudience = normalizeString(body.target_audience);
  const context = normalizeString(body.context);
  const platform = normalizeString(body.platform);
  const tone = normalizeString(body.tone);
  const objective = normalizeString(body.objective);
  const notes = normalizeString(body.notes);

  if (!ROLES.has(role)) {
    throw createHttpError('Role Social Post Agent tidak valid.', 400);
  }

  if (!idea || idea.length > FIELD_LIMITS.idea) {
    throw createHttpError('Ide konten wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (!targetAudience || targetAudience.length > FIELD_LIMITS.targetAudience) {
    throw createHttpError('Target audiens wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (context.length > FIELD_LIMITS.context) {
    throw createHttpError('Konteks atau brand voice terlalu panjang.', 400);
  }

  if (!PLATFORMS.has(platform)) {
    throw createHttpError('Platform tidak valid.', 400);
  }

  if (!TONES.has(tone)) {
    throw createHttpError('Tone tidak valid.', 400);
  }

  if (!objective || objective.length > FIELD_LIMITS.objective) {
    throw createHttpError('Tujuan post wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (notes.length > FIELD_LIMITS.notes) {
    throw createHttpError('Catatan tambahan terlalu panjang.', 400);
  }

  return {
    role,
    idea,
    targetAudience,
    context,
    platform,
    tone,
    objective,
    notes,
  };
};

const getRoleInstruction = (role) => {
  if (role === 'sme') {
    return `
Fokus untuk UMKM:
- Buat post brand/campaign yang jelas, mudah dipakai, dan tidak berlebihan.
- CTA harus mendorong aksi bisnis seperti order, chat, daftar, atau simpan konten.
- Pesan harus cocok untuk UMKM dan bisa dipakai sendiri atau sebagai arahan ke influencer.
`;
  }

  return `
Fokus untuk influencer:
- Buat post yang natural, hook-led, dan tetap terasa seperti suara kreator.
- Hindari hard selling berlebihan kecuali diminta.
- Draft harus mudah diadaptasi menjadi caption, script Reels/TikTok, atau post profesional.
`;
};

const buildPrompt = (request, profile, influencer) => `
Anda adalah Social Post Agent untuk platform BersamaKreator.
Gunakan Bahasa Indonesia yang natural, profesional, dan siap dipakai.
Jangan menyebut bahwa Anda adalah AI.
Jangan membuat klaim produk yang tidak diberikan user.

Role pengguna: ${request.role}
Nama akun: ${profile.name || '-'}
Niche/profil influencer: ${influencer?.niche || '-'}
Bio influencer: ${influencer?.bio || '-'}
Followers influencer: ${influencer?.followers_count || 0}
Engagement rate influencer: ${influencer?.engagement_rate || 0}%

Input post:
- Ide utama: ${request.idea}
- Target audiens: ${request.targetAudience}
- Konteks/voice: ${request.context || '-'}
- Platform: ${request.platform}
- Tone: ${request.tone}
- Tujuan post: ${request.objective}
- Catatan tambahan: ${request.notes || '-'}

${getRoleInstruction(request.role)}

Buat output yang berisi:
- ringkasan arah post
- 5 hook pembuka
- 1-3 draft post utama sesuai platform
- 2 variasi gaya
- CTA alternatif
- catatan editing/publishing

Kembalikan hanya JSON valid tanpa markdown:
{
  "title": "Judul singkat draft",
  "summary": "Ringkasan 1-3 kalimat",
  "hooks": ["Hook pembuka"],
  "posts": [
    {
      "title": "Draft utama",
      "platform": "Platform",
      "hook": "Hook",
      "body": "Isi post/script/caption",
      "cta": "CTA",
      "note": "Catatan eksekusi"
    }
  ],
  "variants": [
    {
      "title": "Variasi",
      "platform": "Platform",
      "hook": "Hook",
      "body": "Isi variasi",
      "cta": "CTA",
      "note": "Catatan"
    }
  ],
  "ctas": ["CTA alternatif"],
  "editing_notes": ["Catatan editing atau publishing"]
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

const normalizePostList = (items, fallbackTitle, limit) => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeString(item?.title) || `${fallbackTitle} ${index + 1}`,
        platform: normalizeString(item?.platform),
        hook: normalizeString(item?.hook),
        body: normalizeString(item?.body || item?.content || item?.text),
        cta: normalizeString(item?.cta),
        note: normalizeString(item?.note),
      }))
      .filter((item) => item.hook || item.body || item.cta)
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
    title: normalizeString(result?.title) || 'Draft Social Post',
    summary: normalizeString(result?.summary),
    hooks: normalizeTextList(result?.hooks, 8),
    posts: normalizePostList(result?.posts, 'Post', 4),
    variants: normalizePostList(result?.variants, 'Variasi', 4),
    ctas: normalizeTextList(result?.ctas, 8),
    editing_notes: normalizeTextList(result?.editing_notes, 8),
  };

  if (!normalized.summary && normalized.posts.length === 0 && normalized.variants.length === 0) {
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
        temperature: 0.75,
        messages: [
          {
            role: 'system',
            content: 'Anda membantu membuat post sosial siap pakai untuk UMKM dan influencer dalam Bahasa Indonesia.',
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
    { error: error.message || 'Social Post Agent sementara tidak tersedia.' },
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
        platform: request.platform,
        tone: request.tone,
        provider,
        result,
      },
    });
  } catch (error) {
    return createAiErrorResponse(context, error);
  }
}

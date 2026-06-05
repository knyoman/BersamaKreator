import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
const DEFAULT_AI_PROVIDER = 'auto';
const AI_TIMEOUT_MS = 30000;
const MAX_REQUEST_BODY_BYTES = 12 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const FIELD_LIMITS = {
  brief: 1600,
  targetAudience: 300,
  notes: 600,
};
const MODES = new Set(['caption', 'content_ideas', 'proposal_reply']);
const PLATFORMS = new Set(['instagram', 'instagram_story', 'instagram_feed', 'instagram_reels', 'tiktok', 'youtube_shorts']);
const TONES = new Set(['friendly', 'professional', 'persuasive', 'casual', 'premium']);

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

const normalizeProvider = (provider) => {
  const normalizedProvider = String(provider || DEFAULT_AI_PROVIDER).trim().toLowerCase();
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

const getAuthenticatedInfluencer = async (context, config) => {
  const authHeader = getRequestHeader(context.request, 'Authorization');
  if (!authHeader.startsWith('Bearer ')) {
    throw createHttpError('Autentikasi diperlukan untuk menggunakan AI Assistant.', 401);
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

  if (profile.user_type !== 'influencer') {
    throw createHttpError('AI Assistant hanya tersedia untuk akun influencer.', 403);
  }

  const { data: influencer, error: influencerError } = await supabase
    .from('influencers')
    .select('id, username, niche, bio, followers_count, engagement_rate')
    .eq('user_id', user.id)
    .single();

  if (influencerError || !influencer) {
    throw createHttpError('Profil influencer belum lengkap.', 403);
  }

  return { supabase, user, profile, influencer };
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
    throw createHttpError('Batas percobaan AI lokal tercapai. Coba lagi nanti.', 429, {
      retryAfter,
      source: 'local_rate_limit',
    });
  }
};

const normalizeString = (value) => String(value || '').trim();

const validateRequestBody = (body) => {
  const mode = normalizeString(body.mode);
  const platform = normalizeString(body.platform);
  const tone = normalizeString(body.tone);
  const brief = normalizeString(body.brief);
  const targetAudience = normalizeString(body.target_audience);
  const notes = normalizeString(body.notes);
  const campaignContext = body.campaign_context && typeof body.campaign_context === 'object'
    ? body.campaign_context
    : null;

  if (!MODES.has(mode)) {
    throw createHttpError('Mode AI Assistant tidak valid.', 400);
  }

  if (!PLATFORMS.has(platform)) {
    throw createHttpError('Platform tidak valid.', 400);
  }

  if (!TONES.has(tone)) {
    throw createHttpError('Tone tidak valid.', 400);
  }

  if (!brief || brief.length > FIELD_LIMITS.brief) {
    throw createHttpError('Brief wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (targetAudience.length > FIELD_LIMITS.targetAudience) {
    throw createHttpError('Target audiens terlalu panjang.', 400);
  }

  if (notes.length > FIELD_LIMITS.notes) {
    throw createHttpError('Catatan tambahan terlalu panjang.', 400);
  }

  return {
    mode,
    platform,
    tone,
    brief,
    targetAudience,
    notes,
    campaignContext,
  };
};

const modeInstructions = {
  caption: `
Fokus output:
- Buat caption campaign yang siap dipakai.
- Sertakan hook pembuka, caption utama, CTA, dan hashtag seperlunya.
- Buat beberapa variasi caption jika memungkinkan.
`,
  content_ideas: `
Fokus output:
- Buat ide konten yang praktis untuk dieksekusi influencer.
- Jelaskan konsep, angle, alur konten, dan CTA.
- Berikan variasi yang cocok untuk platform pilihan.
`,
  proposal_reply: `
Fokus output:
- Buat balasan proposal campaign untuk UMKM.
- Nada harus sopan, profesional, dan menunjukkan influencer memahami brief.
- Sertakan konfirmasi, pertanyaan klarifikasi bila perlu, dan next step.
`,
};

const buildPrompt = (request, influencer) => `
Anda adalah AI Assistant untuk influencer di platform BersamaKreator.
Gunakan Bahasa Indonesia yang natural, profesional, dan ringkas.
Jangan mengarang data brand di luar brief.
Jangan menyebut bahwa Anda adalah AI.

Profil influencer:
- Username: ${influencer.username}
- Niche: ${influencer.niche || '-'}
- Bio: ${influencer.bio || '-'}
- Followers: ${influencer.followers_count || 0}
- Engagement rate: ${influencer.engagement_rate || 0}%

Mode: ${request.mode}
Platform: ${request.platform}
Tone: ${request.tone}
Target audiens: ${request.targetAudience || '-'}

Brief:
${request.brief}

Catatan tambahan:
${request.notes || '-'}

Konteks campaign:
${JSON.stringify(request.campaignContext || {}, null, 2)}

${modeInstructions[request.mode]}

Kembalikan hanya JSON valid tanpa markdown:
{
  "title": "Judul singkat hasil",
  "content": "Draft utama yang rapi dan siap dipakai",
  "variants": [
    { "label": "Opsi 1", "text": "Teks variasi" }
  ],
  "tips": [
    "Tips singkat untuk eksekusi"
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

const normalizeAiResult = (result) => {
  const variants = Array.isArray(result?.variants)
    ? result.variants
      .map((item, index) => ({
        label: normalizeString(item?.label) || `Opsi ${index + 1}`,
        text: normalizeString(item?.text),
      }))
      .filter((item) => item.text)
      .slice(0, 5)
    : [];

  const tips = Array.isArray(result?.tips)
    ? result.tips.map(normalizeString).filter(Boolean).slice(0, 6)
    : [];

  const content = normalizeString(result?.content);
  if (!content && variants.length === 0) {
    throw new Error('Respons AI kosong.');
  }

  return {
    title: normalizeString(result?.title) || 'Draft AI Assistant',
    content,
    variants,
    tips,
  };
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
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'Anda membantu influencer membuat draft konten dan balasan campaign dalam Bahasa Indonesia.',
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

    const isRateLimited = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
    const isUnauthorized = error.message?.includes('401') || error.message?.includes('403');

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
    { error: error.message || 'AI Assistant sementara tidak tersedia.' },
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

    const { user, influencer } = await getAuthenticatedInfluencer(context, config);
    enforceRateLimit(context, user);

    const body = await parseRequestBody(context);
    const request = validateRequestBody(body);
    const prompt = buildPrompt(request, influencer);
    const { provider, result } = await runAiProvider(context, config, prompt);

    return jsonResponse(context, {
      data: {
        mode: request.mode,
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

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
const WORKFLOWS = new Set(['campaign_launch', 'influencer_collaboration', 'content_calendar', 'performance_report']);
const CHANNELS = new Set(['instagram', 'tiktok', 'whatsapp', 'email', 'marketplace', 'paid_ads', 'multi_channel']);
const CADENCES = new Set(['daily', 'weekly', 'launch_week', 'custom']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FIELD_LIMITS = {
  campaignName: 200,
  objective: 500,
  audience: 350,
  assets: 700,
  metrics: 500,
  notes: 700,
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
    throw createHttpError('Autentikasi diperlukan untuk menggunakan Marketing Ops Agent.', 401);
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
    throw createHttpError('Marketing Ops Agent hanya tersedia untuk akun UMKM.', 403);
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

const isValidDate = (dateText) => {
  if (!DATE_PATTERN.test(dateText)) return false;
  const date = new Date(`${dateText}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateText;
};

const validateDateRange = (startDate, endDate) => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw createHttpError('Tanggal campaign harus memakai format YYYY-MM-DD.', 400);
  }

  if (new Date(`${endDate}T00:00:00Z`) < new Date(`${startDate}T00:00:00Z`)) {
    throw createHttpError('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.', 400);
  }
};

const validateRequestBody = (body) => {
  const role = normalizeString(body.role);
  const campaignName = normalizeString(body.campaign_name);
  const workflow = normalizeString(body.workflow);
  const primaryChannel = normalizeString(body.primary_channel);
  const cadence = normalizeString(body.cadence);
  const startDate = normalizeString(body.start_date);
  const endDate = normalizeString(body.end_date);
  const objective = normalizeString(body.objective);
  const audience = normalizeString(body.audience);
  const assets = normalizeString(body.assets);
  const metrics = normalizeString(body.metrics);
  const notes = normalizeString(body.notes);

  if (!ROLES.has(role)) {
    throw createHttpError('Role Marketing Ops Agent tidak valid.', 400);
  }

  if (!campaignName || campaignName.length > FIELD_LIMITS.campaignName) {
    throw createHttpError('Nama campaign wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (!WORKFLOWS.has(workflow)) {
    throw createHttpError('Workflow campaign tidak valid.', 400);
  }

  if (!CHANNELS.has(primaryChannel)) {
    throw createHttpError('Channel utama tidak valid.', 400);
  }

  if (!CADENCES.has(cadence)) {
    throw createHttpError('Cadence kerja tidak valid.', 400);
  }

  validateDateRange(startDate, endDate);

  if (!objective || objective.length > FIELD_LIMITS.objective) {
    throw createHttpError('Tujuan campaign wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (!audience || audience.length > FIELD_LIMITS.audience) {
    throw createHttpError('Target audiens wajib diisi dan tidak boleh terlalu panjang.', 400);
  }

  if (assets.length > FIELD_LIMITS.assets) {
    throw createHttpError('Kebutuhan asset terlalu panjang.', 400);
  }

  if (metrics.length > FIELD_LIMITS.metrics) {
    throw createHttpError('Target metrik terlalu panjang.', 400);
  }

  if (notes.length > FIELD_LIMITS.notes) {
    throw createHttpError('Catatan tambahan terlalu panjang.', 400);
  }

  return {
    role,
    campaignName,
    workflow,
    primaryChannel,
    cadence,
    startDate,
    endDate,
    objective,
    audience,
    assets,
    metrics,
    notes,
  };
};

const buildPrompt = (request, profile) => `
Anda adalah Marketing Ops Agent untuk platform BersamaKreator.
Tugas Anda adalah membantu UMKM mengubah rencana campaign menjadi operasi yang bisa dijalankan: jadwal, checklist, asset tracker, metrik, dan report.
Gunakan Bahasa Indonesia yang natural, profesional, dan praktis.
Jangan menyebut bahwa Anda adalah AI.
Jangan membuat klaim hasil yang tidak diberikan user.
Jangan memberi instruksi spam, manipulatif, atau melanggar kebijakan platform.

Profil UMKM:
- Nama akun: ${profile.name || '-'}
- Email akun: ${profile.email || '-'}

Input operasional:
- Nama campaign: ${request.campaignName}
- Workflow: ${request.workflow}
- Channel utama: ${request.primaryChannel}
- Cadence kerja: ${request.cadence}
- Periode campaign: ${request.startDate} sampai ${request.endDate}
- Tujuan campaign: ${request.objective}
- Target audiens: ${request.audience}
- Asset yang dibutuhkan: ${request.assets || '-'}
- Target metrik: ${request.metrics || '-'}
- Catatan tambahan: ${request.notes || '-'}

Buat output yang bisa dipakai sebagai workspace operasional UMKM:
- operating plan singkat
- kalender eksekusi campaign
- checklist publish dan approval
- asset tracker
- metrics tracker
- outline report setelah campaign
- risiko dan mitigasi
- next steps

Kembalikan hanya JSON valid tanpa markdown:
{
  "title": "Judul singkat rencana operasional",
  "summary": "Ringkasan 1-3 kalimat",
  "operating_plan": {
    "workflow": "Workflow campaign",
    "cadence": "Cadence kerja",
    "primary_channel": "Channel utama",
    "launch_window": "Periode launch",
    "success_definition": "Definisi sukses campaign"
  },
  "calendar": [
    {
      "date": "YYYY-MM-DD atau relatif",
      "phase": "Fase kerja",
      "focus": "Fokus hari/minggu",
      "tasks": ["Task operasional"],
      "owner": "PIC",
      "channel": "Channel",
      "dependency": "Dependency atau prasyarat"
    }
  ],
  "publish_checklist": [
    {
      "task": "Checklist publish",
      "owner": "PIC",
      "due_date": "Tanggal/jadwal",
      "priority": "High/Medium/Low",
      "status": "Todo/In Progress/Ready"
    }
  ],
  "asset_tracker": [
    {
      "asset": "Nama asset",
      "purpose": "Fungsi asset",
      "format": "Format",
      "owner": "PIC",
      "due_date": "Tanggal/jadwal"
    }
  ],
  "metrics_tracker": [
    {
      "metric": "Nama metrik",
      "target": "Target atau benchmark",
      "tracking_method": "Cara tracking",
      "review_frequency": "Frekuensi review"
    }
  ],
  "report_outline": [
    {
      "section": "Bagian report",
      "insight": "Insight yang perlu dicari",
      "action": "Tindak lanjut"
    }
  ],
  "risks": [
    {
      "risk": "Risiko operasional",
      "mitigation": "Mitigasi"
    }
  ],
  "next_steps": ["Langkah berikutnya"]
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

const normalizeCalendar = (items) => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        date: normalizeString(item?.date),
        phase: normalizeString(item?.phase) || `Fase ${index + 1}`,
        focus: normalizeString(item?.focus),
        tasks: normalizeTextList(item?.tasks, 8),
        owner: normalizeString(item?.owner),
        channel: normalizeString(item?.channel),
        dependency: normalizeString(item?.dependency),
      }))
      .filter((item) => item.date || item.focus || item.tasks.length > 0)
      .slice(0, 12)
    : []
);

const normalizeChecklist = (items) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        task: normalizeString(item?.task),
        owner: normalizeString(item?.owner),
        due_date: normalizeString(item?.due_date),
        priority: normalizeString(item?.priority),
        status: normalizeString(item?.status),
      }))
      .filter((item) => item.task)
      .slice(0, 12)
    : []
);

const normalizeAssets = (items) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        asset: normalizeString(item?.asset),
        purpose: normalizeString(item?.purpose),
        format: normalizeString(item?.format),
        owner: normalizeString(item?.owner),
        due_date: normalizeString(item?.due_date),
      }))
      .filter((item) => item.asset || item.purpose)
      .slice(0, 12)
    : []
);

const normalizeMetrics = (items) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        metric: normalizeString(item?.metric),
        target: normalizeString(item?.target),
        tracking_method: normalizeString(item?.tracking_method),
        review_frequency: normalizeString(item?.review_frequency),
      }))
      .filter((item) => item.metric || item.target)
      .slice(0, 10)
    : []
);

const normalizeReportOutline = (items) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        section: normalizeString(item?.section),
        insight: normalizeString(item?.insight),
        action: normalizeString(item?.action),
      }))
      .filter((item) => item.section || item.insight || item.action)
      .slice(0, 8)
    : []
);

const normalizeRisks = (items) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        risk: normalizeString(item?.risk),
        mitigation: normalizeString(item?.mitigation),
      }))
      .filter((item) => item.risk || item.mitigation)
      .slice(0, 8)
    : []
);

const normalizeAiResult = (result, request) => {
  const operatingPlan = result?.operating_plan || {};
  const normalized = {
    title: normalizeString(result?.title) || 'Marketing Ops Plan UMKM',
    summary: normalizeString(result?.summary),
    operating_plan: {
      workflow: normalizeString(operatingPlan.workflow) || request.workflow,
      cadence: normalizeString(operatingPlan.cadence) || request.cadence,
      primary_channel: normalizeString(operatingPlan.primary_channel) || request.primaryChannel,
      launch_window: normalizeString(operatingPlan.launch_window) || `${request.startDate} sampai ${request.endDate}`,
      success_definition: normalizeString(operatingPlan.success_definition),
    },
    calendar: normalizeCalendar(result?.calendar),
    publish_checklist: normalizeChecklist(result?.publish_checklist),
    asset_tracker: normalizeAssets(result?.asset_tracker),
    metrics_tracker: normalizeMetrics(result?.metrics_tracker),
    report_outline: normalizeReportOutline(result?.report_outline),
    risks: normalizeRisks(result?.risks),
    next_steps: normalizeTextList(result?.next_steps, 8),
  };

  if (!normalized.summary && normalized.calendar.length === 0 && normalized.publish_checklist.length === 0) {
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
        temperature: 0.65,
        messages: [
          {
            role: 'system',
            content: 'Anda membantu UMKM menyusun marketing operations plan yang praktis dan siap dieksekusi dalam Bahasa Indonesia.',
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
    { error: error.message || 'Marketing Ops Agent sementara tidak tersedia.' },
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
        workflow: request.workflow,
        primary_channel: request.primaryChannel,
        provider,
        result,
      },
    });
  } catch (error) {
    return createAiErrorResponse(context, error);
  }
}

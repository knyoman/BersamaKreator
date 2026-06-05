export const EMAIL_CAMPAIGN_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'Follow-up WhatsApp' },
  { value: 'email_whatsapp', label: 'Email + WhatsApp' },
];

export const EMAIL_CAMPAIGN_FUNNEL_STAGES = [
  { value: 'awareness', label: 'Pengenalan' },
  { value: 'consideration', label: 'Pertimbangan' },
  { value: 'conversion', label: 'Konversi' },
  { value: 'retention', label: 'Retensi' },
  { value: 'reactivation', label: 'Aktivasi Ulang' },
];

export const EMAIL_CAMPAIGN_TONES = [
  { value: 'friendly', label: 'Ramah' },
  { value: 'professional', label: 'Profesional' },
  { value: 'persuasive', label: 'Persuasif' },
  { value: 'premium', label: 'Premium' },
  { value: 'educational', label: 'Edukatif' },
];

export const EMAIL_CAMPAIGN_SEQUENCE_COUNTS = [
  { value: 1, label: '1 Pesan' },
  { value: 2, label: '2 Pesan' },
  { value: 3, label: '3 Pesan' },
  { value: 4, label: '4 Pesan' },
  { value: 5, label: '5 Pesan' },
];

export const EMAIL_CAMPAIGN_FIELD_LIMITS = {
  offer: 500,
  audience: 350,
  goal: 500,
  context: 800,
  objections: 600,
  notes: 600,
};

const normalizeText = (value) => String(value || '').trim();

const isOptionValue = (options, value) => options.some((item) => item.value === value);

export const createEmptyEmailCampaignForm = () => ({
  role: 'sme',
  offer: '',
  audience: '',
  goal: '',
  funnel_stage: 'conversion',
  channel: 'email',
  tone: 'persuasive',
  email_count: 3,
  context: '',
  objections: '',
  notes: '',
});

export const sanitizeEmailCampaignPayload = (formData = {}) => {
  const offer = normalizeText(formData.offer);
  const audience = normalizeText(formData.audience);
  const goal = normalizeText(formData.goal);
  const funnelStage = normalizeText(formData.funnel_stage);
  const channel = normalizeText(formData.channel);
  const tone = normalizeText(formData.tone);
  const context = normalizeText(formData.context);
  const objections = normalizeText(formData.objections);
  const notes = normalizeText(formData.notes);
  const emailCount = Number(formData.email_count || 3);

  if (!offer) {
    throw new Error('Produk, layanan, atau penawaran wajib diisi.');
  }

  if (!audience) {
    throw new Error('Segmen audiens wajib diisi.');
  }

  if (!goal) {
    throw new Error('Tujuan promosi wajib diisi.');
  }

  if (offer.length > EMAIL_CAMPAIGN_FIELD_LIMITS.offer) {
    throw new Error(`Produk, layanan, atau penawaran maksimal ${EMAIL_CAMPAIGN_FIELD_LIMITS.offer} karakter.`);
  }

  if (audience.length > EMAIL_CAMPAIGN_FIELD_LIMITS.audience) {
    throw new Error(`Segmen audiens maksimal ${EMAIL_CAMPAIGN_FIELD_LIMITS.audience} karakter.`);
  }

  if (goal.length > EMAIL_CAMPAIGN_FIELD_LIMITS.goal) {
    throw new Error(`Tujuan promosi maksimal ${EMAIL_CAMPAIGN_FIELD_LIMITS.goal} karakter.`);
  }

  if (context.length > EMAIL_CAMPAIGN_FIELD_LIMITS.context) {
    throw new Error(`Konteks promosi maksimal ${EMAIL_CAMPAIGN_FIELD_LIMITS.context} karakter.`);
  }

  if (objections.length > EMAIL_CAMPAIGN_FIELD_LIMITS.objections) {
    throw new Error(`Keberatan pelanggan maksimal ${EMAIL_CAMPAIGN_FIELD_LIMITS.objections} karakter.`);
  }

  if (notes.length > EMAIL_CAMPAIGN_FIELD_LIMITS.notes) {
    throw new Error(`Catatan tambahan maksimal ${EMAIL_CAMPAIGN_FIELD_LIMITS.notes} karakter.`);
  }

  if (!isOptionValue(EMAIL_CAMPAIGN_FUNNEL_STAGES, funnelStage)) {
    throw new Error('Tahap funnel tidak valid.');
  }

  if (!isOptionValue(EMAIL_CAMPAIGN_CHANNELS, channel)) {
    throw new Error('Channel promosi tidak valid.');
  }

  if (!isOptionValue(EMAIL_CAMPAIGN_TONES, tone)) {
    throw new Error('Gaya bahasa promosi tidak valid.');
  }

  if (!EMAIL_CAMPAIGN_SEQUENCE_COUNTS.some((item) => item.value === emailCount)) {
    throw new Error('Jumlah pesan tidak valid.');
  }

  return {
    role: 'sme',
    offer,
    audience,
    goal,
    funnel_stage: funnelStage,
    channel,
    tone,
    email_count: emailCount,
    context: context || null,
    objections: objections || null,
    notes: notes || null,
  };
};

const normalizeList = (items = []) => (
  Array.isArray(items) ? items.map(normalizeText).filter(Boolean) : []
);

const normalizeSequence = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        step: Number(item?.step || index + 1),
        purpose: normalizeText(item?.purpose),
        subject: normalizeText(item?.subject),
        preview_text: normalizeText(item?.preview_text),
        body: normalizeText(item?.body || item?.content || item?.text),
        cta: normalizeText(item?.cta),
        timing: normalizeText(item?.timing),
      }))
      .filter((item) => item.subject || item.body || item.cta)
    : []
);

const normalizeObjectionResponses = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        objection: normalizeText(item?.objection),
        response: normalizeText(item?.response),
      }))
      .filter((item) => item.objection || item.response)
    : []
);

export const normalizeEmailCampaignResult = (result = {}) => {
  const strategy = result.strategy || {};

  return {
    title: normalizeText(result.title) || 'Rangkaian Email dan WhatsApp UMKM',
    summary: normalizeText(result.summary),
    strategy: {
      funnel_stage: normalizeText(strategy.funnel_stage),
      positioning: normalizeText(strategy.positioning),
      message_angle: normalizeText(strategy.message_angle),
      send_timing: normalizeText(strategy.send_timing),
    },
    subject_lines: normalizeList(result.subject_lines),
    sequence: normalizeSequence(result.sequence),
    objection_responses: normalizeObjectionResponses(result.objection_responses),
    ctas: normalizeList(result.ctas),
    testing_notes: normalizeList(result.testing_notes),
  };
};

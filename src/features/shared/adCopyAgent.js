export const AD_COPY_PLATFORMS = [
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'instagram_story_ads', label: 'Iklan Instagram Story' },
  { value: 'tiktok_ads', label: 'Iklan TikTok' },
  { value: 'google_search_ads', label: 'Iklan Google Search' },
  { value: 'marketplace_ads', label: 'Iklan Marketplace' },
  { value: 'multi_channel', label: 'Multi-channel' },
];

export const AD_COPY_OBJECTIVES = [
  { value: 'awareness', label: 'Pengenalan' },
  { value: 'traffic', label: 'Traffic / Kunjungan' },
  { value: 'leads', label: 'Prospek' },
  { value: 'sales', label: 'Penjualan' },
  { value: 'retargeting', label: 'Retargeting' },
];

export const AD_COPY_TONES = [
  { value: 'friendly', label: 'Ramah' },
  { value: 'professional', label: 'Profesional' },
  { value: 'persuasive', label: 'Persuasif' },
  { value: 'premium', label: 'Premium' },
  { value: 'playful', label: 'Ceria' },
  { value: 'educational', label: 'Edukatif' },
];

export const AD_COPY_VARIATION_COUNTS = [
  { value: 2, label: '2 Variasi' },
  { value: 3, label: '3 Variasi' },
  { value: 4, label: '4 Variasi' },
  { value: 5, label: '5 Variasi' },
  { value: 6, label: '6 Variasi' },
];

export const AD_COPY_FIELD_LIMITS = {
  offer: 500,
  audience: 350,
  objectiveDetail: 500,
  context: 800,
  constraints: 600,
  notes: 600,
};

const normalizeText = (value) => String(value || '').trim();

const isOptionValue = (options, value) => options.some((item) => item.value === value);

export const createEmptyAdCopyForm = () => ({
  role: 'sme',
  offer: '',
  audience: '',
  objective: 'sales',
  objective_detail: '',
  platform: 'meta_ads',
  tone: 'persuasive',
  variation_count: 4,
  context: '',
  constraints: '',
  notes: '',
});

export const sanitizeAdCopyPayload = (formData = {}) => {
  const offer = normalizeText(formData.offer);
  const audience = normalizeText(formData.audience);
  const objective = normalizeText(formData.objective);
  const objectiveDetail = normalizeText(formData.objective_detail);
  const platform = normalizeText(formData.platform);
  const tone = normalizeText(formData.tone);
  const context = normalizeText(formData.context);
  const constraints = normalizeText(formData.constraints);
  const notes = normalizeText(formData.notes);
  const variationCount = Number(formData.variation_count || 4);

  if (!offer) {
    throw new Error('Produk, layanan, atau penawaran wajib diisi.');
  }

  if (!audience) {
    throw new Error('Target audiens wajib diisi.');
  }

  if (!objectiveDetail) {
    throw new Error('Detail tujuan wajib diisi.');
  }

  if (offer.length > AD_COPY_FIELD_LIMITS.offer) {
    throw new Error(`Produk, layanan, atau penawaran maksimal ${AD_COPY_FIELD_LIMITS.offer} karakter.`);
  }

  if (audience.length > AD_COPY_FIELD_LIMITS.audience) {
    throw new Error(`Target audiens maksimal ${AD_COPY_FIELD_LIMITS.audience} karakter.`);
  }

  if (objectiveDetail.length > AD_COPY_FIELD_LIMITS.objectiveDetail) {
    throw new Error(`Detail tujuan maksimal ${AD_COPY_FIELD_LIMITS.objectiveDetail} karakter.`);
  }

  if (context.length > AD_COPY_FIELD_LIMITS.context) {
    throw new Error(`Konteks brand atau promosi maksimal ${AD_COPY_FIELD_LIMITS.context} karakter.`);
  }

  if (constraints.length > AD_COPY_FIELD_LIMITS.constraints) {
    throw new Error(`Batasan atau hal yang dihindari maksimal ${AD_COPY_FIELD_LIMITS.constraints} karakter.`);
  }

  if (notes.length > AD_COPY_FIELD_LIMITS.notes) {
    throw new Error(`Catatan tambahan maksimal ${AD_COPY_FIELD_LIMITS.notes} karakter.`);
  }

  if (!isOptionValue(AD_COPY_OBJECTIVES, objective)) {
    throw new Error('Tujuan iklan tidak valid.');
  }

  if (!isOptionValue(AD_COPY_PLATFORMS, platform)) {
    throw new Error('Platform iklan tidak valid.');
  }

  if (!isOptionValue(AD_COPY_TONES, tone)) {
    throw new Error('Gaya bahasa iklan tidak valid.');
  }

  if (!AD_COPY_VARIATION_COUNTS.some((item) => item.value === variationCount)) {
    throw new Error('Jumlah variasi tidak valid.');
  }

  return {
    role: 'sme',
    offer,
    audience,
    objective,
    objective_detail: objectiveDetail,
    platform,
    tone,
    variation_count: variationCount,
    context: context || null,
    constraints: constraints || null,
    notes: notes || null,
  };
};

const normalizeList = (items = []) => (
  Array.isArray(items) ? items.map(normalizeText).filter(Boolean) : []
);

const normalizeAngles = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeText(item?.title) || `Angle ${index + 1}`,
        rationale: normalizeText(item?.rationale),
        best_for: normalizeText(item?.best_for),
      }))
      .filter((item) => item.title || item.rationale || item.best_for)
    : []
);

const normalizeVariations = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeText(item?.title) || `Variasi ${index + 1}`,
        platform: normalizeText(item?.platform),
        angle: normalizeText(item?.angle),
        headline: normalizeText(item?.headline || item?.hook),
        primary_text: normalizeText(item?.primary_text || item?.body || item?.copy),
        description: normalizeText(item?.description),
        cta: normalizeText(item?.cta),
        creative_direction: normalizeText(item?.creative_direction),
      }))
      .filter((item) => item.headline || item.primary_text || item.cta)
    : []
);

export const normalizeAdCopyResult = (result = {}) => ({
  title: normalizeText(result.title) || 'Naskah Iklan UMKM',
  summary: normalizeText(result.summary),
  angles: normalizeAngles(result.angles),
  variations: normalizeVariations(result.variations),
  hooks: normalizeList(result.hooks),
  negative_prompts: normalizeList(result.negative_prompts),
  ctas: normalizeList(result.ctas),
  testing_notes: normalizeList(result.testing_notes),
});

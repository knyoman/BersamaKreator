export const MARKET_RESEARCH_ROLES = {
  influencer: {
    label: 'Influencer',
    focusLabel: 'Niche / Fokus Konten',
    focusPlaceholder: 'contoh: skincare lokal, edukasi finansial, kuliner rumahan',
    objectiveLabel: 'Tujuan Riset',
    objectivePlaceholder: 'contoh: mencari tren konten dan angle promosi yang menarik brand',
    notesPlaceholder: 'contoh: fokus konten Reels, gaya ringan, audiens Gen Z',
  },
  sme: {
    label: 'UMKM',
    focusLabel: 'Industri / Produk / Layanan',
    focusPlaceholder: 'contoh: kopi susu botolan, hampers Lebaran, jasa laundry kiloan',
    objectiveLabel: 'Tujuan Promosi / Bisnis',
    objectivePlaceholder: 'contoh: mencari peluang promosi untuk produk baru dan memahami kebutuhan audiens',
    notesPlaceholder: 'contoh: brand masih baru, budget promosi terbatas, target Jakarta dan sekitarnya',
  },
};

export const MARKET_RESEARCH_TIMEFRAMES = [
  { value: 'current', label: 'Saat Ini' },
  { value: 'next_30_days', label: '30 Hari ke Depan' },
  { value: 'next_90_days', label: '90 Hari ke Depan' },
];

export const MARKET_RESEARCH_FIELD_LIMITS = {
  focus: 180,
  targetAudience: 300,
  location: 120,
  objective: 500,
  notes: 600,
};

const normalizeText = (value) => String(value || '').trim();

export const getMarketResearchRoleConfig = (role) => (
  MARKET_RESEARCH_ROLES[role] || MARKET_RESEARCH_ROLES.influencer
);

export const createEmptyMarketResearchForm = (role = 'influencer') => ({
  role,
  focus: '',
  target_audience: '',
  location: '',
  objective: '',
  timeframe: role === 'sme' ? 'next_30_days' : 'current',
  notes: '',
});

export const sanitizeMarketResearchPayload = (formData = {}, role = 'influencer') => {
  const normalizedRole = MARKET_RESEARCH_ROLES[role] ? role : 'influencer';
  const focus = normalizeText(formData.focus);
  const targetAudience = normalizeText(formData.target_audience);
  const location = normalizeText(formData.location);
  const objective = normalizeText(formData.objective);
  const timeframe = normalizeText(formData.timeframe);
  const notes = normalizeText(formData.notes);
  const roleConfig = getMarketResearchRoleConfig(normalizedRole);

  if (!focus) {
    throw new Error(`${roleConfig.focusLabel} wajib diisi.`);
  }

  if (!targetAudience) {
    throw new Error('Target audiens wajib diisi.');
  }

  if (!objective) {
    throw new Error(`${roleConfig.objectiveLabel} wajib diisi.`);
  }

  if (focus.length > MARKET_RESEARCH_FIELD_LIMITS.focus) {
    throw new Error(`${roleConfig.focusLabel} maksimal ${MARKET_RESEARCH_FIELD_LIMITS.focus} karakter.`);
  }

  if (targetAudience.length > MARKET_RESEARCH_FIELD_LIMITS.targetAudience) {
    throw new Error(`Target audiens maksimal ${MARKET_RESEARCH_FIELD_LIMITS.targetAudience} karakter.`);
  }

  if (location.length > MARKET_RESEARCH_FIELD_LIMITS.location) {
    throw new Error(`Lokasi maksimal ${MARKET_RESEARCH_FIELD_LIMITS.location} karakter.`);
  }

  if (objective.length > MARKET_RESEARCH_FIELD_LIMITS.objective) {
    throw new Error(`${roleConfig.objectiveLabel} maksimal ${MARKET_RESEARCH_FIELD_LIMITS.objective} karakter.`);
  }

  if (notes.length > MARKET_RESEARCH_FIELD_LIMITS.notes) {
    throw new Error(`Catatan tambahan maksimal ${MARKET_RESEARCH_FIELD_LIMITS.notes} karakter.`);
  }

  if (!MARKET_RESEARCH_TIMEFRAMES.some((item) => item.value === timeframe)) {
    throw new Error('Rentang riset tidak valid.');
  }

  return {
    role: normalizedRole,
    focus,
    target_audience: targetAudience,
    location: location || null,
    objective,
    timeframe,
    notes: notes || null,
  };
};

const normalizeList = (items = [], fallbackTitle = 'Temuan') => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeText(item?.title) || `${fallbackTitle} ${index + 1}`,
        description: normalizeText(item?.description || item?.text || item?.insight),
        implication: normalizeText(item?.implication),
        action: normalizeText(item?.action),
      }))
      .filter((item) => item.description || item.implication || item.action)
    : []
);

export const normalizeMarketResearchResult = (result = {}) => ({
  title: normalizeText(result.title) || 'Riset Pasar',
  summary: normalizeText(result.summary),
  trends: normalizeList(result.trends, 'Tren'),
  pain_points: normalizeList(result.pain_points, 'Masalah Audiens'),
  search_intents: normalizeList(result.search_intents, 'Niat Pencarian'),
  opportunities: normalizeList(result.opportunities, 'Peluang'),
  content_angles: normalizeList(result.content_angles, 'Angle'),
  recommended_actions: normalizeList(result.recommended_actions, 'Aksi'),
  cautions: Array.isArray(result.cautions) ? result.cautions.map(normalizeText).filter(Boolean) : [],
});

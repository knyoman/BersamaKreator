export const CONTENT_STRATEGY_ROLES = {
  influencer: {
    label: 'Influencer',
    focusLabel: 'Niche / Topik Utama',
    focusPlaceholder: 'contoh: skincare lokal, edukasi finansial, kuliner Bandung',
    objectiveLabel: 'Tujuan Konten',
    objectivePlaceholder: 'contoh: meningkatkan engagement dan menarik campaign brand skincare',
    notesPlaceholder: 'contoh: gaya santai, konten harus mudah dibuat dengan smartphone',
  },
  sme: {
    label: 'UMKM',
    focusLabel: 'Produk / Layanan',
    focusPlaceholder: 'contoh: kopi susu botolan, hampers Lebaran, jasa laundry kiloan',
    objectiveLabel: 'Tujuan Promosi',
    objectivePlaceholder: 'contoh: meningkatkan awareness produk baru dan mendorong pemesanan',
    notesPlaceholder: 'contoh: hindari klaim berlebihan, cocok untuk konten Reels dan Story',
  },
};

export const CONTENT_STRATEGY_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'instagram_reels', label: 'Instagram Reels' },
  { value: 'instagram_story', label: 'Instagram Story' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube_shorts', label: 'YouTube Shorts' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'multi_platform', label: 'Multi-platform' },
];

export const CONTENT_STRATEGY_TIMEFRAMES = [
  { value: '7_days', label: '7 Hari' },
  { value: '14_days', label: '14 Hari' },
  { value: '30_days', label: '30 Hari' },
];

export const CONTENT_STRATEGY_FIELD_LIMITS = {
  focus: 180,
  targetAudience: 300,
  objective: 500,
  notes: 600,
};

const normalizeText = (value) => String(value || '').trim();

export const getContentStrategyRoleConfig = (role) => (
  CONTENT_STRATEGY_ROLES[role] || CONTENT_STRATEGY_ROLES.influencer
);

export const createEmptyContentStrategyForm = (role = 'influencer') => ({
  role,
  focus: '',
  target_audience: '',
  objective: '',
  platform: role === 'sme' ? 'multi_platform' : 'instagram_reels',
  timeframe: '7_days',
  notes: '',
});

export const sanitizeContentStrategyPayload = (formData = {}, role = 'influencer') => {
  const normalizedRole = CONTENT_STRATEGY_ROLES[role] ? role : 'influencer';
  const focus = normalizeText(formData.focus);
  const targetAudience = normalizeText(formData.target_audience);
  const objective = normalizeText(formData.objective);
  const platform = normalizeText(formData.platform);
  const timeframe = normalizeText(formData.timeframe);
  const notes = normalizeText(formData.notes);

  if (!focus) {
    throw new Error(`${getContentStrategyRoleConfig(normalizedRole).focusLabel} wajib diisi.`);
  }

  if (!targetAudience) {
    throw new Error('Target audiens wajib diisi.');
  }

  if (!objective) {
    throw new Error(`${getContentStrategyRoleConfig(normalizedRole).objectiveLabel} wajib diisi.`);
  }

  if (focus.length > CONTENT_STRATEGY_FIELD_LIMITS.focus) {
    throw new Error(`${getContentStrategyRoleConfig(normalizedRole).focusLabel} maksimal ${CONTENT_STRATEGY_FIELD_LIMITS.focus} karakter.`);
  }

  if (targetAudience.length > CONTENT_STRATEGY_FIELD_LIMITS.targetAudience) {
    throw new Error(`Target audiens maksimal ${CONTENT_STRATEGY_FIELD_LIMITS.targetAudience} karakter.`);
  }

  if (objective.length > CONTENT_STRATEGY_FIELD_LIMITS.objective) {
    throw new Error(`${getContentStrategyRoleConfig(normalizedRole).objectiveLabel} maksimal ${CONTENT_STRATEGY_FIELD_LIMITS.objective} karakter.`);
  }

  if (notes.length > CONTENT_STRATEGY_FIELD_LIMITS.notes) {
    throw new Error(`Catatan tambahan maksimal ${CONTENT_STRATEGY_FIELD_LIMITS.notes} karakter.`);
  }

  if (!CONTENT_STRATEGY_PLATFORMS.some((item) => item.value === platform)) {
    throw new Error('Platform tidak valid.');
  }

  if (!CONTENT_STRATEGY_TIMEFRAMES.some((item) => item.value === timeframe)) {
    throw new Error('Durasi rencana tidak valid.');
  }

  return {
    role: normalizedRole,
    focus,
    target_audience: targetAudience,
    objective,
    platform,
    timeframe,
    notes: notes || null,
  };
};

const normalizeObjectList = (items = [], fallbackTitle = 'Item') => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeText(item?.title) || `${fallbackTitle} ${index + 1}`,
        description: normalizeText(item?.description || item?.text || item?.action),
        hook: normalizeText(item?.hook),
        format: normalizeText(item?.format),
        cta: normalizeText(item?.cta),
        day: normalizeText(item?.day),
      }))
      .filter((item) => item.description || item.hook || item.cta || item.format)
    : []
);

export const normalizeContentStrategyResult = (result = {}) => ({
  title: normalizeText(result.title) || 'Strategi Konten',
  summary: normalizeText(result.summary),
  pillars: normalizeObjectList(result.pillars, 'Pilar'),
  angles: normalizeObjectList(result.angles, 'Angle'),
  weekly_plan: normalizeObjectList(result.weekly_plan, 'Rencana'),
  hooks: Array.isArray(result.hooks) ? result.hooks.map(normalizeText).filter(Boolean) : [],
  ctas: Array.isArray(result.ctas) ? result.ctas.map(normalizeText).filter(Boolean) : [],
  tips: Array.isArray(result.tips) ? result.tips.map(normalizeText).filter(Boolean) : [],
});

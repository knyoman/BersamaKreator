export const SOCIAL_POST_ROLES = {
  influencer: {
    label: 'Influencer',
    ideaLabel: 'Ide Konten / Insight',
    ideaPlaceholder: 'contoh: review jujur sunscreen lokal untuk kulit berminyak',
    contextLabel: 'Gaya Konten / Suara Anda',
    contextPlaceholder: 'contoh: santai, jujur, edukatif, sering pakai storytelling singkat',
    objectiveLabel: 'Tujuan Konten',
    objectivePlaceholder: 'contoh: membuat konten sponsored yang tetap terasa natural',
    notesPlaceholder: 'contoh: jangan terlalu hard selling, gunakan CTA halus',
  },
  sme: {
    label: 'UMKM',
    ideaLabel: 'Produk / Penawaran / Ide Konten',
    ideaPlaceholder: 'contoh: promo bundling kopi susu botolan untuk akhir pekan',
    contextLabel: 'Gaya Brand / Konteks Promosi',
    contextPlaceholder: 'contoh: brand lokal, ramah, playful, ingin terlihat premium tapi tetap terjangkau',
    objectiveLabel: 'Tujuan Konten',
    objectivePlaceholder: 'contoh: mendorong order WhatsApp dan meningkatkan awareness produk baru',
    notesPlaceholder: 'contoh: sebutkan gratis ongkir area Jakarta, hindari klaim berlebihan',
  },
};

export const SOCIAL_POST_PLATFORMS = [
  { value: 'instagram_caption', label: 'Caption Instagram' },
  { value: 'instagram_reels', label: 'Naskah Instagram Reels' },
  { value: 'instagram_story', label: 'Instagram Story' },
  { value: 'tiktok_video', label: 'Naskah Video TikTok' },
  { value: 'linkedin_post', label: 'Posting LinkedIn' },
  { value: 'x_post', label: 'Posting X / Twitter' },
  { value: 'multi_platform', label: 'Multi-platform' },
];

export const SOCIAL_POST_TONES = [
  { value: 'friendly', label: 'Ramah' },
  { value: 'professional', label: 'Profesional' },
  { value: 'persuasive', label: 'Persuasif' },
  { value: 'casual', label: 'Santai' },
  { value: 'premium', label: 'Premium' },
  { value: 'educational', label: 'Edukatif' },
];

export const SOCIAL_POST_FIELD_LIMITS = {
  idea: 500,
  targetAudience: 300,
  context: 700,
  objective: 500,
  notes: 600,
};

const normalizeText = (value) => String(value || '').trim();

export const getSocialPostRoleConfig = (role) => (
  SOCIAL_POST_ROLES[role] || SOCIAL_POST_ROLES.influencer
);

export const createEmptySocialPostForm = (role = 'influencer') => ({
  role,
  idea: '',
  target_audience: '',
  context: '',
  platform: role === 'sme' ? 'instagram_caption' : 'instagram_reels',
  tone: role === 'sme' ? 'persuasive' : 'friendly',
  objective: '',
  notes: '',
});

export const sanitizeSocialPostPayload = (formData = {}, role = 'influencer') => {
  const normalizedRole = SOCIAL_POST_ROLES[role] ? role : 'influencer';
  const roleConfig = getSocialPostRoleConfig(normalizedRole);
  const idea = normalizeText(formData.idea);
  const targetAudience = normalizeText(formData.target_audience);
  const context = normalizeText(formData.context);
  const platform = normalizeText(formData.platform);
  const tone = normalizeText(formData.tone);
  const objective = normalizeText(formData.objective);
  const notes = normalizeText(formData.notes);

  if (!idea) {
    throw new Error(`${roleConfig.ideaLabel} wajib diisi.`);
  }

  if (!targetAudience) {
    throw new Error('Target audiens wajib diisi.');
  }

  if (!objective) {
    throw new Error(`${roleConfig.objectiveLabel} wajib diisi.`);
  }

  if (idea.length > SOCIAL_POST_FIELD_LIMITS.idea) {
    throw new Error(`${roleConfig.ideaLabel} maksimal ${SOCIAL_POST_FIELD_LIMITS.idea} karakter.`);
  }

  if (targetAudience.length > SOCIAL_POST_FIELD_LIMITS.targetAudience) {
    throw new Error(`Target audiens maksimal ${SOCIAL_POST_FIELD_LIMITS.targetAudience} karakter.`);
  }

  if (context.length > SOCIAL_POST_FIELD_LIMITS.context) {
    throw new Error(`${roleConfig.contextLabel} maksimal ${SOCIAL_POST_FIELD_LIMITS.context} karakter.`);
  }

  if (objective.length > SOCIAL_POST_FIELD_LIMITS.objective) {
    throw new Error(`${roleConfig.objectiveLabel} maksimal ${SOCIAL_POST_FIELD_LIMITS.objective} karakter.`);
  }

  if (notes.length > SOCIAL_POST_FIELD_LIMITS.notes) {
    throw new Error(`Catatan tambahan maksimal ${SOCIAL_POST_FIELD_LIMITS.notes} karakter.`);
  }

  if (!SOCIAL_POST_PLATFORMS.some((item) => item.value === platform)) {
    throw new Error('Platform tidak valid.');
  }

  if (!SOCIAL_POST_TONES.some((item) => item.value === tone)) {
    throw new Error('Tone tidak valid.');
  }

  return {
    role: normalizedRole,
    idea,
    target_audience: targetAudience,
    context: context || null,
    platform,
    tone,
    objective,
    notes: notes || null,
  };
};

const normalizeList = (items = [], fallbackTitle = 'Item') => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeText(item?.title) || `${fallbackTitle} ${index + 1}`,
        platform: normalizeText(item?.platform),
        hook: normalizeText(item?.hook),
        body: normalizeText(item?.body || item?.content || item?.text),
        cta: normalizeText(item?.cta),
        note: normalizeText(item?.note),
      }))
      .filter((item) => item.hook || item.body || item.cta)
    : []
);

export const normalizeSocialPostResult = (result = {}) => ({
  title: normalizeText(result.title) || 'Draf Konten Sosial',
  summary: normalizeText(result.summary),
  hooks: Array.isArray(result.hooks) ? result.hooks.map(normalizeText).filter(Boolean) : [],
  posts: normalizeList(result.posts, 'Konten'),
  variants: normalizeList(result.variants, 'Variasi'),
  ctas: Array.isArray(result.ctas) ? result.ctas.map(normalizeText).filter(Boolean) : [],
  editing_notes: Array.isArray(result.editing_notes) ? result.editing_notes.map(normalizeText).filter(Boolean) : [],
});

export const AI_ASSISTANT_MODES = [
  {
    value: 'caption',
    label: 'Caption Promosi',
    description: 'Buat caption siap pakai untuk konten promosi.',
  },
  {
    value: 'content_ideas',
    label: 'Ide Konten',
    description: 'Buat beberapa konsep konten berdasarkan brief UMKM.',
  },
  {
    value: 'proposal_reply',
    label: 'Balasan Proposal',
    description: 'Buat balasan profesional untuk promosi masuk.',
  },
];

export const AI_ASSISTANT_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'instagram_story', label: 'Instagram Story' },
  { value: 'instagram_feed', label: 'Instagram Feed' },
  { value: 'instagram_reels', label: 'Instagram Reels' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube_shorts', label: 'YouTube Shorts' },
];

export const AI_ASSISTANT_TONES = [
  { value: 'friendly', label: 'Ramah' },
  { value: 'professional', label: 'Profesional' },
  { value: 'persuasive', label: 'Persuasif' },
  { value: 'casual', label: 'Santai' },
  { value: 'premium', label: 'Premium' },
];

export const AI_ASSISTANT_FIELD_LIMITS = {
  brief: 1600,
  targetAudience: 300,
  notes: 600,
};

export const getAIAssistantModeLabel = (value) => (
  AI_ASSISTANT_MODES.find((mode) => mode.value === value)?.label || 'Asisten AI'
);

export const getAIAssistantPlatformLabel = (value) => (
  AI_ASSISTANT_PLATFORMS.find((platform) => platform.value === value)?.label || 'Platform'
);

export const createEmptyAIAssistantForm = () => ({
  mode: 'caption',
  platform: 'instagram_reels',
  tone: 'friendly',
  brief: '',
  target_audience: '',
  notes: '',
});

export const buildCampaignAIAssistantContext = (order = {}) => ({
  order_id: order.id || null,
  campaign_name: order.campaign_name || '',
  campaign_description: order.campaign_description || '',
  sme_name: order.sme_name || '',
  notes: order.notes || '',
  deadline: order.deadline || '',
  package_title: order.package_snapshot?.title || 'Harga dasar per post',
  package_deliverables: Array.isArray(order.package_snapshot?.deliverables)
    ? order.package_snapshot.deliverables
    : [],
});

export const createAIAssistantFormFromCampaign = (order = {}, mode = 'proposal_reply') => {
  const context = buildCampaignAIAssistantContext(order);
  const deliverables = context.package_deliverables.length > 0
    ? `\nDeliverables paket:\n- ${context.package_deliverables.join('\n- ')}`
    : '';

  return {
    mode,
    platform: 'instagram_reels',
    tone: mode === 'proposal_reply' ? 'professional' : 'friendly',
    brief: [
      `Nama promosi: ${context.campaign_name || '-'}`,
      `UMKM: ${context.sme_name || '-'}`,
      `Paket: ${context.package_title || '-'}`,
      `Deadline: ${context.deadline || '-'}`,
      '',
      context.campaign_description || 'Brief promosi belum tersedia.',
      context.notes ? `\nCatatan UMKM:\n${context.notes}` : '',
      deliverables,
    ].filter(Boolean).join('\n'),
    target_audience: '',
    notes: mode === 'proposal_reply'
      ? 'Buat balasan yang sopan, jelas, dan menunjukkan influencer memahami brief.'
      : '',
  };
};

export const sanitizeAIAssistantPayload = (formData = {}, campaignContext = null) => {
  const mode = String(formData.mode || '').trim();
  const platform = String(formData.platform || '').trim();
  const tone = String(formData.tone || '').trim();
  const brief = String(formData.brief || '').trim();
  const targetAudience = String(formData.target_audience || '').trim();
  const notes = String(formData.notes || '').trim();

  if (!AI_ASSISTANT_MODES.some((item) => item.value === mode)) {
    throw new Error('Mode Asisten AI tidak valid.');
  }

  if (!AI_ASSISTANT_PLATFORMS.some((item) => item.value === platform)) {
    throw new Error('Platform tidak valid.');
  }

  if (!AI_ASSISTANT_TONES.some((item) => item.value === tone)) {
    throw new Error('Tone tidak valid.');
  }

  if (!brief) {
    throw new Error('Brief wajib diisi.');
  }

  if (brief.length > AI_ASSISTANT_FIELD_LIMITS.brief) {
    throw new Error(`Brief maksimal ${AI_ASSISTANT_FIELD_LIMITS.brief} karakter.`);
  }

  if (targetAudience.length > AI_ASSISTANT_FIELD_LIMITS.targetAudience) {
    throw new Error(`Target audiens maksimal ${AI_ASSISTANT_FIELD_LIMITS.targetAudience} karakter.`);
  }

  if (notes.length > AI_ASSISTANT_FIELD_LIMITS.notes) {
    throw new Error(`Catatan tambahan maksimal ${AI_ASSISTANT_FIELD_LIMITS.notes} karakter.`);
  }

  return {
    mode,
    platform,
    tone,
    brief,
    target_audience: targetAudience || null,
    notes: notes || null,
    campaign_context: campaignContext || null,
  };
};

export const normalizeAIAssistantResult = (result = {}) => ({
  title: String(result.title || 'Draf Asisten AI').trim(),
  content: String(result.content || '').trim(),
  variants: Array.isArray(result.variants)
    ? result.variants
      .map((item, index) => ({
        label: String(item?.label || `Opsi ${index + 1}`).trim(),
        text: String(item?.text || '').trim(),
      }))
      .filter((item) => item.text)
    : [],
  tips: Array.isArray(result.tips)
    ? result.tips.map((item) => String(item || '').trim()).filter(Boolean)
    : [],
});

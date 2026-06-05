export const ICP_AGENT_ROLES = {
  influencer: {
    label: 'Influencer',
    focusLabel: 'Niche / Karakter Audiens',
    focusPlaceholder: 'contoh: beauty enthusiast pemula, profesional muda, ibu muda aktif',
    evidenceLabel: 'Data Audiens / Konten',
    evidencePlaceholder: 'contoh: komentar terbanyak, konten paling ramai, pertanyaan followers, insight audience',
    objectiveLabel: 'Tujuan ICP',
    objectivePlaceholder: 'contoh: memahami brand dan campaign apa yang paling cocok dengan audiens saya',
    notesPlaceholder: 'contoh: audiens dominan perempuan 20-30 tahun, suka konten review jujur',
  },
  sme: {
    label: 'UMKM',
    focusLabel: 'Produk / Layanan',
    focusPlaceholder: 'contoh: kopi susu botolan, hampers Lebaran, jasa laundry kiloan',
    evidenceLabel: 'Data Awal Pelanggan',
    evidencePlaceholder: 'contoh: review pembeli, keluhan customer, data order, pertanyaan yang sering masuk',
    objectiveLabel: 'Tujuan ICP',
    objectivePlaceholder: 'contoh: menentukan customer ideal sebelum membuat campaign influencer',
    notesPlaceholder: 'contoh: produk baru, harga menengah, ingin menyasar pembeli repeat order',
  },
};

export const ICP_AGENT_CHANNELS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'offline', label: 'Offline' },
  { value: 'multi_channel', label: 'Multi Channel' },
];

export const ICP_AGENT_FIELD_LIMITS = {
  focus: 180,
  evidence: 700,
  objective: 500,
  location: 120,
  notes: 600,
};

const normalizeText = (value) => String(value || '').trim();

export const getICPAgentRoleConfig = (role) => (
  ICP_AGENT_ROLES[role] || ICP_AGENT_ROLES.sme
);

export const createEmptyICPAgentForm = (role = 'sme') => ({
  role,
  focus: '',
  evidence: '',
  objective: '',
  channel: role === 'sme' ? 'multi_channel' : 'instagram',
  location: '',
  notes: '',
});

export const sanitizeICPAgentPayload = (formData = {}, role = 'sme') => {
  const normalizedRole = ICP_AGENT_ROLES[role] ? role : 'sme';
  const roleConfig = getICPAgentRoleConfig(normalizedRole);
  const focus = normalizeText(formData.focus);
  const evidence = normalizeText(formData.evidence);
  const objective = normalizeText(formData.objective);
  const channel = normalizeText(formData.channel);
  const location = normalizeText(formData.location);
  const notes = normalizeText(formData.notes);

  if (!focus) {
    throw new Error(`${roleConfig.focusLabel} wajib diisi.`);
  }

  if (!evidence) {
    throw new Error(`${roleConfig.evidenceLabel} wajib diisi.`);
  }

  if (!objective) {
    throw new Error(`${roleConfig.objectiveLabel} wajib diisi.`);
  }

  if (focus.length > ICP_AGENT_FIELD_LIMITS.focus) {
    throw new Error(`${roleConfig.focusLabel} maksimal ${ICP_AGENT_FIELD_LIMITS.focus} karakter.`);
  }

  if (evidence.length > ICP_AGENT_FIELD_LIMITS.evidence) {
    throw new Error(`${roleConfig.evidenceLabel} maksimal ${ICP_AGENT_FIELD_LIMITS.evidence} karakter.`);
  }

  if (objective.length > ICP_AGENT_FIELD_LIMITS.objective) {
    throw new Error(`${roleConfig.objectiveLabel} maksimal ${ICP_AGENT_FIELD_LIMITS.objective} karakter.`);
  }

  if (location.length > ICP_AGENT_FIELD_LIMITS.location) {
    throw new Error(`Lokasi maksimal ${ICP_AGENT_FIELD_LIMITS.location} karakter.`);
  }

  if (notes.length > ICP_AGENT_FIELD_LIMITS.notes) {
    throw new Error(`Catatan tambahan maksimal ${ICP_AGENT_FIELD_LIMITS.notes} karakter.`);
  }

  if (!ICP_AGENT_CHANNELS.some((item) => item.value === channel)) {
    throw new Error('Channel tidak valid.');
  }

  return {
    role: normalizedRole,
    focus,
    evidence,
    objective,
    channel,
    location: location || null,
    notes: notes || null,
  };
};

const normalizeList = (items = [], fallbackTitle = 'Item') => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeText(item?.title) || `${fallbackTitle} ${index + 1}`,
        description: normalizeText(item?.description || item?.text || item?.insight),
        signal: normalizeText(item?.signal),
        action: normalizeText(item?.action),
      }))
      .filter((item) => item.description || item.signal || item.action)
    : []
);

export const normalizeICPAgentResult = (result = {}) => ({
  title: normalizeText(result.title) || 'Profil Ideal',
  summary: normalizeText(result.summary),
  primary_icp: {
    title: normalizeText(result.primary_icp?.title) || 'ICP Utama',
    description: normalizeText(result.primary_icp?.description),
    demographics: normalizeText(result.primary_icp?.demographics),
    psychographics: normalizeText(result.primary_icp?.psychographics),
    needs: Array.isArray(result.primary_icp?.needs) ? result.primary_icp.needs.map(normalizeText).filter(Boolean) : [],
    buying_triggers: Array.isArray(result.primary_icp?.buying_triggers) ? result.primary_icp.buying_triggers.map(normalizeText).filter(Boolean) : [],
    best_channels: Array.isArray(result.primary_icp?.best_channels) ? result.primary_icp.best_channels.map(normalizeText).filter(Boolean) : [],
  },
  segments: normalizeList(result.segments, 'Segmen'),
  objections: normalizeList(result.objections, 'Keberatan'),
  messaging_angles: normalizeList(result.messaging_angles, 'Pesan'),
  validation_actions: normalizeList(result.validation_actions, 'Validasi'),
  cautions: Array.isArray(result.cautions) ? result.cautions.map(normalizeText).filter(Boolean) : [],
});

export const COMPETITOR_ANALYSIS_ROLES = {
  influencer: {
    label: 'Influencer',
    subjectLabel: 'Profil / Niche Anda',
    subjectPlaceholder: 'contoh: kreator skincare lokal dengan gaya review jujur',
    competitorLabel: 'Kreator / Pembanding',
    competitorPlaceholder: 'contoh: @creatorA fokus edukasi, @creatorB fokus review cepat, @creatorC fokus before-after',
    evidenceLabel: 'Data Konten / Catatan Kompetitor',
    evidencePlaceholder: 'contoh: konten yang sering muncul, hook yang dipakai, format populer, komentar audiens',
    objectiveLabel: 'Tujuan Analisis',
    objectivePlaceholder: 'contoh: menemukan diferensiasi agar lebih menarik untuk brand campaign',
    notesPlaceholder: 'contoh: saya ingin tetap natural dan tidak terlalu hard selling',
  },
  sme: {
    label: 'UMKM',
    subjectLabel: 'Brand / Produk Anda',
    subjectPlaceholder: 'contoh: kopi susu botolan harga menengah untuk anak muda Jakarta',
    competitorLabel: 'Kompetitor / Pembanding',
    competitorPlaceholder: 'contoh: Brand A kuat di harga, Brand B kuat di packaging, Brand C aktif di TikTok',
    evidenceLabel: 'Data Kompetitor / Catatan',
    evidencePlaceholder: 'contoh: harga, promo, pesan iklan, jenis konten, komentar customer, link atau ringkasan website',
    objectiveLabel: 'Tujuan Analisis',
    objectivePlaceholder: 'contoh: menemukan positioning dan angle campaign yang berbeda dari kompetitor',
    notesPlaceholder: 'contoh: budget terbatas, ingin promosi via influencer lokal',
  },
};

export const COMPETITOR_ANALYSIS_CHANNELS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'website', label: 'Website' },
  { value: 'offline', label: 'Offline' },
  { value: 'multi_channel', label: 'Multi Channel' },
];

export const COMPETITOR_ANALYSIS_FIELD_LIMITS = {
  subject: 220,
  competitors: 500,
  evidence: 900,
  objective: 500,
  notes: 600,
};

const normalizeText = (value) => String(value || '').trim();

export const getCompetitorAnalysisRoleConfig = (role) => (
  COMPETITOR_ANALYSIS_ROLES[role] || COMPETITOR_ANALYSIS_ROLES.sme
);

export const createEmptyCompetitorAnalysisForm = (role = 'sme') => ({
  role,
  subject: '',
  competitors: '',
  evidence: '',
  objective: '',
  channel: role === 'sme' ? 'multi_channel' : 'instagram',
  notes: '',
});

export const sanitizeCompetitorAnalysisPayload = (formData = {}, role = 'sme') => {
  const normalizedRole = COMPETITOR_ANALYSIS_ROLES[role] ? role : 'sme';
  const roleConfig = getCompetitorAnalysisRoleConfig(normalizedRole);
  const subject = normalizeText(formData.subject);
  const competitors = normalizeText(formData.competitors);
  const evidence = normalizeText(formData.evidence);
  const objective = normalizeText(formData.objective);
  const channel = normalizeText(formData.channel);
  const notes = normalizeText(formData.notes);

  if (!subject) {
    throw new Error(`${roleConfig.subjectLabel} wajib diisi.`);
  }

  if (!competitors) {
    throw new Error(`${roleConfig.competitorLabel} wajib diisi.`);
  }

  if (!objective) {
    throw new Error(`${roleConfig.objectiveLabel} wajib diisi.`);
  }

  if (subject.length > COMPETITOR_ANALYSIS_FIELD_LIMITS.subject) {
    throw new Error(`${roleConfig.subjectLabel} maksimal ${COMPETITOR_ANALYSIS_FIELD_LIMITS.subject} karakter.`);
  }

  if (competitors.length > COMPETITOR_ANALYSIS_FIELD_LIMITS.competitors) {
    throw new Error(`${roleConfig.competitorLabel} maksimal ${COMPETITOR_ANALYSIS_FIELD_LIMITS.competitors} karakter.`);
  }

  if (evidence.length > COMPETITOR_ANALYSIS_FIELD_LIMITS.evidence) {
    throw new Error(`${roleConfig.evidenceLabel} maksimal ${COMPETITOR_ANALYSIS_FIELD_LIMITS.evidence} karakter.`);
  }

  if (objective.length > COMPETITOR_ANALYSIS_FIELD_LIMITS.objective) {
    throw new Error(`${roleConfig.objectiveLabel} maksimal ${COMPETITOR_ANALYSIS_FIELD_LIMITS.objective} karakter.`);
  }

  if (notes.length > COMPETITOR_ANALYSIS_FIELD_LIMITS.notes) {
    throw new Error(`Catatan tambahan maksimal ${COMPETITOR_ANALYSIS_FIELD_LIMITS.notes} karakter.`);
  }

  if (!COMPETITOR_ANALYSIS_CHANNELS.some((item) => item.value === channel)) {
    throw new Error('Channel tidak valid.');
  }

  return {
    role: normalizedRole,
    subject,
    competitors,
    evidence: evidence || null,
    objective,
    channel,
    notes: notes || null,
  };
};

const normalizeList = (items = [], fallbackTitle = 'Item') => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        title: normalizeText(item?.title) || `${fallbackTitle} ${index + 1}`,
        description: normalizeText(item?.description || item?.text || item?.insight),
        positioning: normalizeText(item?.positioning),
        offer: normalizeText(item?.offer),
        messaging: normalizeText(item?.messaging),
        weakness: normalizeText(item?.weakness),
        opportunity: normalizeText(item?.opportunity),
        proof_point: normalizeText(item?.proof_point),
        format: normalizeText(item?.format),
        priority: normalizeText(item?.priority),
        action: normalizeText(item?.action),
      }))
      .filter((item) => (
        item.description
        || item.positioning
        || item.offer
        || item.messaging
        || item.opportunity
        || item.action
      ))
    : []
);

export const normalizeCompetitorAnalysisResult = (result = {}) => ({
  title: normalizeText(result.title) || 'Analisis Kompetitor',
  summary: normalizeText(result.summary),
  competitors: normalizeList(result.competitors, 'Kompetitor'),
  gaps: normalizeList(result.gaps, 'Gap'),
  differentiation: normalizeList(result.differentiation, 'Diferensiasi'),
  content_opportunities: normalizeList(result.content_opportunities, 'Peluang Konten'),
  recommended_actions: normalizeList(result.recommended_actions, 'Aksi'),
  cautions: Array.isArray(result.cautions) ? result.cautions.map(normalizeText).filter(Boolean) : [],
});

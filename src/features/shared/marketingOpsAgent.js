export const MARKETING_OPS_WORKFLOWS = [
  { value: 'campaign_launch', label: 'Peluncuran Promosi' },
  { value: 'influencer_collaboration', label: 'Kolaborasi Influencer' },
  { value: 'content_calendar', label: 'Kalender Konten' },
  { value: 'performance_report', label: 'Laporan Performa' },
];

export const MARKETING_OPS_CHANNELS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'paid_ads', label: 'Iklan Berbayar' },
  { value: 'multi_channel', label: 'Multi-channel' },
];

export const MARKETING_OPS_CADENCES = [
  { value: 'daily', label: 'Check-in Harian' },
  { value: 'weekly', label: 'Review Mingguan' },
  { value: 'launch_week', label: 'Sprint Minggu Peluncuran' },
  { value: 'custom', label: 'Ritme Khusus' },
];

export const MARKETING_OPS_FIELD_LIMITS = {
  campaignName: 200,
  objective: 500,
  audience: 350,
  assets: 700,
  metrics: 500,
  notes: 700,
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeText = (value) => String(value || '').trim();

const isOptionValue = (options, value) => options.some((item) => item.value === value);

const isValidDate = (dateText) => {
  if (!DATE_PATTERN.test(dateText)) return false;
  const date = new Date(`${dateText}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateText;
};

const toIsoDate = (date) => date.toISOString().slice(0, 10);

export const createEmptyMarketingOpsForm = () => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 14);

  return {
    role: 'sme',
    campaign_name: '',
    workflow: 'campaign_launch',
    primary_channel: 'multi_channel',
    cadence: 'launch_week',
    start_date: toIsoDate(startDate),
    end_date: toIsoDate(endDate),
    objective: '',
    audience: '',
    assets: '',
    metrics: '',
    notes: '',
  };
};

export const sanitizeMarketingOpsPayload = (formData = {}) => {
  const campaignName = normalizeText(formData.campaign_name);
  const workflow = normalizeText(formData.workflow);
  const primaryChannel = normalizeText(formData.primary_channel);
  const cadence = normalizeText(formData.cadence);
  const startDate = normalizeText(formData.start_date);
  const endDate = normalizeText(formData.end_date);
  const objective = normalizeText(formData.objective);
  const audience = normalizeText(formData.audience);
  const assets = normalizeText(formData.assets);
  const metrics = normalizeText(formData.metrics);
  const notes = normalizeText(formData.notes);

  if (!campaignName) {
    throw new Error('Nama promosi wajib diisi.');
  }

  if (!objective) {
    throw new Error('Tujuan promosi wajib diisi.');
  }

  if (!audience) {
    throw new Error('Target audiens wajib diisi.');
  }

  if (campaignName.length > MARKETING_OPS_FIELD_LIMITS.campaignName) {
    throw new Error(`Nama promosi maksimal ${MARKETING_OPS_FIELD_LIMITS.campaignName} karakter.`);
  }

  if (objective.length > MARKETING_OPS_FIELD_LIMITS.objective) {
    throw new Error(`Tujuan promosi maksimal ${MARKETING_OPS_FIELD_LIMITS.objective} karakter.`);
  }

  if (audience.length > MARKETING_OPS_FIELD_LIMITS.audience) {
    throw new Error(`Target audiens maksimal ${MARKETING_OPS_FIELD_LIMITS.audience} karakter.`);
  }

  if (assets.length > MARKETING_OPS_FIELD_LIMITS.assets) {
    throw new Error(`Kebutuhan aset maksimal ${MARKETING_OPS_FIELD_LIMITS.assets} karakter.`);
  }

  if (metrics.length > MARKETING_OPS_FIELD_LIMITS.metrics) {
    throw new Error(`Target metrik maksimal ${MARKETING_OPS_FIELD_LIMITS.metrics} karakter.`);
  }

  if (notes.length > MARKETING_OPS_FIELD_LIMITS.notes) {
    throw new Error(`Catatan tambahan maksimal ${MARKETING_OPS_FIELD_LIMITS.notes} karakter.`);
  }

  if (!isOptionValue(MARKETING_OPS_WORKFLOWS, workflow)) {
    throw new Error('Alur kerja promosi tidak valid.');
  }

  if (!isOptionValue(MARKETING_OPS_CHANNELS, primaryChannel)) {
    throw new Error('Channel utama tidak valid.');
  }

  if (!isOptionValue(MARKETING_OPS_CADENCES, cadence)) {
    throw new Error('Ritme kerja tidak valid.');
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Tanggal promosi harus memakai format YYYY-MM-DD.');
  }

  if (new Date(`${endDate}T00:00:00Z`) < new Date(`${startDate}T00:00:00Z`)) {
    throw new Error('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
  }

  return {
    role: 'sme',
    campaign_name: campaignName,
    workflow,
    primary_channel: primaryChannel,
    cadence,
    start_date: startDate,
    end_date: endDate,
    objective,
    audience,
    assets: assets || null,
    metrics: metrics || null,
    notes: notes || null,
  };
};

const normalizeList = (items = []) => (
  Array.isArray(items) ? items.map(normalizeText).filter(Boolean) : []
);

const normalizeCalendar = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        date: normalizeText(item?.date),
        phase: normalizeText(item?.phase) || `Fase ${index + 1}`,
        focus: normalizeText(item?.focus),
        tasks: normalizeList(item?.tasks),
        owner: normalizeText(item?.owner),
        channel: normalizeText(item?.channel),
        dependency: normalizeText(item?.dependency),
      }))
      .filter((item) => item.date || item.focus || item.tasks.length > 0)
    : []
);

const normalizeChecklist = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        task: normalizeText(item?.task),
        owner: normalizeText(item?.owner),
        due_date: normalizeText(item?.due_date),
        priority: normalizeText(item?.priority),
        status: normalizeText(item?.status),
      }))
      .filter((item) => item.task)
    : []
);

const normalizeAssets = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        asset: normalizeText(item?.asset),
        purpose: normalizeText(item?.purpose),
        format: normalizeText(item?.format),
        owner: normalizeText(item?.owner),
        due_date: normalizeText(item?.due_date),
      }))
      .filter((item) => item.asset || item.purpose)
    : []
);

const normalizeMetrics = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        metric: normalizeText(item?.metric),
        target: normalizeText(item?.target),
        tracking_method: normalizeText(item?.tracking_method),
        review_frequency: normalizeText(item?.review_frequency),
      }))
      .filter((item) => item.metric || item.target)
    : []
);

const normalizeReportOutline = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        section: normalizeText(item?.section),
        insight: normalizeText(item?.insight),
        action: normalizeText(item?.action),
      }))
      .filter((item) => item.section || item.insight || item.action)
    : []
);

const normalizeRisks = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item) => ({
        risk: normalizeText(item?.risk),
        mitigation: normalizeText(item?.mitigation),
      }))
      .filter((item) => item.risk || item.mitigation)
    : []
);

export const normalizeMarketingOpsResult = (result = {}) => {
  const operatingPlan = result.operating_plan || {};

  return {
    title: normalizeText(result.title) || 'Rencana Operasional Marketing UMKM',
    summary: normalizeText(result.summary),
    operating_plan: {
      workflow: normalizeText(operatingPlan.workflow),
      cadence: normalizeText(operatingPlan.cadence),
      primary_channel: normalizeText(operatingPlan.primary_channel),
      launch_window: normalizeText(operatingPlan.launch_window),
      success_definition: normalizeText(operatingPlan.success_definition),
    },
    calendar: normalizeCalendar(result.calendar),
    publish_checklist: normalizeChecklist(result.publish_checklist),
    asset_tracker: normalizeAssets(result.asset_tracker),
    metrics_tracker: normalizeMetrics(result.metrics_tracker),
    report_outline: normalizeReportOutline(result.report_outline),
    risks: normalizeRisks(result.risks),
    next_steps: normalizeList(result.next_steps),
  };
};

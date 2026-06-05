export const PRICING_PACKAGE_TYPES = [
  {
    value: 'instagram_story',
    label: '1 Instagram Story',
    defaultTitle: '1 Instagram Story',
    deliverables: ['1x Instagram Story', 'Mention brand', 'Link sticker'],
  },
  {
    value: 'feed_post',
    label: '1 Feed Post',
    defaultTitle: '1 Feed Post',
    deliverables: ['1x Feed Post', 'Caption campaign', 'Tag brand'],
  },
  {
    value: 'reels',
    label: '1 Reels',
    defaultTitle: '1 Reels',
    deliverables: ['1x Instagram Reels', 'Caption campaign', 'Tag brand'],
  },
  {
    value: 'story_reels',
    label: 'Paket Story + Reels',
    defaultTitle: 'Paket Story + Reels',
    deliverables: ['1x Instagram Story', '1x Instagram Reels', 'Tag brand'],
  },
  {
    value: 'tiktok_video',
    label: 'Paket TikTok Video',
    defaultTitle: 'Paket TikTok Video',
    deliverables: ['1x TikTok Video', 'Caption campaign', 'Tag brand'],
  },
  {
    value: 'custom',
    label: 'Paket Custom',
    defaultTitle: 'Paket Custom',
    deliverables: ['Deliverable sesuai brief'],
  },
];

export const getPricingPackageType = (value) => (
  PRICING_PACKAGE_TYPES.find((type) => type.value === value)
  || PRICING_PACKAGE_TYPES[PRICING_PACKAGE_TYPES.length - 1]
);

export const getPricingPackageTypeLabel = (value) => getPricingPackageType(value).label;

export const formatPackageCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Number(value || 0));

const normalizeDeliverables = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
};

export const deliverablesToText = (deliverables = []) => (
  normalizeDeliverables(deliverables).join('\n')
);

export const createEmptyPricingPackageForm = (packageTypeValue = 'instagram_story') => {
  const packageType = getPricingPackageType(packageTypeValue);

  return {
    title: packageType.defaultTitle,
    description: '',
    package_type: packageType.value,
    deliverablesText: deliverablesToText(packageType.deliverables),
    price: '',
    delivery_days: 3,
    revision_count: 1,
    is_public: true,
    is_featured: false,
  };
};

export const toPricingPackageForm = (item = {}) => ({
  title: item.title || getPricingPackageType(item.package_type).defaultTitle,
  description: item.description || '',
  package_type: item.package_type || 'custom',
  deliverablesText: deliverablesToText(item.deliverables || []),
  price: item.price ?? '',
  delivery_days: item.delivery_days ?? 3,
  revision_count: item.revision_count ?? 1,
  is_public: item.is_public !== false,
  is_featured: Boolean(item.is_featured),
});

export const createPackageSnapshot = (item = {}) => ({
  id: item.id,
  title: item.title,
  package_type: item.package_type,
  deliverables: normalizeDeliverables(item.deliverables || []),
  price: Number(item.price || 0),
  delivery_days: Number(item.delivery_days || 0),
  revision_count: Number(item.revision_count || 0),
});

export const sanitizePricingPackagePayload = (formData, influencerId) => {
  const title = String(formData.title || '').trim();
  const description = String(formData.description || '').trim();
  const packageType = String(formData.package_type || 'custom').trim();
  const price = Number(formData.price);
  const deliveryDays = Number(formData.delivery_days);
  const revisionCount = Number(formData.revision_count);
  const deliverables = normalizeDeliverables(formData.deliverablesText || formData.deliverables);

  if (!influencerId) {
    throw new Error('Profil influencer belum siap. Lengkapi profil terlebih dahulu.');
  }

  if (!title) {
    throw new Error('Nama paket wajib diisi.');
  }

  if (title.length > 120) {
    throw new Error('Nama paket maksimal 120 karakter.');
  }

  if (description.length > 700) {
    throw new Error('Deskripsi paket maksimal 700 karakter.');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Harga paket harus berupa angka positif.');
  }

  if (!Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 90) {
    throw new Error('Estimasi pengerjaan harus antara 1 sampai 90 hari.');
  }

  if (!Number.isInteger(revisionCount) || revisionCount < 0 || revisionCount > 10) {
    throw new Error('Jumlah revisi harus antara 0 sampai 10.');
  }

  if (deliverables.length === 0) {
    throw new Error('Minimal tambahkan satu deliverable paket.');
  }

  if (deliverables.some((item) => item.length > 120)) {
    throw new Error('Setiap deliverable maksimal 120 karakter.');
  }

  return {
    influencer_id: influencerId,
    title,
    description: description || null,
    package_type: PRICING_PACKAGE_TYPES.some((type) => type.value === packageType) ? packageType : 'custom',
    deliverables,
    price,
    delivery_days: deliveryDays,
    revision_count: revisionCount,
    is_public: Boolean(formData.is_public),
    is_featured: Boolean(formData.is_featured),
  };
};

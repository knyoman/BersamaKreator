import { normalizeOptionalHttpsUrl } from '../../utils/urlValidation';

export const PORTFOLIO_CONTENT_TYPES = [
  { value: 'instagram_post', label: 'Instagram Post' },
  { value: 'instagram_reel', label: 'Instagram Reels' },
  { value: 'tiktok_video', label: 'TikTok Video' },
  { value: 'youtube_video', label: 'YouTube Video' },
  { value: 'brand_campaign', label: 'Brand Campaign' },
  { value: 'other', label: 'Lainnya' },
];

export const getPortfolioContentTypeLabel = (value) => (
  PORTFOLIO_CONTENT_TYPES.find((type) => type.value === value)?.label || 'Lainnya'
);

export const createEmptyPortfolioForm = () => ({
  title: '',
  description: '',
  content_type: 'instagram_post',
  brand_name: '',
  content_url: '',
  thumbnail_url: '',
  published_at: '',
  is_public: true,
});

export const toPortfolioForm = (item = {}) => ({
  title: item.title || '',
  description: item.description || '',
  content_type: item.content_type || 'instagram_post',
  brand_name: item.brand_name || '',
  content_url: item.content_url || '',
  thumbnail_url: item.thumbnail_url || '',
  published_at: item.published_at || '',
  is_public: item.is_public !== false,
});

export const sanitizePortfolioPayload = (formData, influencerId) => {
  const title = String(formData.title || '').trim();
  const description = String(formData.description || '').trim();
  const brandName = String(formData.brand_name || '').trim();
  const contentType = String(formData.content_type || 'other').trim();

  if (!influencerId) {
    throw new Error('Profil influencer belum siap. Lengkapi profil terlebih dahulu.');
  }

  if (!title) {
    throw new Error('Judul portfolio wajib diisi.');
  }

  if (title.length > 120) {
    throw new Error('Judul portfolio maksimal 120 karakter.');
  }

  if (description.length > 1000) {
    throw new Error('Deskripsi portfolio maksimal 1000 karakter.');
  }

  if (brandName.length > 80) {
    throw new Error('Nama brand maksimal 80 karakter.');
  }

  return {
    influencer_id: influencerId,
    title,
    description: description || null,
    content_type: PORTFOLIO_CONTENT_TYPES.some((type) => type.value === contentType) ? contentType : 'other',
    brand_name: brandName || null,
    content_url: normalizeOptionalHttpsUrl(formData.content_url, { label: 'Link karya' }) || null,
    thumbnail_url: normalizeOptionalHttpsUrl(formData.thumbnail_url, { label: 'Thumbnail portfolio' }) || null,
    published_at: formData.published_at || null,
    is_public: Boolean(formData.is_public),
  };
};

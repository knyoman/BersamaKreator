const hasText = (value) => String(value || '').trim().length > 0;

const hasPositiveNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0;
};

const hasAnySocialLink = (profile) => (
  hasText(profile?.instagram_url)
  || hasText(profile?.tiktok_url)
  || hasText(profile?.youtube_url)
);

export const INFLUENCER_PROFILE_CHECKLIST = [
  {
    id: 'name',
    label: 'Nama lengkap',
    description: 'Nama yang jelas membuat UMKM lebih mudah mengenali Anda.',
    isComplete: (profile) => hasText(profile?.name),
  },
  {
    id: 'username',
    label: 'Username publik',
    description: 'Username dipakai sebagai alamat profil dan identitas kreator.',
    isComplete: (profile) => hasText(profile?.username),
  },
  {
    id: 'profile_image',
    label: 'Foto profil',
    description: 'Foto profesional membantu profil terlihat lebih tepercaya.',
    isComplete: (profile) => hasText(profile?.profile_image),
  },
  {
    id: 'niche',
    label: 'Niche konten',
    description: 'Niche membantu sistem dan UMKM mencocokkan campaign yang relevan.',
    isComplete: (profile) => hasText(profile?.niche),
  },
  {
    id: 'bio',
    label: 'Bio singkat',
    description: 'Ceritakan gaya konten, audiens, dan keunggulan Anda.',
    isComplete: (profile) => hasText(profile?.bio),
  },
  {
    id: 'price_per_post',
    label: 'Harga per posting',
    description: 'Rate yang jelas mempercepat proses negosiasi campaign.',
    isComplete: (profile) => hasPositiveNumber(profile?.price_per_post),
  },
  {
    id: 'social_links',
    label: 'Minimal satu link sosial',
    description: 'Tambahkan Instagram, TikTok, atau YouTube agar UMKM bisa menilai karya Anda.',
    isComplete: hasAnySocialLink,
  },
];

export const getInfluencerProfileCompletion = (profile = {}) => {
  const items = INFLUENCER_PROFILE_CHECKLIST.map((item) => ({
    ...item,
    isCompleted: item.isComplete(profile),
  }));

  const completedCount = items.filter((item) => item.isCompleted).length;
  const totalCount = items.length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const nextItem = items.find((item) => !item.isCompleted) || null;

  const statusLabel = percentage >= 100
    ? 'Profil siap tampil'
    : percentage >= 70
      ? 'Hampir lengkap'
      : 'Perlu dilengkapi';

  return {
    items,
    completedCount,
    totalCount,
    percentage,
    nextItem,
    statusLabel,
  };
};

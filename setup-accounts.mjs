/**
 * BersamaKreator - Setup Accounts
 *
 * Required env:
 * - VITE_SUPABASE_URL or SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 * - SEED_SME_EMAIL / SEED_SME_PASSWORD
 * - SEED_INFLUENCER_EMAIL / SEED_INFLUENCER_PASSWORD
 *
 * Optional env:
 * - SEED_ADMIN_NAME
 * - SEED_SME_NAME
 * - SEED_INFLUENCER_NAME
 * - SEED_INFLUENCER_USERNAME
 *
 * Run: node setup-accounts.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} wajib diisi.`);
  }

  return value;
};

const optionalEnv = (key, fallback) => process.env[key] || fallback;

const supabaseUrl = process.env.SUPABASE_URL || requiredEnv('VITE_SUPABASE_URL');
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mainAccounts = [
  {
    label: 'Admin',
    email: requiredEnv('SEED_ADMIN_EMAIL'),
    password: requiredEnv('SEED_ADMIN_PASSWORD'),
    userData: {
      name: optionalEnv('SEED_ADMIN_NAME', 'Admin BersamaKreator'),
      user_type: 'admin',
      role: 'admin',
    },
  },
  {
    label: 'UMKM',
    email: requiredEnv('SEED_SME_EMAIL'),
    password: requiredEnv('SEED_SME_PASSWORD'),
    userData: {
      name: optionalEnv('SEED_SME_NAME', 'Toko Maju Jaya'),
      user_type: 'sme',
      role: 'user',
    },
  },
  {
    label: 'Influencer',
    email: requiredEnv('SEED_INFLUENCER_EMAIL'),
    password: requiredEnv('SEED_INFLUENCER_PASSWORD'),
    userData: {
      name: optionalEnv('SEED_INFLUENCER_NAME', 'Sarah Ayu'),
      user_type: 'influencer',
      role: 'user',
    },
    influencerData: {
      username: optionalEnv('SEED_INFLUENCER_USERNAME', 'sarahayu'),
      niche: 'Beauty & Skincare',
      bio: 'Beauty content creator dari Jakarta. Sharing daily skincare routine, makeup tutorial, dan honest review produk kecantikan lokal.',
      price_per_post: 500000,
      followers_count: 25000,
      engagement_rate: 4.8,
      rating_average: 4.7,
      total_orders: 12,
      instagram_url: 'https://instagram.com/sarahayu',
      tiktok_url: 'https://tiktok.com/@sarahayu',
      youtube_url: '',
      is_verified: true,
    },
  },
];

const sampleInfluencers = [
  {
    name: 'Budi Santoso',
    username: 'budifoodie',
    niche: 'Food & Culinary',
    bio: 'Food explorer Jakarta. Review jujur warung lokal sampai restoran fine dining.',
    price_per_post: 350000,
    followers_count: 18500,
    engagement_rate: 5.2,
    rating_average: 4.5,
    total_orders: 8,
    instagram_url: 'https://instagram.com/budifoodie',
    tiktok_url: 'https://tiktok.com/@budifoodie',
    youtube_url: 'https://youtube.com/@budifoodie',
    is_verified: true,
  },
  {
    name: 'Dian Pratama',
    username: 'diantech',
    niche: 'Technology & Gadget',
    bio: 'Tech reviewer dan gadget enthusiast untuk unboxing, review, dan tips teknologi.',
    price_per_post: 750000,
    followers_count: 42000,
    engagement_rate: 3.9,
    rating_average: 4.8,
    total_orders: 15,
    instagram_url: 'https://instagram.com/diantech',
    tiktok_url: 'https://tiktok.com/@diantech',
    youtube_url: 'https://youtube.com/@diantech',
    is_verified: true,
  },
  {
    name: 'Maya Putri',
    username: 'mayaputri.style',
    niche: 'Fashion & Lifestyle',
    bio: 'Fashion enthusiast dan lifestyle blogger dengan inspirasi outfit budget-friendly.',
    price_per_post: 400000,
    followers_count: 31000,
    engagement_rate: 6.1,
    rating_average: 4.6,
    total_orders: 10,
    instagram_url: 'https://instagram.com/mayaputri.style',
    tiktok_url: 'https://tiktok.com/@mayaputri.style',
    youtube_url: '',
    is_verified: true,
  },
  {
    name: 'Rizky Wanderer',
    username: 'rizkywanderer',
    niche: 'Travel',
    bio: 'Travel creator yang membahas hidden gems Indonesia dan tips backpacking hemat.',
    price_per_post: 600000,
    followers_count: 55000,
    engagement_rate: 4.3,
    rating_average: 4.9,
    total_orders: 20,
    instagram_url: 'https://instagram.com/rizkywanderer',
    tiktok_url: 'https://tiktok.com/@rizkywanderer',
    youtube_url: 'https://youtube.com/@rizkywanderer',
    is_verified: true,
  },
  {
    name: 'Fitri Sehat',
    username: 'fitrisehat',
    niche: 'Health & Fitness',
    bio: 'Personal trainer dan nutrition coach untuk home workout dan meal prep.',
    price_per_post: 450000,
    followers_count: 28000,
    engagement_rate: 5.5,
    rating_average: 4.4,
    total_orders: 6,
    instagram_url: 'https://instagram.com/fitrisehat',
    tiktok_url: 'https://tiktok.com/@fitrisehat',
    youtube_url: '',
    is_verified: false,
  },
];

const findAuthUserByEmail = async (email) => {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 100) return null;
  }

  return null;
};

const createAuthAccount = async ({ email, password }) => {
  const existingUser = await findAuthUserByEmail(email);
  if (existingUser) return existingUser.id;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
      const user = await findAuthUserByEmail(email);
      if (user) return user.id;
    }

    throw authError;
  }

  if (!authData.user?.id) {
    throw new Error('Supabase tidak mengembalikan user id.');
  }

  return authData.user.id;
};

const upsertUserProfile = async (userId, email, userData) => {
  const { error } = await supabase.from('users').upsert([{
    id: userId,
    name: userData.name,
    email,
    password: '***supabase-auth***',
    role: userData.role || 'user',
    user_type: userData.user_type,
    is_active: true,
  }], { onConflict: 'id' });

  if (error) throw error;
};

const upsertInfluencerProfile = async (userId, influencerData) => {
  if (!influencerData) return;

  const { error } = await supabase.from('influencers').upsert([{
    user_id: userId,
    ...influencerData,
  }], { onConflict: 'user_id' });

  if (error) throw error;
};

const createMainAccount = async (account, index) => {
  console.log(`\n[${index + 1}/${mainAccounts.length}] Membuat akun ${account.label}`);

  try {
    const userId = await createAuthAccount(account);
    await upsertUserProfile(userId, account.email, account.userData);
    await upsertInfluencerProfile(userId, account.influencerData);
    console.log('  OK');
  } catch (error) {
    console.log(`  Gagal: ${error.message}`);
  }
};

const createSampleInfluencers = async () => {
  console.log('\nMembuat sample influencer publik...');

  for (const influencer of sampleInfluencers) {
    try {
      const email = `sample.${influencer.username}@example.com`;
      const password = `Sample-${randomUUID()}!`;
      const userId = await createAuthAccount({ email, password });

      await upsertUserProfile(userId, email, {
        name: influencer.name,
        user_type: 'influencer',
        role: 'user',
      });
      await upsertInfluencerProfile(userId, influencer);
      console.log(`  OK: @${influencer.username}`);
    } catch (error) {
      console.log(`  Lewati @${influencer.username}: ${error.message}`);
    }
  }
};

const main = async () => {
  console.log('BersamaKreator - Account Setup');
  console.log('Menghubungkan ke Supabase...');

  const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
  if (error) {
    throw new Error(`Koneksi atau tabel users bermasalah: ${error.message}`);
  }

  console.log('Koneksi berhasil.');

  for (let index = 0; index < mainAccounts.length; index += 1) {
    if (index > 0) await sleep(4000);
    await createMainAccount(mainAccounts[index], index);
  }

  await sleep(3000);
  await createSampleInfluencers();

  console.log('\nSetup selesai. Akun utama diambil dari environment variable SEED_*.');
  console.log('Password tidak ditampilkan di terminal.');
};

main().catch((error) => {
  console.error('Fatal:', error.message);
  process.exit(1);
});

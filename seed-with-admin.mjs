import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} wajib diisi di environment lokal.`);
  return value;
};

const optionalEnv = (key) => process.env[key] || null;

const SUPABASE_URL = requiredEnv('SUPABASE_URL');
const SERVICE_KEY = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

const seedAccounts = {
  admin: {
    email: requiredEnv('SEED_ADMIN_EMAIL'),
    password: requiredEnv('SEED_ADMIN_PASSWORD'),
    name: optionalEnv('SEED_ADMIN_NAME') || 'Admin BersamaKreator',
  },
  sme: {
    email: requiredEnv('SEED_SME_EMAIL'),
    password: requiredEnv('SEED_SME_PASSWORD'),
    name: optionalEnv('SEED_SME_NAME') || 'Toko Maju Jaya',
  },
  influencer: {
    email: requiredEnv('SEED_INFLUENCER_EMAIL'),
    password: requiredEnv('SEED_INFLUENCER_PASSWORD'),
    name: optionalEnv('SEED_INFLUENCER_NAME') || 'Sarah Ayu',
  },
};

// Initialize with Service Role Key (Bypasses RLS, can use admin API)
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const niches = ['Fashion & Lifestyle', 'Beauty & Skincare', 'Food & Culinary', 'Technology & Gadget', 'Travel', 'Health & Fitness', 'Gaming', 'Parenting'];
const firstNames = ['Budi', 'Andi', 'Siti', 'Dewi', 'Ayu', 'Rizky', 'Putra', 'Putri', 'Dian', 'Reza', 'Maya', 'Rina', 'Fajar', 'Tari', 'Eka', 'Dwi', 'Tri', 'Bayu', 'Indra', 'Fitri', 'Nina', 'Ari', 'Bagas', 'Rini', 'Siska', 'Adit', 'Gilang', 'Citra', 'Nadia', 'Sarah'];
const lastNames = ['Santoso', 'Pratama', 'Wijaya', 'Kusuma', 'Saputra', 'Sari', 'Wahyuni', 'Lestari', 'Setiawan', 'Nugroho', 'Hidayat', 'Siregar', 'Harahap', 'Wibowo', 'Putra', 'Ramadhan', 'Utami', 'Pertiwi', 'Gunawan', 'Haryanto'];
const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali', 'Medan', 'Semarang', 'Makassar', 'Malang', 'Palembang'];

function getRandomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function createRandomPassword() {
  return `Bk${randomUUID().replace(/-/g, '').slice(0, 14)}!`;
}

async function createAdminUser(email, password, name, role, type) {
  // 1. Create Auth User
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // bypass email confirmation
  });

  if (authErr) {
    if (authErr.message.includes('already exists')) {
      console.log(`⚠️ User ${email} already exists in auth.`);
      // Try to fetch ID
      const { data } = await supabase.from('users').select('id').eq('email', email).single();
      return data?.id || null;
    }
    console.error(`❌ Error creating auth ${email}:`, authErr.message);
    return null;
  }

  const userId = authData.user.id;

  // 2. Insert into public.users
  const { error: dbErr } = await supabase.from('users').insert({
    id: userId,
    name: name,
    email: email,
    role: role,
    user_type: type,
    is_active: true
  });

  if (dbErr) {
    console.error(`❌ Error inserting public.users ${email}:`, dbErr.message);
  } else {
    console.log(`✅ Created public user: ${email}`);
  }

  return userId;
}

async function runSeeder() {
  console.log('🚀 Memulai proses seeding data dengan Service Role...');

  // --- 1. CREATE MAIN ACCOUNTS ---
  console.log('\n=== Membuat 3 Akun Utama ===');
  
  // Admin
  await createAdminUser(seedAccounts.admin.email, seedAccounts.admin.password, seedAccounts.admin.name, 'admin', 'admin');
  
  // SME
  await createAdminUser(seedAccounts.sme.email, seedAccounts.sme.password, seedAccounts.sme.name, 'user', 'sme');
  
  // Influencer Utama
  const inf1Id = await createAdminUser(seedAccounts.influencer.email, seedAccounts.influencer.password, seedAccounts.influencer.name, 'user', 'influencer');
  if (inf1Id) {
    await supabase.from('influencers').insert({
      user_id: inf1Id,
      username: 'sarahayu_official',
      niche: 'Fashion & Lifestyle',
      bio: 'Fashion enthusiast based in Bali. Open for collabs!',
      price_per_post: 500000,
      followers_count: 25000,
      engagement_rate: 4.5,
      rating_average: 4.8,
      is_verified: true
    });
  }

  // --- 2. CREATE 50 INFLUENCERS ---
  console.log('\n=== Membuat 50 Akun Influencer ===');
  
  let successCount = 0;
  for (let i = 1; i <= 50; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${getRandomInt(10, 999)}`;
    const email = `inf_${i}_${username}@example.com`;
    const password = createRandomPassword();
    
    // Create User via Admin API
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (authErr) {
      console.log(`⚠️ Skip ${i}: ${authErr.message}`);
      continue;
    }

    const userId = authData.user.id;
    const city = getRandomItem(cities);
    const niche = getRandomItem(niches);
    const price = getRandomInt(1, 50) * 50000;
    const followers = getRandomInt(5, 500) * 1000;
    const engagement = (Math.random() * 8 + 1).toFixed(2);
    const rating = (Math.random() * 1.5 + 3.5).toFixed(2);
    
    // Insert into users
    await supabase.from('users').insert({
      id: userId,
      name: fullName,
      email: email,
      role: 'user',
      user_type: 'influencer',
      is_active: true
    });

    // Insert into influencers
    await supabase.from('influencers').insert({
      user_id: userId,
      username: username,
      niche: niche,
      bio: `Content creator dari ${city} yang fokus pada ${niche}. Let's collaborate! 🚀`,
      price_per_post: price,
      followers_count: followers,
      engagement_rate: parseFloat(engagement),
      rating_average: parseFloat(rating),
      instagram_url: `https://instagram.com/${username}`,
      tiktok_url: `https://tiktok.com/@${username}`,
      youtube_url: Math.random() > 0.5 ? `https://youtube.com/@${username}` : null,
      is_verified: Math.random() > 0.7
    });

    successCount++;
    process.stdout.write(`\rProgress: ${successCount}/50 influencers created...`);
  }

  console.log('\n\n✅ SEEDING SELESAI!');
  console.log('====================================');
  console.log('Akun utama dibuat dari environment variable SEED_*.');
  console.log('Password tidak ditampilkan untuk menjaga keamanan.');
  console.log('====================================');
}

runSeeder();

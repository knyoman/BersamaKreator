import fs from 'fs';
import crypto from 'crypto';

const niches = ['Fashion & Lifestyle', 'Beauty & Skincare', 'Food & Culinary', 'Technology & Gadget', 'Travel', 'Health & Fitness', 'Gaming', 'Parenting'];
const firstNames = ['Budi', 'Andi', 'Siti', 'Dewi', 'Ayu', 'Rizky', 'Putra', 'Putri', 'Dian', 'Reza', 'Maya', 'Rina', 'Fajar', 'Tari', 'Eka', 'Dwi', 'Tri', 'Bayu', 'Indra', 'Fitri', 'Nina', 'Ari', 'Bagas', 'Rini', 'Siska', 'Adit', 'Gilang', 'Citra', 'Nadia', 'Sarah'];
const lastNames = ['Santoso', 'Pratama', 'Wijaya', 'Kusuma', 'Saputra', 'Sari', 'Wahyuni', 'Lestari', 'Setiawan', 'Nugroho', 'Hidayat', 'Siregar', 'Harahap', 'Wibowo', 'Putra', 'Ramadhan', 'Utami', 'Pertiwi', 'Gunawan', 'Haryanto'];
const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali', 'Medan', 'Semarang', 'Makassar', 'Malang', 'Palembang'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let sql = `-- =============================================\n`;
sql += `-- SEED DATA: 50 INFLUENCER INDONESIA\n`;
sql += `-- =============================================\n\n`;

const users = [];
const influencers = [];

for (let i = 1; i <= 50; i++) {
  const id = crypto.randomUUID();
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  const fullName = `${firstName} ${lastName}`;
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${getRandomInt(10, 99)}`;
  const email = `${username}@example.com`;
  const niche = getRandomItem(niches);
  const city = getRandomItem(cities);
  
  const price = getRandomInt(1, 50) * 50000; // 50k to 2.5m
  const followers = getRandomInt(5, 500) * 1000; // 5k to 500k
  const engagement = (Math.random() * 8 + 1).toFixed(2); // 1.00 to 9.00
  const rating = (Math.random() * 1.5 + 3.5).toFixed(2); // 3.50 to 5.00
  const orders = getRandomInt(0, 50);
  
  users.push(`('${id}', '${fullName.replace(/'/g, "''")}', '${email}', '***seed-data***', 'user', 'influencer', true, now())`);
  
  const bio = `Content creator dari ${city} yang fokus pada ${niche}. Let's collaborate! 🚀`;
  
  influencers.push(`('${id}', '${username}', '${niche}', '${bio}', ${price}, ${followers}, ${engagement}, ${rating}, ${orders}, 'https://instagram.com/${username}', 'https://tiktok.com/@${username}', ${Math.random() > 0.5 ? "'https://youtube.com/@" + username + "'" : 'NULL'}, ${Math.random() > 0.7}, now())`);
}

// Generate chunks of 10 to avoid too long statements
sql += `-- 1. INSERT USERS\n`;
for (let i = 0; i < users.length; i += 10) {
  const chunk = users.slice(i, i + 10).join(',\n  ');
  sql += `INSERT INTO public.users (id, name, email, password, role, user_type, is_active, created_at)\nVALUES\n  ${chunk}\nON CONFLICT (email) DO NOTHING;\n\n`;
}

sql += `-- 2. INSERT INFLUENCERS\n`;
for (let i = 0; i < influencers.length; i += 10) {
  const chunk = influencers.slice(i, i + 10).join(',\n  ');
  sql += `INSERT INTO public.influencers (user_id, username, niche, bio, price_per_post, followers_count, engagement_rate, rating_average, total_orders, instagram_url, tiktok_url, youtube_url, is_verified, created_at)\nVALUES\n  ${chunk}\nON CONFLICT (username) DO NOTHING;\n\n`;
}

fs.writeFileSync('seed_50_influencers.sql', sql);
console.log('File seed_50_influencers.sql generated!');

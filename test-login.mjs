/**
 * Login smoke test.
 *
 * Required env:
 * - VITE_SUPABASE_URL or SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY
 * - TEST_LOGIN_EMAIL
 * - TEST_LOGIN_PASSWORD
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} wajib diisi.`);
  }

  return value;
};

const supabaseUrl = process.env.SUPABASE_URL || requiredEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || requiredEnv('VITE_SUPABASE_ANON_KEY');
const email = requiredEnv('TEST_LOGIN_EMAIL');
const password = requiredEnv('TEST_LOGIN_PASSWORD');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('1. Menguji login...');
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

if (authError) {
  console.error('Login gagal:', authError.message);
  process.exit(1);
}

console.log('Login berhasil.');
console.log('2. Menguji akses profil sendiri...');

const { data: userProfile, error: profileError } = await supabase
  .from('users')
  .select('id, name, user_type, is_active')
  .eq('id', authData.user.id)
  .single();

if (profileError) {
  console.error('Gagal mengambil profil:', profileError.message);
  process.exit(1);
}

console.log(`Profil ditemukan untuk tipe user: ${userProfile.user_type}`);
await supabase.auth.signOut();

/**
 * Test Supabase Connection
 * Run: node test-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js';

// Read from .env manually
import { readFileSync } from 'fs';
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

let supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

console.log('=== SUPABASE CONNECTION TEST ===\n');
console.log('URL Supabase:', supabaseUrl ? 'terkonfigurasi' : 'belum ada');
console.log('Anon key:', supabaseAnonKey ? 'terkonfigurasi' : 'belum ada');

// Fix: Remove trailing /rest/v1/ if present
if (supabaseUrl && supabaseUrl.includes('/rest/v1')) {
  const fixedUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');
  console.log('\n⚠️  URL mengandung /rest/v1/ — ini SALAH!');
  console.log('   URL yang benar seharusnya:', fixedUrl);
  supabaseUrl = fixedUrl;
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan di .env!');
  process.exit(1);
}

console.log('\n--- Testing connection with fixed URL ---\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test 1: Basic connectivity
console.log('Test 1: Basic Auth Health Check...');
try {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log('❌ Auth error:', error.message);
  } else {
    console.log('✅ Auth connection OK (no active session, which is expected)');
  }
} catch (e) {
  console.log('❌ Auth connection FAILED:', e.message);
}

// Test 2: Try to query tables
const tablesToTest = ['users', 'influencers', 'orders', 'reviews'];
console.log('\nTest 2: Testing table access...');

for (const table of tablesToTest) {
  try {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`  ❌ Table '${table}': ERROR (${error.code}) - ${error.message}`);
    } else {
      console.log(`  ✅ Table '${table}': OK (${data?.length || 0} rows returned)`);
    }
  } catch (e) {
    console.log(`  ❌ Table '${table}': FAILED - ${e.message}`);
  }
}

// Test 3: Try to query views
const viewsToTest = ['v_influencer_profiles', 'v_order_details'];
console.log('\nTest 3: Testing view access...');

for (const view of viewsToTest) {
  try {
    const { data, error } = await supabase.from(view).select('id').limit(1);
    if (error) {
      console.log(`  ❌ View '${view}': ERROR (${error.code}) - ${error.message}`);
    } else {
      console.log(`  ✅ View '${view}': OK (${data?.length || 0} rows returned)`);
    }
  } catch (e) {
    console.log(`  ❌ View '${view}': FAILED - ${e.message}`);
  }
}

console.log('\n=== TEST COMPLETE ===');

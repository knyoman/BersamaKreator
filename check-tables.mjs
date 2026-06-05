/**
 * Quick check: verify tables exist and are accessible
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) envVars[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
});

const supabase = createClient(envVars['VITE_SUPABASE_URL'], envVars['VITE_SUPABASE_ANON_KEY']);

console.log('=== Checking all tables & views ===\n');

const items = ['users', 'influencers', 'orders', 'reviews', 'v_influencer_profiles', 'v_order_details'];

for (const name of items) {
  const { data, error } = await supabase.from(name).select('id').limit(1);
  if (error) {
    console.log(`❌ ${name}: [${error.code}] ${error.message}`);
  } else {
    console.log(`✅ ${name}: OK (${data?.length || 0} rows)`);
  }
}

// Also check auth rate limit status
console.log('\n=== Testing auth signUp (rate limit check) ===');
const { data, error } = await supabase.auth.signUp({
  email: 'ratelimit-test-delete@test.com',
  password: 'TestTest123!',
});
if (error) {
  console.log(`Auth status: ${error.message}`);
} else {
  console.log('Auth status: ✅ Ready (no rate limit)');
  // Clean up - sign out
  await supabase.auth.signOut();
}

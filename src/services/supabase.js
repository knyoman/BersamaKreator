import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [Supabase] Missing configuration!');
  console.error('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  throw new Error('Supabase configuration is missing. Please check .env file.');
}

// Warn if anon key doesn't look like a JWT token
if (!supabaseAnonKey.startsWith('eyJ')) {
  console.warn('⚠️ [Supabase] Anon key may be invalid - should start with "eyJ"');
  console.warn('Current key starts with:', supabaseAnonKey.substring(0, 20) + '...');
}

console.log('✅ [Supabase] Configuration loaded:', {
  url: supabaseUrl,
  anonKeyLength: supabaseAnonKey?.length,
  anonKeyStartsCorrectly: supabaseAnonKey.startsWith('eyJ'),
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


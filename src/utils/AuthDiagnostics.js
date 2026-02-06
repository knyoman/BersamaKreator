import { supabase } from '../services/supabase';
import { getCurrentUser, getUserProfile } from '../services/api';

/**
 * ⚠️ DEVELOPMENT ONLY: Auth & Database Diagnostics
 * This file should NEVER run in production
 */

const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;

export const runAuthTests = async () => {
  if (!isDevelopment) {
    console.warn('🚫 AuthDiagnostics is disabled in production mode');
    return;
  }

  console.group('🔍 Auth & Database Diagnostics');
  
  try {
    // 1. Check Configuration
    console.log('%c1. Checking Configuration...', 'color: blue; font-weight: bold');
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      console.error('❌ Missing Environment Variables');
    } else {
      console.log('✅ Supabase URL configured');
      console.log('✅ Anon Key Status:', key.startsWith('eyJ') ? 'Valid Format' : 'Invalid Format');
    }

    // 2. Check Connection
    console.log('%c\n2. Checking Database Connection...', 'color: blue; font-weight: bold');
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request Timed Out (5s)')), 5000)
    );

    const dbPromise = supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count, error: connError } = await Promise.race([dbPromise, timeoutPromise])
      .catch(err => ({ error: err, count: null }));
      
    if (connError) {
      console.error('❌ Connection Failed:', connError.message);
      console.warn('💡 Tip: Check if "users" table exists and RLS policies allow reading.');
    } else {
      console.log('✅ Connection Successful');
      console.log(`ℹ️ Total Users in DB: ${count}`);
    }

    // 3. Check Current Session
    console.log('%c\n3. Checking Session State...', 'color: blue; font-weight: bold');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Check Failed:', sessionError.message);
    } else if (!session) {
      console.log('ℹ️ No active session (User is logged out)');
    } else {
      console.log('✅ Active Session Found');
      console.log('👤 Auth User Email:', session.user.email);
      console.log('🆔 Auth User ID:', session.user.id);
      
      // 4. Check Profile Consistency
      console.log('%c\n4. Checking Profile Consistency...', 'color: blue; font-weight: bold');
      const { data: profile, error: profileError } = await getUserProfile(session.user.id);
      
      if (profileError) {
        console.error('❌ Profile Fetch Failed:', profileError.message);
        console.error('CRITICAL: User is authenticated but has no profile in "users" table.');
      } else {
        console.log('✅ Profile Found');
        console.log('👤 Name:', profile.name);
        console.log('🎭 Role (user_type):', profile.user_type);
        console.table(profile);
      }
    }

    console.log('%c\n✅ Diagnostics Complete', 'color: green; font-weight: bold; font-size: 12px');
    console.log('If you see green checks above, the system is healthy.');
    
  } catch (err) {
    console.error('💥 Unexpected Diagnostic Error:', err);
  } finally {
    console.groupEnd();
  }
};


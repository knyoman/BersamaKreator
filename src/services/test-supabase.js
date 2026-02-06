import { supabase } from './supabase';

/**
 * Test Supabase Connection
 * Run this script to verify your Supabase configuration is working correctly
 */
async function testSupabaseConnection() {
  console.log('='.repeat(60));
  console.log('🧪 TESTING SUPABASE CONNECTION');
  console.log('='.repeat(60));
  
  // Test 1: Check if Supabase client exists
  console.log('\n1️⃣ Checking Supabase client...');
  console.log('   ✅ Supabase client initialized:', !!supabase);
  
  // Test 2: Try to query the view
  console.log('\n2️⃣ Testing v_influencer_profiles view...');
  try {
    const { data, error, count } = await supabase
      .from('v_influencer_profiles')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log('   ❌ ERROR:', error);
      console.log('   Error Code:', error.code);
      console.log('   Error Message:', error.message);
      console.log('   Error Details:', error.details);
      console.log('   Error Hint:', error.hint);
    } else {
      console.log('   ✅ SUCCESS!');
      console.log('   Total records:', count);
      console.log('   Fetched records:', data?.length || 0);
      console.log('   Sample data:', data);
    }
  } catch (error) {
    console.log('   ❌ EXCEPTION:', error);
  }
  
  // Test 3: Check if influencers table exists
  console.log('\n3️⃣ Testing influencers table...');
  try {
    const { data, error, count } = await supabase
      .from('influencers')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('   ❌ ERROR:', error.message);
    } else {
      console.log('   ✅ Table exists!');
      console.log('   Total records:', count);
    }
  } catch (error) {
    console.log('   ❌ EXCEPTION:', error.message);
  }
  
  // Test 4: Check if users table exists
  console.log('\n4️⃣ Testing users table...');
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('   ❌ ERROR:', error.message);
    } else {
      console.log('   ✅ Table exists!');
      console.log('   Total records:', count);
    }
  } catch (error) {
    console.log('   ❌ EXCEPTION:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 TEST COMPLETE');
  console.log('='.repeat(60));
}

// Auto-run in browser
if (typeof window !== 'undefined') {
  testSupabaseConnection();
}

export default testSupabaseConnection;

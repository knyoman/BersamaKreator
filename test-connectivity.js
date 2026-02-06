import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tznupuahwbgqrsmtelai.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bnVwdWFod2JncXJzbXRlbGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTEwMDQsImV4cCI6MjA4NTg2NzAwNH0.e64tKoJcQy5U3f48EHZuinUKE5I9LxMxOUGerZFof1U'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testConnection() {
  console.log('1. Testing URL Reachability...')
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: { 'apikey': SUPABASE_KEY }
    })
    console.log(`   Status: ${response.status} ${response.statusText}`)
    if (response.ok) {
        console.log('   ✅ Service is UP')
    } else {
        console.log('   ❌ Service might be down or key invalid')
    }
  } catch (err) {
    console.log('   ❌ Network Error:', err.message)
    return
  }

  console.log('\n2. Testing Table Query (RLS Check)...')
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.log('   ❌ API Error:', error.message)
    console.log('   💡 This usually means RLS policies are blocking access.')
  } else {
    console.log(`   ✅ Success! Found ${count} users.`)
    console.log('   💡 Connection and Permissions are GOOD.')
  }
}

testConnection()

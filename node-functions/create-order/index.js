import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  // 1. CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 2. Parse Environment & Auth
  // Try to get from context (EdgeOne), fallback to process.env (Local Node) if needed
  const supabaseUrl = context.env?.SUPABASE_URL || process.env.VITE_SUPABASE_URL; 
  const supabaseKey = context.env?.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const authHeader = context.request.headers.get('Authorization');

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: "Server Configuration Error: Missing Supabase Credentials" }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  // 3. Init Supabase with User Context (RLS)
  // Passing the Authorization header allows Supabase to respect RLS policies for the logged-in user
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  const supabase = createClient(supabaseUrl, supabaseKey, options);

  // 4. Parse & Validate Body
  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { 
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  // Basic validation
  // We don't strictly validate everything, letting the database constraints handle some, 
  // but good to check essentials.
  const { sme_id, influencer_id, total_price, campaign_name } = body;
  
  if (!sme_id || !influencer_id || !total_price || !campaign_name) {
    return new Response(JSON.stringify({ error: "Missing required fields: sme_id, influencer_id, total_price, campaign_name" }), { 
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  // 5. Insert Order
  const { data, error } = await supabase
    .from('orders')
    .insert([body])
    .select()
    .single();

  if (error) {
    console.error('Supabase Insert Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Database Insert Failed' }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // 6. Success Response
  return new Response(JSON.stringify({ data, message: "Order created successfully" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

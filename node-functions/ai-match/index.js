import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export async function onRequest(context) {
  // 1. CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 2. Setup Clients (Supabase & OpenAI)
  // 2. Setup Clients (Supabase & OpenAI)
  // 2. Setup Clients (Supabase & Grok/xAI)
  const supabaseUrl = context.env?.SUPABASE_URL || context.env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = context.env?.SUPABASE_ANON_KEY || context.env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  // Switch to Grok API Key
  const xaiKey = context.env?.XAI_API_KEY || process.env.XAI_API_KEY;

  if (!xaiKey) {
    return new Response(JSON.stringify({ 
      error: "XAI API Key is missing. Please add XAI_API_KEY to your environment variables." 
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Initialize OpenAI Client but point to xAI Base URL
  const openai = new OpenAI({ 
    apiKey: xaiKey,
    baseURL: "https://api.x.ai/v1"
  });

  // 3. Parse Request
  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  // ===== ANTI-BOT: HONEYPOT VERIFICATION =====
  // If honeypot field is filled, reject silently (it's a bot)
  if (body._honeypot && body._honeypot !== '') {
    console.log('🤖 Bot detected via honeypot field');
    return new Response(JSON.stringify({ error: "Invalid request" }), { 
      status: 403, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
  
  // Remove honeypot from payload before processing
  delete body._honeypot;

  const { budget, niche, targetAudience, campaignGoal } = body;

  // 4. Step 1: Pre-filtering (Get Candidates from Database)
  // We filter by niche first to save tokens and ensure relevance
  let query = supabase.from('influencers').select('*, users!inner(name, profile_image)').limit(10);
  
  if (niche) {
    // Basic fuzzy matching or exact match depending on data
    query = query.ilike('niche', `%${niche}%`);
  }
  
  // Filter by budget (assuming price_per_post is the metric)
  if (budget) {
    query = query.lte('price_per_post', budget);
  }

  const { data: candidates, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  if (!candidates || candidates.length === 0) {
    return new Response(JSON.stringify({ 
      data: { message: "No influencers found matching basic criteria (Budget/Niche). Try adjusting filters.", influencers: [] }
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // 5. Step 2: AI Analysis (OpenAI)
  // We ask AI to rank these candidates based on the Goal and Audience
  try {
    const prompt = `
      Role: You are a Senior Influencer Marketing Strategist with 10 years of experience.
      
      Context:
      I need you to recommend the best influencers for a specific marketing campaign.
      You must analyze the candidate's Niche, Bio, Price, and Platform Presence to determine the best fit.

      Campaign Details:
      - Goal: "${campaignGoal}"
      - Target Audience: "${targetAudience}"
      - Maximum Budget: IDR ${budget}
      - Preferred Niche: "${niche || 'Any'}"

      Candidate List (JSON):
      ${JSON.stringify(candidates.map(c => ({ 
        id: c.id, 
        name: c.users.name,
        username: c.username,
        niche: c.niche, 
        price: c.price_per_post,
        bio: c.bio,
        platforms: {
          instagram: !!c.instagram_url,
          tiktok: !!c.tiktok_url,
          youtube: !!c.youtube_url
        } 
      })))}

      Analysis Instructions:
      1. **Relevance**: Does the influencer's Niche and Bio align with the Campaign Goal?
      2. **Audience Fit**: Based on their Niche/Bio, would they reach the Target Audience? (e.g. "Gaming" fits "Gen Z", "Parenting" fits "Moms").
      3. **Budget Efficiency**: is their Price within the budget? (It is okay if it is slightly lower, but exclude if significantly higher unless the value is immense).
      4. **Platform Match**: Prioritize influencers active on platforms suitable for the audience (e.g. TikTok for youth, Instagram for lifestyle).

      Task:
      Select the TOP 3 most relevant influencers.
      
      Output Format (Strict JSON):
      {
        "recommendations": [
          { 
            "id": "influencer_id", 
            "match_score": 85, 
            "reasoning": "Explain strictly in 2 sentences why they are a good match for THIS specific goal and audience." 
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You are a helpful AI assistant that outputs JSON only." }, { role: "user", content: prompt }],
      model: "grok-4-fast-non-reasoning",
      response_format: { type: "json_object" },
    });

    const aiResult = JSON.parse(completion.choices[0].message.content);
    
    // Merge AI results back with full influencer data
    const finalResults = aiResult.recommendations.map(rec => {
      const fullProfile = candidates.find(c => c.id === rec.id);
      if (!fullProfile) return null; // Safety check
      return {
        ...fullProfile,
        match_score: rec.match_score,
        reasoning: rec.reasoning
      };
    }).filter(Boolean).sort((a, b) => b.match_score - a.match_score);

    return new Response(JSON.stringify({ 
      data: { influencers: finalResults, message: "AI matching complete." } 
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (aiError) {
    console.error("OpenAI Error:", aiError);
    // Don't expose internal AI errors to client
    return new Response(JSON.stringify({ 
      error: "AI matching service is temporarily unavailable. Please try again later." 
    }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
}

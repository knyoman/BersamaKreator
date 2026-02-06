import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function onRequest(context) {
  // 1. CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Setup Clients (Supabase & Gemini)
    const supabaseUrl = context.env?.SUPABASE_URL || context.env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = context.env?.SUPABASE_ANON_KEY || context.env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const geminiKey = context.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    // Validate all required environment variables
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseKey) missingVars.push('SUPABASE_ANON_KEY');
    if (!geminiKey) missingVars.push('GEMINI_API_KEY');

    if (missingVars.length > 0) {
      console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      return new Response(
        JSON.stringify({
          error: `Missing environment variables: ${missingVars.join(', ')}. Please configure them in EdgeOne Project Settings.`,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('✅ All environment variables configured');
    console.log('✅ Supabase URL:', supabaseUrl);
    console.log('✅ Gemini API Key configured:', geminiKey ? 'Yes' : 'No');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    // 3. Parse Request
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), { status: 400, headers: corsHeaders });
    }

    // ===== ANTI-BOT: HONEYPOT VERIFICATION =====
    // If honeypot field is filled, reject silently (it's a bot)
    if (body._honeypot && body._honeypot !== '') {
      console.log('🤖 Bot detected via honeypot field');
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Remove honeypot from payload before processing
    delete body._honeypot;

    const { budget, niche, targetAudience, campaignGoal } = body;

    console.log('📋 Received request:', { budget, niche, targetAudience, campaignGoal });

    // 4. Step 1: Pre-filtering (Get Candidates from Database)
    // We filter by niche first to save tokens and ensure relevance
    let query = supabase.from('influencers').select('*, users!inner(name, profile_image)').limit(5); // Reduced from 10 to 5 to save tokens

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
      console.error('❌ Supabase error:', error);
      return new Response(JSON.stringify({ error: `Database error: ${error.message}` }), { status: 500, headers: corsHeaders });
    }

    if (!candidates || candidates.length === 0) {
      console.log('⚠️ No influencers found matching criteria');
      return new Response(
        JSON.stringify({
          data: { message: 'No influencers found matching basic criteria (Budget/Niche). Try adjusting filters.', influencers: [] },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`✅ Found ${candidates.length} candidate influencers`);

    // 5. Step 2: AI Analysis (Gemini)
    // We ask AI to rank these candidates based on the Goal and Audience
    try {
      console.log('🤖 Starting AI analysis with Gemini...');
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
      ${JSON.stringify(
        candidates.map((c) => ({
          id: c.id,
          name: c.users.name,
          username: c.username,
          niche: c.niche,
          price: c.price_per_post,
          bio: c.bio,
          platforms: {
            instagram: !!c.instagram_url,
            tiktok: !!c.tiktok_url,
            youtube: !!c.youtube_url,
          },
        })),
      )}

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

      const completion = await Promise.race([
        model.generateContent({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('API request timeout after 25 seconds')), 25000)),
      ]);

      console.log('✅ AI analysis completed');
      const aiResult = JSON.parse(completion.response.text());

      // Merge AI results back with full influencer data
      const finalResults = aiResult.recommendations
        .map((rec) => {
          const fullProfile = candidates.find((c) => c.id === rec.id);
          if (!fullProfile) return null; // Safety check
          return {
            ...fullProfile,
            match_score: rec.match_score,
            reasoning: rec.reasoning,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.match_score - a.match_score);

      console.log(`✅ Returning ${finalResults.length} recommendations`);
      return new Response(
        JSON.stringify({
          data: { influencers: finalResults, message: 'AI matching complete.' },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } catch (aiError) {
      console.error('❌ AI Error Type:', aiError.constructor.name);
      console.error('❌ AI Error Message:', aiError.message);
      console.error('❌ AI Error Status:', aiError.status);
      console.error('❌ Full Stack:', aiError);

      // Return more detailed error based on error type
      let errorMessage = 'AI matching service is temporarily unavailable. Please try again later.';
      let statusCode = 500;

      if (aiError.message.includes('timeout')) {
        errorMessage = 'AI service is taking too long. Please try again in a moment.';
        statusCode = 504;
      } else if (aiError.message.includes('401') || aiError.status === 401) {
        errorMessage = 'Authentication failed. Please check GEMINI_API_KEY.';
        statusCode = 401;
      } else if (aiError.message.includes('429') || aiError.status === 429) {
        errorMessage = 'Too many requests. Please try again later.';
        statusCode = 429;

        // Return response with Retry-After header for better client-side handling
        return new Response(
          JSON.stringify({
            error: errorMessage,
            retryAfter: 60, // Suggest retry after 60 seconds
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': '60', // Standard HTTP header for rate limiting
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          debug: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
        }),
        {
          status: statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred. Please try again later.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
}

import { createClient } from '@supabase/supabase-js';

export async function onRequest({ request, params, env }) {
  try {
    // Initialize Supabase client with environment variables
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing Supabase configuration',
        }),
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get total SME users count from users table where user_type = 'sme'
    const { count: smeCount, error: smeError } = await supabase.from('users').select('id', { count: 'exact' }).eq('user_type', 'sme');

    if (smeError) throw smeError;

    // Get total influencers count from influencers table
    const { count: influencersCount, error: influencersError } = await supabase.from('influencers').select('id', { count: 'exact' });

    if (influencersError) throw influencersError;

    // Prepare cache data in JSON format
    const statsData = {
      totalSMEs: smeCount || 0,
      totalInfluencers: influencersCount || 0,
      cachedAt: new Date().toISOString(),
    };

    // Save to cache with key 'stats' in JSON format
    await stats.put('stats', JSON.stringify(statsData), {
      expirationTtl: 3600, // Cache for 1 hour
    });

    return new Response(JSON.stringify(statsData), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      },
    );
  }
}

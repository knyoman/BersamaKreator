import { supabase } from './supabase';

// ============================================
// INFLUENCERS
// ============================================

/**
 * Get all verified influencers with profile data
 */
export const getInfluencers = async (filters = {}) => {
  try {
    console.log('[API] Fetching influencers with filters:', filters);
    console.log('[API] Supabase client initialized:', !!supabase);
    
    let query = supabase.from('v_influencer_profiles').select('*').order('rating_average', { ascending: false });

    // Apply filters
    if (filters.niche) {
      query = query.ilike('niche', `%${filters.niche}%`);
    }
    if (filters.minFollowers) {
      query = query.gte('followers_count', filters.minFollowers);
    }
    if (filters.maxPrice) {
      query = query.lte('price_per_post', filters.maxPrice);
    }
    if (filters.isVerified !== undefined) {
      query = query.eq('is_verified', filters.isVerified);
    }

    console.log('[API] Executing query...');
    const { data, error } = await query;

    console.log('[API] Query response:', { 
      dataCount: data?.length, 
      hasError: !!error,
      errorDetails: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[API] Error fetching influencers:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: error
    });
    return { data: null, error };
  }
};

/**
 * Get single influencer by ID
 */
export const getInfluencerById = async (id) => {
  try {
    const { data, error } = await supabase.from('v_influencer_profiles').select('*').eq('id', id).single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching influencer:', error);
    return { data: null, error };
  }
};

/**
 * Get single influencer by Username
 */
export const getInfluencerByUsername = async (username) => {
  try {
    const { data, error } = await supabase.from('v_influencer_profiles').select('*').eq('username', username).single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching influencer by username:', error);
    return { data: null, error };
  }
};

/**
 * Get reviews for an influencer
 */
export const getInfluencerReviews = async (influencerId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        order:orders!inner(
          influencer_id,
          campaign_name,
          sme:users!orders_sme_id_fkey(name)
        )
      `,
      )
      .eq('order.influencer_id', influencerId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { data: null, error };
  }
};

// ============================================
// ORDERS
// ============================================

/**
 * Get all orders with details
 */
export const getOrders = async () => {
  try {
    const { data, error } = await supabase.from('v_order_details').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { data: null, error };
  }
};

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
  try {
    const edgeFunctionUrl = import.meta.env.VITE_EDGE_FUNCTION_URL;
    const isconfigured = edgeFunctionUrl && !edgeFunctionUrl.includes('your-edgeone-domain');

    // 1. Priority: Edge Function (Secure)
    if (isconfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Pass JWT for RLS
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Edge Function Order Creation Failed');
      }
      
      return { data: result.data, error: null };
    }

    // 2. Fallback: Direct Supabase Insert (Client-side)
    // Used if Edge Function is not yet configured or is using placeholder
    console.warn('Using Direct DB Insert (Edge Function not configured)');
    const { data, error } = await supabase.from('orders').insert([orderData]).select().single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating order:', error);
    return { data: null, error };
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase.from('v_order_details').select('*').eq('id', orderId).single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { data: null, error };
  }
};

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Sign up new user and create user profile
 */
export const signUp = async (email, password, userData) => {
  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Step 2: Create user profile in users table
    const { error: profileError } = await supabase.from('users').insert([
      {
        id: authData.user.id,
        name: userData.name,
        email,
        password: '***supabase-auth***', // Placeholder - Supabase Auth manages actual password
        role: 'user',
        user_type: userData.user_type || 'sme',
        is_active: true,
      },
    ]);

    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { data: null, error: { message: error.message || 'Sign up failed' } };
  }
};

/**
 * Sign in user
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error: { message: error.message || 'Sign in failed' } };
  }
};

/**
 * Sign out user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
};

/**
 * Get current user from auth
 */
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return { data: user, error: null };
  } catch (error) {
    console.error('Error getting user:', error);
    return { data: null, error };
  }
};

/**
 * Get user profile from database
 */
export const getUserProfile = async (userId) => {
  try {
    // 1. Get base user data
    const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();

    if (error) throw error;

    // 2. If user is influencer, get extended profile
    if (user.user_type === 'influencer') {
      const { data: influencerData } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Merge data (priority to influencer table for specific fields if any overlap)
      if (influencerData) {
        return { 
          data: { ...user, ...influencerData }, 
          error: null 
        };
      }
    }

    return { data: user, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    // 1. Separate data for 'users' and 'influencers' tables
    const userData = {};
    const influencerData = {};

    const userFields = ['name', 'phone', 'profile_image'];
    const influencerFields = ['username', 'niche', 'price_per_post', 'bio', 'instagram_url', 'tiktok_url', 'youtube_url'];

    Object.keys(updates).forEach(key => {
      if (userFields.includes(key)) userData[key] = updates[key];
      if (influencerFields.includes(key)) influencerData[key] = updates[key];
    });

    // 2. Update 'users' table
    if (Object.keys(userData).length > 0) {
      const { error: userError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId);
        
      if (userError) throw userError;
    }

    // 3. Update 'influencers' table
    if (Object.keys(influencerData).length > 0) {
      // Check if influencer record exists first
      const { data: existingInfluencer } = await supabase
        .from('influencers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingInfluencer) {
        const { error: infError } = await supabase
          .from('influencers')
          .update(influencerData)
          .eq('user_id', userId);
        if (infError) throw infError;
      } else {
        // Create if not exists (rare case, but safe)
        const { error: insertError } = await supabase
          .from('influencers')
          .insert([{ ...influencerData, user_id: userId }]);
        if (insertError) throw insertError;
      }
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
};


// ============================================
// STATS & ANALYTICS
// ============================================

/**
 * Get platform statistics
 */
export const getPlatformStats = async () => {
  try {
    const [influencers, orders, smes] = await Promise.all([
      supabase.from('influencers').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('user_type', 'sme'),
    ]);

    return {
      data: {
        totalInfluencers: influencers.count || 0,
        totalOrders: orders.count || 0,
        totalSMEs: smes.count || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { data: null, error };
  }
};

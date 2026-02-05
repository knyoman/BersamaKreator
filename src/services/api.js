import { supabase } from './supabase'

// ============================================
// INFLUENCERS
// ============================================

/**
 * Get all verified influencers with profile data
 */
export const getInfluencers = async (filters = {}) => {
  try {
    let query = supabase
      .from('v_influencer_profiles')
      .select('*')
      .order('rating_average', { ascending: false })

    // Apply filters
    if (filters.niche) {
      query = query.ilike('niche', `%${filters.niche}%`)
    }
    if (filters.minFollowers) {
      query = query.gte('followers_count', filters.minFollowers)
    }
    if (filters.maxPrice) {
      query = query.lte('price_per_post', filters.maxPrice)
    }
    if (filters.isVerified !== undefined) {
      query = query.eq('is_verified', filters.isVerified)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching influencers:', error)
    return { data: null, error }
  }
}

/**
 * Get single influencer by ID
 */
export const getInfluencerById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('v_influencer_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching influencer:', error)
    return { data: null, error }
  }
}

/**
 * Get reviews for an influencer
 */
export const getInfluencerReviews = async (influencerId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        order:orders!inner(
          influencer_id,
          campaign_name,
          sme:users!orders_sme_id_fkey(name)
        )
      `)
      .eq('order.influencer_id', influencerId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return { data: null, error }
  }
}

// ============================================
// ORDERS
// ============================================

/**
 * Get all orders with details
 */
export const getOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('v_order_details')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { data: null, error }
  }
}

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating order:', error)
    return { data: null, error }
  }
}

/**
 * Get order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('v_order_details')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { data: null, error }
  }
}

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Sign up new user
 */
export const signUp = async (email, password, userData) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error signing up:', error)
    return { data: null, error }
  }
}

/**
 * Sign in user
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error signing in:', error)
    return { data: null, error }
  }
}

/**
 * Sign out user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error signing out:', error)
    return { error }
  }
}

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { data: user, error: null }
  } catch (error) {
    console.error('Error getting user:', error)
    return { data: null, error }
  }
}

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
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('user_type', 'sme')
    ])

    return {
      data: {
        totalInfluencers: influencers.count || 0,
        totalOrders: orders.count || 0,
        totalSMEs: smes.count || 0
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return { data: null, error }
  }
}

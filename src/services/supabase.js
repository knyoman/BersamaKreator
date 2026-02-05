import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tznupuahwbgqrsmtelai.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IIKXqiKKdxsi0mB521jcXQ_JpS3-E9B'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

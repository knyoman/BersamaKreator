import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_REQUEST_TIMEOUT_MS = 15000
const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV

const fetchWithTimeout = async (input, init = {}) => {
  const controller = new AbortController()
  let timedOut = false
  let abortExternalSignal

  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, SUPABASE_REQUEST_TIMEOUT_MS)

  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort()
    } else {
      abortExternalSignal = () => controller.abort()
      init.signal.addEventListener('abort', abortExternalSignal, { once: true })
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (timedOut && error.name === 'AbortError') {
      throw new Error('Request Supabase terlalu lama. Periksa koneksi Anda lalu coba lagi.')
    }

    throw error
  } finally {
    if (abortExternalSignal) {
      init.signal.removeEventListener('abort', abortExternalSignal)
    }

    clearTimeout(timeoutId)
  }
}

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  if (isDevelopment) {
    console.error('[Supabase] Missing configuration!')
    console.error('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.')
  }
  throw new Error('Konfigurasi Supabase belum lengkap. Periksa file .env.')
}

// Warn if anon key doesn't look like a JWT token (development only)
if (isDevelopment && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn('[Supabase] Anon key may be invalid - should start with "eyJ"')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithTimeout,
  },
  auth: {
    storage: sessionStorage, // Persist session on reload, but clear on tab close
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

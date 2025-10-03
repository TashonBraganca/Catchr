import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@cathcr/shared'

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

/**
 * PRODUCTION-READY SUPABASE CLIENT (SSR Compatible)
 *
 * Uses @supabase/ssr for proper cookie handling in production
 * Includes retry logic for network failures
 * Configured for PKCE flow (more secure than implicit flow)
 */

// Custom fetch with retry logic for production resilience
const fetchWithRetry = async (url: RequestInfo | URL, options?: RequestInit, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)

      // If response is ok or it's a client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }

      // For server errors (5xx), retry
      if (i === maxRetries - 1) {
        return response
      }

      // Exponential backoff: wait 1s, 2s, 3s
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    } catch (error) {
      // Network error - retry unless it's the last attempt
      if (i === maxRetries - 1) {
        console.error('❌ Supabase fetch failed after', maxRetries, 'attempts:', error)
        throw error
      }

      console.warn(`⚠️ Supabase fetch attempt ${i + 1} failed, retrying...`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }

  throw new Error('Fetch failed after maximum retries')
}

// Create browser client with SSR support
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Auto refresh tokens before they expire
      autoRefreshToken: true,

      // Persist session in browser storage
      persistSession: true,

      // Detect OAuth redirects
      detectSessionInUrl: true,

      // Use PKCE flow for better security
      flowType: 'pkce',

      // Storage config for production
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },

    // Custom fetch with retry logic
    global: {
      fetch: fetchWithRetry,
      headers: {
        'X-Client-Info': 'cathcr-web',
      },
    },

    // Database schema
    db: {
      schema: 'public',
    },
  }
)

// Export helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },

  // Sign in with OAuth (Google, GitHub, etc.)
  signInWithProvider: async (provider: 'google' | 'github', redirectTo?: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${baseUrl}`,
        queryParams: provider === 'google' ? {
          access_type: 'offline',
          prompt: 'consent',
        } : undefined,
      },
    })
  },

  // Sign in with magic link
  signInWithMagicLink: async (email: string, redirectTo?: string) => {
    return await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })
  },

  // Sign out
  signOut: async () => {
    return await supabase.auth.signOut()
  },

  // Get current session
  getSession: async () => {
    return await supabase.auth.getSession()
  },

  // Get current user
  getUser: async () => {
    return await supabase.auth.getUser()
  },

  // Update user
  updateUser: async (updates: { email?: string; password?: string; data?: Record<string, any> }) => {
    return await supabase.auth.updateUser(updates)
  },

  // Reset password
  resetPassword: async (email: string, redirectTo?: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
  },
}

// Export for convenience
export default supabase

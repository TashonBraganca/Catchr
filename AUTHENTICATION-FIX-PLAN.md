# 🔧 AUTHENTICATION FIX PLAN

**Date**: 2025-10-03
**Issue**: "Failed to fetch" error in production deployment

---

## 📋 ROOT CAUSE ANALYSIS

Based on Context7 Supabase docs and web research:

| Issue | Current State | Required Fix |
|-------|---------------|--------------|
| **SSR Not Configured** | Using `@supabase/supabase-js` client-side only | Need `@supabase/ssr` for Vercel |
| **CORS Headers** | Not explicitly set | May need manual CORS in production |
| **Session Persistence** | Client-side only (localStorage) | Need server-side cookie handling |
| **Browser Extensions** | Blocking API calls in dev | Known issue (user confirmed) |

---

## 🎯 IMPLEMENTATION PLAN

### Phase 1: Install Dependencies ✅
```bash
npm install @supabase/ssr
```

### Phase 2: Create SSR-Compatible Supabase Client
**File**: `client/src/lib/supabase-browser.ts`
- Use `createBrowserClient` from `@supabase/ssr`
- Configure cookie handling for production
- Set proper CORS headers

### Phase 3: Update AuthContext
**File**: `client/src/contexts/AuthContext.tsx`
- Import SSR client instead of direct client
- Add proper error handling for fetch errors
- Implement retry logic for network issues

### Phase 4: Add Google OAuth
**File**: `client/src/components/auth/AuthForm.tsx`
- Add Google sign-in button
- Configure redirect URLs
- Use Supabase OAuth provider

### Phase 5: Add GitHub OAuth
**File**: `client/src/components/auth/AuthForm.tsx`
- Add GitHub sign-in button
- Configure redirect URLs
- Use Supabase OAuth provider

### Phase 6: Update Supabase Auth Configuration (API)
- Enable Google OAuth provider
- Enable GitHub OAuth provider
- Set production redirect URLs

---

## 📝 TECHNICAL DETAILS

### SSR Client Pattern (from Context7)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // More secure for production
    },
    // Custom fetch with retry logic
    global: {
      fetch: async (url, options) => {
        const maxRetries = 3
        for (let i = 0; i < maxRetries; i++) {
          try {
            const response = await fetch(url, options)
            return response
          } catch (error) {
            if (i === maxRetries - 1) throw error
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
          }
        }
      }
    }
  }
)
```

### OAuth Configuration
```typescript
// Google OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})

// GitHub OAuth
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

---

## ✅ SUCCESS CRITERIA

- [ ] Email/password auth works in production
- [ ] Session persists across page refreshes
- [ ] Google OAuth working
- [ ] GitHub OAuth working
- [ ] No "Failed to fetch" errors
- [ ] Proper error messages for users
- [ ] Works in both dev and production

---

## 🔗 REFERENCES

- Context7: `/supabase/supabase-js` - Authentication best practices
- Supabase Docs: SSR configuration for Vercel
- GitHub Issue #7627: CORS Error on REST API Requests
- Vercel Community: CORS issues and fixes

---

**Estimated Time**: 45-60 minutes

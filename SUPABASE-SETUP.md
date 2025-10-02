# 🔧 SUPABASE SETUP INSTRUCTIONS

## Issues Found (2025-10-02)

### ❌ Issue 1: OAuth Providers Not Enabled
**Error**: `"Unsupported provider: provider is not enabled"`

**What this means**: Google and GitHub sign-in buttons won't work until you enable them in Supabase dashboard.

**How to fix**:
1. Go to: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/auth/providers
2. Find **Google** provider
   - Toggle it ON
   - Add OAuth credentials (Google Cloud Console)
   - Add redirect URL: `https://jrowrloysdkluxtgzvxm.supabase.co/auth/v1/callback`
3. Find **GitHub** provider
   - Toggle it ON
   - Add OAuth credentials (GitHub OAuth Apps)
   - Add redirect URL: `https://jrowrloysdkluxtgzvxm.supabase.co/auth/v1/callback`

**For now**: I'll hide Google/GitHub buttons until you enable them.

---

### ❌ Issue 2: Email Validation Too Strict
**Error**: `Email address "test1759428531769@example.com" is invalid`

**What this means**: Supabase is rejecting test email addresses with timestamps or `@example.com` domain.

**How to fix**:
1. Go to: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/auth/settings
2. Under **Email Settings**:
   - Check "Email Confirmations" - if enabled, disable it for testing
   - Check "Email Domain Restrictions" - make sure it's not blocking test emails
3. Under **Security**:
   - Check "Allowed Email Domains" - should be `*` (all domains)

**Temporary fix**: Use realistic email like `yourname@gmail.com` for testing.

---

## ✅ Quick Fix Checklist

### Step 1: Disable Email Confirmations (For Testing)
```
Dashboard → Authentication → Settings → Email Settings
→ Uncheck "Enable email confirmations"
→ Click Save
```

### Step 2: Allow All Email Domains
```
Dashboard → Authentication → Settings → Security
→ Allowed Email Domains: * (asterisk means all)
→ Click Save
```

### Step 3: Set Site URL
```
Dashboard → Authentication → Settings → Site URL
→ Add: http://localhost:3000
→ Click Save
```

### Step 4: Add Redirect URLs
```
Dashboard → Authentication → Settings → Redirect URLs
→ Add: http://localhost:3000
→ Add: http://localhost:3000/**
→ Click Save
```

---

## 🔧 Current Supabase Config

**Project**: `jrowrloysdkluxtgzvxm`
**URL**: `https://jrowrloysdkluxtgzvxm.supabase.co`
**Region**: Unknown
**Database**: PostgreSQL

**What's Working ✅**:
- Supabase client connection
- Session checks
- Database queries (RLS)

**What's Broken ❌**:
- Email sign up (validation too strict)
- Google OAuth (not enabled)
- GitHub OAuth (not enabled)

---

## 📝 Recommended Settings for Development

### Email Settings
```
✓ Enable email confirmations: OFF (for testing)
✓ Secure email change: ON
✓ Enable email OTP: OFF (unless you want magic links)
```

### Auth Providers
```
Email/Password: ON ✅
Google: OFF (enable when you add credentials)
GitHub: OFF (enable when you add credentials)
Magic Link: OFF (optional)
```

### Security
```
Site URL: http://localhost:3000
Redirect URLs:
  - http://localhost:3000
  - http://localhost:3000/**
  - https://cathcr.vercel.app (when deployed)
JWT expiry: 3600 (1 hour)
Refresh token rotation: ON
```

---

## 🚀 After You Fix These Settings

1. **Test again** - Click the debug test button
2. **Should see**: `✅ SIGN UP SUCCESS!`
3. **Then I'll**:
   - Remove debug panel
   - Fix main sign in/sign up
   - Show HomePage after auth
   - Add "+ New" buttons

---

## 🔗 Quick Links

- **Auth Settings**: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/auth/settings
- **Auth Providers**: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/auth/providers
- **Database Tables**: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/editor
- **API Keys**: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/settings/api

---

*Last updated: 2025-10-02*
*Status: Waiting for user to update Supabase settings*

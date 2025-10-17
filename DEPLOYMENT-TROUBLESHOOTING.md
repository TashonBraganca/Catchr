# Deployment Troubleshooting Guide

**Quick Reference for Common Deployment Issues**

---

## Table of Contents

1. [Pre-Deployment Issues](#pre-deployment-issues)
2. [Deployment Issues](#deployment-issues)
3. [Post-Deployment Issues](#post-deployment-issues)
4. [Migration Issues](#migration-issues)
5. [API Issues](#api-issues)
6. [Frontend Issues](#frontend-issues)
7. [Emergency Procedures](#emergency-procedures)

---

## Pre-Deployment Issues

### Issue 1: Build Fails Locally

**Symptom**: `npm run build` fails with errors

**Common Causes**:
- TypeScript errors
- Missing dependencies
- Node version mismatch

**Solutions**:

```bash
# Fix 1: Clean install
rm -rf node_modules
rm package-lock.json
npm install

# Fix 2: Check Node version
node --version  # Should be >=18.0.0
nvm use 18  # If using nvm

# Fix 3: Check TypeScript errors
npm run typecheck
# Fix errors shown in output

# Fix 4: Clear build cache
npm run clean
npm run build
```

---

### Issue 2: Type Checking Fails

**Symptom**: `npm run typecheck` shows errors

**Common Causes**:
- Missing type definitions
- Import errors
- API changes

**Solutions**:

```bash
# Fix 1: Install missing types
npm install --save-dev @types/node @types/react

# Fix 2: Check tsconfig.json
# Ensure "strict": true is not too aggressive

# Fix 3: Review error messages
npm run typecheck 2>&1 | grep error
# Fix each error individually
```

---

### Issue 3: Migration File Not Found

**Symptom**: Can't find `004_user_settings_calendar.sql`

**Location**: `D:\Projects\Cathcr\supabase\migrations\004_user_settings_calendar.sql`

**Solutions**:

```bash
# Verify file exists
dir supabase\migrations\004_user_settings_calendar.sql

# If missing, check git
git status
git log --all -- supabase/migrations/004_user_settings_calendar.sql

# Restore if needed
git checkout HEAD -- supabase/migrations/004_user_settings_calendar.sql
```

---

## Deployment Issues

### Issue 4: Git Push Fails

**Symptom**: `git push origin main` fails

**Common Causes**:
- Authentication issues
- Remote branch conflicts
- Large file sizes

**Solutions**:

```bash
# Fix 1: Authentication
git config --global user.email "your@email.com"
git config --global user.name "Your Name"

# Fix 2: Pull latest changes
git pull origin main --rebase
git push origin main

# Fix 3: Force push (CAREFUL!)
# Only if you're sure nobody else is working on this branch
git push origin main --force

# Fix 4: Check remote
git remote -v
# Should show GitHub repository
```

---

### Issue 5: Vercel Deployment Fails

**Symptom**: `vercel --prod` fails or times out

**Common Causes**:
- Build errors
- Environment variables missing
- Vercel CLI not authenticated

**Solutions**:

```bash
# Fix 1: Login to Vercel
vercel login

# Fix 2: Check project link
vercel link
# Select correct project

# Fix 3: Check build logs
vercel logs
# Look for specific error messages

# Fix 4: Try via GitHub (auto-deploy)
# Just push to GitHub and let Vercel auto-deploy
git push origin main
# Wait 2-5 minutes, check Vercel dashboard
```

---

### Issue 6: Build Succeeds but Deployment Pending

**Symptom**: Vercel shows "Building..." for >10 minutes

**Solutions**:

```bash
# Fix 1: Check Vercel status
# Visit: https://www.vercel-status.com

# Fix 2: Cancel and retry
vercel --prod
# Press Ctrl+C to cancel
# Wait 1 minute
vercel --prod

# Fix 3: Deploy via dashboard
# Go to Vercel dashboard
# Click "Redeploy" on latest deployment
```

---

## Post-Deployment Issues

### Issue 7: Homepage Loads but Shows Old Version

**Symptom**: Deployed but changes not visible

**Solutions**:

```bash
# Fix 1: Hard refresh browser
# Windows: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# Fix 2: Clear browser cache
# Settings → Privacy → Clear browsing data

# Fix 3: Check deployment version
# Vercel dashboard → Deployments
# Verify latest commit hash matches
```

---

### Issue 8: 500 Internal Server Error

**Symptom**: Pages show "500 Internal Server Error"

**Diagnosis**:

```bash
# Step 1: Check Vercel logs
vercel logs --prod
# Look for error stack traces

# Step 2: Check Supabase logs
# Dashboard → Logs → Database
# Look for connection errors
```

**Common Causes & Fixes**:

#### Cause A: Missing Environment Variables
```bash
# Check Vercel settings
# Dashboard → Settings → Environment Variables
# Ensure all required vars are set:
# - OPENAI_API_KEY
# - DATABASE_URL
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
```

#### Cause B: Database Connection Error
```bash
# Test database connection
# Supabase dashboard → SQL Editor
SELECT 1;
# Should return: 1

# If fails, check:
# - Supabase project status
# - Database password
# - Connection string in Vercel
```

#### Cause C: API Route Error
```bash
# Check specific API route
curl https://cathcr.vercel.app/api/stats -v
# Look for error response

# Check function logs
# Vercel dashboard → Functions → Click on failing function
```

---

### Issue 9: Notes Not Saving

**Symptom**: Create note button clicked, but note doesn't appear

**Diagnosis Flow**:

```javascript
// Step 1: Check browser console (F12)
// Look for errors in Console tab

// Step 2: Check Network tab
// Filter: XHR or Fetch
// Look for failed requests (red)

// Step 3: Check response
// Click on failed request
// Response tab shows error message
```

**Common Causes & Fixes**:

#### Cause A: Migration 004 Not Applied
**Error**: `column "title" does not exist`

**Fix**: Apply migration immediately:
```sql
-- Run in Supabase SQL Editor
-- Copy from: supabase/migrations/004_user_settings_calendar.sql
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled';
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
```

#### Cause B: RLS Policy Violation
**Error**: `new row violates row-level security policy`

**Fix**: Check RLS policies:
```sql
-- Verify policy exists
SELECT * FROM pg_policies WHERE tablename = 'thoughts';

-- If missing, recreate
CREATE POLICY "Users can insert own thoughts" ON thoughts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### Cause C: Authentication Issue
**Error**: `No token provided` or `Invalid token`

**Fix**:
```javascript
// Check localStorage
localStorage.getItem('supabase.auth.token')
// Should return a token

// If null, user needs to re-login
// Redirect to login page
```

---

### Issue 10: Voice Notes Not Working

**Symptom**: Recording completes but no note created

**Diagnosis**:

```javascript
// Step 1: Check console logs
// Should see:
// "✅ [Voice] Whisper transcript received"
// "✅ [Voice] GPT-5 Nano result"
// "✅ [AppShell] Voice note created"

// If you see:
// "❌ [AppShell] VALIDATION FAILED"
// → Empty transcript issue
```

**Common Causes & Fixes**:

#### Cause A: Empty Transcript
**Fix**: Check microphone permissions:
```javascript
// Browser console
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('Mic access granted'))
  .catch(err => console.error('Mic access denied:', err))
```

#### Cause B: OpenAI API Error
**Fix**: Check API key:
```bash
# Vercel dashboard → Environment Variables
# Verify OPENAI_API_KEY is set

# Test API directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
# Should return 200 OK
```

#### Cause C: GPT-5 Nano API Endpoint Wrong
**Fix**: Verify using Responses API:
```typescript
// Check api/voice/categorize.ts
// Should use: openai.responses.create()
// NOT: openai.chat.completions.create()
```

---

## Migration Issues

### Issue 11: Migration Fails to Apply

**Symptom**: SQL error when running migration

**Solutions**:

```sql
-- Error: "relation already exists"
-- Fix: Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS user_settings ...

-- Error: "column already exists"
-- Fix: Use IF NOT EXISTS
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS title TEXT;

-- Error: "permission denied"
-- Fix: Check you're using service_role or postgres user
-- Supabase dashboard → SQL Editor uses correct permissions
```

---

### Issue 12: Migration Applied but Columns Missing

**Symptom**: Migration ran successfully but columns don't exist

**Diagnosis**:

```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'thoughts'
  AND column_name IN ('title', 'is_pinned');

-- If empty, migration didn't actually apply
```

**Solutions**:

```sql
-- Re-run migration manually
ALTER TABLE thoughts ADD COLUMN title TEXT DEFAULT 'Untitled';
ALTER TABLE thoughts ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;

-- Verify again
SELECT column_name FROM information_schema.columns
WHERE table_name = 'thoughts' AND column_name IN ('title', 'is_pinned');

-- Should return: title, is_pinned
```

---

## API Issues

### Issue 13: /api/stats Returns 404

**Symptom**: Stats endpoint not found

**Solutions**:

```bash
# Fix 1: Verify file exists
dir api\stats\index.ts

# Fix 2: Check Vercel deployment
# Dashboard → Deployments → Latest → Files
# Verify api/stats/index.ts is included

# Fix 3: Check API route
curl https://cathcr.vercel.app/api/stats
# Should return 401 (unauthorized) not 404
```

---

### Issue 14: API Returns 401 Unauthorized

**Symptom**: All API calls return 401

**Solutions**:

```javascript
// Fix 1: Check token
const token = localStorage.getItem('supabase.auth.token');
console.log('Token:', token);

// Fix 2: Re-login
// Sign out and sign back in

// Fix 3: Check token expiry
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(payload.exp * 1000));
// If expired, refresh token
```

---

## Frontend Issues

### Issue 15: UI Elements Not Appearing

**Symptom**: Buttons, panels, or components missing

**Solutions**:

```javascript
// Fix 1: Check console for errors
// F12 → Console tab
// Look for component errors

// Fix 2: Check CSS loading
// F12 → Network tab → Filter: CSS
// Verify all stylesheets loaded

// Fix 3: Hard refresh
// Ctrl + Shift + R (Windows)
// Cmd + Shift + R (Mac)
```

---

### Issue 16: Animations Glitchy or Slow

**Symptom**: UI animations stuttering or slow

**Solutions**:

```javascript
// Fix 1: Check performance
// F12 → Performance tab
// Record interaction
// Look for long tasks (>50ms)

// Fix 2: Disable animations temporarily
// Browser console:
document.body.style.animation = 'none';

// Fix 3: Check browser compatibility
// Ensure using modern browser (Chrome 90+, Firefox 88+)
```

---

## Emergency Procedures

### Emergency 1: Site Completely Down

**Immediate Actions**:

```bash
# 1. Rollback via Vercel Dashboard (FASTEST)
# https://vercel.com/cathcr/deployments
# Click previous working deployment → "Promote to Production"

# 2. Monitor restoration
# Wait 30 seconds
# Test: https://cathcr.vercel.app
# Should load within 1 minute

# 3. Investigate issue
# Check logs for root cause
# Document for post-mortem
```

---

### Emergency 2: Database Corrupted

**Immediate Actions**:

```bash
# 1. Check Supabase dashboard
# https://vysdpthbimdlkciusbvx.supabase.co
# Database → Health
# Look for critical errors

# 2. If migration caused issue, rollback
ALTER TABLE thoughts DROP COLUMN title;
ALTER TABLE thoughts DROP COLUMN is_pinned;

# 3. Verify database operational
SELECT COUNT(*) FROM thoughts;
# Should return count

# 4. Restore from backup if needed
# Supabase dashboard → Database → Backups
# Restore to pre-deployment state
```

---

### Emergency 3: Mass User Errors

**Immediate Actions**:

```bash
# 1. Enable maintenance mode (if available)
# Or add banner to site:
# "We're experiencing technical issues. Working on a fix."

# 2. Rollback deployment
git revert HEAD
git push origin main

# 3. Communicate
# Update status page
# Email affected users
# Post on social media

# 4. Investigate and fix
# Once identified, deploy hotfix
# Test thoroughly before deploying
```

---

## Common Error Messages & Fixes

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `column "title" does not exist` | Migration 004 not applied | Apply migration via Supabase |
| `relation "user_settings" does not exist` | Migration 004 not applied | Apply migration via Supabase |
| `new row violates row-level security policy` | RLS policy missing | Recreate RLS policy |
| `Invalid API key provided` | Wrong OpenAI key | Update Vercel env var |
| `Cannot read property 'uid' of undefined` | User not authenticated | Re-login required |
| `Failed to fetch` | Network error or API down | Check Vercel status |
| `Maximum call stack size exceeded` | Infinite loop in code | Check recent changes, rollback |
| `CORS error` | API route misconfigured | Check API headers |

---

## Quick Diagnostic Commands

```bash
# Test production site
curl -I https://cathcr.vercel.app
# Should return: 200 OK

# Test API endpoint
curl https://cathcr.vercel.app/api/stats \
  -H "Authorization: Bearer TOKEN"
# Should return: JSON or 401

# Check Vercel deployment status
vercel ls

# Check latest logs
vercel logs --prod

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
# Should return: 1
```

---

## Support Contacts

### Internal Resources
- **Deployment Plan**: `D:\Projects\Cathcr\DEPLOYMENT-PLAN.md`
- **Voice Debugging**: `D:\Projects\Cathcr\VOICE-TO-NOTE-DIAGNOSIS.md`
- **Migration Guide**: `D:\Projects\Cathcr\MIGRATION-004-SUMMARY.md`

### External Resources
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **OpenAI Support**: https://help.openai.com

### Community
- **Vercel Discord**: https://vercel.com/discord
- **Supabase Discord**: https://discord.supabase.com
- **Stack Overflow**: Tag with `vercel`, `supabase`, `nextjs`

---

**Troubleshooting Guide Last Updated**: 2025-10-16
**For Deployment**: Major Release (Phases 1-10)
**Status**: Ready for use during deployment

---

**Remember**: Stay calm, check logs, and rollback if needed. Most issues are fixable within minutes.

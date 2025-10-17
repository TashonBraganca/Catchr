# Quick Deployment Reference Card

**PRINT THIS PAGE** - Keep it next to you during deployment

---

## Pre-Deployment (5 minutes)

### 1. Apply Migration 004 (REQUIRED)

Go to: https://vysdpthbimdlkciusbvx.supabase.co/project/vysdpthbimdlkciusbvx/sql

Copy/paste: `supabase/migrations/004_user_settings_calendar.sql`

Click "Run" - Should complete in 2-5 seconds

**Verify**:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'thoughts' AND column_name IN ('title', 'is_pinned');
```

Should return: `title`, `is_pinned`

### 2. Local Verification

```bash
cd D:\Projects\Cathcr
npm run build
npm run typecheck
```

Both should succeed with no errors.

---

## Deployment (10 minutes)

### Option 1: Automated Script (Windows)

```bash
cd D:\Projects\Cathcr
DEPLOY.bat
```

Follow prompts. Script handles everything.

### Option 2: Manual Commands

```bash
cd D:\Projects\Cathcr

# Stage changes
git add .

# Commit (use exact message from DEPLOYMENT-PLAN.md)
git commit -m "🚀 MAJOR RELEASE: Complete Platform Improvements (Phases 1-10)
<copy full message from DEPLOYMENT-PLAN.md>"

# Push
git push origin main

# Deploy
vercel --prod
```

Wait 2-5 minutes for deployment.

---

## Post-Deployment Testing (5 minutes)

### Critical Tests (Do These NOW)

Visit: https://cathcr.vercel.app

**Test 1**: Login
- Click "Sign In"
- Login with test account
- ✅ Dashboard loads

**Test 2**: Manual Note
- Click "+ New"
- Type "Test deployment"
- ✅ Note created

**Test 3**: Voice Note
- Click microphone FAB
- Record 2-3 seconds
- ✅ Note created from voice

**Test 4**: Console Check
- Press F12
- Check Console tab
- ✅ No red errors

### If All Tests Pass
✅ Deployment successful! Monitor for next hour.

### If Any Test Fails
❌ See "Rollback" section below

---

## Monitoring (Next Hour)

### Every 15 Minutes

**Vercel**: https://vercel.com/cathcr/deployments
- Check latest deployment status
- Click "Functions" → Look for errors
- ✅ Target: 0-5 errors max

**Supabase**: https://vysdpthbimdlkciusbvx.supabase.co/project/vysdpthbimdlkciusbvx/logs
- Select "Database" logs
- Look for INSERT/SELECT errors
- ✅ Target: No RLS violations

**Browser Console**
- Keep F12 open while testing
- Watch for JavaScript errors
- ✅ Target: No red messages

---

## Rollback (If Needed)

### Immediate Rollback

```bash
git revert HEAD
git push origin main
```

Wait 2-3 minutes for Vercel to redeploy.

### Database Rollback

Run in Supabase SQL Editor:

```sql
ALTER TABLE thoughts DROP COLUMN IF EXISTS title;
ALTER TABLE thoughts DROP COLUMN IF EXISTS is_pinned;
DROP INDEX IF EXISTS idx_thoughts_pinned;
```

### Vercel Dashboard Rollback

1. Go to: https://vercel.com/cathcr/deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## Success Checklist

After deployment, mark these off:

- [ ] Homepage loads (https://cathcr.vercel.app)
- [ ] Login works
- [ ] Manual notes create
- [ ] Voice notes create
- [ ] Pin functionality works
- [ ] No console errors
- [ ] Vercel logs clean (first 15 min)
- [ ] Supabase logs clean (first 15 min)
- [ ] Response times <500ms
- [ ] No user complaints

**All checked?** ✅ Deployment complete!

---

## Quick Links

| Resource | URL |
|----------|-----|
| Production | https://cathcr.vercel.app |
| Vercel Dashboard | https://vercel.com/cathcr |
| Supabase Dashboard | https://vysdpthbimdlkciusbvx.supabase.co |
| Deployment Plan | D:\Projects\Cathcr\DEPLOYMENT-PLAN.md |

---

## Emergency Contacts

If critical issues:

1. Check `DEPLOYMENT-PLAN.md` for detailed troubleshooting
2. Check `VOICE-TO-NOTE-DIAGNOSIS.md` for voice issues
3. Use rollback commands above
4. Document issues for team review

---

**Print Date**: 2025-10-16
**Deployment Type**: Major Release (Phases 1-10)
**Estimated Time**: 20-30 minutes total
**Risk**: Medium (requires migration)

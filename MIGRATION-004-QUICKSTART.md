# Migration 004 - Quick Start Guide

## 🚀 5-Minute Application

### Step 1: Apply Migration (2 minutes)
1. Go to: https://vysdpthbimdlkciusbvx.supabase.co/project/vysdpthbimdlkciusbvx/sql
2. Click **"New Query"**
3. Copy `supabase/migrations/004_add_is_pinned_to_thoughts.sql`
4. Paste and click **"Run"**
5. Wait for ✅ **Success**

### Step 2: Verify (1 minute)
Run this SQL:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'thoughts'
  AND column_name IN ('title', 'is_pinned');
```
Should return 2 rows.

### Step 3: Update Code (2 minutes)
Replace `client/src/hooks/useNotes.ts` with uncommitted version:

**Lines 120, 123** - Change from:
```typescript
// title: noteData.title || extractTitleFromContent(noteData.content), // TODO
// is_pinned: false, // TODO
```

To:
```typescript
title: noteData.title || extractTitleFromContent(noteData.content),
is_pinned: false,
```

**OR** copy the ready-made file:
```bash
cp client/src/hooks/useNotes.POST-MIGRATION-004.ts client/src/hooks/useNotes.ts
```

### Step 4: Test (5 minutes)
```bash
npm run dev
```

1. Create a note
2. Refresh browser
3. Verify title persists
4. Pin note
5. Refresh browser
6. Verify pin persists

### Step 5: Deploy
```bash
git add .
git commit -m "✅ Enable title and is_pinned after migration 004"
git push
```

---

## ⚡ That's It!

Total time: **~10 minutes**

Full details: See `MIGRATION-004-SUMMARY.md`

---

## 🆘 Quick Troubleshooting

**Error: "column already exists"**
✅ Good - migration was already applied

**Frontend shows error after update**
1. Hard refresh: Ctrl+F5
2. Clear browser cache
3. Check browser console (F12)

**Need to rollback?**
```sql
ALTER TABLE thoughts DROP COLUMN title, DROP COLUMN is_pinned;
```

---

**Status**: ⏳ Ready to apply
**Last Updated**: 2025-10-13

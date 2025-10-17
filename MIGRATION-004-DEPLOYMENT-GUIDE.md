# MIGRATION 004 DEPLOYMENT GUIDE

## Overview
**Migration 004** adds two critical features to Catchr:
1. **User Settings Table** - Calendar integration, timezone, AI preferences
2. **Thoughts Table Enhancements** - `title` and `is_pinned` columns

**Status**: Ready to deploy to Supabase Production
**Estimated Time**: 5 minutes
**Risk Level**: Low (safe migrations with IF NOT EXISTS checks)

---

## Pre-Flight Checklist

- [ ] Backup current database (recommended)
- [ ] Review migration SQL files
- [ ] Verify you have admin access to Supabase Dashboard
- [ ] Have rollback SQL ready (provided below)

---

## STEP 1: Apply Migration - User Settings Table

### 1.1 Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your **Catchr** project
3. Navigate to **SQL Editor** in left sidebar
4. Click **New Query**

### 1.2 Copy and Paste This SQL

```sql
-- =====================================================
-- CATHCR USER SETTINGS & CALENDAR INTEGRATION
-- Migration 004: User Settings Table
-- Created: 2025-10-13
-- =====================================================

-- User settings table for calendar integration and timezone
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Calendar integration
  calendar_integration_enabled BOOLEAN DEFAULT FALSE,
  google_calendar_access_token TEXT,
  google_calendar_refresh_token TEXT,
  google_calendar_token_expires_at TIMESTAMPTZ,
  calendar_sync_enabled BOOLEAN DEFAULT FALSE,
  default_calendar_id TEXT,

  -- Timezone preferences
  timezone TEXT DEFAULT 'America/Los_Angeles', -- IANA timezone format
  timezone_auto_detect BOOLEAN DEFAULT TRUE,

  -- Notification preferences
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  reminder_notifications_enabled BOOLEAN DEFAULT TRUE,

  -- AI preferences
  ai_auto_categorization BOOLEAN DEFAULT TRUE,
  ai_confidence_threshold REAL DEFAULT 0.7 CHECK (ai_confidence_threshold >= 0 AND ai_confidence_threshold <= 1),
  ai_auto_calendar_events BOOLEAN DEFAULT FALSE, -- Only queue calendar events if enabled

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_calendar_enabled ON user_settings(calendar_integration_enabled) WHERE calendar_integration_enabled = TRUE;

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create user settings with defaults
CREATE OR REPLACE FUNCTION get_or_create_user_settings(p_user_id UUID)
RETURNS user_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_settings user_settings;
BEGIN
  -- Try to get existing settings
  SELECT * INTO v_settings
  FROM public.user_settings
  WHERE user_id = p_user_id;

  -- If not found, create with defaults
  IF NOT FOUND THEN
    INSERT INTO public.user_settings (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_settings;
  END IF;

  RETURN v_settings;
END;
$$;

-- Function to update calendar integration status
CREATE OR REPLACE FUNCTION update_calendar_integration(
  p_user_id UUID,
  p_enabled BOOLEAN,
  p_access_token TEXT DEFAULT NULL,
  p_refresh_token TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_calendar_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_id,
    calendar_integration_enabled,
    google_calendar_access_token,
    google_calendar_refresh_token,
    google_calendar_token_expires_at,
    default_calendar_id,
    calendar_sync_enabled
  ) VALUES (
    p_user_id,
    p_enabled,
    p_access_token,
    p_refresh_token,
    p_expires_at,
    p_calendar_id,
    p_enabled
  )
  ON CONFLICT (user_id) DO UPDATE SET
    calendar_integration_enabled = p_enabled,
    google_calendar_access_token = COALESCE(p_access_token, user_settings.google_calendar_access_token),
    google_calendar_refresh_token = COALESCE(p_refresh_token, user_settings.google_calendar_refresh_token),
    google_calendar_token_expires_at = COALESCE(p_expires_at, user_settings.google_calendar_token_expires_at),
    default_calendar_id = COALESCE(p_calendar_id, user_settings.default_calendar_id),
    calendar_sync_enabled = p_enabled,
    updated_at = NOW();
END;
$$;

-- Function to update user timezone
CREATE OR REPLACE FUNCTION update_user_timezone(
  p_user_id UUID,
  p_timezone TEXT,
  p_auto_detect BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_id,
    timezone,
    timezone_auto_detect
  ) VALUES (
    p_user_id,
    p_timezone,
    p_auto_detect
  )
  ON CONFLICT (user_id) DO UPDATE SET
    timezone = p_timezone,
    timezone_auto_detect = p_auto_detect,
    updated_at = NOW();
END;
$$;

-- View for calendar-enabled users
CREATE OR REPLACE VIEW calendar_enabled_users
WITH (security_invoker = true)
AS
SELECT
  us.user_id,
  us.timezone,
  us.default_calendar_id,
  us.google_calendar_access_token,
  us.google_calendar_refresh_token,
  us.google_calendar_token_expires_at,
  us.ai_auto_calendar_events,
  p.display_name,
  p.avatar_url
FROM user_settings us
JOIN profiles p ON us.user_id = p.id
WHERE us.calendar_integration_enabled = TRUE
  AND us.calendar_sync_enabled = TRUE
  AND us.google_calendar_access_token IS NOT NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- User settings table ready for calendar integration ✅
-- =====================================================
```

### 1.3 Execute the SQL

1. Click **Run** button (bottom right)
2. Wait for "Success. No rows returned" message
3. If you see any errors, check the troubleshooting section below

---

## STEP 2: Apply Migration - Thoughts Table Enhancements

### 2.1 Open New SQL Query

1. Stay in **SQL Editor**
2. Click **New Query** again

### 2.2 Copy and Paste This SQL

```sql
-- =====================================================
-- MIGRATION 004: Add is_pinned column to thoughts table
-- Date: 2025-10-04
-- Purpose: Fix PGRST204 error - missing is_pinned column
-- =====================================================

-- Add is_pinned column to thoughts table
ALTER TABLE thoughts
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Add index for performance on pinned thoughts
CREATE INDEX IF NOT EXISTS idx_thoughts_pinned
ON thoughts(is_pinned)
WHERE is_pinned = TRUE;

-- Add title column (for Apple Notes compatibility)
ALTER TABLE thoughts
ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing records to extract title from content (first line)
UPDATE thoughts
SET title = SPLIT_PART(content, E'\n', 1)
WHERE title IS NULL;

-- Set default title for any remaining NULL titles
UPDATE thoughts
SET title = 'Untitled'
WHERE title IS NULL OR title = '';

-- Add NOT NULL constraint after populating data
ALTER TABLE thoughts
ALTER COLUMN title SET DEFAULT 'Untitled';

COMMENT ON COLUMN thoughts.is_pinned IS 'Whether the thought is pinned to top of list';
COMMENT ON COLUMN thoughts.title IS 'Thought title extracted from first line or user-defined';
```

### 2.3 Execute the SQL

1. Click **Run** button
2. Wait for success message
3. You should see "X rows affected" where X = number of existing thoughts

---

## STEP 3: Verify Migration Success

### 3.1 Run Verification Queries

Copy and paste each query below into a new SQL query and run them:

**Query 1: Check user_settings table exists**
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;
```
**Expected**: Should return 17 rows (all columns)

**Query 2: Check thoughts table columns**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'thoughts'
AND column_name IN ('title', 'is_pinned');
```
**Expected**: Should return 2 rows:
- title | text | YES | 'Untitled'::text
- is_pinned | boolean | YES | false

**Query 3: Check indexes created**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('user_settings', 'thoughts')
AND indexname IN ('idx_user_settings_user_id', 'idx_user_settings_calendar_enabled', 'idx_thoughts_pinned');
```
**Expected**: Should return 3 rows

**Query 4: Check RLS policies**
```sql
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'user_settings';
```
**Expected**: Should return 4 rows (SELECT, INSERT, UPDATE, DELETE)

**Query 5: Check functions created**
```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN ('get_or_create_user_settings', 'update_calendar_integration', 'update_user_timezone');
```
**Expected**: Should return 3 rows

**Query 6: Test sample insert (optional)**
```sql
-- This will create a settings row for current authenticated user
SELECT get_or_create_user_settings(auth.uid());
```
**Expected**: Should return your new user_settings row

---

## STEP 4: Run Automated Verification Script

Now let's run the Node.js verification script to do a full system check.

### 4.1 Install Dependencies (if needed)
```bash
cd D:\Projects\Cathcr
npm install @supabase/supabase-js dotenv
```

### 4.2 Run Verification Script
```bash
node verify-migration-004.js
```

**Expected Output**:
```
========================================
MIGRATION 004 VERIFICATION
========================================

✓ user_settings table exists
✓ user_settings has 17 columns
✓ thoughts.title column exists
✓ thoughts.is_pinned column exists
✓ idx_thoughts_pinned index exists
✓ idx_user_settings_user_id index exists
✓ idx_user_settings_calendar_enabled index exists
✓ get_or_create_user_settings function exists
✓ update_calendar_integration function exists
✓ update_user_timezone function exists
✓ calendar_enabled_users view exists
✓ user_settings RLS enabled
✓ 4 RLS policies on user_settings

========================================
MIGRATION 004: SUCCESS ✅
All components verified and working!
========================================
```

---

## Troubleshooting

### Error: "relation already exists"
**Solution**: This is safe to ignore. The migration uses `IF NOT EXISTS` checks.

### Error: "function update_updated_at_column() does not exist"
**Solution**: This function should have been created in migration 002. Run this:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "column 'title' already exists"
**Solution**: Safe to ignore. Column already exists from previous attempt.

### Error: "relation 'profiles' does not exist"
**Issue**: The calendar_enabled_users view references profiles table
**Solution**: Ensure profiles table exists from migration 001. If not, the view will fail but table creation will succeed.

---

## Rollback Plan (Emergency Only)

If you need to rollback these changes:

### Rollback user_settings table
```sql
-- Drop view
DROP VIEW IF EXISTS calendar_enabled_users;

-- Drop functions
DROP FUNCTION IF EXISTS get_or_create_user_settings(UUID);
DROP FUNCTION IF EXISTS update_calendar_integration(UUID, BOOLEAN, TEXT, TEXT, TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS update_user_timezone(UUID, TEXT, BOOLEAN);

-- Drop table (WARNING: This deletes all user settings data)
DROP TABLE IF EXISTS user_settings CASCADE;
```

### Rollback thoughts table changes
```sql
-- Remove columns (WARNING: This deletes title and is_pinned data)
ALTER TABLE thoughts DROP COLUMN IF EXISTS is_pinned;
ALTER TABLE thoughts DROP COLUMN IF EXISTS title;

-- Drop index
DROP INDEX IF EXISTS idx_thoughts_pinned;
```

---

## Post-Deployment Tasks

After successful migration:

1. **Update Application Code**
   - Deploy latest client/api code that uses these new columns
   - Ensure `useNotes.ts` references correct schema

2. **Test Calendar Integration**
   - Test Google Calendar OAuth flow
   - Verify token storage in user_settings
   - Test natural language event creation

3. **Test Pin Functionality**
   - Pin a thought in the UI
   - Verify it appears at top of list
   - Check database: `SELECT id, title, is_pinned FROM thoughts WHERE is_pinned = TRUE;`

4. **Monitor Logs**
   - Watch Supabase logs for any errors
   - Check Vercel deployment logs
   - Monitor client console for errors

---

## Next Steps

- [ ] Apply migrations in Supabase Dashboard
- [ ] Run verification script
- [ ] Deploy updated application code to Vercel
- [ ] Test calendar integration flow
- [ ] Test pin functionality
- [ ] Update CLAUDE.md with migration status

---

## Support

If you encounter any issues:
1. Check Supabase Dashboard > Database > Logs
2. Review error messages in SQL Editor
3. Run verification queries to identify what failed
4. Use rollback SQL if needed (backup first!)

**Migration Files Location**:
- `D:\Projects\Cathcr\supabase\migrations\004_user_settings_calendar.sql`
- `D:\Projects\Cathcr\supabase\migrations\004_add_is_pinned_to_thoughts.sql`
- `D:\Projects\Cathcr\verify-migration-004.js` (verification script)

---

**Ready to deploy? Follow steps 1-4 above. Good luck!**

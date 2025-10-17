# APPLY MIGRATION 004 - QUICK START

**Time Required**: 5 minutes
**Risk Level**: Low (safe IF NOT EXISTS checks)

---

## STEP 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your **Catchr** project
3. Click **SQL Editor** in left sidebar

---

## STEP 2: Run Migration - User Settings

Click **New Query** and paste this SQL:

```sql
-- MIGRATION 004A: User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_integration_enabled BOOLEAN DEFAULT FALSE,
  google_calendar_access_token TEXT,
  google_calendar_refresh_token TEXT,
  google_calendar_token_expires_at TIMESTAMPTZ,
  calendar_sync_enabled BOOLEAN DEFAULT FALSE,
  default_calendar_id TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  timezone_auto_detect BOOLEAN DEFAULT TRUE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  reminder_notifications_enabled BOOLEAN DEFAULT TRUE,
  ai_auto_categorization BOOLEAN DEFAULT TRUE,
  ai_confidence_threshold REAL DEFAULT 0.7 CHECK (ai_confidence_threshold >= 0 AND ai_confidence_threshold <= 1),
  ai_auto_calendar_events BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_calendar_enabled ON user_settings(calendar_integration_enabled) WHERE calendar_integration_enabled = TRUE;

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION get_or_create_user_settings(p_user_id UUID)
RETURNS user_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_settings user_settings;
BEGIN
  SELECT * INTO v_settings FROM public.user_settings WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.user_settings (user_id) VALUES (p_user_id) RETURNING * INTO v_settings;
  END IF;
  RETURN v_settings;
END;
$$;

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
    user_id, calendar_integration_enabled, google_calendar_access_token,
    google_calendar_refresh_token, google_calendar_token_expires_at,
    default_calendar_id, calendar_sync_enabled
  ) VALUES (
    p_user_id, p_enabled, p_access_token, p_refresh_token, p_expires_at, p_calendar_id, p_enabled
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
  INSERT INTO public.user_settings (user_id, timezone, timezone_auto_detect)
  VALUES (p_user_id, p_timezone, p_auto_detect)
  ON CONFLICT (user_id) DO UPDATE SET
    timezone = p_timezone,
    timezone_auto_detect = p_auto_detect,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE VIEW calendar_enabled_users
WITH (security_invoker = true)
AS
SELECT
  us.user_id, us.timezone, us.default_calendar_id,
  us.google_calendar_access_token, us.google_calendar_refresh_token,
  us.google_calendar_token_expires_at, us.ai_auto_calendar_events,
  p.display_name, p.avatar_url
FROM user_settings us
JOIN profiles p ON us.user_id = p.id
WHERE us.calendar_integration_enabled = TRUE
  AND us.calendar_sync_enabled = TRUE
  AND us.google_calendar_access_token IS NOT NULL;
```

Click **RUN**. Wait for "Success" message.

---

## STEP 3: Run Migration - Thoughts Enhancements

Click **New Query** again and paste this SQL:

```sql
-- MIGRATION 004B: Thoughts Table Enhancements
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS title TEXT;

CREATE INDEX IF NOT EXISTS idx_thoughts_pinned ON thoughts(is_pinned) WHERE is_pinned = TRUE;

UPDATE thoughts SET title = SPLIT_PART(content, E'\n', 1) WHERE title IS NULL;
UPDATE thoughts SET title = 'Untitled' WHERE title IS NULL OR title = '';

ALTER TABLE thoughts ALTER COLUMN title SET DEFAULT 'Untitled';

COMMENT ON COLUMN thoughts.is_pinned IS 'Whether the thought is pinned to top of list';
COMMENT ON COLUMN thoughts.title IS 'Thought title extracted from first line or user-defined';
```

Click **RUN**. Wait for "Success" message.

---

## STEP 4: Verify Success

### Quick Verification Queries

**Query 1: Check user_settings table**
```sql
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'user_settings';
```
**Expected**: `column_count = 17`

**Query 2: Check thoughts columns**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'thoughts'
AND column_name IN ('title', 'is_pinned');
```
**Expected**: 2 rows returned

---

## STEP 5: Run Automated Verification

Open your terminal and run:

```bash
cd D:\Projects\Cathcr
node verify-migration-004.js
```

**Expected Output**:
```
========================================
MIGRATION 004 VERIFICATION
========================================

✓ user_settings table exists
✓ user_settings has all required columns
✓ thoughts.title column exists
✓ thoughts.is_pinned column exists
✓ calendar_enabled_users view exists
✓ INSERT successful (134ms)

========================================
MIGRATION 004: SUCCESS ✅
All components verified and working!
========================================
```

---

## Troubleshooting

### Error: "function update_updated_at_column() does not exist"

**Fix**: Run this SQL first:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "relation 'profiles' does not exist"

**Fix**: The `calendar_enabled_users` view will fail, but tables will be created. You can ignore this if you don't have a profiles table, or create one:
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url TEXT
);
```

### Error: "column already exists"

**Solution**: Safe to ignore. Migration uses `IF NOT EXISTS` checks.

---

## Next Steps After Success

1. Deploy updated application code to Vercel
2. Test calendar integration OAuth flow
3. Test pin functionality in production UI
4. Monitor Supabase logs for any errors

---

## Rollback (Emergency Only)

If you need to undo the migration:

```sql
-- WARNING: This deletes data!
DROP VIEW IF EXISTS calendar_enabled_users;
DROP FUNCTION IF EXISTS get_or_create_user_settings(UUID);
DROP FUNCTION IF EXISTS update_calendar_integration(UUID, BOOLEAN, TEXT, TEXT, TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS update_user_timezone(UUID, TEXT, BOOLEAN);
DROP TABLE IF EXISTS user_settings CASCADE;

ALTER TABLE thoughts DROP COLUMN IF EXISTS is_pinned;
ALTER TABLE thoughts DROP COLUMN IF EXISTS title;
DROP INDEX IF EXISTS idx_thoughts_pinned;
```

---

## Files Reference

- **D:\Projects\Cathcr\supabase\migrations\004_user_settings_calendar.sql** - Full migration A
- **D:\Projects\Cathcr\supabase\migrations\004_add_is_pinned_to_thoughts.sql** - Full migration B
- **D:\Projects\Cathcr\verify-migration-004.js** - Automated verification script
- **D:\Projects\Cathcr\MIGRATION-004-DEPLOYMENT-GUIDE.md** - Detailed deployment guide

---

**Ready? Start with Step 1 above!**

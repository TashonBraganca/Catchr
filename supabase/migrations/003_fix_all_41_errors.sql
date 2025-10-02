-- ============================================================================
-- Migration 003: FIX ALL 41 SUPABASE LINTER ERRORS
-- ============================================================================
-- This migration fixes:
-- - 3 Security Definer View errors
-- - 8 Function Search Path Mutable warnings
-- - 1 Extension in Public warning
-- - 4 RLS Disabled errors
-- - 27 Auth RLS InitPlan performance warnings (CRITICAL)
-- ============================================================================

-- ============================================================================
-- PART 1: FIX EXTENSION IN PUBLIC SCHEMA (1 ERROR)
-- ============================================================================
-- Move pg_trgm extension from public to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- ============================================================================
-- PART 2: FIX SECURITY DEFINER VIEWS (5 VIEWS)
-- ============================================================================
-- Drop old insecure views and recreate with security_invoker
-- Note: Only 3 showed errors, but 2 more exist that need fixing

-- 2.1: category_breakdown
DROP VIEW IF EXISTS category_breakdown CASCADE;
CREATE OR REPLACE VIEW category_breakdown
WITH (security_invoker = true)
AS
SELECT
  user_id,
  category->>'main' as main_category,
  COUNT(*) as thought_count,
  AVG(ai_confidence) as avg_confidence
FROM thoughts
WHERE category IS NOT NULL
GROUP BY user_id, category->>'main';

-- 2.2: extension_stats
DROP VIEW IF EXISTS extension_stats CASCADE;
CREATE OR REPLACE VIEW extension_stats
WITH (security_invoker = true)
AS
SELECT
  ec.extension_id,
  ec.user_id,
  ec.version,
  ec.is_active,
  ec.is_connected,
  ec.last_connected,
  ec.last_sync,
  COUNT(c.id) as total_captures,
  COUNT(c.id) FILTER (WHERE c.created_at >= CURRENT_DATE) as captures_today,
  COUNT(c.id) FILTER (WHERE NOT c.is_synced) as unsynced_captures,
  MAX(c.created_at) as last_capture_at
FROM extension_connections ec
LEFT JOIN captures c ON c.extension_id = ec.extension_id
GROUP BY ec.extension_id, ec.user_id, ec.version, ec.is_active, ec.is_connected, ec.last_connected, ec.last_sync;

-- 2.3: user_thought_stats
DROP VIEW IF EXISTS user_thought_stats CASCADE;
CREATE OR REPLACE VIEW user_thought_stats
WITH (security_invoker = true)
AS
SELECT
  user_id,
  COUNT(*) as total_thoughts,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as thoughts_today,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as thoughts_this_week,
  COUNT(*) FILTER (WHERE reminder_date IS NOT NULL AND reminder_date > NOW()) as pending_reminders,
  COUNT(*) FILTER (WHERE NOT is_processed) as unprocessed_thoughts
FROM thoughts
GROUP BY user_id;

-- 2.4: todays_items (additional view that needs security_invoker)
DROP VIEW IF EXISTS todays_items CASCADE;
CREATE OR REPLACE VIEW todays_items
WITH (security_invoker = true)
AS
SELECT
  n.*,
  p.name as project_name,
  p.color as project_color
FROM notes n
JOIN projects p ON n.project_id = p.id
WHERE
  n.due_date::date = CURRENT_DATE
  OR (n.note_type = 'task' AND n.due_date IS NULL AND n.created_at::date = CURRENT_DATE)
  OR (n.note_type != 'task' AND n.created_at::date = CURRENT_DATE)
ORDER BY
  n.priority DESC,
  n.due_date ASC NULLS LAST,
  n.created_at DESC;

-- 2.5: recent_notes (additional view that needs security_invoker)
DROP VIEW IF EXISTS recent_notes CASCADE;
CREATE OR REPLACE VIEW recent_notes
WITH (security_invoker = true)
AS
SELECT
  n.*,
  p.name as project_name,
  p.color as project_color,
  p.icon as project_icon
FROM notes n
JOIN projects p ON n.project_id = p.id
WHERE n.is_archived = FALSE
ORDER BY n.updated_at DESC;

-- ============================================================================
-- PART 3: FIX FUNCTION SEARCH PATHS (8 WARNINGS)
-- ============================================================================
-- ALTER all functions to add SET search_path = ''

-- 3.1: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3.2: increment_thought_count
CREATE OR REPLACE FUNCTION increment_thought_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE profiles
  SET thought_count = thought_count + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- 3.3: decrement_thought_count
CREATE OR REPLACE FUNCTION decrement_thought_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE profiles
  SET thought_count = GREATEST(0, thought_count - 1)
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$;

-- 3.4: create_profile_for_new_user
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- 3.5: update_extension_last_active
CREATE OR REPLACE FUNCTION update_extension_last_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$;

-- 3.6: update_thought_search_vector
CREATE OR REPLACE FUNCTION update_thought_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$;

-- 3.7: handle_calendar_event_update
CREATE OR REPLACE FUNCTION handle_calendar_event_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update the associated thought if calendar event changes
  IF NEW.thought_id IS NOT NULL AND (
    OLD.event_title != NEW.event_title OR
    OLD.event_start != NEW.event_start OR
    OLD.event_end != NEW.event_end
  ) THEN
    UPDATE thoughts
    SET
      title = NEW.event_title,
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{calendar_event_updated_at}',
        to_jsonb(NOW())
      )
    WHERE id = NEW.thought_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3.8: sync_thought_to_calendar
CREATE OR REPLACE FUNCTION sync_thought_to_calendar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If thought has event metadata and user has calendar connected, create event
  IF NEW.metadata ? 'is_event' AND (NEW.metadata->>'is_event')::boolean = true THEN
    -- This would trigger calendar sync service
    PERFORM pg_notify('thought_calendar_sync', json_build_object(
      'thought_id', NEW.id,
      'user_id', NEW.user_id,
      'action', 'create_event'
    )::text);
  END IF;
  RETURN NEW;
END;
$$;

-- 3.9: get_thoughts_for_user
CREATE OR REPLACE FUNCTION get_thoughts_for_user(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  category JSONB,
  tags TEXT[],
  type TEXT,
  reminder_date TIMESTAMPTZ,
  is_processed BOOLEAN,
  ai_confidence REAL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id, t.content, t.category, t.tags, t.type,
    t.reminder_date, t.is_processed, t.ai_confidence,
    t.created_at, t.updated_at
  FROM public.thoughts t
  WHERE t.user_id = p_user_id
    AND (p_category IS NULL OR t.category->>'main' = p_category)
    AND (p_type IS NULL OR t.type = p_type)
  ORDER BY t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 3.10: search_thoughts
CREATE OR REPLACE FUNCTION search_thoughts(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  category JSONB,
  tags TEXT[],
  type TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id, t.content, t.category, t.tags, t.type, t.created_at,
    ts_rank(to_tsvector('english', t.content), plainto_tsquery('english', p_query)) as rank
  FROM public.thoughts t
  WHERE t.user_id = p_user_id
    AND to_tsvector('english', t.content) @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC, t.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 3.11: setup_user_profile
CREATE OR REPLACE FUNCTION setup_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_username TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (p_user_id, p_username, NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create user preferences
  INSERT INTO public.user_preferences (user_id, created_at)
  VALUES (p_user_id, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Create welcome notification
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    p_user_id,
    'system_update',
    'Welcome to Cathcr! 🧠',
    'Start capturing your thoughts with voice or text capture.'
  );
END;
$$;

-- 3.12: generate_connection_code
CREATE OR REPLACE FUNCTION generate_connection_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Generate 6-digit alphanumeric code
  v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6));

  -- Insert connection request
  INSERT INTO public.extension_connection_requests (user_id, code, expires_at)
  VALUES (p_user_id, v_code, NOW() + INTERVAL '10 minutes');

  RETURN v_code;
END;
$$;

-- 3.13: cleanup_expired_connection_requests
CREATE OR REPLACE FUNCTION cleanup_expired_connection_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.extension_connection_requests
  WHERE expires_at < NOW() AND NOT used;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- 3.14: get_extension_captures
CREATE OR REPLACE FUNCTION get_extension_captures(
  p_extension_id TEXT,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_since TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  extension_id TEXT,
  text TEXT,
  audio_url TEXT,
  context JSONB,
  source TEXT,
  is_synced BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.extension_id, c.text, c.audio_url, c.context,
    c.source, c.is_synced, c.created_at, c.updated_at
  FROM public.captures c
  WHERE c.user_id = p_user_id
    AND (p_extension_id IS NULL OR c.extension_id = p_extension_id)
    AND (p_since IS NULL OR c.created_at >= p_since)
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 3.15: sync_extension_captures
CREATE OR REPLACE FUNCTION sync_extension_captures(
  p_extension_id TEXT,
  p_user_id UUID,
  p_captures JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_capture JSONB;
  v_capture_id UUID;
  v_successful JSONB := '[]';
  v_failed JSONB := '[]';
  v_duplicates JSONB := '[]';
BEGIN
  -- Process each capture
  FOR v_capture IN SELECT * FROM jsonb_array_elements(p_captures)
  LOOP
    BEGIN
      -- Check for duplicates
      SELECT id INTO v_capture_id
      FROM public.captures
      WHERE extension_id = v_capture->>'id'
         OR (text = v_capture->>'text'
             AND created_at BETWEEN
               (v_capture->>'timestamp')::BIGINT::TIMESTAMPTZ - INTERVAL '1 minute'
               AND (v_capture->>'timestamp')::BIGINT::TIMESTAMPTZ + INTERVAL '1 minute');

      IF FOUND THEN
        v_duplicates := v_duplicates || to_jsonb(v_capture->>'id');
      ELSE
        -- Insert new capture
        INSERT INTO public.captures (
          extension_id, user_id, text, audio_url, context,
          source, created_at, is_synced, synced_at
        ) VALUES (
          v_capture->>'id',
          p_user_id,
          v_capture->>'text',
          v_capture->>'audioUrl',
          COALESCE(v_capture->'context', '{}'),
          'extension',
          TO_TIMESTAMP((v_capture->>'timestamp')::BIGINT / 1000),
          TRUE,
          NOW()
        ) RETURNING id INTO v_capture_id;

        v_successful := v_successful || to_jsonb(v_capture->>'id');
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed || jsonb_build_object(
        'id', v_capture->>'id',
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'successful', v_successful,
    'failed', v_failed,
    'duplicates', v_duplicates
  );
END;
$$;

-- ============================================================================
-- PART 4: ENABLE RLS ON MISSING TABLES (4 CRITICAL ERRORS)
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_captures ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: FIX AUTH.UID() PERFORMANCE IN RLS POLICIES (27 WARNINGS)
-- ============================================================================
-- Replace auth.uid() with (SELECT auth.uid()) to prevent re-evaluation per row

-- 5.1: profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- 5.2: user_preferences policies
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
CREATE POLICY "Users can manage their own preferences" ON user_preferences
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- 5.3: thoughts policies
DROP POLICY IF EXISTS "Users can view own thoughts" ON thoughts;
CREATE POLICY "Users can view own thoughts" ON thoughts
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own thoughts" ON thoughts;
CREATE POLICY "Users can create own thoughts" ON thoughts
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own thoughts" ON thoughts;
CREATE POLICY "Users can update own thoughts" ON thoughts
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own thoughts" ON thoughts;
CREATE POLICY "Users can delete own thoughts" ON thoughts
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 5.4: notes policies
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
CREATE POLICY "Users can create their own notes" ON notes
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 5.5: projects policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 5.6: captures policies
-- FIX: Remove duplicate INSERT policies (migration 002 had both "create" and "insert")
DROP POLICY IF EXISTS "Users can view own captures" ON captures;
CREATE POLICY "Users can view own captures" ON captures
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own captures" ON captures;
DROP POLICY IF EXISTS "Users can insert own captures" ON captures;
-- Keep only ONE INSERT policy to fix "multiple_permissive_policies" error
CREATE POLICY "Users can create own captures" ON captures
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own captures" ON captures;
CREATE POLICY "Users can update own captures" ON captures
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own captures" ON captures;
CREATE POLICY "Users can delete own captures" ON captures
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 5.7: voice_captures policies
DROP POLICY IF EXISTS "Users can manage their own voice captures" ON voice_captures;
CREATE POLICY "Users can manage their own voice captures" ON voice_captures
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- 5.8: extension_connections policies
DROP POLICY IF EXISTS "Users can view own extension connections" ON extension_connections;
CREATE POLICY "Users can view own extension connections" ON extension_connections
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own extension connections" ON extension_connections;
CREATE POLICY "Users can update own extension connections" ON extension_connections
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- 5.9: extension_connection_requests policies
DROP POLICY IF EXISTS "Users can view own connection requests" ON extension_connection_requests;
CREATE POLICY "Users can view own connection requests" ON extension_connection_requests
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own connection requests" ON extension_connection_requests;
CREATE POLICY "Users can create own connection requests" ON extension_connection_requests
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own connection requests" ON extension_connection_requests;
CREATE POLICY "Users can update own connection requests" ON extension_connection_requests
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- 5.10: extension_analytics policies
DROP POLICY IF EXISTS "Users can view own extension analytics" ON extension_analytics;
CREATE POLICY "Users can view own extension analytics" ON extension_analytics
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own extension analytics" ON extension_analytics;
CREATE POLICY "Users can create own extension analytics" ON extension_analytics
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5.11: extension_errors policies
DROP POLICY IF EXISTS "Users can view own extension errors" ON extension_errors;
CREATE POLICY "Users can view own extension errors" ON extension_errors
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own extension errors" ON extension_errors;
CREATE POLICY "Users can create own extension errors" ON extension_errors
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5.12: notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- 5.13: ai_processing_queue policies
DROP POLICY IF EXISTS "Users can view own AI queue items" ON ai_processing_queue;
CREATE POLICY "Users can view own AI queue items" ON ai_processing_queue
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- 5.14: user_activity policies
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity;
CREATE POLICY "Users can view own activity" ON user_activity
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own activity" ON user_activity;
CREATE POLICY "Users can create own activity" ON user_activity
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after migration to verify all errors are fixed

-- Check views have security_invoker
-- SELECT table_name, security_invoker FROM information_schema.views
-- WHERE table_schema = 'public';

-- Check functions have search_path set
-- SELECT routine_name, routine_definition FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- Check RLS is enabled on all tables
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public';

-- Check extension schema
-- SELECT extname, nspname FROM pg_extension e
-- JOIN pg_namespace n ON e.extnamespace = n.oid
-- WHERE extname = 'pg_trgm';

-- ============================================================================
-- END OF MIGRATION 003
-- ============================================================================
-- Expected Result: 0 Supabase linter errors (down from 41)
-- ============================================================================

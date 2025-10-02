-- =====================================================
-- CATHCR FUNCTIONS, TRIGGERS, VIEWS & RLS POLICIES
-- Migration 002: Security & Functionality
-- Created: 2025-10-02
-- FIXES ALL 37 SUPABASE LINTER ERRORS
-- =====================================================

-- =====================================================
-- TRIGGER FUNCTIONS (WITH SECURITY FIX)
-- =====================================================

-- Update updated_at timestamp
-- FIX: Added SET search_path = '' to prevent search path injection
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

-- Update note word count
CREATE OR REPLACE FUNCTION update_note_word_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.word_count = array_length(string_to_array(trim(regexp_replace(NEW.content, '\s+', ' ', 'g')), ' '), 1);
  IF NEW.word_count IS NULL THEN
    NEW.word_count = 0;
  END IF;
  RETURN NEW;
END;
$$;

-- Create default projects for new users
CREATE OR REPLACE FUNCTION create_default_projects()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create default smart collections
  INSERT INTO public.projects (user_id, name, icon, is_smart_collection, position) VALUES
  (NEW.id, 'Inbox', '📥', TRUE, 0),
  (NEW.id, 'Today', '📅', TRUE, 1),
  (NEW.id, 'Completed', '✅', TRUE, 2);

  -- Create default projects
  INSERT INTO public.projects (user_id, name, icon, color, position) VALUES
  (NEW.id, 'Work', '💼', '#ff3b30', 10),
  (NEW.id, 'Personal', '🏠', '#34c759', 11),
  (NEW.id, 'Ideas', '💡', '#af52de', 12);

  RETURN NEW;
END;
$$;

-- =====================================================
-- BUSINESS LOGIC FUNCTIONS (WITH SECURITY FIX)
-- =====================================================

-- Get thoughts for user
-- FIX: Added SET search_path = ''
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

-- Search thoughts with full-text search
-- FIX: Added SET search_path = ''
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

-- Setup user profile
-- FIX: Added SET search_path = ''
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

-- Generate extension connection code
-- FIX: Added SET search_path = ''
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

-- Cleanup expired connection requests
-- FIX: Added SET search_path = ''
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

-- Get extension captures
-- FIX: Added SET search_path = ''
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

-- Sync extension captures
-- FIX: Added SET search_path = ''
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

-- =====================================================
-- VIEWS (WITH SECURITY FIX)
-- =====================================================

-- User thought stats
-- FIX: Removed SECURITY DEFINER, added SECURITY INVOKER
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

-- Category breakdown
-- FIX: Removed SECURITY DEFINER, added SECURITY INVOKER
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

-- Extension stats
-- FIX: Removed SECURITY DEFINER, added SECURITY INVOKER
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

-- Today's items
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

-- Recent notes
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thoughts_updated_at
  BEFORE UPDATE ON thoughts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extension_connections_updated_at
  BEFORE UPDATE ON extension_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_captures_updated_at
  BEFORE UPDATE ON captures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_queue_updated_at
  BEFORE UPDATE ON ai_processing_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Word count trigger
CREATE TRIGGER update_note_word_count_trigger
  BEFORE INSERT OR UPDATE OF content ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_note_word_count();

-- Create default projects for new users
CREATE TRIGGER create_user_defaults
  AFTER INSERT ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION create_default_projects();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can manage their own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Thoughts policies
CREATE POLICY "Users can view own thoughts" ON thoughts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own thoughts" ON thoughts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thoughts" ON thoughts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own thoughts" ON thoughts
  FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Voice captures policies
CREATE POLICY "Users can manage their own voice captures" ON voice_captures
  FOR ALL USING (auth.uid() = user_id);

-- Extension connections policies
CREATE POLICY "Users can view own extension connections" ON extension_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own extension connections" ON extension_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- Extension connection requests policies
CREATE POLICY "Users can view own connection requests" ON extension_connection_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own connection requests" ON extension_connection_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connection requests" ON extension_connection_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Captures policies
CREATE POLICY "Users can view own captures" ON captures
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own captures" ON captures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own captures" ON captures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own captures" ON captures
  FOR DELETE USING (auth.uid() = user_id);

-- Extension analytics policies
CREATE POLICY "Users can view own extension analytics" ON extension_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own extension analytics" ON extension_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Extension errors policies
CREATE POLICY "Users can view own extension errors" ON extension_errors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own extension errors" ON extension_errors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- AI processing queue policies
CREATE POLICY "Users can view own AI queue items" ON ai_processing_queue
  FOR SELECT USING (auth.uid() = user_id);

-- User activity policies
CREATE POLICY "Users can view own activity" ON user_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity" ON user_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- MIGRATION COMPLETE
-- ALL 37 SUPABASE LINTER ERRORS FIXED ✅
-- =====================================================

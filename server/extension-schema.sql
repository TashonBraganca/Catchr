-- Extension Integration Schema for CATHCR
-- This file extends the main schema to support Chrome extension connectivity

-- Extension connections table
CREATE TABLE extension_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  extension_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  token TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_connected BOOLEAN DEFAULT FALSE,
  last_connected TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extension connection requests table (for secure pairing)
CREATE TABLE extension_connection_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captures table (renamed from thoughts for extension clarity)
CREATE TABLE captures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  extension_id TEXT, -- For tracking extension captures
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (length(text) >= 1 AND length(text) <= 10000),
  audio_url TEXT,
  context JSONB DEFAULT '{}', -- Page URL, title, etc.
  source TEXT DEFAULT 'unknown' CHECK (source IN ('web', 'extension', 'api', 'mobile')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}', -- Extension version, user agent, etc.
  is_synced BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extension analytics table
CREATE TABLE extension_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  extension_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('capture_created', 'sync_completed', 'error_occurred', 'feature_used')),
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extension error logs table
CREATE TABLE extension_errors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  extension_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  error_code TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  user_agent TEXT,
  extension_version TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_extension_connections_extension_id ON extension_connections(extension_id);
CREATE INDEX idx_extension_connections_user_id ON extension_connections(user_id);
CREATE INDEX idx_extension_connections_is_active ON extension_connections(is_active);
CREATE INDEX idx_extension_connections_last_sync ON extension_connections(last_sync);

CREATE INDEX idx_extension_requests_code ON extension_connection_requests(code);
CREATE INDEX idx_extension_requests_user_id ON extension_connection_requests(user_id);
CREATE INDEX idx_extension_requests_expires_at ON extension_connection_requests(expires_at);

CREATE INDEX idx_captures_extension_id ON captures(extension_id);
CREATE INDEX idx_captures_user_id ON captures(user_id);
CREATE INDEX idx_captures_source ON captures(source);
CREATE INDEX idx_captures_is_synced ON captures(is_synced);
CREATE INDEX idx_captures_created_at ON captures(created_at DESC);
CREATE INDEX idx_captures_text_search ON captures USING gin(to_tsvector('english', text));

CREATE INDEX idx_extension_analytics_extension_id ON extension_analytics(extension_id);
CREATE INDEX idx_extension_analytics_user_id ON extension_analytics(user_id);
CREATE INDEX idx_extension_analytics_event_type ON extension_analytics(event_type);
CREATE INDEX idx_extension_analytics_created_at ON extension_analytics(created_at DESC);

CREATE INDEX idx_extension_errors_extension_id ON extension_errors(extension_id);
CREATE INDEX idx_extension_errors_resolved ON extension_errors(resolved);
CREATE INDEX idx_extension_errors_created_at ON extension_errors(created_at DESC);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_extension_connections_updated_at
    BEFORE UPDATE ON extension_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_captures_updated_at
    BEFORE UPDATE ON captures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE extension_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_errors ENABLE ROW LEVEL SECURITY;

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

-- Views for extension management
CREATE OR REPLACE VIEW extension_stats AS
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

-- Functions for extension operations
CREATE OR REPLACE FUNCTION generate_connection_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Generate 6-digit alphanumeric code
  v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6));

  -- Insert connection request
  INSERT INTO extension_connection_requests (user_id, code, expires_at)
  VALUES (p_user_id, v_code, NOW() + INTERVAL '10 minutes');

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_connection_requests()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM extension_connection_requests
  WHERE expires_at < NOW() AND NOT used;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.extension_id, c.text, c.audio_url, c.context,
    c.source, c.is_synced, c.created_at, c.updated_at
  FROM captures c
  WHERE c.user_id = p_user_id
    AND (p_extension_id IS NULL OR c.extension_id = p_extension_id)
    AND (p_since IS NULL OR c.created_at >= p_since)
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync captures from extension
CREATE OR REPLACE FUNCTION sync_extension_captures(
  p_extension_id TEXT,
  p_user_id UUID,
  p_captures JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_capture JSONB;
  v_capture_id UUID;
  v_result JSONB := '{"successful": [], "failed": [], "duplicates": []}';
  v_successful JSONB := '[]';
  v_failed JSONB := '[]';
  v_duplicates JSONB := '[]';
BEGIN
  -- Process each capture in the array
  FOR v_capture IN SELECT * FROM jsonb_array_elements(p_captures)
  LOOP
    BEGIN
      -- Check for existing capture
      SELECT id INTO v_capture_id
      FROM captures
      WHERE extension_id = v_capture->>'id'
         OR (text = v_capture->>'text'
             AND created_at BETWEEN
               (v_capture->>'timestamp')::BIGINT::TIMESTAMPTZ - INTERVAL '1 minute'
               AND (v_capture->>'timestamp')::BIGINT::TIMESTAMPTZ + INTERVAL '1 minute');

      IF FOUND THEN
        -- Duplicate found
        v_duplicates := v_duplicates || to_jsonb(v_capture->>'id');
      ELSE
        -- Insert new capture
        INSERT INTO captures (
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
      -- Capture failed
      v_failed := v_failed || jsonb_build_object(
        'id', v_capture->>'id',
        'error', SQLERRM
      );
    END;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'successful', v_successful,
    'failed', v_failed,
    'duplicates', v_duplicates
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
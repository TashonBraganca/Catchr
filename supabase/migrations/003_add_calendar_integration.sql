-- GOOGLE CALENDAR INTEGRATION TABLE
-- Stores OAuth tokens and calendar settings for users

CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL, -- 'google_calendar', 'todoist', etc.

  -- OAuth tokens
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,

  -- Service-specific settings
  scopes TEXT[],
  settings JSONB DEFAULT '{}'::jsonb,

  -- Sync status
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one integration per user per service
  UNIQUE(user_id, service)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_service
  ON user_integrations(user_id, service);

-- Row Level Security
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own integrations
CREATE POLICY user_integrations_policy ON user_integrations
  FOR ALL
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_integrations_updated_at();

-- Comments for documentation
COMMENT ON TABLE user_integrations IS 'Stores third-party service integrations (Google Calendar, Todoist, etc.) with OAuth tokens';
COMMENT ON COLUMN user_integrations.service IS 'Service identifier: google_calendar, todoist, notion, etc.';
COMMENT ON COLUMN user_integrations.access_token IS 'OAuth2 access token (encrypted in production)';
COMMENT ON COLUMN user_integrations.refresh_token IS 'OAuth2 refresh token for token renewal';
COMMENT ON COLUMN user_integrations.token_expiry IS 'When the access token expires';
COMMENT ON COLUMN user_integrations.scopes IS 'Array of OAuth scopes granted';
COMMENT ON COLUMN user_integrations.settings IS 'Service-specific settings (calendar ID, sync preferences, etc.)';

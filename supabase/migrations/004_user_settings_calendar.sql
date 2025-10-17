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

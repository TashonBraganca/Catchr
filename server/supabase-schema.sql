-- Cathcr Database Schema for Supabase
-- This file contains the database schema for the Cathcr thought capture application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  preferences JSONB DEFAULT '{
    "defaultCategories": ["ideas", "reminders", "notes"],
    "notificationSettings": {
      "reminders": true,
      "dailyDigest": false,
      "weeklyReview": false
    },
    "aiSettings": {
      "autoCategory": true,
      "confidenceThreshold": 0.7,
      "personalizedPrompts": true
    },
    "theme": "auto"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thoughts table - main entity for storing user thoughts
CREATE TABLE thoughts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 5000),
  transcribed_text TEXT,
  audio_url TEXT,
  category JSONB DEFAULT '{
    "main": "uncategorized",
    "subcategory": null,
    "color": "#6B7280",
    "icon": "📝"
  }'::jsonb,
  tags TEXT[] DEFAULT '{}',
  type TEXT DEFAULT 'note' CHECK (type IN ('idea', 'reminder', 'project', 'note', 'brainstorm')),
  reminder_date TIMESTAMPTZ,
  is_processed BOOLEAN DEFAULT FALSE,
  processed_by_ai TIMESTAMPTZ,
  ai_confidence REAL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ai_suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'daily_digest', 'weekly_review', 'ai_processing_complete', 'system_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  thought_id UUID REFERENCES thoughts(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI processing queue table (for background processing)
CREATE TABLE ai_processing_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_type TEXT NOT NULL CHECK (processing_type IN ('categorization', 'reminder_extraction', 'expansion_suggestions')),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity log for analytics
CREATE TABLE user_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('thought_created', 'thought_updated', 'thought_deleted', 'login', 'export', 'search')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX idx_thoughts_created_at ON thoughts(created_at DESC);
CREATE INDEX idx_thoughts_type ON thoughts(type);
CREATE INDEX idx_thoughts_is_processed ON thoughts(is_processed);
CREATE INDEX idx_thoughts_reminder_date ON thoughts(reminder_date) WHERE reminder_date IS NOT NULL;
CREATE INDEX idx_thoughts_audio_url ON thoughts(audio_url) WHERE audio_url IS NOT NULL;
CREATE INDEX idx_thoughts_content_search ON thoughts USING gin(to_tsvector('english', content));
CREATE INDEX idx_thoughts_tags ON thoughts USING gin(tags);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE INDEX idx_ai_queue_status ON ai_processing_queue(status);
CREATE INDEX idx_ai_queue_user_id ON ai_processing_queue(user_id);

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at DESC);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thoughts_updated_at
    BEFORE UPDATE ON thoughts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_queue_updated_at
    BEFORE UPDATE ON ai_processing_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
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

-- Thoughts policies
CREATE POLICY "Users can view own thoughts" ON thoughts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own thoughts" ON thoughts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thoughts" ON thoughts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own thoughts" ON thoughts
  FOR DELETE USING (auth.uid() = user_id);

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

-- Views for common queries
CREATE OR REPLACE VIEW user_thought_stats AS
SELECT 
  user_id,
  COUNT(*) as total_thoughts,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as thoughts_today,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as thoughts_this_week,
  COUNT(*) FILTER (WHERE reminder_date IS NOT NULL AND reminder_date > NOW()) as pending_reminders,
  COUNT(*) FILTER (WHERE NOT is_processed) as unprocessed_thoughts
FROM thoughts
GROUP BY user_id;

CREATE OR REPLACE VIEW category_breakdown AS
SELECT 
  user_id,
  category->>'main' as main_category,
  COUNT(*) as thought_count,
  AVG(ai_confidence) as avg_confidence
FROM thoughts
WHERE category IS NOT NULL
GROUP BY user_id, category->>'main';

-- Functions for common operations
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.content, t.category, t.tags, t.type, 
    t.reminder_date, t.is_processed, t.ai_confidence,
    t.created_at, t.updated_at
  FROM thoughts t
  WHERE t.user_id = p_user_id
    AND (p_category IS NULL OR t.category->>'main' = p_category)
    AND (p_type IS NULL OR t.type = p_type)
  ORDER BY t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search thoughts with full-text search
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.content, t.category, t.tags, t.type, t.created_at,
    ts_rank(to_tsvector('english', t.content), plainto_tsquery('english', p_query)) as rank
  FROM thoughts t
  WHERE t.user_id = p_user_id
    AND to_tsvector('english', t.content) @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC, t.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial data setup function (run after user signup)
CREATE OR REPLACE FUNCTION setup_user_profile(p_user_id UUID, p_email TEXT, p_username TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profiles (id, username, created_at)
  VALUES (p_user_id, p_username, NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Create welcome notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    p_user_id, 
    'system_update', 
    'Welcome to Cathcr! 🧠',
    'Start capturing your thoughts with Ctrl+Shift+C or click the capture button.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
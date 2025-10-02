-- =====================================================
-- CATHCR COMPLETE DATABASE SCHEMA
-- Migration 001: Initial Schema
-- Created: 2025-10-02
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA extensions;

-- =====================================================
-- USER PROFILES & PREFERENCES
-- =====================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
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

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  sidebar_collapsed BOOLEAN DEFAULT FALSE,
  default_project_id UUID,
  quick_capture_shortcut TEXT DEFAULT 'cmd+k',
  voice_enabled BOOLEAN DEFAULT TRUE,
  ai_categorization_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROJECT ORGANIZATION (TODOIST INSPIRED)
-- =====================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#007aff',
  icon TEXT DEFAULT '📁',
  position INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  is_smart_collection BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTES & THOUGHTS
-- =====================================================

-- Thoughts table (main entity for voice captures and thoughts)
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 10000),
  transcribed_text TEXT,
  audio_url TEXT,
  audio_path TEXT,
  audio_duration INTEGER,
  category JSONB DEFAULT '{
    "main": "uncategorized",
    "subcategory": null,
    "color": "#6B7280",
    "icon": "📝"
  }'::jsonb,
  tags TEXT[] DEFAULT '{}',
  type TEXT DEFAULT 'note' CHECK (type IN ('idea', 'reminder', 'project', 'note', 'brainstorm', 'task')),
  reminder_date TIMESTAMPTZ,
  is_processed BOOLEAN DEFAULT FALSE,
  processed_by_ai TIMESTAMPTZ,
  ai_confidence REAL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ai_suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table (Apple Notes style)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT DEFAULT '',
  note_type TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'task', 'idea', 'voice_note')),
  is_completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 4),
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  word_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice captures table
CREATE TABLE IF NOT EXISTS voice_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  audio_file_url TEXT NOT NULL,
  audio_duration INTEGER,
  audio_format TEXT DEFAULT 'wav',
  transcript_text TEXT,
  transcript_confidence REAL,
  processing_status TEXT DEFAULT 'pending' CHECK (
    processing_status IN ('pending', 'processing', 'completed', 'failed')
  ),
  ai_category TEXT,
  ai_suggested_title TEXT,
  ai_suggested_tags TEXT[],
  ai_confidence REAL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- =====================================================
-- EXTENSION & CAPTURE SYSTEM
-- =====================================================

-- Extension connections
CREATE TABLE IF NOT EXISTS extension_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  extension_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Extension connection requests (for secure pairing)
CREATE TABLE IF NOT EXISTS extension_connection_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captures table (from extension)
CREATE TABLE IF NOT EXISTS captures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  extension_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (length(text) >= 1 AND length(text) <= 10000),
  audio_url TEXT,
  context JSONB DEFAULT '{}',
  source TEXT DEFAULT 'unknown' CHECK (source IN ('web', 'extension', 'api', 'mobile')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_synced BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extension analytics
CREATE TABLE IF NOT EXISTS extension_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  extension_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('capture_created', 'sync_completed', 'error_occurred', 'feature_used')),
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extension errors
CREATE TABLE IF NOT EXISTS extension_errors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  extension_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- =====================================================
-- NOTIFICATIONS & PROCESSING
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'daily_digest', 'weekly_review', 'ai_processing_complete', 'system_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  thought_id UUID REFERENCES thoughts(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI processing queue
CREATE TABLE IF NOT EXISTS ai_processing_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_type TEXT NOT NULL CHECK (processing_type IN ('categorization', 'reminder_extraction', 'expansion_suggestions')),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('thought_created', 'thought_updated', 'thought_deleted', 'login', 'export', 'search')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Thoughts indexes
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON thoughts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thoughts_type ON thoughts(type);
CREATE INDEX IF NOT EXISTS idx_thoughts_is_processed ON thoughts(is_processed);
CREATE INDEX IF NOT EXISTS idx_thoughts_reminder_date ON thoughts(reminder_date) WHERE reminder_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_thoughts_content_search ON thoughts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_thoughts_tags ON thoughts USING gin(tags);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(note_type);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_due_date ON notes(due_date) WHERE due_date IS NOT NULL;

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_position ON projects(position);

-- Voice captures indexes
CREATE INDEX IF NOT EXISTS idx_voice_captures_user_id ON voice_captures(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_captures_status ON voice_captures(processing_status);

-- Extension indexes
CREATE INDEX IF NOT EXISTS idx_extension_connections_extension_id ON extension_connections(extension_id);
CREATE INDEX IF NOT EXISTS idx_extension_connections_user_id ON extension_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_requests_code ON extension_connection_requests(code);
CREATE INDEX IF NOT EXISTS idx_extension_requests_user_id ON extension_connection_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_captures_user_id ON captures(user_id);
CREATE INDEX IF NOT EXISTS idx_captures_source ON captures(source);
CREATE INDEX IF NOT EXISTS idx_captures_text_search ON captures USING gin(to_tsvector('english', text));

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- AI queue indexes
CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON ai_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_queue_user_id ON ai_processing_queue(user_id);

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);

-- =====================================================
-- COMMENTS COMPLETE - Ready for migration!
-- =====================================================

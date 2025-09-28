-- =====================================================
-- SIMPLIFIED NOTES APP SCHEMA
-- Apple Notes + Todoist + Google Keep Inspired
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE USER SYSTEM
-- =====================================================

-- Table: users (extends Supabase auth.users)
-- Additional user preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    default_project_id UUID,
    quick_capture_shortcut TEXT DEFAULT 'cmd+k',
    voice_enabled BOOLEAN DEFAULT TRUE,
    ai_categorization_enabled BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROJECT ORGANIZATION (TODOIST INSPIRED)
-- =====================================================

-- Table: projects
-- Hierarchical project organization like Todoist
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#007aff', -- Apple Blue default
    icon TEXT DEFAULT '📁',
    position INTEGER NOT NULL DEFAULT 0, -- For manual ordering
    parent_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- For hierarchy
    is_smart_collection BOOLEAN DEFAULT FALSE, -- Inbox, Today, Completed
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create smart collections for each user (trigger function)
CREATE OR REPLACE FUNCTION create_default_projects()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default smart collections
    INSERT INTO projects (user_id, name, icon, is_smart_collection, position) VALUES
    (NEW.id, 'Inbox', '📥', TRUE, 0),
    (NEW.id, 'Today', '📅', TRUE, 1),
    (NEW.id, 'Completed', '✅', TRUE, 2);

    -- Create default projects
    INSERT INTO projects (user_id, name, icon, color, position) VALUES
    (NEW.id, 'Work', '💼', '#ff3b30', 10),
    (NEW.id, 'Personal', '🏠', '#34c759', 11),
    (NEW.id, 'Ideas', '💡', '#af52de', 12);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default projects for new users
CREATE TRIGGER create_user_defaults
    AFTER INSERT ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION create_default_projects();

-- =====================================================
-- NOTES SYSTEM (APPLE NOTES + GOOGLE KEEP INSPIRED)
-- =====================================================

-- Table: notes
-- Core notes storage with Apple Notes simplicity
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content TEXT DEFAULT '',
    note_type TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'task', 'idea', 'voice_note')),

    -- Task-specific fields (Todoist inspired)
    is_completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 4), -- P1-P4 like Todoist

    -- Organization fields
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Metadata
    word_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VOICE CAPTURE SYSTEM (GOOGLE KEEP INSPIRED)
-- =====================================================

-- Table: voice_captures
-- Simple voice transcription storage
CREATE TABLE IF NOT EXISTS voice_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE, -- Link to created note

    -- Audio storage
    audio_file_url TEXT NOT NULL, -- Supabase storage URL
    audio_duration INTEGER, -- Duration in seconds
    audio_format TEXT DEFAULT 'wav',

    -- Transcription
    transcript_text TEXT,
    transcript_confidence REAL, -- 0.0 to 1.0
    processing_status TEXT DEFAULT 'pending' CHECK (
        processing_status IN ('pending', 'processing', 'completed', 'failed')
    ),

    -- AI Processing (GPT-5-mini)
    ai_category TEXT,
    ai_suggested_title TEXT,
    ai_suggested_tags TEXT[],
    ai_confidence REAL, -- 0.0 to 1.0

    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- SEARCH AND INDEXING
-- =====================================================

-- Full-text search on notes
CREATE INDEX idx_notes_search ON notes USING gin(to_tsvector('english', title || ' ' || content));

-- Performance indexes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_project_id ON notes(project_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_notes_tags ON notes USING gin(tags);
CREATE INDEX idx_notes_type ON notes(note_type);
CREATE INDEX idx_notes_pinned ON notes(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_notes_due_date ON notes(due_date) WHERE due_date IS NOT NULL;

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_position ON projects(position);

CREATE INDEX idx_voice_captures_user_id ON voice_captures(user_id);
CREATE INDEX idx_voice_captures_status ON voice_captures(processing_status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_captures ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update word count on note content change
CREATE OR REPLACE FUNCTION update_note_word_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.word_count = array_length(string_to_array(trim(regexp_replace(NEW.content, '\s+', ' ', 'g')), ' '), 1);
    IF NEW.word_count IS NULL THEN
        NEW.word_count = 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_note_word_count_trigger BEFORE INSERT OR UPDATE OF content ON notes
    FOR EACH ROW EXECUTE FUNCTION update_note_word_count();

-- Function: Update last_accessed_at when note is viewed
CREATE OR REPLACE FUNCTION update_note_access()
RETURNS VOID AS $$
BEGIN
    -- This will be called from the application when a note is opened
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Today's tasks and notes
CREATE OR REPLACE VIEW todays_items AS
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

-- View: Overdue tasks
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT
    n.*,
    p.name as project_name,
    p.color as project_color
FROM notes n
JOIN projects p ON n.project_id = p.id
WHERE
    n.note_type = 'task'
    AND n.is_completed = FALSE
    AND n.due_date < NOW()
ORDER BY n.due_date ASC;

-- View: Recent notes with project info
CREATE OR REPLACE VIEW recent_notes AS
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
-- INITIAL DATA SETUP
-- =====================================================

-- This would be handled by the trigger when users sign up
-- Default projects and smart collections are created automatically

-- =====================================================
-- CLEANUP OLD SCHEMA (if needed)
-- =====================================================

-- Drop cognitive insights tables if they exist
-- DROP TABLE IF EXISTS predictive_suggestions CASCADE;
-- DROP TABLE IF EXISTS thought_connections CASCADE;
-- DROP TABLE IF EXISTS intelligent_reminders CASCADE;
-- DROP TABLE IF EXISTS insight_reports CASCADE;
-- DROP TABLE IF EXISTS thinking_patterns CASCADE;
-- DROP TABLE IF EXISTS user_context_history CASCADE;
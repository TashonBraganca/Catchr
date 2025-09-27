# Database Schema

Cathcr uses Supabase (PostgreSQL) as its primary database with Row Level Security (RLS) for data isolation and real-time subscriptions for live updates.

## Schema Overview

The database schema is designed around thought capture, organization, and AI processing with strong user data isolation.

## Core Tables

### users
Extends Supabase's built-in auth.users table with additional profile information.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- `idx_users_username` on `username`
- `idx_users_email` on `email`

### thoughts
Core table for storing captured thoughts and their metadata.

```sql
CREATE TABLE public.thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  title VARCHAR(255),
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  is_reminder BOOLEAN DEFAULT false,
  reminder_date TIMESTAMP WITH TIME ZONE,
  confidence_score DECIMAL(3,2),
  processing_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- `idx_thoughts_user_id` on `user_id`
- `idx_thoughts_category` on `category`
- `idx_thoughts_status` on `status`
- `idx_thoughts_created_at` on `created_at`
- `idx_thoughts_reminder_date` on `reminder_date`
- `idx_thoughts_processing_status` on `processing_status`
- `idx_thoughts_content_fts` (Full-text search on content)

### categories
Predefined and user-defined categories for thought organization.

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

**System Categories** (is_system = true):
- "ideas" - Creative thoughts and concepts
- "reminders" - Tasks and scheduled items
- "projects" - Work and personal projects
- "notes" - General information and observations
- "goals" - Aspirations and objectives

### processing_queue
Queue for AI processing tasks with status tracking.

```sql
CREATE TABLE public.processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Task Types**:
- "categorize" - AI categorization
- "extract_entities" - Entity extraction
- "parse_reminders" - Reminder date parsing
- "generate_summary" - Content summarization

### ai_processing_logs
Audit log for AI processing operations.

```sql
CREATE TABLE public.ai_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  processing_type VARCHAR(50) NOT NULL,
  input_data JSONB,
  output_data JSONB,
  confidence_score DECIMAL(3,2),
  model_used VARCHAR(100),
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### tags
User-defined tags for flexible organization.

```sql
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

### user_settings
User preferences and configuration.

```sql
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);
```

**Common Settings**:
- "ui_theme" - Dark/light mode preference
- "default_category" - Default categorization
- "ai_processing" - AI processing preferences
- "shortcuts" - Custom keyboard shortcuts
- "notifications" - Notification preferences

## Row Level Security (RLS)

All tables implement RLS to ensure users can only access their own data.

### Users Table RLS
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

### Thoughts Table RLS
```sql
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own thoughts" ON public.thoughts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own thoughts" ON public.thoughts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thoughts" ON public.thoughts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own thoughts" ON public.thoughts
  FOR DELETE USING (auth.uid() = user_id);
```

### Categories Table RLS
```sql
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id OR is_system = true);

CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id AND is_system = false);
```

## Database Functions

### Search Function
Full-text search across thoughts with ranking.

```sql
CREATE OR REPLACE FUNCTION search_thoughts(
  search_query TEXT,
  user_uuid UUID
) RETURNS TABLE (
  id UUID,
  content TEXT,
  title VARCHAR(255),
  category VARCHAR(50),
  tags TEXT[],
  rank REAL,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.content,
    t.title,
    t.category,
    t.tags,
    ts_rank(to_tsvector('english', t.content), plainto_tsquery(search_query)) as rank,
    t.created_at
  FROM thoughts t
  WHERE t.user_id = user_uuid
    AND to_tsvector('english', t.content) @@ plainto_tsquery(search_query)
  ORDER BY rank DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Category Statistics
Get thought counts by category for a user.

```sql
CREATE OR REPLACE FUNCTION get_category_stats(user_uuid UUID)
RETURNS TABLE (
  category VARCHAR(50),
  count BIGINT,
  latest_thought TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.category,
    COUNT(*) as count,
    MAX(t.created_at) as latest_thought
  FROM thoughts t
  WHERE t.user_id = user_uuid
    AND t.status = 'active'
  GROUP BY t.category
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Triggers and Automation

### Update Timestamps
Automatically update `updated_at` timestamps.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thoughts_updated_at
  BEFORE UPDATE ON public.thoughts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Processing Queue Trigger
Automatically create processing tasks for new thoughts.

```sql
CREATE OR REPLACE FUNCTION create_processing_tasks()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.processing_queue (thought_id, user_id, task_type)
  VALUES
    (NEW.id, NEW.user_id, 'categorize'),
    (NEW.id, NEW.user_id, 'extract_entities');

  IF NEW.content ~* '(tomorrow|next week|remind|schedule)' THEN
    INSERT INTO public.processing_queue (thought_id, user_id, task_type)
    VALUES (NEW.id, NEW.user_id, 'parse_reminders');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_processing_tasks_trigger
  AFTER INSERT ON public.thoughts
  FOR EACH ROW EXECUTE FUNCTION create_processing_tasks();
```

## Indexes for Performance

### Full-Text Search Index
```sql
CREATE INDEX idx_thoughts_content_fts
ON public.thoughts
USING GIN (to_tsvector('english', content));
```

### Composite Indexes
```sql
CREATE INDEX idx_thoughts_user_status_created
ON public.thoughts (user_id, status, created_at DESC);

CREATE INDEX idx_processing_queue_status_scheduled
ON public.processing_queue (status, scheduled_at);
```

## Real-time Subscriptions

Supabase real-time subscriptions are configured for:

### Thoughts Updates
```sql
-- Enable real-time for thoughts table
ALTER publication supabase_realtime ADD TABLE public.thoughts;
```

### Processing Status Updates
```sql
-- Enable real-time for processing queue
ALTER publication supabase_realtime ADD TABLE public.processing_queue;
```

## Data Retention and Cleanup

### Soft Delete Policy
Thoughts use soft deletion with status = 'deleted' instead of hard deletion for 30 days.

### Cleanup Function
```sql
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete processing logs older than 30 days
  DELETE FROM public.ai_processing_logs
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Hard delete soft-deleted thoughts older than 30 days
  DELETE FROM public.thoughts
  WHERE status = 'deleted'
    AND updated_at < NOW() - INTERVAL '30 days';

  -- Delete completed processing queue items older than 7 days
  DELETE FROM public.processing_queue
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Backup and Recovery

### Automated Backups
Supabase provides automated daily backups with point-in-time recovery.

### Data Export
Users can export their data using the API with full JSON export functionality.

## Migration Strategy

Database migrations are managed through Supabase's migration system with version control.

### Migration Files
- `001_initial_schema.sql` - Initial table creation
- `002_add_full_text_search.sql` - Search functionality
- `003_add_processing_queue.sql` - AI processing infrastructure
- `004_add_user_settings.sql` - User preferences

Each migration includes rollback scripts for safe deployment.
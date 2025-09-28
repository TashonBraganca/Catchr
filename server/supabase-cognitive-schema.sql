-- =====================================================
-- COGNITIVE INSIGHTS DATABASE SCHEMA
-- Phase 2: Proactive Intelligence System
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- PREDICTIVE SUGGESTIONS SYSTEM
-- =====================================================

-- Table: predictive_suggestions
-- Stores AI-generated predictive suggestions for users
CREATE TABLE IF NOT EXISTS predictive_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('task', 'idea', 'reminder', 'note', 'follow_up', 'project')),
    content TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    context_triggers JSONB NOT NULL DEFAULT '[]',
    suggested_category JSONB,
    suggested_tags TEXT[],
    is_accepted BOOLEAN DEFAULT NULL, -- NULL = pending, TRUE = accepted, FALSE = dismissed
    user_feedback TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_predictive_suggestions_user_id ON predictive_suggestions(user_id);
CREATE INDEX idx_predictive_suggestions_type ON predictive_suggestions(suggestion_type);
CREATE INDEX idx_predictive_suggestions_expires ON predictive_suggestions(expires_at);
CREATE INDEX idx_predictive_suggestions_confidence ON predictive_suggestions(confidence_score DESC);

-- RLS Policy for predictive_suggestions
ALTER TABLE predictive_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own suggestions" ON predictive_suggestions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions" ON predictive_suggestions
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- THOUGHT CONNECTIONS SYSTEM
-- =====================================================

-- Table: thought_connections
-- Stores discovered relationships between thoughts
CREATE TABLE IF NOT EXISTS thought_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    thought_a_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    thought_b_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    connection_type TEXT NOT NULL CHECK (connection_type IN ('semantic', 'temporal', 'causal', 'thematic', 'project_related', 'contextual')),
    strength_score INTEGER NOT NULL CHECK (strength_score >= 0 AND strength_score <= 100),
    reasoning TEXT NOT NULL,
    actionable_insights TEXT[],
    suggested_actions JSONB DEFAULT '[]',
    is_user_confirmed BOOLEAN DEFAULT NULL,
    user_notes TEXT,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_thought_connections_user_id ON thought_connections(user_id);
CREATE INDEX idx_thought_connections_strength ON thought_connections(strength_score DESC);
CREATE INDEX idx_thought_connections_type ON thought_connections(connection_type);
CREATE INDEX idx_thought_connections_thoughts ON thought_connections(thought_a_id, thought_b_id);

-- Ensure no duplicate connections (A->B same as B->A)
CREATE UNIQUE INDEX idx_thought_connections_unique ON thought_connections(
    user_id,
    LEAST(thought_a_id::text, thought_b_id::text),
    GREATEST(thought_a_id::text, thought_b_id::text),
    connection_type
);

-- RLS Policy for thought_connections
ALTER TABLE thought_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections" ON thought_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON thought_connections
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- INTELLIGENT REMINDERS SYSTEM
-- =====================================================

-- Table: intelligent_reminders
-- Stores context-aware reminders with optimal timing
CREATE TABLE IF NOT EXISTS intelligent_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    reminder_reason TEXT NOT NULL,
    optimal_timing JSONB NOT NULL, -- {suggestedTime, timeReasoning, contextFactors, availabilityScore}
    context_triggers JSONB NOT NULL DEFAULT '[]',
    priority TEXT NOT NULL DEFAULT 'gentle' CHECK (priority IN ('background', 'gentle', 'attention', 'urgent')),
    delivery_method TEXT NOT NULL DEFAULT 'notification' CHECK (delivery_method IN ('notification', 'email', 'dashboard', 'modal')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    user_response TEXT, -- 'completed', 'snoozed', 'dismissed'
    snooze_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_intelligent_reminders_user_id ON intelligent_reminders(user_id);
CREATE INDEX idx_intelligent_reminders_scheduled ON intelligent_reminders(scheduled_for);
CREATE INDEX idx_intelligent_reminders_active ON intelligent_reminders(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_intelligent_reminders_thought ON intelligent_reminders(thought_id);

-- RLS Policy for intelligent_reminders
ALTER TABLE intelligent_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders" ON intelligent_reminders
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- INSIGHT ANALYTICS SYSTEM
-- =====================================================

-- Table: insight_reports
-- Stores generated intelligence reports for users
CREATE TABLE IF NOT EXISTS insight_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    insights JSONB NOT NULL DEFAULT '[]', -- Array of PersonalInsight objects
    recommendations JSONB NOT NULL DEFAULT '[]', -- Array of ActionableRecommendation objects
    thinking_patterns JSONB NOT NULL DEFAULT '[]', -- Array of ThinkingPattern objects
    productivity_analysis JSONB NOT NULL DEFAULT '{}', -- ProductivityAnalysis object
    goal_alignment JSONB NOT NULL DEFAULT '{}', -- GoalAlignment object
    key_metrics JSONB NOT NULL DEFAULT '{}', -- Summary metrics
    is_viewed BOOLEAN DEFAULT FALSE,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_insight_reports_user_id ON insight_reports(user_id);
CREATE INDEX idx_insight_reports_type ON insight_reports(report_type);
CREATE INDEX idx_insight_reports_period ON insight_reports(period_start, period_end);
CREATE INDEX idx_insight_reports_generated ON insight_reports(generated_at DESC);

-- RLS Policy for insight_reports
ALTER TABLE insight_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON insight_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON insight_reports
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- CONTEXT TRACKING SYSTEM
-- =====================================================

-- Table: user_context_history
-- Tracks user context over time for pattern analysis
CREATE TABLE IF NOT EXISTS user_context_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL CHECK (context_type IN ('time_pattern', 'location', 'calendar_event', 'app_usage', 'productivity_state')),
    context_data JSONB NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_context_user_id ON user_context_history(user_id);
CREATE INDEX idx_user_context_type ON user_context_history(context_type);
CREATE INDEX idx_user_context_captured ON user_context_history(captured_at DESC);

-- RLS Policy for user_context_history
ALTER TABLE user_context_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own context" ON user_context_history
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- PATTERN ANALYSIS SYSTEM
-- =====================================================

-- Table: thinking_patterns
-- Stores discovered patterns in user thinking
CREATE TABLE IF NOT EXISTS thinking_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('temporal', 'thematic', 'productivity', 'creative', 'focus', 'emotional')),
    pattern_name TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'irregular')),
    supporting_data JSONB NOT NULL DEFAULT '{}',
    actionable_insights TEXT[],
    first_detected TIMESTAMP WITH TIME ZONE NOT NULL,
    last_confirmed TIMESTAMP WITH TIME ZONE NOT NULL,
    strength_trend TEXT CHECK (strength_trend IN ('increasing', 'stable', 'decreasing')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_thinking_patterns_user_id ON thinking_patterns(user_id);
CREATE INDEX idx_thinking_patterns_type ON thinking_patterns(pattern_type);
CREATE INDEX idx_thinking_patterns_confidence ON thinking_patterns(confidence_score DESC);
CREATE INDEX idx_thinking_patterns_active ON thinking_patterns(is_active) WHERE is_active = TRUE;

-- RLS Policy for thinking_patterns
ALTER TABLE thinking_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patterns" ON thinking_patterns
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- AI EMBEDDINGS FOR SEMANTIC SEARCH
-- =====================================================

-- Table: thought_embeddings
-- Stores vector embeddings for semantic similarity search
CREATE TABLE IF NOT EXISTS thought_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    embedding vector(1536), -- OpenAI text-embedding-ada-002 dimension
    model_version TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX idx_thought_embeddings_thought_id ON thought_embeddings(thought_id);
CREATE INDEX idx_thought_embeddings_vector ON thought_embeddings USING ivfflat (embedding vector_cosine_ops);

-- RLS Policy for thought_embeddings
ALTER TABLE thought_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings for their own thoughts" ON thought_embeddings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM thoughts
            WHERE thoughts.id = thought_embeddings.thought_id
            AND thoughts.user_id = auth.uid()
        )
    );

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function: Calculate semantic similarity between thoughts
CREATE OR REPLACE FUNCTION calculate_thought_similarity(
    thought_a_id UUID,
    thought_b_id UUID
) RETURNS FLOAT AS $$
DECLARE
    embedding_a vector(1536);
    embedding_b vector(1536);
    similarity FLOAT;
BEGIN
    -- Get embeddings
    SELECT embedding INTO embedding_a FROM thought_embeddings WHERE thought_id = thought_a_id;
    SELECT embedding INTO embedding_b FROM thought_embeddings WHERE thought_id = thought_b_id;

    -- Calculate cosine similarity
    SELECT 1 - (embedding_a <=> embedding_b) INTO similarity;

    RETURN COALESCE(similarity, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Get similar thoughts for a given thought
CREATE OR REPLACE FUNCTION get_similar_thoughts(
    target_thought_id UUID,
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
) RETURNS TABLE (
    thought_id UUID,
    similarity_score FLOAT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        calculate_thought_similarity(target_thought_id, t.id) as similarity,
        t.content,
        t.created_at
    FROM thoughts t
    WHERE t.id != target_thought_id
    AND calculate_thought_similarity(target_thought_id, t.id) >= similarity_threshold
    ORDER BY similarity DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATED PROCESSING
-- =====================================================

-- Trigger: Update thought_embeddings when new thoughts are created
CREATE OR REPLACE FUNCTION trigger_generate_embedding()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert placeholder embedding (will be updated by background job)
    INSERT INTO thought_embeddings (thought_id, embedding)
    VALUES (NEW.id, ARRAY[0]::float[]::vector);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_embedding_trigger
    AFTER INSERT ON thoughts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_embedding();

-- Trigger: Update updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_predictive_suggestions_timestamp
    BEFORE UPDATE ON predictive_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_intelligent_reminders_timestamp
    BEFORE UPDATE ON intelligent_reminders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_thinking_patterns_timestamp
    BEFORE UPDATE ON thinking_patterns
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

-- =====================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================

-- Insert default pattern types for new users
CREATE OR REPLACE FUNCTION initialize_user_cognitive_features(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Initialize default thinking patterns to track
    INSERT INTO thinking_patterns (user_id, pattern_type, pattern_name, description, confidence_score, frequency, first_detected, last_confirmed)
    VALUES
    (user_id, 'temporal', 'Morning Productivity', 'User tends to be most productive in morning hours', 50, 'daily', NOW(), NOW()),
    (user_id, 'thematic', 'Work Focus', 'User frequently captures work-related thoughts', 50, 'daily', NOW(), NOW()),
    (user_id, 'creative', 'Idea Generation', 'User generates creative ideas regularly', 50, 'weekly', NOW(), NOW()),
    (user_id, 'productivity', 'Task Planning', 'User plans tasks and projects systematically', 50, 'weekly', NOW(), NOW());
END;
$$ LANGUAGE plpgsql;

-- Create a view for active user intelligence summary
CREATE OR REPLACE VIEW user_intelligence_summary AS
SELECT
    u.id as user_id,
    u.email,
    COUNT(DISTINCT ps.id) as pending_suggestions,
    COUNT(DISTINCT tc.id) as discovered_connections,
    COUNT(DISTINCT ir.id) as active_reminders,
    COUNT(DISTINCT tp.id) as tracked_patterns,
    MAX(ir_reports.generated_at) as last_report_generated
FROM auth.users u
LEFT JOIN predictive_suggestions ps ON u.id = ps.user_id AND ps.is_accepted IS NULL AND ps.expires_at > NOW()
LEFT JOIN thought_connections tc ON u.id = tc.user_id AND tc.is_user_confirmed IS NULL
LEFT JOIN intelligent_reminders ir ON u.id = ir.user_id AND ir.is_active = TRUE AND ir.delivered_at IS NULL
LEFT JOIN thinking_patterns tp ON u.id = tp.user_id AND tp.is_active = TRUE
LEFT JOIN insight_reports ir_reports ON u.id = ir_reports.user_id
GROUP BY u.id, u.email;

-- =====================================================
-- PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Cleanup old suggestions and processed reminders
CREATE OR REPLACE FUNCTION cleanup_cognitive_data()
RETURNS VOID AS $$
BEGIN
    -- Remove expired suggestions
    DELETE FROM predictive_suggestions
    WHERE expires_at < NOW() - INTERVAL '7 days';

    -- Archive old delivered reminders
    DELETE FROM intelligent_reminders
    WHERE delivered_at < NOW() - INTERVAL '30 days'
    AND user_response IS NOT NULL;

    -- Clean up old context history (keep last 90 days)
    DELETE FROM user_context_history
    WHERE captured_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job (would be called by background worker)
COMMENT ON FUNCTION cleanup_cognitive_data() IS 'Run daily to clean up old cognitive intelligence data';

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions for the application
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions for service role (for background jobs)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- COGNITIVE INSIGHTS SCHEMA COMPLETE
-- =====================================================

-- This schema extends the base CATHCR system with advanced intelligence features:
-- 1. Predictive suggestions that anticipate user needs
-- 2. Thought connection discovery for relationship intelligence
-- 3. Context-aware intelligent reminders
-- 4. Comprehensive insight analytics and reporting
-- 5. Pattern recognition and learning systems
-- 6. Vector embeddings for semantic similarity search

-- Ready for COGNITIVE INSIGHTS Phase 2 implementation!
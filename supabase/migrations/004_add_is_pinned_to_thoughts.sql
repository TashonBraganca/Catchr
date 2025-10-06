-- =====================================================
-- MIGRATION 004: Add is_pinned column to thoughts table
-- Date: 2025-10-04
-- Purpose: Fix PGRST204 error - missing is_pinned column
-- =====================================================

-- Add is_pinned column to thoughts table
ALTER TABLE thoughts
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Add index for performance on pinned thoughts
CREATE INDEX IF NOT EXISTS idx_thoughts_pinned
ON thoughts(is_pinned)
WHERE is_pinned = TRUE;

-- Add title column (for Apple Notes compatibility)
ALTER TABLE thoughts
ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing records to extract title from content (first line)
UPDATE thoughts
SET title = SPLIT_PART(content, E'\n', 1)
WHERE title IS NULL;

-- Set default title for any remaining NULL titles
UPDATE thoughts
SET title = 'Untitled'
WHERE title IS NULL OR title = '';

-- Add NOT NULL constraint after populating data
ALTER TABLE thoughts
ALTER COLUMN title SET DEFAULT 'Untitled';

COMMENT ON COLUMN thoughts.is_pinned IS 'Whether the thought is pinned to top of list';
COMMENT ON COLUMN thoughts.title IS 'Thought title extracted from first line or user-defined';

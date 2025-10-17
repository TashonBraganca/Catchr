# Migration 004: Add title and is_pinned Columns

## Status
⏳ **PENDING APPLICATION** - Migration file exists, needs to be applied to database

## Overview
This migration adds two critical columns to the `thoughts` table:
- `title` (TEXT) - Note title for Apple Notes compatibility
- `is_pinned` (BOOLEAN) - Pin notes to top of list

## Migration File
**Location**: `D:\Projects\Cathcr\supabase\migrations\004_add_is_pinned_to_thoughts.sql`

**Contents**:
```sql
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
```

## How to Apply

### Method 1: Supabase Dashboard (RECOMMENDED)
1. Go to https://vysdpthbimdlkciusbvx.supabase.co/project/vysdpthbimdlkciusbvx/sql
2. Click "New Query"
3. Copy the contents of `supabase/migrations/004_add_is_pinned_to_thoughts.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. Verify success message

### Method 2: Supabase CLI (If installed)
```bash
cd D:\Projects\Cathcr
npx supabase db push
```

### Method 3: Direct SQL (Using psql)
```bash
psql "postgresql://postgres:[PASSWORD]@db.vysdpthbimdlkciusbvx.supabase.co:5432/postgres" < supabase/migrations/004_add_is_pinned_to_thoughts.sql
```

## Verification Steps

### 1. Check Columns Exist
Run this SQL in Supabase Dashboard:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'thoughts'
  AND column_name IN ('title', 'is_pinned')
ORDER BY column_name;
```

Expected output:
```
column_name | data_type | is_nullable | column_default
------------|-----------|-------------|----------------
is_pinned   | boolean   | YES         | false
title       | text      | YES         | 'Untitled'::text
```

### 2. Test SELECT Query
```sql
SELECT id, content, title, is_pinned
FROM thoughts
LIMIT 1;
```

Should return without errors and show `title` and `is_pinned` columns.

### 3. Test INSERT Query
```sql
INSERT INTO thoughts (user_id, content, title, is_pinned, tags, category)
VALUES (
  auth.uid(),
  'Test note content',
  'Test Title',
  true,
  ARRAY['test'],
  '{"main": "note"}'::jsonb
)
RETURNING *;
```

Should complete in <500ms and return the created row with all columns.

### 4. Test Frontend (After Uncommenting Code)
1. Go to https://cathcr.vercel.app
2. Create a new note
3. Check if title appears in note list
4. Try pinning a note
5. Verify pinned note stays at top

## Frontend Code Changes

### File: `client/src/hooks/useNotes.ts`

**Lines 120, 123 - CURRENTLY COMMENTED OUT**:
```typescript
// title: noteData.title || extractTitleFromContent(noteData.content), // TODO: Add after migration 004
// is_pinned: false, // TODO: Add after migration 004
```

**After migration is applied, uncomment to**:
```typescript
title: noteData.title || extractTitleFromContent(noteData.content),
is_pinned: false,
```

**Full createNote function (UPDATED)**:
```typescript
const createNote = useCallback(async (noteData: {
  content: string;
  title?: string;
  tags?: string[];
  category?: { main: string; sub?: string };
}): Promise<Note | null> => {
  if (!user) {
    setError('Must be logged in to create notes');
    return null;
  }

  try {
    console.log('🔍 [useNotes] Starting database insert...', {
      user_id: user.id,
      contentLength: noteData.content.length
    });

    const { data, error: createError } = await supabase
      .from('thoughts')
      .insert({
        user_id: user.id,
        content: noteData.content,
        title: noteData.title || extractTitleFromContent(noteData.content), // ✅ UNCOMMENTED
        tags: noteData.tags || [],
        category: noteData.category || { main: 'note' },
        is_pinned: false, // ✅ UNCOMMENTED
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ [useNotes] Insert error:', createError);
      throw createError;
    }

    if (!data) {
      console.error('❌ [useNotes] No data returned from insert');
      throw new Error('No data returned from database');
    }

    // Optimistic UI update
    const newNote: Note = {
      id: data.id,
      user_id: data.user_id,
      content: data.content,
      title: data.title, // ✅ Now reading from database
      tags: data.tags || [],
      category: data.category || { main: 'note' },
      is_pinned: data.is_pinned, // ✅ Now reading from database
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    setNotes(prev => [newNote, ...prev]);
    return newNote;
  } catch (err) {
    console.error('❌ [useNotes] Error creating note:', err);
    setError(err instanceof Error ? err.message : 'Failed to create note');
    return null;
  }
}, [user]);
```

## Expected Performance

| Metric | Before Migration | After Migration | Improvement |
|--------|-----------------|-----------------|-------------|
| **INSERT Time** | 134ms (without cols) | ~150ms (with cols) | Negligible |
| **SELECT Time** | 50ms | 50ms | No change |
| **Pin Filter** | N/A | <50ms (indexed) | New feature |
| **Title Search** | N/A | <100ms | New feature |

## Rollback Plan (If Needed)

If the migration causes issues:

```sql
-- Remove columns
ALTER TABLE thoughts DROP COLUMN IF EXISTS title;
ALTER TABLE thoughts DROP COLUMN IF EXISTS is_pinned;

-- Drop indexes
DROP INDEX IF EXISTS idx_thoughts_pinned;
```

## Post-Migration Checklist

- [ ] Migration applied successfully in Supabase Dashboard
- [ ] Columns verified via SQL query
- [ ] Test INSERT completed successfully (<500ms)
- [ ] Frontend code uncommented (lines 120, 123, 149, 152)
- [ ] Frontend tested (create note, title displays, pin works)
- [ ] Production deployed and verified
- [ ] No errors in browser console
- [ ] No errors in Supabase logs

## Troubleshooting

### Error: "column 'title' already exists"
✅ Safe to ignore - means migration was already applied

### Error: "column 'title' does not exist" (after applying)
❌ Migration did not apply properly - check Supabase logs

### Frontend still shows error after uncommenting
1. Check browser cache (hard refresh: Ctrl+F5)
2. Check if Vercel deployed latest code
3. Check browser console for specific error
4. Verify migration was applied via SQL query

## Contact
If migration fails, check:
1. Supabase Dashboard > Logs
2. Browser Console (F12)
3. `VOICE-TO-NOTE-DIAGNOSIS.md` for similar issues

---

**Last Updated**: 2025-10-13
**Status**: ⏳ Ready to apply - waiting for database access

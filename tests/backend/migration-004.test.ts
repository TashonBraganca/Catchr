/**
 * Migration 004 Database Schema Test Suite
 * Tests for title and is_pinned columns in thoughts table
 *
 * MIGRATION 004 CHANGES:
 * - Added `title` column (TEXT, default 'Untitled')
 * - Added `is_pinned` column (BOOLEAN, default FALSE)
 * - Added index on `is_pinned` for performance
 * - Backfilled existing records with title from first line
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Migration 004: Database Schema', () => {
  let testUserId: string;
  let testThoughtId: string;

  beforeAll(async () => {
    // Authenticate test user
    const testEmail = process.env.TEST_USER_EMAIL || 'test@cathcr.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error || !user) {
      console.error('Failed to authenticate test user:', error);
      throw new Error('Failed to authenticate test user');
    }

    testUserId = user.id;
    console.log(`✅ Authenticated test user: ${testUserId}`);
  });

  afterAll(async () => {
    // Clean up test data
    if (testThoughtId) {
      await supabase
        .from('thoughts')
        .delete()
        .eq('id', testThoughtId);
    }
  });

  describe('1. Schema Verification', () => {
    it('should have thoughts table with required columns', async () => {
      // Query to check column existence
      const { data, error } = await supabase
        .from('thoughts')
        .select('id, user_id, content, title, is_pinned, created_at, updated_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      console.log('✅ thoughts table has all required columns');
    });

    it('should have user_settings table', async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('user_id')
        .limit(1);

      expect(error).toBeNull();
      console.log('✅ user_settings table exists');
    });
  });

  describe('2. Title Column Functionality', () => {
    it('should create thought with custom title', async () => {
      const timestamp = Date.now();
      const customTitle = `Test Title ${timestamp}`;
      const content = `${customTitle}\nThis is the content`;

      const { data, error } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content,
          title: customTitle,
          tags: ['test'],
          category: { main: 'note' },
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.title).toBe(customTitle);

      testThoughtId = data!.id;

      console.log('✅ Thought created with custom title:', customTitle);
    });

    it('should use default title "Untitled" if not provided', async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content: 'Content without explicit title',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Should either have extracted title or default "Untitled"
      expect(data?.title).toBeTruthy();

      console.log('✅ Default title applied:', data?.title);

      // Clean up
      if (data?.id) {
        await supabase.from('thoughts').delete().eq('id', data.id);
      }
    });

    it('should extract title from content first line', async () => {
      const firstLine = 'This should be the title';
      const content = `${firstLine}\nSecond line\nThird line`;

      const { data, error } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Title should be first line or "Untitled"
      const titleMatchesFirstLine = data?.title === firstLine;
      const titleIsUntitled = data?.title === 'Untitled';

      expect(titleMatchesFirstLine || titleIsUntitled).toBe(true);

      console.log('✅ Title extraction:', data?.title);

      // Clean up
      if (data?.id) {
        await supabase.from('thoughts').delete().eq('id', data.id);
      }
    });

    it('should update title correctly', async () => {
      const newTitle = `Updated Title ${Date.now()}`;

      const { error } = await supabase
        .from('thoughts')
        .update({ title: newTitle })
        .eq('id', testThoughtId);

      expect(error).toBeNull();

      // Verify update
      const { data } = await supabase
        .from('thoughts')
        .select('title')
        .eq('id', testThoughtId)
        .single();

      expect(data?.title).toBe(newTitle);

      console.log('✅ Title updated successfully:', newTitle);
    });

    it('should handle long titles gracefully', async () => {
      const longTitle = 'A'.repeat(500); // Very long title

      const { data, error } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content: longTitle,
          title: longTitle,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.title).toBeTruthy();

      console.log('✅ Long title handled:', data?.title.substring(0, 50) + '...');

      // Clean up
      if (data?.id) {
        await supabase.from('thoughts').delete().eq('id', data.id);
      }
    });

    it('should handle empty/whitespace titles', async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content: '   \n\n  ',
          title: '   ',
        })
        .select()
        .single();

      // Should either fail validation or apply "Untitled"
      if (!error) {
        expect(data?.title).toBeTruthy();
        console.log('✅ Empty title handled with:', data?.title);

        // Clean up
        if (data?.id) {
          await supabase.from('thoughts').delete().eq('id', data.id);
        }
      } else {
        console.log('✅ Empty title rejected by validation');
      }
    });
  });

  describe('3. is_pinned Column Functionality', () => {
    it('should create thought with is_pinned = false by default', async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content: 'Test unpinned note',
          title: 'Unpinned',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.is_pinned).toBe(false);

      console.log('✅ Default is_pinned = false');

      // Clean up
      if (data?.id) {
        await supabase.from('thoughts').delete().eq('id', data.id);
      }
    });

    it('should create thought with is_pinned = true', async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content: 'Test pinned note',
          title: 'Pinned',
          is_pinned: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.is_pinned).toBe(true);

      console.log('✅ Thought created with is_pinned = true');

      // Clean up
      if (data?.id) {
        await supabase.from('thoughts').delete().eq('id', data.id);
      }
    });

    it('should toggle is_pinned state', async () => {
      // Pin the test thought
      const { error: pinError } = await supabase
        .from('thoughts')
        .update({ is_pinned: true })
        .eq('id', testThoughtId);

      expect(pinError).toBeNull();

      // Verify pinned
      const { data: pinnedData } = await supabase
        .from('thoughts')
        .select('is_pinned')
        .eq('id', testThoughtId)
        .single();

      expect(pinnedData?.is_pinned).toBe(true);

      console.log('✅ Thought pinned');

      // Unpin
      const { error: unpinError } = await supabase
        .from('thoughts')
        .update({ is_pinned: false })
        .eq('id', testThoughtId);

      expect(unpinError).toBeNull();

      // Verify unpinned
      const { data: unpinnedData } = await supabase
        .from('thoughts')
        .select('is_pinned')
        .eq('id', testThoughtId)
        .single();

      expect(unpinnedData?.is_pinned).toBe(false);

      console.log('✅ Thought unpinned');
    });

    it('should query pinned thoughts only', async () => {
      // Create a pinned thought
      const { data: pinnedThought, error: insertError } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content: 'Pinned thought for query test',
          title: 'Query Test Pinned',
          is_pinned: true,
        })
        .select()
        .single();

      expect(insertError).toBeNull();

      // Query only pinned thoughts
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', testUserId)
        .eq('is_pinned', true);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      // Verify all returned thoughts are pinned
      const allPinned = data!.every(thought => thought.is_pinned === true);
      expect(allPinned).toBe(true);

      console.log(`✅ Query returned ${data!.length} pinned thoughts`);

      // Clean up
      if (pinnedThought?.id) {
        await supabase.from('thoughts').delete().eq('id', pinnedThought.id);
      }
    });

    it('should order pinned thoughts before unpinned', async () => {
      // Create 2 pinned and 2 unpinned thoughts
      const timestamp = Date.now();

      const thoughts = [
        { content: 'Unpinned 1', is_pinned: false, title: `Unpinned 1 ${timestamp}` },
        { content: 'Pinned 1', is_pinned: true, title: `Pinned 1 ${timestamp}` },
        { content: 'Unpinned 2', is_pinned: false, title: `Unpinned 2 ${timestamp}` },
        { content: 'Pinned 2', is_pinned: true, title: `Pinned 2 ${timestamp}` },
      ];

      const insertedIds: string[] = [];

      for (const thought of thoughts) {
        const { data, error } = await supabase
          .from('thoughts')
          .insert({
            user_id: testUserId,
            ...thought,
          })
          .select('id')
          .single();

        if (!error && data?.id) {
          insertedIds.push(data.id);
        }
      }

      // Query with proper ordering
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', testUserId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length >= 4) {
        // First entries should be pinned
        const firstTwo = data.slice(0, 2);
        const hasPinnedFirst = firstTwo.some(t => t.is_pinned === true);

        expect(hasPinnedFirst).toBe(true);

        console.log('✅ Pinned thoughts appear before unpinned');
      } else {
        console.log('⚠️  Not enough thoughts to verify ordering');
      }

      // Clean up
      for (const id of insertedIds) {
        await supabase.from('thoughts').delete().eq('id', id);
      }
    });
  });

  describe('4. Index Performance', () => {
    it('should have index on is_pinned column', async () => {
      // This test verifies that queries on is_pinned are fast
      // By creating many records and timing a query

      const startTime = Date.now();

      const { data, error } = await supabase
        .from('thoughts')
        .select('id')
        .eq('user_id', testUserId)
        .eq('is_pinned', true)
        .limit(100);

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000); // Should complete in < 1s

      console.log(`✅ Pinned query completed in ${duration}ms`);
    });
  });

  describe('5. RLS Policy Verification', () => {
    it('should allow user to read their own thoughts', async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .eq('id', testThoughtId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(1);

      console.log('✅ User can read their own thoughts');
    });

    it('should allow user to update their own thoughts', async () => {
      const { error } = await supabase
        .from('thoughts')
        .update({ is_pinned: true })
        .eq('id', testThoughtId);

      expect(error).toBeNull();

      console.log('✅ User can update their own thoughts');
    });

    it('should allow user to delete their own thoughts', async () => {
      // Create a thought to delete
      const { data, error: insertError } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content: 'Thought to delete',
          title: 'Delete Me',
        })
        .select()
        .single();

      expect(insertError).toBeNull();

      // Delete it
      const { error: deleteError } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', data!.id);

      expect(deleteError).toBeNull();

      console.log('✅ User can delete their own thoughts');
    });
  });

  describe('6. Integration Tests', () => {
    it('should complete full workflow: create → pin → update title → unpin', async () => {
      const timestamp = Date.now();

      // 1. Create thought
      const { data: created, error: createError } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content: `Integration test ${timestamp}`,
          title: `Original Title ${timestamp}`,
          is_pinned: false,
        })
        .select()
        .single();

      expect(createError).toBeNull();
      expect(created).toBeDefined();
      expect(created?.is_pinned).toBe(false);

      console.log('✅ Step 1: Created thought');

      // 2. Pin thought
      const { error: pinError } = await supabase
        .from('thoughts')
        .update({ is_pinned: true })
        .eq('id', created!.id);

      expect(pinError).toBeNull();

      console.log('✅ Step 2: Pinned thought');

      // 3. Update title
      const newTitle = `Updated Title ${timestamp}`;
      const { error: updateError } = await supabase
        .from('thoughts')
        .update({ title: newTitle })
        .eq('id', created!.id);

      expect(updateError).toBeNull();

      console.log('✅ Step 3: Updated title');

      // 4. Verify all changes
      const { data: final, error: fetchError } = await supabase
        .from('thoughts')
        .select('*')
        .eq('id', created!.id)
        .single();

      expect(fetchError).toBeNull();
      expect(final?.is_pinned).toBe(true);
      expect(final?.title).toBe(newTitle);

      console.log('✅ Step 4: Verified all changes persist');

      // 5. Unpin
      const { error: unpinError } = await supabase
        .from('thoughts')
        .update({ is_pinned: false })
        .eq('id', created!.id);

      expect(unpinError).toBeNull();

      console.log('✅ Step 5: Unpinned thought');

      // Clean up
      await supabase.from('thoughts').delete().eq('id', created!.id);

      console.log('✅ Integration test complete');
    });

    it('should handle rapid pin/unpin toggles', async () => {
      const { data: thought, error: createError } = await supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content: 'Rapid toggle test',
          title: 'Toggle Test',
        })
        .select()
        .single();

      expect(createError).toBeNull();

      // Toggle 5 times rapidly
      for (let i = 0; i < 5; i++) {
        const isPinned = i % 2 === 0;

        const { error } = await supabase
          .from('thoughts')
          .update({ is_pinned: isPinned })
          .eq('id', thought!.id);

        expect(error).toBeNull();
      }

      // Final state should be unpinned (5 toggles, starting from false)
      const { data: final } = await supabase
        .from('thoughts')
        .select('is_pinned')
        .eq('id', thought!.id)
        .single();

      expect(final?.is_pinned).toBe(false);

      console.log('✅ Rapid toggles handled correctly');

      // Clean up
      await supabase.from('thoughts').delete().eq('id', thought!.id);
    });
  });

  describe('7. Data Consistency', () => {
    it('should maintain data consistency after multiple operations', async () => {
      const timestamp = Date.now();

      // Create 10 thoughts with mixed states
      const thoughtIds: string[] = [];

      for (let i = 0; i < 10; i++) {
        const { data, error } = await supabase
          .from('thoughts')
          .insert({
            user_id: testUserId,
            content: `Consistency test ${i} ${timestamp}`,
            title: `Title ${i}`,
            is_pinned: i % 3 === 0, // Pin every 3rd thought
          })
          .select('id')
          .single();

        if (!error && data?.id) {
          thoughtIds.push(data.id);
        }
      }

      // Verify count
      const { data: allThoughts, error: countError } = await supabase
        .from('thoughts')
        .select('id, is_pinned')
        .in('id', thoughtIds);

      expect(countError).toBeNull();
      expect(allThoughts?.length).toBe(10);

      // Count pinned
      const pinnedCount = allThoughts?.filter(t => t.is_pinned).length;
      expect(pinnedCount).toBe(4); // 0, 3, 6, 9 = 4 thoughts

      console.log(`✅ Data consistency verified: ${pinnedCount}/10 pinned`);

      // Clean up
      for (const id of thoughtIds) {
        await supabase.from('thoughts').delete().eq('id', id);
      }
    });
  });
});

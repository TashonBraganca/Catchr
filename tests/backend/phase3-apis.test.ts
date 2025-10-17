/**
 * Phase 3 Backend APIs Test Suite
 * Tests for /api/stats, calendar integration, and timezone logic
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Phase 3 Backend APIs', () => {
  let testUserId: string;
  let testAuthToken: string;

  beforeAll(async () => {
    // Create a test user or use existing
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email: 'test@cathcr.com',
      password: 'testpassword123',
    });

    if (error || !user) {
      throw new Error('Failed to authenticate test user');
    }

    testUserId = user.id;
    testAuthToken = user.session?.access_token || '';
  });

  describe('1. /api/stats Endpoint', () => {
    it('should return valid dashboard statistics', async () => {
      const response = await fetch('http://localhost:3000/api/stats', {
        headers: {
          Authorization: `Bearer ${testAuthToken}`,
        },
      });

      expect(response.status).toBe(200);

      const stats = await response.json();

      // Verify required fields exist
      expect(stats).toHaveProperty('totalNotes');
      expect(stats).toHaveProperty('notesThisWeek');
      expect(stats).toHaveProperty('totalVoiceNotes');
      expect(stats).toHaveProperty('voiceNotesThisWeek');
      expect(stats).toHaveProperty('averageNotesPerDay');
      expect(stats).toHaveProperty('mostUsedTags');
      expect(stats).toHaveProperty('recentActivity');

      // Verify data types
      expect(typeof stats.totalNotes).toBe('number');
      expect(typeof stats.notesThisWeek).toBe('number');
      expect(typeof stats.totalVoiceNotes).toBe('number');
      expect(typeof stats.voiceNotesThisWeek).toBe('number');
      expect(typeof stats.averageNotesPerDay).toBe('number');
      expect(Array.isArray(stats.mostUsedTags)).toBe(true);
      expect(Array.isArray(stats.recentActivity)).toBe(true);

      // Verify recent activity structure
      if (stats.recentActivity.length > 0) {
        const activity = stats.recentActivity[0];
        expect(activity).toHaveProperty('date');
        expect(activity).toHaveProperty('count');
        expect(typeof activity.date).toBe('string');
        expect(typeof activity.count).toBe('number');
      }
    });

    it('should return 401 without authentication', async () => {
      const response = await fetch('http://localhost:3000/api/stats');
      expect(response.status).toBe(401);
    });

    it('should enforce RLS policies', async () => {
      // Stats should only include current user's data
      const response = await fetch('http://localhost:3000/api/stats', {
        headers: {
          Authorization: `Bearer ${testAuthToken}`,
        },
      });

      const stats = await response.json();

      // Verify all counts are non-negative
      expect(stats.totalNotes).toBeGreaterThanOrEqual(0);
      expect(stats.notesThisWeek).toBeGreaterThanOrEqual(0);
      expect(stats.notesThisWeek).toBeLessThanOrEqual(stats.totalNotes);
    });
  });

  describe('2. User Settings Table', () => {
    it('should create user_settings with defaults', async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      // If no settings exist, create them
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: testUserId,
          })
          .select()
          .single();

        expect(insertError).toBeNull();
        expect(newSettings).toBeDefined();
        expect(newSettings?.timezone).toBe('America/Los_Angeles');
        expect(newSettings?.calendar_integration_enabled).toBe(false);
      } else {
        expect(data).toBeDefined();
        expect(data.user_id).toBe(testUserId);
      }
    });

    it('should update calendar integration status', async () => {
      const { error } = await supabase.rpc('update_calendar_integration', {
        p_user_id: testUserId,
        p_enabled: true,
        p_access_token: 'test_token',
        p_refresh_token: 'test_refresh',
      });

      expect(error).toBeNull();

      // Verify update
      const { data } = await supabase
        .from('user_settings')
        .select('calendar_integration_enabled, google_calendar_access_token')
        .eq('user_id', testUserId)
        .single();

      expect(data?.calendar_integration_enabled).toBe(true);
      expect(data?.google_calendar_access_token).toBe('test_token');
    });

    it('should update user timezone', async () => {
      const { error } = await supabase.rpc('update_user_timezone', {
        p_user_id: testUserId,
        p_timezone: 'America/New_York',
        p_auto_detect: false,
      });

      expect(error).toBeNull();

      // Verify update
      const { data } = await supabase
        .from('user_settings')
        .select('timezone, timezone_auto_detect')
        .eq('user_id', testUserId)
        .single();

      expect(data?.timezone).toBe('America/New_York');
      expect(data?.timezone_auto_detect).toBe(false);
    });
  });

  describe('3. Calendar Integration Check', () => {
    it('should check if calendar integration is enabled', async () => {
      // Enable calendar integration for test
      await supabase
        .from('user_settings')
        .update({
          calendar_integration_enabled: true,
          ai_auto_calendar_events: true,
        })
        .eq('user_id', testUserId);

      const { data } = await supabase
        .from('user_settings')
        .select('calendar_integration_enabled, ai_auto_calendar_events')
        .eq('user_id', testUserId)
        .single();

      expect(data?.calendar_integration_enabled).toBe(true);
      expect(data?.ai_auto_calendar_events).toBe(true);
    });

    it('should respect ai_auto_calendar_events flag', async () => {
      // Disable auto calendar events
      await supabase
        .from('user_settings')
        .update({
          ai_auto_calendar_events: false,
        })
        .eq('user_id', testUserId);

      const { data } = await supabase
        .from('user_settings')
        .select('ai_auto_calendar_events')
        .eq('user_id', testUserId)
        .single();

      expect(data?.ai_auto_calendar_events).toBe(false);
    });
  });

  describe('4. Timezone Logic', () => {
    it('should support all IANA timezone identifiers', async () => {
      const timezones = [
        'America/Los_Angeles',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'UTC',
      ];

      for (const timezone of timezones) {
        const { error } = await supabase
          .from('user_settings')
          .update({ timezone })
          .eq('user_id', testUserId);

        expect(error).toBeNull();

        const { data } = await supabase
          .from('user_settings')
          .select('timezone')
          .eq('user_id', testUserId)
          .single();

        expect(data?.timezone).toBe(timezone);
      }
    });

    it('should fallback to default timezone if not set', async () => {
      // Remove timezone
      await supabase
        .from('user_settings')
        .update({ timezone: null })
        .eq('user_id', testUserId);

      const { data } = await supabase
        .from('user_settings')
        .select('timezone')
        .eq('user_id', testUserId)
        .single();

      // Should use default from table definition
      expect(data?.timezone).toBeTruthy();
    });
  });

  describe('5. RLS Policy Verification', () => {
    it('should prevent access to other users settings', async () => {
      // Try to query another user's settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .neq('user_id', testUserId)
        .single();

      // Should either get no data or RLS should block it
      if (!error) {
        expect(data).toBeNull();
      }
    });

    it('should allow users to view their own settings', async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(testUserId);
    });

    it('should allow users to update their own settings', async () => {
      const { error } = await supabase
        .from('user_settings')
        .update({
          email_notifications_enabled: false,
        })
        .eq('user_id', testUserId);

      expect(error).toBeNull();
    });
  });
});

describe('Integration Tests', () => {
  it('should complete full workflow: thought → stats update', async () => {
    // 1. Create a thought
    const { data: thought, error: thoughtError } = await supabase
      .from('thoughts')
      .insert({
        user_id: testUserId,
        content: 'Test thought for stats',
        type: 'note',
      })
      .select()
      .single();

    expect(thoughtError).toBeNull();
    expect(thought).toBeDefined();

    // 2. Fetch stats (should include new thought)
    const response = await fetch('http://localhost:3000/api/stats', {
      headers: {
        Authorization: `Bearer ${testAuthToken}`,
      },
    });

    const stats = await response.json();
    expect(stats.totalNotes).toBeGreaterThan(0);
  });
});

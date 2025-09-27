// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server/.env first
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// Then load from root .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Server-side Supabase client with service role key for admin operations
export const supabaseAdmin: SupabaseClient<Database> = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Client-side Supabase client with anon key for user operations
export const supabaseClient: SupabaseClient<Database> = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Helper function to create authenticated client for specific user
export const createAuthenticatedClient = (accessToken: string): SupabaseClient<Database> => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
};

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  THOUGHTS: 'thoughts',
  NOTIFICATIONS: 'notifications',
  AI_PROCESSING_QUEUE: 'ai_processing_queue',
  USER_ACTIVITY: 'user_activity',
} as const;

// Helper functions for common database operations
export class DatabaseService {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database> = supabaseAdmin) {
    this.client = client;
  }

  // Profile operations
  async getProfile(userId: string) {
    const { data, error } = await this.client
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      throw error;
    }

    return data;
  }

  async createProfile(userId: string, email: string, username?: string) {
    const { data, error } = await this.client
      .from(TABLES.PROFILES)
      .upsert({
        id: userId,
        username,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create welcome notification
    await this.createNotification(userId, {
      type: 'system_update',
      title: 'Welcome to Cathcr! 🧠',
      message: 'Start capturing your thoughts with Ctrl+Shift+C or click the capture button.',
    });

    return data;
  }

  async updateProfile(userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) {
    const { data, error } = await this.client
      .from(TABLES.PROFILES)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // Thought operations
  async createThought(userId: string, thoughtData: {
    content: string;
    transcribed_text?: string;
    type?: string;
    category?: any;
    tags?: string[];
  }) {
    const { data, error } = await this.client
      .from(TABLES.THOUGHTS)
      .insert({
        user_id: userId,
        ...thoughtData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log user activity
    await this.logActivity(userId, 'thought_created', { thought_id: data.id });

    return data;
  }

  async getThoughts(userId: string, options: {
    limit?: number;
    offset?: number;
    category?: string;
    type?: string;
    search?: string;
  } = {}) {
    let query = this.client
      .from(TABLES.THOUGHTS)
      .select('*')
      .eq('user_id', userId);

    if (options.category) {
      query = query.eq('category->main', options.category);
    }

    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.search) {
      query = query.textSearch('content', options.search);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(options.limit || 20)
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  async updateThought(thoughtId: string, userId: string, updates: Partial<Database['public']['Tables']['thoughts']['Update']>) {
    const { data, error } = await this.client
      .from(TABLES.THOUGHTS)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', thoughtId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log user activity
    await this.logActivity(userId, 'thought_updated', { thought_id: thoughtId });

    return data;
  }

  async deleteThought(thoughtId: string, userId: string) {
    const { error } = await this.client
      .from(TABLES.THOUGHTS)
      .delete()
      .eq('id', thoughtId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Log user activity
    await this.logActivity(userId, 'thought_deleted', { thought_id: thoughtId });
  }

  // Notification operations
  async createNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    thought_id?: string;
    scheduled_for?: string;
  }) {
    const { data, error } = await this.client
      .from(TABLES.NOTIFICATIONS)
      .insert({
        user_id: userId,
        ...notification,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async getNotifications(userId: string, limit = 20) {
    const { data, error } = await this.client
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  }

  async markNotificationRead(notificationId: string, userId: string) {
    const { data, error } = await this.client
      .from(TABLES.NOTIFICATIONS)
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // AI Processing Queue operations
  async addToProcessingQueue(userId: string, thoughtId: string, processingType: string) {
    const { data, error } = await this.client
      .from(TABLES.AI_PROCESSING_QUEUE)
      .insert({
        user_id: userId,
        thought_id: thoughtId,
        processing_type: processingType,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async getProcessingQueueItems(status?: string, limit = 10) {
    let query = this.client
      .from(TABLES.AI_PROCESSING_QUEUE)
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  async updateProcessingQueueItem(itemId: string, updates: {
    status?: string;
    error_message?: string;
    retry_count?: number;
  }) {
    const { data, error } = await this.client
      .from(TABLES.AI_PROCESSING_QUEUE)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // User activity logging
  async logActivity(userId: string, activityType: string, metadata: any = {}) {
    try {
      await this.client
        .from(TABLES.USER_ACTIVITY)
        .insert({
          user_id: userId,
          activity_type: activityType,
          metadata,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      // Don't throw on activity logging errors
      console.error('Failed to log user activity:', error);
    }
  }

  // Analytics and stats
  async getUserStats(userId: string) {
    // Get thought counts
    const { data: thoughtStats } = await this.client
      .from(TABLES.THOUGHTS)
      .select('type, created_at, category')
      .eq('user_id', userId);

    if (!thoughtStats) {
      return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      totalThoughts: thoughtStats.length,
      thoughtsToday: thoughtStats.filter(t => new Date(t.created_at!) >= today).length,
      thoughtsThisWeek: thoughtStats.filter(t => new Date(t.created_at!) >= weekAgo).length,
      categoryBreakdown: {} as Record<string, number>,
      typeBreakdown: {} as Record<string, number>,
    };

    // Calculate category and type breakdowns
    thoughtStats.forEach(thought => {
      const category = thought.category?.main || 'uncategorized';
      const type = thought.type || 'note';
      
      stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;
      stats.typeBreakdown[type] = (stats.typeBreakdown[type] || 0) + 1;
    });

    // Get pending reminders
    const { data: reminders } = await this.client
      .from(TABLES.THOUGHTS)
      .select('id')
      .eq('user_id', userId)
      .not('reminder_date', 'is', null)
      .gte('reminder_date', now.toISOString());

    stats.pendingReminders = reminders?.length || 0;

    // Get unprocessed thoughts
    const { data: unprocessed } = await this.client
      .from(TABLES.THOUGHTS)
      .select('id')
      .eq('user_id', userId)
      .eq('is_processed', false);

    stats.processingQueue = unprocessed?.length || 0;

    return stats;
  }
}
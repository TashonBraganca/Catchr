import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@cathcr/shared';

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

// Only warn if variables are missing, don't throw
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase environment variables not configured. Using demo values.');
}

// Client-side Supabase client for user operations
export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Database table names (keep in sync with server)
export const TABLES = {
  PROFILES: 'profiles',
  THOUGHTS: 'thoughts',
  NOTIFICATIONS: 'notifications',
  AI_PROCESSING_QUEUE: 'ai_processing_queue',
  USER_ACTIVITY: 'user_activity',
} as const;

// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  // Sign in with magic link
  signInWithMagicLink: async (email: string, redirectTo?: string) => {
    return await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
  },

  // Sign in with OAuth provider
  signInWithProvider: async (provider: 'google' | 'github' | 'discord', redirectTo?: string) => {
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });
  },

  // Sign out
  signOut: async () => {
    return await supabase.auth.signOut();
  },

  // Get current session
  getSession: async () => {
    return await supabase.auth.getSession();
  },

  // Get current user
  getUser: async () => {
    return await supabase.auth.getUser();
  },

  // Update user profile
  updateUser: async (updates: { email?: string; password?: string; data?: Record<string, any> }) => {
    return await supabase.auth.updateUser(updates);
  },

  // Reset password
  resetPassword: async (email: string, redirectTo?: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
  },
};

// Client-side database operations (simplified versions of server operations)
export const db = {
  // Profile operations
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      throw error;
    }

    return data;
  },

  updateProfile: async (userId: string, updates: Database['public']['Tables']['profiles']['Update']) => {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Thought operations
  getThoughts: async (options: {
    limit?: number;
    offset?: number;
    category?: string;
    type?: string;
    search?: string;
  } = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from(TABLES.THOUGHTS)
      .select('*')
      .eq('user_id', user.id);

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
      .limit(options.limit || 20);

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  },

  createThought: async (thoughtData: {
    content: string;
    transcribed_text?: string;
    audio_url?: string;
    audio_path?: string;
    audio_duration?: number;
    type?: string;
    category?: {
      main: string;
      subcategory?: string;
      color?: string;
      icon?: string;
    };
    tags?: string[];
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const insertData: Database['public']['Tables']['thoughts']['Insert'] = {
      user_id: user.id,
      content: thoughtData.content,
      transcribed_text: thoughtData.transcribed_text || null,
      audio_url: thoughtData.audio_url || null,
      audio_path: thoughtData.audio_path || null,
      audio_duration: thoughtData.audio_duration || null,
      type: thoughtData.type || 'note',
      category: thoughtData.category || {
        main: 'uncategorized',
        subcategory: null,
        color: '#6B7280',
        icon: '📝'
      },
      tags: thoughtData.tags || [],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLES.THOUGHTS)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  updateThought: async (thoughtId: string, updates: {
    content?: string;
    transcribed_text?: string;
    audio_url?: string;
    audio_path?: string;
    audio_duration?: number;
    category?: {
      main: string;
      subcategory?: string;
      color?: string;
      icon?: string;
    };
    tags?: string[];
    type?: string;
    reminder_date?: string;
    is_processed?: boolean;
    ai_confidence?: number;
    ai_suggestions?: any;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: Database['public']['Tables']['thoughts']['Update'] = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLES.THOUGHTS)
      .update(updateData)
      .eq('id', thoughtId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  deleteThought: async (thoughtId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(TABLES.THOUGHTS)
      .delete()
      .eq('id', thoughtId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }
  },

  // Notification operations
  getNotifications: async (limit = 20) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  },

  markNotificationRead: async (notificationId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Real-time subscriptions
  subscribeToThoughts: (callback: (payload: any) => void) => {
    return supabase
      .channel('thoughts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.THOUGHTS,
        },
        callback
      )
      .subscribe();
  },

  subscribeToNotifications: (callback: (payload: any) => void) => {
    return supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.NOTIFICATIONS,
        },
        callback
      )
      .subscribe();
  },
};

// Export types for use in components
export type { Database };
export type SupabaseAuthUser = NonNullable<ReturnType<typeof supabase.auth.getUser> extends Promise<{ data: { user: infer U } }> ? U : never>;
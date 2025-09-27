// Database type definitions for Supabase PostgreSQL schema

export interface Database {
  public: {
    Tables: {
      thoughts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          transcribed_text: string | null;
          audio_url: string | null;
          category: ThoughtCategory | null;
          tags: string[] | null;
          metadata: Record<string, any> | null;
          is_pinned: boolean;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          transcribed_text?: string | null;
          audio_url?: string | null;
          category?: ThoughtCategory | null;
          tags?: string[] | null;
          metadata?: Record<string, any> | null;
          is_pinned?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          transcribed_text?: string | null;
          audio_url?: string | null;
          category?: ThoughtCategory | null;
          tags?: string[] | null;
          metadata?: Record<string, any> | null;
          is_pinned?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          preferences: UserPreferences | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          preferences?: UserPreferences | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          preferences?: UserPreferences | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_learning_patterns: {
        Row: {
          id: string;
          user_id: string;
          vocabulary_weights: Record<string, number>;
          category_preferences: Record<string, string>;
          time_patterns: Record<string, any>;
          context_patterns: Record<string, any>;
          categorization_accuracy: number;
          total_thoughts: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vocabulary_weights?: Record<string, number>;
          category_preferences?: Record<string, string>;
          time_patterns?: Record<string, any>;
          context_patterns?: Record<string, any>;
          categorization_accuracy?: number;
          total_thoughts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vocabulary_weights?: Record<string, number>;
          category_preferences?: Record<string, string>;
          time_patterns?: Record<string, any>;
          context_patterns?: Record<string, any>;
          categorization_accuracy?: number;
          total_thoughts?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          thought_id: string | null;
          scheduled_for: string | null;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          thought_id?: string | null;
          scheduled_for?: string | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          thought_id?: string | null;
          scheduled_for?: string | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_feedback: {
        Row: {
          id: string;
          user_id: string;
          thought_id: string;
          suggested_category: string;
          user_chosen_category: string;
          was_correct: boolean;
          feedback_type: 'category' | 'tags' | 'enhancement';
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          thought_id: string;
          suggested_category: string;
          user_chosen_category: string;
          was_correct: boolean;
          feedback_type: 'category' | 'tags' | 'enhancement';
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          thought_id?: string;
          suggested_category?: string;
          user_chosen_category?: string;
          was_correct?: boolean;
          feedback_type?: 'category' | 'tags' | 'enhancement';
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Supporting types
export interface ThoughtCategory {
  main: string;
  subcategory?: string;
  color: string;
  icon: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  defaultCategory?: string;
  autoTranscribe?: boolean;
  keyboardShortcuts?: Record<string, string>;
  notifications?: {
    reminders?: boolean;
    suggestions?: boolean;
    achievements?: boolean;
  };
  privacy?: {
    shareAnalytics?: boolean;
    saveAudioLocally?: boolean;
  };
}

export interface AISuggestions {
  category?: ThoughtCategory;
  tags?: string[];
  enhancement?: string;
  confidence?: number;
  alternativeCategories?: ThoughtCategory[];
  extractedEntities?: ExtractedEntity[];
  relatedThoughts?: string[];
  suggestedActions?: SuggestedAction[];
}

export interface ExtractedEntity {
  type: 'date' | 'person' | 'amount' | 'task' | 'location';
  value: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface SuggestedAction {
  type: 'calendar_event' | 'reminder' | 'task' | 'note' | 'contact';
  title: string;
  description?: string;
  data: Record<string, any>;
  confidence: number;
}

export interface CategorizationContext {
  timeOfDay?: string;
  location?: string;
  browserContext?: string;
  recentThoughts?: string[];
}

export interface UserLearningPattern {
  vocabularyWeights: Record<string, number>;
  categoryPreferences: Record<string, string>;
  timePatterns: Record<string, any>;
  contextPatterns: Record<string, any>;
  categorizationAccuracy: number;
  totalThoughts: number;
}

// Database row types for easier access
export type ThoughtRow = Database['public']['Tables']['thoughts']['Row'];
export type ThoughtInsert = Database['public']['Tables']['thoughts']['Insert'];
export type ThoughtUpdate = Database['public']['Tables']['thoughts']['Update'];

export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type AIFeedbackRow = Database['public']['Tables']['ai_feedback']['Row'];
export type AIFeedbackInsert = Database['public']['Tables']['ai_feedback']['Insert'];
export type AIFeedbackUpdate = Database['public']['Tables']['ai_feedback']['Update'];

export type UserLearningPatternRow = Database['public']['Tables']['user_learning_patterns']['Row'];
export type UserLearningPatternInsert = Database['public']['Tables']['user_learning_patterns']['Insert'];
export type UserLearningPatternUpdate = Database['public']['Tables']['user_learning_patterns']['Update'];

export default Database;
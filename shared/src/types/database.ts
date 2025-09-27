// Generated database types for Supabase
// This file is generated from the database schema and should be kept in sync

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          preferences: {
            defaultCategories: string[]
            notificationSettings: {
              reminders: boolean
              dailyDigest: boolean
              weeklyReview: boolean
            }
            aiSettings: {
              autoCategory: boolean
              confidenceThreshold: number
              personalizedPrompts: boolean
            }
            theme: 'light' | 'dark' | 'auto'
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          preferences?: {
            defaultCategories?: string[]
            notificationSettings?: {
              reminders?: boolean
              dailyDigest?: boolean
              weeklyReview?: boolean
            }
            aiSettings?: {
              autoCategory?: boolean
              confidenceThreshold?: number
              personalizedPrompts?: boolean
            }
            theme?: 'light' | 'dark' | 'auto'
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          preferences?: {
            defaultCategories?: string[]
            notificationSettings?: {
              reminders?: boolean
              dailyDigest?: boolean
              weeklyReview?: boolean
            }
            aiSettings?: {
              autoCategory?: boolean
              confidenceThreshold?: number
              personalizedPrompts?: boolean
            }
            theme?: 'light' | 'dark' | 'auto'
          }
          created_at?: string
          updated_at?: string
        }
      }
      thoughts: {
        Row: {
          id: string
          user_id: string
          content: string
          transcribed_text: string | null
          audio_url: string | null
          category: {
            main: string
            subcategory?: string | null
            color: string
            icon: string
          }
          tags: string[]
          type: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm'
          reminder_date: string | null
          is_processed: boolean
          processed_by_ai: string | null
          ai_confidence: number | null
          ai_suggestions: {
            alternativeCategories?: Array<{
              main: string
              subcategory?: string
              color: string
              icon: string
            }>
            extractedEntities?: Array<{
              type: 'person' | 'date' | 'amount' | 'location' | 'task'
              value: string
              confidence: number
              metadata?: Record<string, any>
            }>
            relatedThoughts?: string[]
            expansionPrompts?: string[]
          } | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          transcribed_text?: string | null
          audio_url?: string | null
          category?: {
            main?: string
            subcategory?: string | null
            color?: string
            icon?: string
          }
          tags?: string[]
          type?: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm'
          reminder_date?: string | null
          is_processed?: boolean
          processed_by_ai?: string | null
          ai_confidence?: number | null
          ai_suggestions?: {
            alternativeCategories?: Array<{
              main: string
              subcategory?: string
              color: string
              icon: string
            }>
            extractedEntities?: Array<{
              type: 'person' | 'date' | 'amount' | 'location' | 'task'
              value: string
              confidence: number
              metadata?: Record<string, any>
            }>
            relatedThoughts?: string[]
            expansionPrompts?: string[]
          } | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          transcribed_text?: string | null
          audio_url?: string | null
          category?: {
            main?: string
            subcategory?: string | null
            color?: string
            icon?: string
          }
          tags?: string[]
          type?: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm'
          reminder_date?: string | null
          is_processed?: boolean
          processed_by_ai?: string | null
          ai_confidence?: number | null
          ai_suggestions?: {
            alternativeCategories?: Array<{
              main: string
              subcategory?: string
              color: string
              icon: string
            }>
            extractedEntities?: Array<{
              type: 'person' | 'date' | 'amount' | 'location' | 'task'
              value: string
              confidence: number
              metadata?: Record<string, any>
            }>
            relatedThoughts?: string[]
            expansionPrompts?: string[]
          } | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'reminder' | 'daily_digest' | 'weekly_review' | 'ai_processing_complete' | 'system_update'
          title: string
          message: string
          thought_id: string | null
          is_read: boolean
          scheduled_for: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'reminder' | 'daily_digest' | 'weekly_review' | 'ai_processing_complete' | 'system_update'
          title: string
          message: string
          thought_id?: string | null
          is_read?: boolean
          scheduled_for?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'reminder' | 'daily_digest' | 'weekly_review' | 'ai_processing_complete' | 'system_update'
          title?: string
          message?: string
          thought_id?: string | null
          is_read?: boolean
          scheduled_for?: string | null
          created_at?: string
        }
      }
      ai_processing_queue: {
        Row: {
          id: string
          thought_id: string
          user_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          processing_type: 'categorization' | 'reminder_extraction' | 'expansion_suggestions'
          retry_count: number
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          thought_id: string
          user_id: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_type: 'categorization' | 'reminder_extraction' | 'expansion_suggestions'
          retry_count?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          thought_id?: string
          user_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_type?: 'categorization' | 'reminder_extraction' | 'expansion_suggestions'
          retry_count?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_activity: {
        Row: {
          id: string
          user_id: string
          activity_type: 'thought_created' | 'thought_updated' | 'thought_deleted' | 'login' | 'export' | 'search'
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: 'thought_created' | 'thought_updated' | 'thought_deleted' | 'login' | 'export' | 'search'
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: 'thought_created' | 'thought_updated' | 'thought_deleted' | 'login' | 'export' | 'search'
          metadata?: Record<string, any>
          created_at?: string
        }
      }
    }
    Views: {
      user_thought_stats: {
        Row: {
          user_id: string
          total_thoughts: number
          thoughts_today: number
          thoughts_this_week: number
          pending_reminders: number
          unprocessed_thoughts: number
        }
      }
      category_breakdown: {
        Row: {
          user_id: string
          main_category: string
          thought_count: number
          avg_confidence: number | null
        }
      }
    }
    Functions: {
      get_thoughts_for_user: {
        Args: {
          p_user_id: string
          p_limit?: number
          p_offset?: number
          p_category?: string | null
          p_type?: string | null
        }
        Returns: Array<{
          id: string
          content: string
          category: {
            main: string
            subcategory?: string | null
            color: string
            icon: string
          }
          tags: string[]
          type: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm'
          reminder_date: string | null
          is_processed: boolean
          ai_confidence: number | null
          created_at: string
          updated_at: string
        }>
      }
      search_thoughts: {
        Args: {
          p_user_id: string
          p_query: string
          p_limit?: number
        }
        Returns: Array<{
          id: string
          content: string
          category: {
            main: string
            subcategory?: string | null
            color: string
            icon: string
          }
          tags: string[]
          type: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm'
          created_at: string
          rank: number
        }>
      }
      setup_user_profile: {
        Args: {
          p_user_id: string
          p_email: string
          p_username?: string | null
        }
        Returns: void
      }
    }
    Enums: {
      thought_type: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm'
      notification_type: 'reminder' | 'daily_digest' | 'weekly_review' | 'ai_processing_complete' | 'system_update'
      processing_status: 'pending' | 'processing' | 'completed' | 'failed'
      processing_type: 'categorization' | 'reminder_extraction' | 'expansion_suggestions'
      activity_type: 'thought_created' | 'thought_updated' | 'thought_deleted' | 'login' | 'export' | 'search'
    }
  }
}

// Convenience type aliases for easier use
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Thought = Database['public']['Tables']['thoughts']['Row']
export type ThoughtInsert = Database['public']['Tables']['thoughts']['Insert']
export type ThoughtUpdate = Database['public']['Tables']['thoughts']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type AIProcessingQueueItem = Database['public']['Tables']['ai_processing_queue']['Row']
export type AIProcessingQueueInsert = Database['public']['Tables']['ai_processing_queue']['Insert']
export type AIProcessingQueueUpdate = Database['public']['Tables']['ai_processing_queue']['Update']

export type UserActivity = Database['public']['Tables']['user_activity']['Row']
export type UserActivityInsert = Database['public']['Tables']['user_activity']['Insert']
export type UserActivityUpdate = Database['public']['Tables']['user_activity']['Update']

export type UserThoughtStats = Database['public']['Views']['user_thought_stats']['Row']
export type CategoryBreakdown = Database['public']['Views']['category_breakdown']['Row']

// Type guards and utility functions
export function isValidThoughtType(type: string): type is Database['public']['Enums']['thought_type'] {
  return ['idea', 'reminder', 'project', 'note', 'brainstorm'].includes(type)
}

export function isValidNotificationType(type: string): type is Database['public']['Enums']['notification_type'] {
  return ['reminder', 'daily_digest', 'weekly_review', 'ai_processing_complete', 'system_update'].includes(type)
}

export function isValidProcessingStatus(status: string): status is Database['public']['Enums']['processing_status'] {
  return ['pending', 'processing', 'completed', 'failed'].includes(status)
}

export function isValidProcessingType(type: string): type is Database['public']['Enums']['processing_type'] {
  return ['categorization', 'reminder_extraction', 'expansion_suggestions'].includes(type)
}

export function isValidActivityType(type: string): type is Database['public']['Enums']['activity_type'] {
  return ['thought_created', 'thought_updated', 'thought_deleted', 'login', 'export', 'search'].includes(type)
}

// Helper functions for type conversion
export function thoughtRowToThought(row: Thought): import('./index').Thought {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    transcribedText: row.transcribed_text || undefined,
    category: {
      main: row.category.main,
      subcategory: row.category.subcategory || undefined,
      color: row.category.color,
      icon: row.category.icon,
    },
    tags: row.tags,
    type: row.type,
    reminderDate: row.reminder_date ? new Date(row.reminder_date) : undefined,
    isProcessed: row.is_processed,
    processedByAi: row.processed_by_ai ? new Date(row.processed_by_ai) : undefined,
    aiConfidence: row.ai_confidence || undefined,
    aiSuggestions: row.ai_suggestions ? {
      alternativeCategories: row.ai_suggestions.alternativeCategories || [],
      extractedEntities: row.ai_suggestions.extractedEntities || [],
      relatedThoughts: row.ai_suggestions.relatedThoughts || [],
      expansionPrompts: row.ai_suggestions.expansionPrompts || [],
    } : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }
}

export function thoughtToThoughtInsert(thought: Partial<import('./index').Thought>): ThoughtInsert {
  return {
    user_id: thought.userId!,
    content: thought.content!,
    transcribed_text: thought.transcribedText || null,
    category: thought.category ? {
      main: thought.category.main,
      subcategory: thought.category.subcategory || null,
      color: thought.category.color || '#6B7280',
      icon: thought.category.icon || '📝',
    } : undefined,
    tags: thought.tags || [],
    type: thought.type || 'note',
    reminder_date: thought.reminderDate?.toISOString() || null,
    is_processed: thought.isProcessed || false,
    ai_confidence: thought.aiConfidence || null,
    ai_suggestions: thought.aiSuggestions ? {
      alternativeCategories: thought.aiSuggestions.alternativeCategories?.map(cat => ({
        main: cat.main,
        subcategory: cat.subcategory || undefined,
        color: cat.color || '#6B7280',
        icon: cat.icon || '📝'
      })) || [],
      extractedEntities: thought.aiSuggestions.extractedEntities || [],
      relatedThoughts: thought.aiSuggestions.relatedThoughts || [],
      expansionPrompts: thought.aiSuggestions.expansionPrompts || [],
    } : null,
  }
}
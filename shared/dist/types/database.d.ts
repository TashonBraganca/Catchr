export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string | null;
                    preferences: {
                        defaultCategories: string[];
                        notificationSettings: {
                            reminders: boolean;
                            dailyDigest: boolean;
                            weeklyReview: boolean;
                        };
                        aiSettings: {
                            autoCategory: boolean;
                            confidenceThreshold: number;
                            personalizedPrompts: boolean;
                        };
                        theme: 'light' | 'dark' | 'auto';
                    };
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    username?: string | null;
                    preferences?: {
                        defaultCategories?: string[];
                        notificationSettings?: {
                            reminders?: boolean;
                            dailyDigest?: boolean;
                            weeklyReview?: boolean;
                        };
                        aiSettings?: {
                            autoCategory?: boolean;
                            confidenceThreshold?: number;
                            personalizedPrompts?: boolean;
                        };
                        theme?: 'light' | 'dark' | 'auto';
                    };
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string | null;
                    preferences?: {
                        defaultCategories?: string[];
                        notificationSettings?: {
                            reminders?: boolean;
                            dailyDigest?: boolean;
                            weeklyReview?: boolean;
                        };
                        aiSettings?: {
                            autoCategory?: boolean;
                            confidenceThreshold?: number;
                            personalizedPrompts?: boolean;
                        };
                        theme?: 'light' | 'dark' | 'auto';
                    };
                    created_at?: string;
                    updated_at?: string;
                };
            };
            thoughts: {
                Row: {
                    id: string;
                    user_id: string;
                    content: string;
                    transcribed_text: string | null;
                    audio_url: string | null;
                    category: {
                        main: string;
                        subcategory?: string | null;
                        color: string;
                        icon: string;
                    };
                    tags: string[];
                    type: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm';
                    reminder_date: string | null;
                    is_processed: boolean;
                    processed_by_ai: string | null;
                    ai_confidence: number | null;
                    ai_suggestions: {
                        alternativeCategories?: Array<{
                            main: string;
                            subcategory?: string;
                            color: string;
                            icon: string;
                        }>;
                        extractedEntities?: Array<{
                            type: 'person' | 'date' | 'amount' | 'location' | 'task';
                            value: string;
                            confidence: number;
                            metadata?: Record<string, any>;
                        }>;
                        relatedThoughts?: string[];
                        expansionPrompts?: string[];
                    } | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    content: string;
                    transcribed_text?: string | null;
                    audio_url?: string | null;
                    category?: {
                        main?: string;
                        subcategory?: string | null;
                        color?: string;
                        icon?: string;
                    };
                    tags?: string[];
                    type?: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm';
                    reminder_date?: string | null;
                    is_processed?: boolean;
                    processed_by_ai?: string | null;
                    ai_confidence?: number | null;
                    ai_suggestions?: {
                        alternativeCategories?: Array<{
                            main: string;
                            subcategory?: string;
                            color: string;
                            icon: string;
                        }>;
                        extractedEntities?: Array<{
                            type: 'person' | 'date' | 'amount' | 'location' | 'task';
                            value: string;
                            confidence: number;
                            metadata?: Record<string, any>;
                        }>;
                        relatedThoughts?: string[];
                        expansionPrompts?: string[];
                    } | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    content?: string;
                    transcribed_text?: string | null;
                    audio_url?: string | null;
                    category?: {
                        main?: string;
                        subcategory?: string | null;
                        color?: string;
                        icon?: string;
                    };
                    tags?: string[];
                    type?: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm';
                    reminder_date?: string | null;
                    is_processed?: boolean;
                    processed_by_ai?: string | null;
                    ai_confidence?: number | null;
                    ai_suggestions?: {
                        alternativeCategories?: Array<{
                            main: string;
                            subcategory?: string;
                            color: string;
                            icon: string;
                        }>;
                        extractedEntities?: Array<{
                            type: 'person' | 'date' | 'amount' | 'location' | 'task';
                            value: string;
                            confidence: number;
                            metadata?: Record<string, any>;
                        }>;
                        relatedThoughts?: string[];
                        expansionPrompts?: string[];
                    } | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    type: 'reminder' | 'daily_digest' | 'weekly_review' | 'ai_processing_complete' | 'system_update';
                    title: string;
                    message: string;
                    thought_id: string | null;
                    is_read: boolean;
                    scheduled_for: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: 'reminder' | 'daily_digest' | 'weekly_review' | 'ai_processing_complete' | 'system_update';
                    title: string;
                    message: string;
                    thought_id?: string | null;
                    is_read?: boolean;
                    scheduled_for?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?: 'reminder' | 'daily_digest' | 'weekly_review' | 'ai_processing_complete' | 'system_update';
                    title?: string;
                    message?: string;
                    thought_id?: string | null;
                    is_read?: boolean;
                    scheduled_for?: string | null;
                    created_at?: string;
                };
            };
            ai_processing_queue: {
                Row: {
                    id: string;
                    thought_id: string;
                    user_id: string;
                    status: 'pending' | 'processing' | 'completed' | 'failed';
                    processing_type: 'categorization' | 'reminder_extraction' | 'expansion_suggestions';
                    retry_count: number;
                    error_message: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    thought_id: string;
                    user_id: string;
                    status?: 'pending' | 'processing' | 'completed' | 'failed';
                    processing_type: 'categorization' | 'reminder_extraction' | 'expansion_suggestions';
                    retry_count?: number;
                    error_message?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    thought_id?: string;
                    user_id?: string;
                    status?: 'pending' | 'processing' | 'completed' | 'failed';
                    processing_type?: 'categorization' | 'reminder_extraction' | 'expansion_suggestions';
                    retry_count?: number;
                    error_message?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            user_activity: {
                Row: {
                    id: string;
                    user_id: string;
                    activity_type: 'thought_created' | 'thought_updated' | 'thought_deleted' | 'login' | 'export' | 'search';
                    metadata: Record<string, any>;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    activity_type: 'thought_created' | 'thought_updated' | 'thought_deleted' | 'login' | 'export' | 'search';
                    metadata?: Record<string, any>;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    activity_type?: 'thought_created' | 'thought_updated' | 'thought_deleted' | 'login' | 'export' | 'search';
                    metadata?: Record<string, any>;
                    created_at?: string;
                };
            };
        };
        Views: {
            user_thought_stats: {
                Row: {
                    user_id: string;
                    total_thoughts: number;
                    thoughts_today: number;
                    thoughts_this_week: number;
                    pending_reminders: number;
                    unprocessed_thoughts: number;
                };
            };
            category_breakdown: {
                Row: {
                    user_id: string;
                    main_category: string;
                    thought_count: number;
                    avg_confidence: number | null;
                };
            };
        };
        Functions: {
            get_thoughts_for_user: {
                Args: {
                    p_user_id: string;
                    p_limit?: number;
                    p_offset?: number;
                    p_category?: string | null;
                    p_type?: string | null;
                };
                Returns: Array<{
                    id: string;
                    content: string;
                    category: {
                        main: string;
                        subcategory?: string | null;
                        color: string;
                        icon: string;
                    };
                    tags: string[];
                    type: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm';
                    reminder_date: string | null;
                    is_processed: boolean;
                    ai_confidence: number | null;
                    created_at: string;
                    updated_at: string;
                }>;
            };
            search_thoughts: {
                Args: {
                    p_user_id: string;
                    p_query: string;
                    p_limit?: number;
                };
                Returns: Array<{
                    id: string;
                    content: string;
                    category: {
                        main: string;
                        subcategory?: string | null;
                        color: string;
                        icon: string;
                    };
                    tags: string[];
                    type: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm';
                    created_at: string;
                    rank: number;
                }>;
            };
            setup_user_profile: {
                Args: {
                    p_user_id: string;
                    p_email: string;
                    p_username?: string | null;
                };
                Returns: void;
            };
        };
        Enums: {
            thought_type: 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm';
            notification_type: 'reminder' | 'daily_digest' | 'weekly_review' | 'ai_processing_complete' | 'system_update';
            processing_status: 'pending' | 'processing' | 'completed' | 'failed';
            processing_type: 'categorization' | 'reminder_extraction' | 'expansion_suggestions';
            activity_type: 'thought_created' | 'thought_updated' | 'thought_deleted' | 'login' | 'export' | 'search';
        };
    };
}
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type Thought = Database['public']['Tables']['thoughts']['Row'];
export type ThoughtInsert = Database['public']['Tables']['thoughts']['Insert'];
export type ThoughtUpdate = Database['public']['Tables']['thoughts']['Update'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];
export type AIProcessingQueueItem = Database['public']['Tables']['ai_processing_queue']['Row'];
export type AIProcessingQueueInsert = Database['public']['Tables']['ai_processing_queue']['Insert'];
export type AIProcessingQueueUpdate = Database['public']['Tables']['ai_processing_queue']['Update'];
export type UserActivity = Database['public']['Tables']['user_activity']['Row'];
export type UserActivityInsert = Database['public']['Tables']['user_activity']['Insert'];
export type UserActivityUpdate = Database['public']['Tables']['user_activity']['Update'];
export type UserThoughtStats = Database['public']['Views']['user_thought_stats']['Row'];
export type CategoryBreakdown = Database['public']['Views']['category_breakdown']['Row'];
export declare function isValidThoughtType(type: string): type is Database['public']['Enums']['thought_type'];
export declare function isValidNotificationType(type: string): type is Database['public']['Enums']['notification_type'];
export declare function isValidProcessingStatus(status: string): status is Database['public']['Enums']['processing_status'];
export declare function isValidProcessingType(type: string): type is Database['public']['Enums']['processing_type'];
export declare function isValidActivityType(type: string): type is Database['public']['Enums']['activity_type'];
export declare function thoughtRowToThought(row: Thought): import('./index').Thought;
export declare function thoughtToThoughtInsert(thought: Partial<import('./index').Thought>): ThoughtInsert;
//# sourceMappingURL=database.d.ts.map
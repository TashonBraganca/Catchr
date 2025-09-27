export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string | null;
                    preferences: any | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    username?: string | null;
                    preferences?: any | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string | null;
                    preferences?: any | null;
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
                    category: any | null;
                    tags: string[] | null;
                    type: string;
                    reminder_date: string | null;
                    is_processed: boolean;
                    processed_by_ai: string | null;
                    ai_confidence: number | null;
                    ai_suggestions: any | null;
                    created_at: string;
                    updated_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    content: string;
                    transcribed_text?: string | null;
                    category?: any | null;
                    tags?: string[] | null;
                    type?: string;
                    reminder_date?: string | null;
                    is_processed?: boolean;
                    processed_by_ai?: string | null;
                    ai_confidence?: number | null;
                    ai_suggestions?: any | null;
                    created_at?: string;
                    updated_at?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    content?: string;
                    transcribed_text?: string | null;
                    category?: any | null;
                    tags?: string[] | null;
                    type?: string;
                    reminder_date?: string | null;
                    is_processed?: boolean;
                    processed_by_ai?: string | null;
                    ai_confidence?: number | null;
                    ai_suggestions?: any | null;
                    created_at?: string;
                    updated_at?: string | null;
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
                    is_read: boolean;
                    scheduled_for: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: string;
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
                    type?: string;
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
                    status: string;
                    processing_type: string;
                    retry_count: number;
                    error_message: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    thought_id: string;
                    user_id: string;
                    status?: string;
                    processing_type: string;
                    retry_count?: number;
                    error_message?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    thought_id?: string;
                    user_id?: string;
                    status?: string;
                    processing_type?: string;
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
                    activity_type: string;
                    metadata: any | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    activity_type: string;
                    metadata?: any | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    activity_type?: string;
                    metadata?: any | null;
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
                    avg_confidence: number;
                };
            };
        };
        Functions: {
            get_thoughts_for_user: {
                Args: {
                    p_user_id: string;
                    p_limit?: number;
                    p_offset?: number;
                    p_category?: string;
                    p_type?: string;
                };
                Returns: {
                    id: string;
                    content: string;
                    category: any;
                    tags: string[];
                    type: string;
                    reminder_date: string | null;
                    is_processed: boolean;
                    ai_confidence: number | null;
                    created_at: string;
                    updated_at: string | null;
                }[];
            };
            search_thoughts: {
                Args: {
                    p_user_id: string;
                    p_query: string;
                    p_limit?: number;
                };
                Returns: {
                    id: string;
                    content: string;
                    category: any;
                    tags: string[];
                    type: string;
                    created_at: string;
                    rank: number;
                }[];
            };
            setup_user_profile: {
                Args: {
                    p_user_id: string;
                    p_email: string;
                    p_username?: string;
                };
                Returns: void;
            };
        };
    };
}
//# sourceMappingURL=database.d.ts.map
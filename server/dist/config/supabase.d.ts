import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
export declare const supabaseAdmin: SupabaseClient<Database>;
export declare const supabaseClient: SupabaseClient<Database>;
export declare const createAuthenticatedClient: (accessToken: string) => SupabaseClient<Database>;
export declare const TABLES: {
    readonly PROFILES: "profiles";
    readonly THOUGHTS: "thoughts";
    readonly NOTIFICATIONS: "notifications";
    readonly AI_PROCESSING_QUEUE: "ai_processing_queue";
    readonly USER_ACTIVITY: "user_activity";
};
export declare class DatabaseService {
    private client;
    constructor(client?: SupabaseClient<Database>);
    getProfile(userId: string): Promise<any>;
    createProfile(userId: string, email: string, username?: string): Promise<any>;
    updateProfile(userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>): Promise<any>;
    createThought(userId: string, thoughtData: {
        content: string;
        transcribed_text?: string;
        type?: string;
        category?: any;
        tags?: string[];
    }): Promise<any>;
    getThoughts(userId: string, options?: {
        limit?: number;
        offset?: number;
        category?: string;
        type?: string;
        search?: string;
    }): Promise<any[]>;
    updateThought(thoughtId: string, userId: string, updates: Partial<Database['public']['Tables']['thoughts']['Update']>): Promise<any>;
    deleteThought(thoughtId: string, userId: string): Promise<void>;
    createNotification(userId: string, notification: {
        type: string;
        title: string;
        message: string;
        thought_id?: string;
        scheduled_for?: string;
    }): Promise<any>;
    getNotifications(userId: string, limit?: number): Promise<any[]>;
    markNotificationRead(notificationId: string, userId: string): Promise<any>;
    addToProcessingQueue(userId: string, thoughtId: string, processingType: string): Promise<any>;
    getProcessingQueueItems(status?: string, limit?: number): Promise<any[]>;
    updateProcessingQueueItem(itemId: string, updates: {
        status?: string;
        error_message?: string;
        retry_count?: number;
    }): Promise<any>;
    logActivity(userId: string, activityType: string, metadata?: any): Promise<void>;
    getUserStats(userId: string): Promise<{
        totalThoughts: number;
        thoughtsToday: number;
        thoughtsThisWeek: number;
        categoryBreakdown: Record<string, number>;
        typeBreakdown: Record<string, number>;
    } | null>;
}
//# sourceMappingURL=supabase.d.ts.map
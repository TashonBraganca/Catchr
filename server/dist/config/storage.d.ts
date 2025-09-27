import { Database } from '@cathcr/shared';
export declare const storageClient: import("@supabase/supabase-js").SupabaseClient<Database, "public", "public", never, {
    PostgrestVersion: "12";
}>;
export declare const STORAGE_CONFIG: {
    buckets: {
        AUDIO_CAPTURES: string;
        EXPORTS: string;
        TEMP: string;
    };
    limits: {
        MAX_FILE_SIZE: number;
        MAX_FILES_PER_USER: number;
        MAX_STORAGE_PER_USER: number;
        FILE_RETENTION_DAYS: number;
    };
    allowedMimeTypes: string[];
    compressionSettings: {
        audioQuality: number;
        targetSampleRate: number;
        targetBitRate: number;
    };
};
export interface StorageQuota {
    used: number;
    limit: number;
    fileCount: number;
    percentage: number;
}
export declare class StorageManager {
    /**
     * Check user storage quota
     */
    static checkUserQuota(userId: string): Promise<StorageQuota>;
    /**
     * Validate file upload
     */
    static validateUpload(userId: string, fileSize: number, mimeType: string): Promise<{
        valid: boolean;
        reason?: string;
    }>;
    /**
     * Clean up old files for a user
     */
    static cleanupOldFiles(userId: string, retentionDays?: number): Promise<{
        deletedCount: number;
        freedSpace: number;
    }>;
    /**
     * Get file download URL with expiration
     */
    static getDownloadUrl(filePath: string, expiresIn?: number): Promise<string>;
    /**
     * Move file to different bucket (e.g., for archiving)
     */
    static moveFile(fromPath: string, toPath: string, fromBucket?: string, toBucket?: string): Promise<void>;
    /**
     * Batch delete files
     */
    static batchDelete(filePaths: string[], bucket?: string): Promise<{
        successCount: number;
        failedPaths: string[];
    }>;
    /**
     * Get storage analytics for admin
     */
    static getStorageAnalytics(): Promise<{
        totalFiles: number;
        totalSize: number;
        userCount: number;
        avgFilesPerUser: number;
        avgSizePerUser: number;
        bucketSizes: Record<string, number>;
    }>;
    /**
     * Health check for storage service
     */
    static healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        checks: Record<string, boolean>;
        latency: number;
    }>;
}
export { StorageManager };
//# sourceMappingURL=storage.d.ts.map
import { createClient } from '@supabase/supabase-js';
import { Database } from '@cathcr/shared';

// Storage configuration and utilities for Cathcr server

export const storageClient = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const STORAGE_CONFIG = {
  buckets: {
    AUDIO_CAPTURES: 'audio-captures',
    EXPORTS: 'exports',
    TEMP: 'temp',
  },

  limits: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_FILES_PER_USER: 1000,
    MAX_STORAGE_PER_USER: 500 * 1024 * 1024, // 500MB
    FILE_RETENTION_DAYS: 90,
  },

  allowedMimeTypes: [
    'audio/webm',
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',
  ],

  compressionSettings: {
    audioQuality: 0.7,
    targetSampleRate: 22050,
    targetBitRate: 128000,
  },
};

export interface StorageQuota {
  used: number;
  limit: number;
  fileCount: number;
  percentage: number;
}

export class StorageManager {
  /**
   * Check user storage quota
   */
  static async checkUserQuota(userId: string): Promise<StorageQuota> {
    try {
      const { data: files, error } = await storageClient.storage
        .from(STORAGE_CONFIG.buckets.AUDIO_CAPTURES)
        .list(userId);

      if (error) {
        throw new Error(`Failed to check quota: ${error.message}`);
      }

      const used = (files || []).reduce((total, file) => {
        return total + (file.metadata?.size || 0);
      }, 0);

      const fileCount = files?.length || 0;
      const limit = STORAGE_CONFIG.limits.MAX_STORAGE_PER_USER;
      const percentage = (used / limit) * 100;

      return {
        used,
        limit,
        fileCount,
        percentage,
      };
    } catch (error) {
      console.error('Check user quota failed:', error);
      throw error;
    }
  }

  /**
   * Validate file upload
   */
  static async validateUpload(
    userId: string,
    fileSize: number,
    mimeType: string
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Check file size
      if (fileSize > STORAGE_CONFIG.limits.MAX_FILE_SIZE) {
        return {
          valid: false,
          reason: `File too large. Maximum size is ${STORAGE_CONFIG.limits.MAX_FILE_SIZE / 1024 / 1024}MB`,
        };
      }

      // Check MIME type
      if (!STORAGE_CONFIG.allowedMimeTypes.includes(mimeType)) {
        return {
          valid: false,
          reason: `File type not supported. Allowed types: ${STORAGE_CONFIG.allowedMimeTypes.join(', ')}`,
        };
      }

      // Check user quota
      const quota = await this.checkUserQuota(userId);

      if (quota.used + fileSize > quota.limit) {
        return {
          valid: false,
          reason: `Storage quota exceeded. Used: ${Math.round(quota.percentage)}%`,
        };
      }

      if (quota.fileCount >= STORAGE_CONFIG.limits.MAX_FILES_PER_USER) {
        return {
          valid: false,
          reason: `Too many files. Maximum ${STORAGE_CONFIG.limits.MAX_FILES_PER_USER} files allowed`,
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Upload validation failed:', error);
      return {
        valid: false,
        reason: 'Validation failed due to server error',
      };
    }
  }

  /**
   * Clean up old files for a user
   */
  static async cleanupOldFiles(userId: string, retentionDays?: number): Promise<{
    deletedCount: number;
    freedSpace: number;
  }> {
    try {
      const days = retentionDays || STORAGE_CONFIG.limits.FILE_RETENTION_DAYS;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data: files, error } = await storageClient.storage
        .from(STORAGE_CONFIG.buckets.AUDIO_CAPTURES)
        .list(userId);

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      if (!files || files.length === 0) {
        return { deletedCount: 0, freedSpace: 0 };
      }

      const oldFiles = files.filter(file => {
        const fileDate = new Date(file.updated_at || file.created_at);
        return fileDate < cutoffDate;
      });

      if (oldFiles.length === 0) {
        return { deletedCount: 0, freedSpace: 0 };
      }

      const pathsToDelete = oldFiles.map(file => `${userId}/${file.name}`);
      const freedSpace = oldFiles.reduce((total, file) => {
        return total + (file.metadata?.size || 0);
      }, 0);

      const { error: deleteError } = await storageClient.storage
        .from(STORAGE_CONFIG.buckets.AUDIO_CAPTURES)
        .remove(pathsToDelete);

      if (deleteError) {
        throw new Error(`Failed to delete files: ${deleteError.message}`);
      }

      return {
        deletedCount: oldFiles.length,
        freedSpace,
      };
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get file download URL with expiration
   */
  static async getDownloadUrl(
    filePath: string,
    expiresIn: number = 3600 // 1 hour default
  ): Promise<string> {
    try {
      const { data, error } = await storageClient.storage
        .from(STORAGE_CONFIG.buckets.AUDIO_CAPTURES)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to create download URL: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('No signed URL returned');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Get download URL failed:', error);
      throw error;
    }
  }

  /**
   * Move file to different bucket (e.g., for archiving)
   */
  static async moveFile(
    fromPath: string,
    toPath: string,
    fromBucket: string = STORAGE_CONFIG.buckets.AUDIO_CAPTURES,
    toBucket: string = STORAGE_CONFIG.buckets.AUDIO_CAPTURES
  ): Promise<void> {
    try {
      // Download from source
      const { data: fileData, error: downloadError } = await storageClient.storage
        .from(fromBucket)
        .download(fromPath);

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`);
      }

      if (!fileData) {
        throw new Error('No file data received');
      }

      // Upload to destination
      const { error: uploadError } = await storageClient.storage
        .from(toBucket)
        .upload(toPath, fileData);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Delete original
      const { error: deleteError } = await storageClient.storage
        .from(fromBucket)
        .remove([fromPath]);

      if (deleteError) {
        console.warn(`Failed to delete original file: ${deleteError.message}`);
        // Don't throw here as the move was successful
      }
    } catch (error) {
      console.error('Move file failed:', error);
      throw error;
    }
  }

  /**
   * Batch delete files
   */
  static async batchDelete(
    filePaths: string[],
    bucket: string = STORAGE_CONFIG.buckets.AUDIO_CAPTURES
  ): Promise<{ successCount: number; failedPaths: string[] }> {
    if (filePaths.length === 0) {
      return { successCount: 0, failedPaths: [] };
    }

    try {
      const { error } = await storageClient.storage
        .from(bucket)
        .remove(filePaths);

      if (error) {
        // If batch delete fails, try individual deletes
        console.warn('Batch delete failed, trying individual deletes:', error);

        let successCount = 0;
        const failedPaths: string[] = [];

        for (const path of filePaths) {
          try {
            const { error: individualError } = await storageClient.storage
              .from(bucket)
              .remove([path]);

            if (individualError) {
              failedPaths.push(path);
            } else {
              successCount++;
            }
          } catch (err) {
            failedPaths.push(path);
          }
        }

        return { successCount, failedPaths };
      }

      return { successCount: filePaths.length, failedPaths: [] };
    } catch (error) {
      console.error('Batch delete failed:', error);
      return { successCount: 0, failedPaths: filePaths };
    }
  }

  /**
   * Get storage analytics for admin
   */
  static async getStorageAnalytics(): Promise<{
    totalFiles: number;
    totalSize: number;
    userCount: number;
    avgFilesPerUser: number;
    avgSizePerUser: number;
    bucketSizes: Record<string, number>;
  }> {
    try {
      const analytics = {
        totalFiles: 0,
        totalSize: 0,
        userCount: 0,
        avgFilesPerUser: 0,
        avgSizePerUser: 0,
        bucketSizes: {} as Record<string, number>,
      };

      // Analyze each bucket
      for (const [bucketKey, bucketName] of Object.entries(STORAGE_CONFIG.buckets)) {
        try {
          const { data: files, error } = await storageClient.storage
            .from(bucketName)
            .list();

          if (!error && files) {
            const bucketSize = files.reduce((total, file) => {
              return total + (file.metadata?.size || 0);
            }, 0);

            analytics.bucketSizes[bucketKey] = bucketSize;
            analytics.totalSize += bucketSize;

            if (bucketName === STORAGE_CONFIG.buckets.AUDIO_CAPTURES) {
              analytics.totalFiles += files.length;

              // Count unique users (folders)
              const userFolders = new Set(files.map(f => f.name.split('/')[0]));
              analytics.userCount = userFolders.size;
            }
          }
        } catch (bucketError) {
          console.warn(`Failed to analyze bucket ${bucketName}:`, bucketError);
        }
      }

      // Calculate averages
      if (analytics.userCount > 0) {
        analytics.avgFilesPerUser = analytics.totalFiles / analytics.userCount;
        analytics.avgSizePerUser = analytics.totalSize / analytics.userCount;
      }

      return analytics;
    } catch (error) {
      console.error('Get storage analytics failed:', error);
      throw error;
    }
  }

  /**
   * Health check for storage service
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    latency: number;
  }> {
    const startTime = Date.now();
    const checks: Record<string, boolean> = {};

    try {
      // Test each bucket
      for (const [bucketKey, bucketName] of Object.entries(STORAGE_CONFIG.buckets)) {
        try {
          await storageClient.storage.from(bucketName).list('', { limit: 1 });
          checks[`${bucketKey}_accessible`] = true;
        } catch (error) {
          checks[`${bucketKey}_accessible`] = false;
        }
      }

      // Test upload capability with a small test file
      try {
        const testContent = new Blob(['test'], { type: 'text/plain' });
        const testPath = `health-check-${Date.now()}.txt`;

        const { error: uploadError } = await storageClient.storage
          .from(STORAGE_CONFIG.buckets.TEMP)
          .upload(testPath, testContent);

        checks.upload_working = !uploadError;

        // Clean up test file
        if (!uploadError) {
          await storageClient.storage
            .from(STORAGE_CONFIG.buckets.TEMP)
            .remove([testPath]);
        }
      } catch (error) {
        checks.upload_working = false;
      }

      const passedChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.values(checks).length;
      const latency = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (passedChecks === totalChecks) {
        status = 'healthy';
      } else if (passedChecks >= totalChecks * 0.7) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return { status, checks, latency };
    } catch (error) {
      console.error('Storage health check failed:', error);
      return {
        status: 'unhealthy',
        checks,
        latency: Date.now() - startTime,
      };
    }
  }
}


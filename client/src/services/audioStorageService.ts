// Audio storage service for Cathcr client
// Handles uploading, compression, and management of audio files

import { supabase } from '@/lib/supabase-browser';

export interface AudioUploadConfig {
  compress?: boolean;
  quality?: number; // 0.1 to 1.0
  maxSizeKB?: number;
  format?: 'webm' | 'wav' | 'mp3';
}

export interface AudioUploadResult {
  url: string;
  path: string;
  size: number;
  duration?: number;
  format: string;
  compressed: boolean;
}

export interface AudioUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'compressing' | 'uploading' | 'complete';
}

export class AudioStorageService {
  private static instance: AudioStorageService;
  private readonly bucketName = 'audio-captures';
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  private readonly allowedFormats = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'];

  static getInstance(): AudioStorageService {
    if (!AudioStorageService.instance) {
      AudioStorageService.instance = new AudioStorageService();
    }
    return AudioStorageService.instance;
  }

  /**
   * Upload audio blob to Supabase Storage
   */
  async uploadAudio(
    audioBlob: Blob,
    userId: string,
    thoughtId?: string,
    config: AudioUploadConfig = {},
    onProgress?: (progress: AudioUploadProgress) => void
  ): Promise<AudioUploadResult> {
    try {
      // Validate input
      this.validateAudioBlob(audioBlob);

      // Set default config
      const uploadConfig: Required<AudioUploadConfig> = {
        compress: config.compress ?? true,
        quality: config.quality ?? 0.8,
        maxSizeKB: config.maxSizeKB ?? 5000, // 5MB default
        format: config.format ?? 'webm',
      };

      // Compress audio if requested
      let processedBlob = audioBlob;
      let compressed = false;

      if (uploadConfig.compress && audioBlob.size > uploadConfig.maxSizeKB * 1024) {
        onProgress?.({
          loaded: 0,
          total: 100,
          percentage: 0,
          stage: 'compressing',
        });

        processedBlob = await this.compressAudio(audioBlob, uploadConfig);
        compressed = true;

        onProgress?.({
          loaded: 50,
          total: 100,
          percentage: 50,
          stage: 'compressing',
        });
      }

      // Generate file path
      const filePath = this.generateFilePath(userId, thoughtId, uploadConfig.format);

      // Upload to Supabase Storage
      onProgress?.({
        loaded: 0,
        total: processedBlob.size,
        percentage: 0,
        stage: 'uploading',
      });

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, processedBlob, {
          contentType: processedBlob.type || `audio/${uploadConfig.format}`,
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      onProgress?.({
        loaded: processedBlob.size,
        total: processedBlob.size,
        percentage: 100,
        stage: 'complete',
      });

      // Get audio duration if possible
      const duration = await this.getAudioDuration(audioBlob);

      return {
        url: publicUrl,
        path: filePath,
        size: processedBlob.size,
        duration,
        format: uploadConfig.format,
        compressed,
      };

    } catch (error) {
      console.error('Audio upload failed:', error);
      throw error;
    }
  }

  /**
   * Compress audio blob
   */
  private async compressAudio(
    audioBlob: Blob,
    config: Required<AudioUploadConfig>
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create audio context for processing
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Calculate compression parameters
            const originalSampleRate = audioBuffer.sampleRate;
            const targetSampleRate = Math.min(originalSampleRate, 22050); // Reduce sample rate
            const targetBitRate = Math.floor(128000 * config.quality); // Reduce bit rate

            // Create offline context for rendering
            const offlineContext = new OfflineAudioContext(
              1, // Mono
              audioBuffer.duration * targetSampleRate,
              targetSampleRate
            );

            // Create source and connect
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start();

            // Render compressed audio
            const compressedBuffer = await offlineContext.startRendering();

            // Convert to blob using MediaRecorder if available
            if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
              this.bufferToBlob(compressedBuffer, targetSampleRate, config.format)
                .then(resolve)
                .catch(reject);
            } else {
              // Fallback: return original blob if compression not supported
              resolve(audioBlob);
            }

          } catch (error) {
            console.warn('Audio compression failed, using original:', error);
            resolve(audioBlob);
          }
        };

        reader.onerror = () => {
          console.warn('Could not read audio file for compression, using original');
          resolve(audioBlob);
        };

        reader.readAsArrayBuffer(audioBlob);

      } catch (error) {
        console.warn('Audio compression setup failed, using original:', error);
        resolve(audioBlob);
      }
    });
  }

  /**
   * Convert AudioBuffer to Blob
   */
  private async bufferToBlob(
    audioBuffer: AudioBuffer,
    sampleRate: number,
    format: string
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create a MediaStream from AudioBuffer
        const audioContext = new AudioContext({ sampleRate });
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);

        // Use MediaRecorder to encode
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: `audio/${format};codecs=opus`,
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: `audio/${format}` });
          resolve(blob);
        };

        mediaRecorder.onerror = (event) => {
          reject(new Error('MediaRecorder error during compression'));
        };

        // Start recording
        source.start();
        mediaRecorder.start();

        // Stop after audio duration
        setTimeout(() => {
          mediaRecorder.stop();
          source.stop();
          audioContext.close();
        }, audioBuffer.duration * 1000 + 100);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get audio duration
   */
  private async getAudioDuration(audioBlob: Blob): Promise<number | undefined> {
    return new Promise((resolve) => {
      try {
        const audio = new Audio();
        const url = URL.createObjectURL(audioBlob);

        audio.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve(audio.duration);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(undefined);
        };

        audio.src = url;
      } catch (error) {
        resolve(undefined);
      }
    });
  }

  /**
   * Validate audio blob
   */
  private validateAudioBlob(audioBlob: Blob): void {
    if (!audioBlob) {
      throw new Error('Audio blob is required');
    }

    if (audioBlob.size === 0) {
      throw new Error('Audio blob is empty');
    }

    if (audioBlob.size > this.maxFileSize) {
      throw new Error(`Audio file too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`);
    }

    if (audioBlob.type && !this.allowedFormats.includes(audioBlob.type)) {
      console.warn(`Audio format ${audioBlob.type} may not be supported`);
    }
  }

  /**
   * Generate unique file path
   */
  private generateFilePath(userId: string, thoughtId?: string, format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    const filename = thoughtId
      ? `${thoughtId}_${timestamp}_${random}.${format}`
      : `capture_${timestamp}_${random}.${format}`;

    return `${userId}/${filename}`;
  }

  /**
   * Delete audio file
   */
  async deleteAudio(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Audio deletion failed:', error);
      throw error;
    }
  }

  /**
   * Download audio file
   */
  async downloadAudio(filePath: string): Promise<Blob> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        throw new Error(`Download failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data received from download');
      }

      return data;
    } catch (error) {
      console.error('Audio download failed:', error);
      throw error;
    }
  }

  /**
   * Get audio file info
   */
  async getAudioInfo(filePath: string): Promise<{
    size: number;
    lastModified: string;
    contentType: string;
  } | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(filePath.split('/')[0], {
          search: filePath.split('/')[1],
        });

      if (error || !data || data.length === 0) {
        return null;
      }

      const file = data[0];
      return {
        size: file.metadata?.size || 0,
        lastModified: file.updated_at || file.created_at,
        contentType: file.metadata?.mimetype || 'audio/webm',
      };
    } catch (error) {
      console.error('Get audio info failed:', error);
      return null;
    }
  }

  /**
   * Cleanup old audio files for a user
   */
  async cleanupOldFiles(userId: string, olderThanDays: number = 30): Promise<number> {
    try {
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list(userId);

      if (error || !files) {
        throw new Error(`List files failed: ${error?.message}`);
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const filesToDelete = files.filter(file => {
        const fileDate = new Date(file.updated_at || file.created_at);
        return fileDate < cutoffDate;
      });

      if (filesToDelete.length === 0) {
        return 0;
      }

      const pathsToDelete = filesToDelete.map(file => `${userId}/${file.name}`);

      const { error: deleteError } = await supabase.storage
        .from(this.bucketName)
        .remove(pathsToDelete);

      if (deleteError) {
        throw new Error(`Cleanup failed: ${deleteError.message}`);
      }

      return filesToDelete.length;
    } catch (error) {
      console.error('Audio cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get storage usage for a user
   */
  async getStorageUsage(userId: string): Promise<{
    fileCount: number;
    totalSize: number;
    oldestFile?: string;
    newestFile?: string;
  }> {
    try {
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list(userId);

      if (error) {
        throw new Error(`Get storage usage failed: ${error.message}`);
      }

      if (!files || files.length === 0) {
        return {
          fileCount: 0,
          totalSize: 0,
        };
      }

      const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

      const sortedFiles = files.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateA.getTime() - dateB.getTime();
      });

      return {
        fileCount: files.length,
        totalSize,
        oldestFile: sortedFiles[0]?.name,
        newestFile: sortedFiles[sortedFiles.length - 1]?.name,
      };
    } catch (error) {
      console.error('Get storage usage failed:', error);
      throw error;
    }
  }
}

// Global types for browser APIs
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// Export singleton instance
export const audioStorageService = AudioStorageService.getInstance();
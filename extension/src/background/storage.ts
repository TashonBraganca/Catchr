/**
 * CATHCR Extension Storage Management
 * Handles offline-first local storage with Chrome Storage API
 */

import browser from 'webextension-polyfill';
import type { CaptureData, StorageData, SyncStatus } from '../types';

export class CathcrStorage {
  private readonly STORAGE_KEYS = {
    CAPTURES: 'cathcr_captures',
    SYNC_QUEUE: 'cathcr_sync_queue',
    SYNC_STATUS: 'cathcr_sync_status',
    USER_SETTINGS: 'cathcr_user_settings',
    LAST_SYNC: 'cathcr_last_sync',
  } as const;

  private readonly MAX_CAPTURES = 1000; // Limit local storage
  private readonly CLEANUP_THRESHOLD = 800; // When to cleanup

  async initialize(): Promise<void> {
    try {
      // Initialize storage structure
      const storage = await this.getStorageData();

      if (!storage.captures) {
        await this.setStorageData({
          captures: [],
          syncQueue: [],
          syncStatus: { isOnline: navigator.onLine, lastSync: null },
          userSettings: {
            syncEnabled: true,
            autoCapture: true,
            notifications: true,
            analyticsEnabled: true,
          },
        });
      }

      console.log('✅ Storage initialized');
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      throw error;
    }
  }

  async addCapture(captureData: Omit<CaptureData, 'id' | 'timestamp' | 'synced'>): Promise<CaptureData> {
    const capture: CaptureData = {
      id: this.generateId(),
      timestamp: Date.now(),
      synced: false,
      ...captureData,
    };

    try {
      const storage = await this.getStorageData();
      storage.captures = storage.captures || [];
      storage.captures.unshift(capture); // Add to beginning

      // Cleanup if needed
      if (storage.captures.length > this.CLEANUP_THRESHOLD) {
        storage.captures = storage.captures.slice(0, this.MAX_CAPTURES);
      }

      await this.setStorageData(storage);

      console.log('📝 Capture stored:', capture.id);
      return capture;

    } catch (error) {
      console.error('❌ Failed to add capture:', error);
      throw error;
    }
  }

  async updateCapture(id: string, updates: Partial<CaptureData>): Promise<CaptureData | null> {
    try {
      const storage = await this.getStorageData();
      const captureIndex = storage.captures.findIndex(c => c.id === id);

      if (captureIndex === -1) {
        console.warn('Capture not found:', id);
        return null;
      }

      storage.captures[captureIndex] = {
        ...storage.captures[captureIndex],
        ...updates,
      };

      await this.setStorageData(storage);

      console.log('📝 Capture updated:', id);
      return storage.captures[captureIndex];

    } catch (error) {
      console.error('❌ Failed to update capture:', error);
      throw error;
    }
  }

  async deleteCapture(id: string): Promise<boolean> {
    try {
      const storage = await this.getStorageData();
      const initialLength = storage.captures.length;

      storage.captures = storage.captures.filter(c => c.id !== id);

      if (storage.captures.length === initialLength) {
        console.warn('Capture not found for deletion:', id);
        return false;
      }

      await this.setStorageData(storage);

      console.log('🗑️ Capture deleted:', id);
      return true;

    } catch (error) {
      console.error('❌ Failed to delete capture:', error);
      throw error;
    }
  }

  async getCaptures(limit?: number): Promise<CaptureData[]> {
    try {
      const storage = await this.getStorageData();
      const captures = storage.captures || [];

      return limit ? captures.slice(0, limit) : captures;

    } catch (error) {
      console.error('❌ Failed to get captures:', error);
      return [];
    }
  }

  async getUnsyncedCaptures(): Promise<CaptureData[]> {
    try {
      const captures = await this.getCaptures();
      return captures.filter(c => !c.synced);

    } catch (error) {
      console.error('❌ Failed to get unsynced captures:', error);
      return [];
    }
  }

  async markAsSynced(captureIds: string[]): Promise<void> {
    try {
      const storage = await this.getStorageData();

      captureIds.forEach(id => {
        const capture = storage.captures.find(c => c.id === id);
        if (capture) {
          capture.synced = true;
          capture.syncedAt = Date.now();
        }
      });

      await this.setStorageData(storage);

      console.log('✅ Marked as synced:', captureIds.length, 'captures');

    } catch (error) {
      console.error('❌ Failed to mark as synced:', error);
      throw error;
    }
  }

  async updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    try {
      const storage = await this.getStorageData();
      storage.syncStatus = {
        ...storage.syncStatus,
        ...status,
      };

      await this.setStorageData(storage);

    } catch (error) {
      console.error('❌ Failed to update sync status:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const storage = await this.getStorageData();

      // Remove old synced captures (keep last 100)
      const syncedCaptures = storage.captures
        .filter(c => c.synced)
        .sort((a, b) => b.timestamp - a.timestamp);

      const capturesToKeep = syncedCaptures.slice(0, 100);
      const unsyncedCaptures = storage.captures.filter(c => !c.synced);

      storage.captures = [...unsyncedCaptures, ...capturesToKeep];

      await this.setStorageData(storage);

      console.log('🧹 Storage cleanup completed');

    } catch (error) {
      console.error('❌ Storage cleanup failed:', error);
    }
  }

  async getAll(): Promise<StorageData> {
    return this.getStorageData();
  }

  async migrate(previousVersion?: string): Promise<void> {
    console.log('🔄 Migrating storage from version:', previousVersion);

    try {
      // Handle version-specific migrations
      if (previousVersion && this.needsMigration(previousVersion)) {
        await this.performMigration(previousVersion);
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }

  private async getStorageData(): Promise<StorageData> {
    const result = await browser.storage.local.get([
      this.STORAGE_KEYS.CAPTURES,
      this.STORAGE_KEYS.SYNC_QUEUE,
      this.STORAGE_KEYS.SYNC_STATUS,
      this.STORAGE_KEYS.USER_SETTINGS,
    ]);

    return {
      captures: result[this.STORAGE_KEYS.CAPTURES] || [],
      syncQueue: result[this.STORAGE_KEYS.SYNC_QUEUE] || [],
      syncStatus: result[this.STORAGE_KEYS.SYNC_STATUS] || {
        isOnline: navigator.onLine,
        lastSync: null,
      },
      userSettings: result[this.STORAGE_KEYS.USER_SETTINGS] || {
        syncEnabled: true,
        autoCapture: true,
        notifications: true,
      },
    };
  }

  private async setStorageData(data: Partial<StorageData>): Promise<void> {
    const toStore: Record<string, any> = {};

    if (data.captures !== undefined) {
      toStore[this.STORAGE_KEYS.CAPTURES] = data.captures;
    }
    if (data.syncQueue !== undefined) {
      toStore[this.STORAGE_KEYS.SYNC_QUEUE] = data.syncQueue;
    }
    if (data.syncStatus !== undefined) {
      toStore[this.STORAGE_KEYS.SYNC_STATUS] = data.syncStatus;
    }
    if (data.userSettings !== undefined) {
      toStore[this.STORAGE_KEYS.USER_SETTINGS] = data.userSettings;
    }

    await browser.storage.local.set(toStore);
  }

  private generateId(): string {
    return `cathcr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private needsMigration(_previousVersion: string): boolean {
    // Add version comparison logic here
    return false; // For now, no migrations needed
  }

  private async performMigration(previousVersion: string): Promise<void> {
    // Add migration logic here when needed
    console.log('No migration needed for version:', previousVersion);
  }
}
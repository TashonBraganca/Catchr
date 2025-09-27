/**
 * CATHCR Extension Sync Service
 * Handles synchronization between extension and main CATHCR API
 */

import browser from 'webextension-polyfill';
import type { CaptureData, SyncResult } from '../types';

export class CathcrSync {
  private readonly API_BASE_URL = (typeof __DEV__ !== 'undefined' && __DEV__)
    ? 'http://localhost:3001'
    : 'https://api.cathcr.com';

  private readonly ENDPOINTS = {
    SYNC: '/api/extension/sync',
    HEALTH: '/api/extension/health',
    AUTH: '/api/extension/auth',
    CAPTURES: '/api/extension/captures',
    CONNECT: '/api/extension/connect',
  } as const;

  // private syncInterval: number | null = null; // Unused for now
  private isOnline: boolean = navigator.onLine;
  private authToken: string | null = null;

  async initialize(): Promise<void> {
    try {
      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Set up periodic sync (every 5 minutes)
      await this.setupPeriodicSync();

      // Initial sync if online
      if (this.isOnline) {
        setTimeout(() => this.syncNow(), 2000); // Delay to allow initialization
      }

      console.log('🔄 Sync service initialized');

    } catch (error) {
      console.error('❌ Sync initialization failed:', error);
    }
  }

  async syncNow(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        error: 'Offline - sync will resume when online',
        synced: 0,
      };
    }

    try {
      console.log('🔄 Starting sync...');

      // Get unsynced captures from storage
      const storage = await this.getStorage();
      const unsyncedCaptures = storage.captures?.filter((c: CaptureData) => !c.synced) || [];

      if (unsyncedCaptures.length === 0) {
        console.log('✅ No captures to sync');
        return { success: true, synced: 0 };
      }

      // Authenticate if needed
      if (!this.authToken) {
        await this.authenticate();
      }

      // Sync captures in batches
      const batchSize = 10;
      let totalSynced = 0;

      for (let i = 0; i < unsyncedCaptures.length; i += batchSize) {
        const batch = unsyncedCaptures.slice(i, i + batchSize);
        const syncedIds = await this.syncBatch(batch);
        totalSynced += syncedIds.length;

        // Mark as synced in storage
        if (syncedIds.length > 0) {
          await this.markAsSynced(syncedIds);
        }
      }

      // Update sync status
      await this.updateSyncStatus({
        lastSync: Date.now(),
        isOnline: true,
        error: null,
      });

      console.log(`✅ Sync completed: ${totalSynced} captures synced`);

      return {
        success: true,
        synced: totalSynced,
      };

    } catch (error) {
      console.error('❌ Sync failed:', error);

      await this.updateSyncStatus({
        isOnline: this.isOnline,
        error: error instanceof Error ? error.message : 'Unknown sync error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        synced: 0,
      };
    }
  }

  async queueCapture(capture: CaptureData): Promise<void> {
    // Immediately attempt sync if online
    if (this.isOnline) {
      try {
        const synced = await this.syncBatch([capture]);
        if (synced.length > 0) {
          await this.markAsSynced(synced);
        }
      } catch (error) {
        console.warn('Failed to sync immediately, will retry later:', error);
      }
    }
  }

  async syncOnStartup(): Promise<void> {
    if (this.isOnline) {
      // Delay sync to avoid overwhelming startup
      setTimeout(() => this.syncNow(), 5000);
    }
  }

  async syncPeriodic(): Promise<void> {
    if (this.isOnline) {
      await this.syncNow();
    }
  }

  private async authenticate(): Promise<void> {
    try {
      // For MVP, we'll use a simple extension-based auth
      // In production, this would integrate with the main app's auth system
      const response = await this.apiRequest(this.ENDPOINTS.AUTH, {
        method: 'POST',
        body: JSON.stringify({
          extensionId: browser.runtime.id,
          version: browser.runtime.getManifest().version,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.authToken = data.token;
        console.log('✅ Extension authenticated');
      } else {
        throw new Error('Authentication failed');
      }

    } catch (error) {
      console.error('❌ Authentication failed:', error);
      // For development, continue without auth
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        this.authToken = 'dev-token';
        console.warn('⚠️ Using development auth token');
      } else {
        throw error;
      }
    }
  }

  private async syncBatch(captures: CaptureData[]): Promise<string[]> {
    try {
      const response = await this.apiRequest(this.ENDPOINTS.SYNC, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          captures: captures.map(c => ({
            id: c.id,
            text: c.text,
            audioUrl: c.audioUrl,
            context: c.context,
            timestamp: c.timestamp,
            source: 'extension',
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📤 Batch synced:', result.synced || captures.length, 'captures');

      return captures.map(c => c.id); // Return all IDs as synced for now

    } catch (error) {
      console.error('❌ Batch sync failed:', error);

      // If it's an auth error, clear token and retry once
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        this.authToken = null;
        throw new Error('Authentication required');
      }

      throw error;
    }
  }

  private async setupPeriodicSync(): Promise<void> {
    // Clear existing alarm
    await browser.alarms.clear('sync-periodic');

    // Create periodic sync alarm (every 5 minutes)
    await browser.alarms.create('sync-periodic', {
      delayInMinutes: 5,
      periodInMinutes: 5,
    });

    console.log('⏰ Periodic sync scheduled');
  }

  private async handleOnline(): Promise<void> {
    this.isOnline = true;
    console.log('🌐 Connection restored');

    await this.updateSyncStatus({ isOnline: true });

    // Attempt sync after brief delay
    setTimeout(() => this.syncNow(), 1000);
  }

  private async handleOffline(): Promise<void> {
    this.isOnline = false;
    console.log('📴 Connection lost');

    await this.updateSyncStatus({ isOnline: false });
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `CATHCR-Extension/${browser.runtime.getManifest().version}`,
      },
      ...options,
    };

    return fetch(url, defaultOptions);
  }

  private async getStorage(): Promise<any> {
    const result = await browser.storage.local.get(['cathcr_captures', 'cathcr_sync_status']);
    return {
      captures: result.cathcr_captures || [],
      syncStatus: result.cathcr_sync_status || {},
    };
  }

  private async markAsSynced(captureIds: string[]): Promise<void> {
    const storage = await this.getStorage();

    captureIds.forEach(id => {
      const capture = storage.captures.find((c: CaptureData) => c.id === id);
      if (capture) {
        capture.synced = true;
        capture.syncedAt = Date.now();
      }
    });

    await browser.storage.local.set({
      cathcr_captures: storage.captures,
    });
  }

  private async updateSyncStatus(status: any): Promise<void> {
    const storage = await this.getStorage();
    const updatedStatus = {
      ...storage.syncStatus,
      ...status,
    };

    await browser.storage.local.set({
      cathcr_sync_status: updatedStatus,
    });
  }
}
// CATHCR Extension Service Worker
// Handles global shortcuts, storage, and sync with main CATHCR database

class CathcrBackground {
  constructor() {
    this.apiUrl = 'http://localhost:3001'; // Main CATHCR API
    this.setupEventListeners();
    this.initializeExtension();
  }

  setupEventListeners() {
    // Global keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'capture-thought') {
        this.openCaptureModal();
      }
    });

    // Extension installation
    chrome.runtime.onInstalled.addListener(() => {
      this.handleInstallation();
    });

    // Messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Tab updates for context awareness
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        // Update context for current tab
        this.updateTabContext(tabId, tab);
      }
    });
  }

  async initializeExtension() {
    console.log('🧠 CATHCR extension initializing...');

    // Initialize default settings
    const defaultSettings = {
      globalShortcuts: true,
      autoSync: true,
      offlineMode: true,
      voiceCapture: true,
      theme: 'orange',
      apiUrl: this.apiUrl,
      syncInterval: 30000, // 30 seconds
      maxRetries: 3
    };

    // Store default settings if not already set
    const existingSettings = await chrome.storage.local.get('settings');
    if (!existingSettings.settings) {
      await chrome.storage.local.set({ settings: defaultSettings });
    }

    // Start background sync timer
    this.startSyncTimer();
  }

  async handleInstallation() {
    console.log('🧠 CATHCR extension installed');

    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'CATHCR Ready! 🧠',
      message: 'Press Cmd+K anywhere to capture thoughts instantly'
    });

    // Initialize storage
    await this.initializeStorage();
  }

  async initializeStorage() {
    // Initialize IndexedDB-like structure in chrome.storage.local
    const initialData = {
      thoughts: [],
      syncQueue: [],
      settings: {
        globalShortcuts: true,
        autoSync: true,
        offlineMode: true,
        voiceCapture: true,
        theme: 'orange',
        apiUrl: this.apiUrl
      },
      lastSync: null,
      syncStatus: 'idle'
    };

    // Only set if not already initialized
    const existingData = await chrome.storage.local.get(['thoughts', 'syncQueue', 'settings']);

    if (!existingData.thoughts) {
      await chrome.storage.local.set({ thoughts: [] });
    }
    if (!existingData.syncQueue) {
      await chrome.storage.local.set({ syncQueue: [] });
    }
    if (!existingData.settings) {
      await chrome.storage.local.set({ settings: initialData.settings });
    }
  }

  async openCaptureModal() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      if (!tab?.id) {
        console.warn('No active tab found');
        return;
      }

      // Skip on certain URLs where injection might fail
      const skipUrls = ['chrome://', 'chrome-extension://', 'moz-extension://', 'edge://', 'about:'];
      if (skipUrls.some(prefix => tab.url?.startsWith(prefix))) {
        // Fallback: Open extension popup
        await chrome.action.openPopup();
        return;
      }

      // Inject and open modal
      await chrome.tabs.sendMessage(tab.id, {
        action: 'open-capture-modal',
        timestamp: Date.now(),
        context: {
          url: tab.url,
          title: tab.title,
          tabId: tab.id
        }
      });

    } catch (error) {
      console.error('Failed to open capture modal:', error);

      // Fallback: Open extension popup
      try {
        await chrome.action.openPopup();
      } catch (popupError) {
        console.error('Popup fallback also failed:', popupError);

        // Last resort: Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'CATHCR Modal Failed',
          message: 'Click the CATHCR extension icon to capture thoughts'
        });
      }
    }
  }

  async handleMessage(message, sender, sendResponse) {
    const { action, data } = message;

    try {
      switch (action) {
        case 'save-thought':
          await this.saveThought(data, sender);
          sendResponse({ success: true });
          break;

        case 'get-recent-thoughts':
          const thoughts = await this.getRecentThoughts(data?.limit || 10);
          sendResponse({ thoughts });
          break;

        case 'sync-now':
          await this.syncPendingThoughts();
          sendResponse({ success: true });
          break;

        case 'get-settings':
          const settings = await this.getSettings();
          sendResponse({ settings });
          break;

        case 'update-settings':
          await this.updateSettings(data);
          sendResponse({ success: true });
          break;

        case 'get-sync-status':
          const syncStatus = await this.getSyncStatus();
          sendResponse({ syncStatus });
          break;

        case 'clear-storage':
          await this.clearStorage();
          sendResponse({ success: true });
          break;

        default:
          console.warn('Unknown message action:', action);
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async saveThought(thoughtData, sender) {
    const thought = {
      id: this.generateId(),
      content: thoughtData.text || thoughtData.content,
      sourceUrl: sender.tab?.url,
      sourceTitle: sender.tab?.title,
      timestamp: thoughtData.timestamp || Date.now(),
      synced: false,
      metadata: {
        source: 'extension',
        userAgent: navigator.userAgent,
        captureMethod: thoughtData.method || 'text',
        confidence: thoughtData.confidence || 1.0,
        tabId: sender.tab?.id
      }
    };

    try {
      // Save locally first (offline-first approach)
      const { thoughts = [] } = await chrome.storage.local.get('thoughts');
      thoughts.unshift(thought); // Add to beginning of array

      // Keep only last 1000 thoughts locally
      if (thoughts.length > 1000) {
        thoughts.splice(1000);
      }

      await chrome.storage.local.set({ thoughts });

      // Add to sync queue
      await this.addToSyncQueue(thought);

      // Attempt immediate sync if online and auto-sync enabled
      const { settings } = await chrome.storage.local.get('settings');
      if (settings?.autoSync && navigator.onLine) {
        setTimeout(() => this.syncPendingThoughts(), 100); // Async sync
      }

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Thought Captured! ✨',
        message: thought.content.substring(0, 60) + (thought.content.length > 60 ? '...' : '')
      });

      console.log('💾 Thought saved locally:', thought.id);

    } catch (error) {
      console.error('Failed to save thought:', error);

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Save Failed 😞',
        message: 'Thought could not be saved. Please try again.'
      });

      throw error;
    }
  }

  async addToSyncQueue(thought) {
    const { syncQueue = [] } = await chrome.storage.local.get('syncQueue');

    const syncItem = {
      ...thought,
      retryCount: 0,
      lastRetry: null,
      addedToQueue: Date.now()
    };

    syncQueue.push(syncItem);
    await chrome.storage.local.set({ syncQueue });
  }

  async syncPendingThoughts() {
    const { syncQueue = [] } = await chrome.storage.local.get('syncQueue');

    if (syncQueue.length === 0) {
      console.log('📡 No thoughts to sync');
      return;
    }

    console.log(`📡 Syncing ${syncQueue.length} thoughts...`);

    // Update sync status
    await chrome.storage.local.set({ syncStatus: 'syncing' });

    const successfulSyncs = [];
    const failedSyncs = [];

    for (const thought of syncQueue) {
      try {
        await this.syncThoughtToServer(thought);
        successfulSyncs.push(thought);

        // Update local thought as synced
        await this.markThoughtAsSynced(thought.id);

      } catch (error) {
        console.error(`Failed to sync thought ${thought.id}:`, error);

        // Increment retry count
        thought.retryCount = (thought.retryCount || 0) + 1;
        thought.lastRetry = Date.now();

        // Remove from queue if max retries reached
        if (thought.retryCount >= 3) {
          console.warn(`Giving up on syncing thought ${thought.id} after ${thought.retryCount} attempts`);
          successfulSyncs.push(thought); // Remove from queue even though it failed
        } else {
          failedSyncs.push(thought);
        }
      }
    }

    // Update sync queue (remove successfully synced items)
    const remainingQueue = syncQueue.filter(thought =>
      !successfulSyncs.some(synced => synced.id === thought.id)
    ).concat(failedSyncs);

    await chrome.storage.local.set({
      syncQueue: remainingQueue,
      syncStatus: 'idle',
      lastSync: Date.now()
    });

    console.log(`📡 Sync completed: ${successfulSyncs.length} successful, ${failedSyncs.length} failed`);
  }

  async syncThoughtToServer(thought) {
    const { settings } = await chrome.storage.local.get('settings');
    const apiUrl = settings?.apiUrl || this.apiUrl;

    const response = await fetch(`${apiUrl}/api/thoughts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add authentication headers when implemented
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: thought.content,
        source: 'extension',
        metadata: thought.metadata,
        timestamp: thought.timestamp
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Synced thought ${thought.id} to server:`, result.id);

    return result;
  }

  async markThoughtAsSynced(thoughtId) {
    const { thoughts = [] } = await chrome.storage.local.get('thoughts');
    const thoughtIndex = thoughts.findIndex(t => t.id === thoughtId);

    if (thoughtIndex !== -1) {
      thoughts[thoughtIndex].synced = true;
      thoughts[thoughtIndex].syncedAt = Date.now();
      await chrome.storage.local.set({ thoughts });
    }
  }

  async getRecentThoughts(limit = 10) {
    const { thoughts = [] } = await chrome.storage.local.get('thoughts');
    return thoughts.slice(0, limit);
  }

  async getSettings() {
    const { settings } = await chrome.storage.local.get('settings');
    return settings || {};
  }

  async updateSettings(newSettings) {
    const { settings = {} } = await chrome.storage.local.get('settings');
    const updatedSettings = { ...settings, ...newSettings };
    await chrome.storage.local.set({ settings: updatedSettings });

    // Restart sync timer if interval changed
    if (newSettings.syncInterval) {
      this.startSyncTimer();
    }
  }

  async getSyncStatus() {
    const { syncQueue = [], syncStatus = 'idle', lastSync } = await chrome.storage.local.get(['syncQueue', 'syncStatus', 'lastSync']);

    return {
      status: syncStatus,
      pendingCount: syncQueue.length,
      lastSync,
      isOnline: navigator.onLine
    };
  }

  async clearStorage() {
    await chrome.storage.local.clear();
    await this.initializeStorage();
    console.log('🗑️ Extension storage cleared');
  }

  startSyncTimer() {
    // Clear existing timer
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Start new timer
    this.syncTimer = setInterval(async () => {
      const { settings } = await chrome.storage.local.get('settings');

      if (settings?.autoSync && navigator.onLine) {
        await this.syncPendingThoughts();
      }
    }, 30000); // Every 30 seconds
  }

  updateTabContext(tabId, tab) {
    // Store tab context for later use in thought metadata
    // This could be used for better categorization
    console.log(`📄 Tab context updated: ${tab.title} - ${tab.url}`);
  }

  generateId() {
    return `cathcr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize background service
const cathcrBackground = new CathcrBackground();

// Handle service worker lifecycle
self.addEventListener('activate', () => {
  console.log('🧠 CATHCR service worker activated');
});

self.addEventListener('install', () => {
  console.log('🧠 CATHCR service worker installed');
  self.skipWaiting();
});

// Handle online/offline events
self.addEventListener('online', () => {
  console.log('📡 Extension back online - syncing...');
  cathcrBackground.syncPendingThoughts();
});

self.addEventListener('offline', () => {
  console.log('📡 Extension offline - thoughts will be queued');
});
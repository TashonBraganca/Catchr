// CATHCR Extension Popup Script

class CathcrPopup {
  constructor() {
    this.isLoading = false;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadStats();
    await this.loadRecentThoughts();
    this.updateConnectionStatus();
  }

  setupEventListeners() {
    // Main capture button
    document.getElementById('capture-btn').addEventListener('click', () => {
      this.triggerCapture();
    });

    // Sync button
    document.getElementById('sync-btn').addEventListener('click', () => {
      this.syncNow();
    });

    // Settings button (placeholder)
    document.getElementById('settings-btn').addEventListener('click', () => {
      // TODO: Open options page when implemented
      this.showMessage('Settings coming soon!', 'info');
    });

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
      this.clearStorage();
    });
  }

  async triggerCapture() {
    try {
      // Get active tab and send message to open modal
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        this.showMessage('No active tab found', 'error');
        return;
      }

      // Skip on certain URLs
      const skipUrls = ['chrome://', 'chrome-extension://', 'moz-extension://', 'edge://', 'about:'];
      if (skipUrls.some(prefix => tab.url?.startsWith(prefix))) {
        this.showMessage('Cannot capture on this page', 'warning');
        return;
      }

      await chrome.tabs.sendMessage(tab.id, {
        action: 'open-capture-modal',
        timestamp: Date.now(),
        context: {
          url: tab.url,
          title: tab.title,
          tabId: tab.id,
          source: 'popup'
        }
      });

      // Close popup after triggering modal
      window.close();

    } catch (error) {
      console.error('Failed to trigger capture:', error);
      this.showMessage('Failed to open capture modal', 'error');
    }
  }

  async syncNow() {
    if (this.isLoading) return;

    this.setLoading(true);
    const syncBtn = document.getElementById('sync-btn');
    const originalText = syncBtn.textContent;
    syncBtn.textContent = 'Syncing...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'sync-now'
      });

      if (response?.success) {
        this.showMessage('Sync completed!', 'success');
        await this.loadStats(); // Refresh stats
      } else {
        throw new Error(response?.error || 'Sync failed');
      }

    } catch (error) {
      console.error('Sync failed:', error);
      this.showMessage('Sync failed', 'error');
    } finally {
      syncBtn.textContent = originalText;
      this.setLoading(false);
    }
  }

  async clearStorage() {
    if (this.isLoading) return;

    const confirmed = confirm('Clear all local thoughts? This cannot be undone.');
    if (!confirmed) return;

    this.setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'clear-storage'
      });

      if (response?.success) {
        this.showMessage('Storage cleared', 'success');
        await this.loadStats();
        await this.loadRecentThoughts();
      } else {
        throw new Error(response?.error || 'Clear failed');
      }

    } catch (error) {
      console.error('Clear failed:', error);
      this.showMessage('Failed to clear storage', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  async loadStats() {
    try {
      // Get recent thoughts for total count
      const thoughtsResponse = await chrome.runtime.sendMessage({
        action: 'get-recent-thoughts',
        data: { limit: 1000 }
      });

      // Get sync status
      const syncResponse = await chrome.runtime.sendMessage({
        action: 'get-sync-status'
      });

      const thoughts = thoughtsResponse?.thoughts || [];
      const syncStatus = syncResponse?.syncStatus || {};

      // Update stats display
      document.getElementById('total-thoughts').textContent = thoughts.length.toString();
      document.getElementById('pending-sync').textContent = (syncStatus.pendingCount || 0).toString();

      const syncedCount = thoughts.filter(t => t.synced).length;
      document.getElementById('sync-status').textContent = syncedCount.toString();

    } catch (error) {
      console.error('Failed to load stats:', error);
      document.getElementById('total-thoughts').textContent = '-';
      document.getElementById('pending-sync').textContent = '-';
      document.getElementById('sync-status').textContent = '-';
    }
  }

  async loadRecentThoughts() {
    const recentList = document.getElementById('recent-list');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'get-recent-thoughts',
        data: { limit: 5 }
      });

      const thoughts = response?.thoughts || [];

      if (thoughts.length === 0) {
        recentList.innerHTML = `
          <div style="text-align: center; padding: 20px; color: rgba(255, 255, 255, 0.4);">
            <div style="font-size: 32px; margin-bottom: 8px;">🌟</div>
            <div>No thoughts yet</div>
            <div style="font-size: 11px; margin-top: 4px;">Press Cmd+K to capture your first thought</div>
          </div>
        `;
        return;
      }

      recentList.innerHTML = thoughts.map(thought => {
        const date = new Date(thought.timestamp);
        const timeAgo = this.getTimeAgo(date);
        const content = thought.content.length > 60
          ? thought.content.substring(0, 60) + '...'
          : thought.content;

        return `
          <div class="thought-item">
            <div class="thought-content">${this.escapeHtml(content)}</div>
            <div class="thought-meta">
              ${timeAgo} • ${thought.metadata?.captureMethod || 'text'}
              ${thought.synced ? '✅' : '⏳'}
            </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Failed to load recent thoughts:', error);
      recentList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: rgba(239, 68, 68, 0.7);">
          Failed to load thoughts
        </div>
      `;
    }
  }

  updateConnectionStatus() {
    const statusEl = document.getElementById('connection-status');

    if (navigator.onLine) {
      statusEl.textContent = '🌐 Connected to CATHCR';
      statusEl.className = 'status online';
    } else {
      statusEl.textContent = '📴 Offline - thoughts will sync later';
      statusEl.className = 'status offline';
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      statusEl.textContent = '🌐 Connected to CATHCR';
      statusEl.className = 'status online';
    });

    window.addEventListener('offline', () => {
      statusEl.textContent = '📴 Offline - thoughts will sync later';
      statusEl.className = 'status offline';
    });
  }

  showMessage(message, type = 'info') {
    // Create a temporary message element
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      transition: all 0.3s ease;
      ${this.getMessageStyles(type)}
    `;

    document.body.appendChild(messageEl);

    // Remove after 3 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => {
          messageEl.remove();
        }, 300);
      }
    }, 3000);
  }

  getMessageStyles(type) {
    switch (type) {
      case 'success':
        return 'background: rgba(34, 197, 94, 0.2); color: #22C55E; border: 1px solid rgba(34, 197, 94, 0.3);';
      case 'error':
        return 'background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3);';
      case 'warning':
        return 'background: rgba(245, 158, 11, 0.2); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3);';
      default:
        return 'background: rgba(59, 130, 246, 0.2); color: #3B82F6; border: 1px solid rgba(59, 130, 246, 0.3);';
    }
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setLoading(loading) {
    this.isLoading = loading;
    document.body.classList.toggle('loading', loading);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CathcrPopup();
});
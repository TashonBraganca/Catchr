/**
 * CATHCR Extension Options Page
 * Settings and configuration interface
 */

import browser from 'webextension-polyfill';
import type { StorageData, UserSettings } from '../types';

class CathcrOptions {
  private settings: UserSettings = {
    syncEnabled: true,
    autoCapture: true,
    notifications: true,
    analyticsEnabled: false,
  };

  private elements = {
    // Settings
    syncEnabled: document.getElementById('syncEnabled') as HTMLInputElement,
    autoCapture: document.getElementById('autoCapture') as HTMLInputElement,
    notifications: document.getElementById('notifications') as HTMLInputElement,
    analyticsEnabled: document.getElementById('analyticsEnabled') as HTMLInputElement,

    // Info displays
    versionInfo: document.getElementById('versionInfo') as HTMLDivElement,
    storageStats: document.getElementById('storageStats') as HTMLDivElement,
    accountStatus: document.getElementById('accountStatus') as HTMLDivElement,

    // Action buttons
    openShortcutsBtn: document.getElementById('openShortcutsBtn') as HTMLButtonElement,
    exportDataBtn: document.getElementById('exportDataBtn') as HTMLButtonElement,
    cleanupBtn: document.getElementById('cleanupBtn') as HTMLButtonElement,
    clearAllBtn: document.getElementById('clearAllBtn') as HTMLButtonElement,
    connectAccountBtn: document.getElementById('connectAccountBtn') as HTMLButtonElement,
    openDashboardBtn: document.getElementById('openDashboardBtn') as HTMLButtonElement,
    resetSettingsBtn: document.getElementById('resetSettingsBtn') as HTMLButtonElement,

    // Modal
    modalOverlay: document.getElementById('modalOverlay') as HTMLDivElement,
    modalTitle: document.getElementById('modalTitle') as HTMLHeadingElement,
    modalMessage: document.getElementById('modalMessage') as HTMLParagraphElement,
    modalCancel: document.getElementById('modalCancel') as HTMLButtonElement,
    modalConfirm: document.getElementById('modalConfirm') as HTMLButtonElement,

    // Toast
    toastContainer: document.getElementById('toastContainer') as HTMLDivElement,
  };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load settings
      await this.loadSettings();

      // Setup event listeners
      this.setupEventListeners();

      // Load dynamic content
      await this.loadVersionInfo();
      await this.loadStorageStats();
      await this.loadAccountStatus();

      console.log('✅ Options page initialized');

    } catch (error) {
      console.error('❌ Failed to initialize options:', error);
      this.showToast('Failed to load settings', 'error');
    }
  }

  private setupEventListeners(): void {
    // Settings checkboxes
    this.elements.syncEnabled.addEventListener('change', this.handleSettingChange.bind(this));
    this.elements.autoCapture.addEventListener('change', this.handleSettingChange.bind(this));
    this.elements.notifications.addEventListener('change', this.handleSettingChange.bind(this));
    this.elements.analyticsEnabled.addEventListener('change', this.handleSettingChange.bind(this));

    // Action buttons
    this.elements.openShortcutsBtn.addEventListener('click', this.handleOpenShortcuts.bind(this));
    this.elements.exportDataBtn.addEventListener('click', this.handleExportData.bind(this));
    this.elements.cleanupBtn.addEventListener('click', this.handleCleanup.bind(this));
    this.elements.clearAllBtn.addEventListener('click', this.handleClearAll.bind(this));
    this.elements.connectAccountBtn.addEventListener('click', this.handleConnectAccount.bind(this));
    this.elements.openDashboardBtn.addEventListener('click', this.handleOpenDashboard.bind(this));
    this.elements.resetSettingsBtn.addEventListener('click', this.handleResetSettings.bind(this));

    // Modal
    this.elements.modalCancel.addEventListener('click', this.hideModal.bind(this));
    this.elements.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.elements.modalOverlay) {
        this.hideModal();
      }
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const storage: StorageData = await browser.runtime.sendMessage({
        type: 'GET_STORAGE',
      });

      if (storage.userSettings) {
        this.settings = { ...this.settings, ...storage.userSettings };
      }

      // Update UI
      this.elements.syncEnabled.checked = this.settings.syncEnabled;
      this.elements.autoCapture.checked = this.settings.autoCapture;
      this.elements.notifications.checked = this.settings.notifications;
      this.elements.analyticsEnabled.checked = this.settings.analyticsEnabled;

    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await browser.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        payload: this.settings,
      });

      this.showToast('Settings saved successfully', 'success');

    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  private async handleSettingChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const setting = target.id as keyof UserSettings;

    this.settings[setting] = target.checked as any;
    await this.saveSettings();
  }

  private async loadVersionInfo(): Promise<void> {
    try {
      const manifest = browser.runtime.getManifest();

      this.elements.versionInfo.innerHTML = `
        <div class="version-badge">
          <span class="version-label">Version</span>
          <span class="version-number">${manifest.version}</span>
        </div>
      `;

    } catch (error) {
      console.error('Failed to load version info:', error);
    }
  }

  private async loadStorageStats(): Promise<void> {
    try {
      const storage: StorageData = await browser.runtime.sendMessage({
        type: 'GET_STORAGE',
      });

      const totalCaptures = storage.captures?.length || 0;
      const syncedCaptures = storage.captures?.filter(c => c.synced).length || 0;
      const unsyncedCaptures = totalCaptures - syncedCaptures;

      // Estimate storage usage (rough calculation)
      const storageSize = JSON.stringify(storage).length;
      const storageMB = (storageSize / 1024 / 1024).toFixed(2);

      this.elements.storageStats.innerHTML = `
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">${totalCaptures}</span>
            <span class="stat-label">Total Captures</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${syncedCaptures}</span>
            <span class="stat-label">Synced</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${unsyncedCaptures}</span>
            <span class="stat-label">Pending</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${storageMB} MB</span>
            <span class="stat-label">Storage Used</span>
          </div>
        </div>
      `;

    } catch (error) {
      console.error('Failed to load storage stats:', error);
      this.elements.storageStats.innerHTML = '<p class="error">Failed to load storage statistics</p>';
    }
  }

  private async loadAccountStatus(): Promise<void> {
    try {
      // Check if user is connected (this would be expanded in full implementation)
      const isConnected = false; // Placeholder

      if (isConnected) {
        this.elements.accountStatus.innerHTML = `
          <div class="account-connected">
            <span class="status-icon">✅</span>
            <div class="status-info">
              <strong>Connected</strong>
              <p>Your captures are syncing to your CATHCR account</p>
            </div>
          </div>
        `;
        this.elements.connectAccountBtn.textContent = 'Disconnect Account';
      } else {
        this.elements.accountStatus.innerHTML = `
          <div class="account-disconnected">
            <span class="status-icon">⚠️</span>
            <div class="status-info">
              <strong>Not Connected</strong>
              <p>Connect your CATHCR account to sync across devices</p>
            </div>
          </div>
        `;
        this.elements.connectAccountBtn.textContent = 'Connect Account';
      }

    } catch (error) {
      console.error('Failed to load account status:', error);
    }
  }

  private async handleOpenShortcuts(): Promise<void> {
    try {
      await browser.tabs.create({
        url: 'chrome://extensions/shortcuts',
      });
    } catch (error) {
      console.error('Failed to open shortcuts:', error);
      this.showToast('Failed to open shortcuts settings', 'error');
    }
  }

  private async handleExportData(): Promise<void> {
    try {
      const storage: StorageData = await browser.runtime.sendMessage({
        type: 'GET_STORAGE',
      });

      const exportData = {
        version: browser.runtime.getManifest().version,
        exportDate: new Date().toISOString(),
        captures: storage.captures || [],
        settings: storage.userSettings || {},
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cathcr-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      URL.revokeObjectURL(url);
      this.showToast('Data exported successfully', 'success');

    } catch (error) {
      console.error('Failed to export data:', error);
      this.showToast('Failed to export data', 'error');
    }
  }

  private async handleCleanup(): Promise<void> {
    this.showModal(
      'Cleanup Old Data',
      'This will remove old synced captures to free up space. Unsynced captures will be preserved.',
      async () => {
        try {
          await browser.runtime.sendMessage({
            type: 'CLEANUP_STORAGE',
          });

          this.showToast('Storage cleanup completed', 'success');
          await this.loadStorageStats();

        } catch (error) {
          console.error('Failed to cleanup storage:', error);
          this.showToast('Failed to cleanup storage', 'error');
        }
      }
    );
  }

  private async handleClearAll(): Promise<void> {
    this.showModal(
      'Clear All Data',
      '⚠️ This will permanently delete ALL your captures and settings. This action cannot be undone!',
      async () => {
        try {
          await browser.runtime.sendMessage({
            type: 'CLEAR_ALL_DATA',
          });

          this.showToast('All data cleared', 'success');
          await this.loadSettings();
          await this.loadStorageStats();

        } catch (error) {
          console.error('Failed to clear data:', error);
          this.showToast('Failed to clear data', 'error');
        }
      },
      'danger'
    );
  }

  private async handleConnectAccount(): Promise<void> {
    try {
      const url = (typeof __DEV__ !== 'undefined' && __DEV__) ? 'http://localhost:3000/connect-extension' : 'https://cathcr.com/connect-extension';
      await browser.tabs.create({ url });

    } catch (error) {
      console.error('Failed to open connection page:', error);
      this.showToast('Failed to open connection page', 'error');
    }
  }

  private async handleOpenDashboard(): Promise<void> {
    try {
      const url = (typeof __DEV__ !== 'undefined' && __DEV__) ? 'http://localhost:3000' : 'https://cathcr.com';
      await browser.tabs.create({ url });

    } catch (error) {
      console.error('Failed to open dashboard:', error);
      this.showToast('Failed to open dashboard', 'error');
    }
  }

  private async handleResetSettings(): Promise<void> {
    this.showModal(
      'Reset Settings',
      'This will reset all settings to their default values.',
      async () => {
        try {
          this.settings = {
            syncEnabled: true,
            autoCapture: true,
            notifications: true,
            analyticsEnabled: false,
          };

          await this.saveSettings();
          await this.loadSettings();
          this.showToast('Settings reset to defaults', 'success');

        } catch (error) {
          console.error('Failed to reset settings:', error);
          this.showToast('Failed to reset settings', 'error');
        }
      }
    );
  }

  private showModal(
    title: string,
    message: string,
    onConfirm: () => Promise<void>,
    type: 'default' | 'danger' = 'default'
  ): void {
    this.elements.modalTitle.textContent = title;
    this.elements.modalMessage.textContent = message;

    this.elements.modalConfirm.className = `btn btn-${type === 'danger' ? 'danger' : 'primary'}`;

    this.elements.modalConfirm.onclick = async () => {
      this.hideModal();
      await onConfirm();
    };

    this.elements.modalOverlay.style.display = 'flex';
  }

  private hideModal(): void {
    this.elements.modalOverlay.style.display = 'none';
  }

  private showToast(message: string, type: 'success' | 'error' | 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.elements.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 200);
    }, 4000);
  }
}

// Initialize options page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CathcrOptions());
} else {
  new CathcrOptions();
}
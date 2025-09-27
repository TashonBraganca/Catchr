/**
 * CATHCR Extension Popup
 * Main interface for quick thought capture
 */

import browser from 'webextension-polyfill';
import type { CaptureData, StorageData, SyncResult } from '../types';

class CathcrPopup {
  private isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  private elements = {
    thoughtInput: document.getElementById('thoughtInput') as HTMLTextAreaElement,
    captureForm: document.getElementById('captureForm') as HTMLFormElement,
    captureBtn: document.getElementById('captureBtn') as HTMLButtonElement,
    voiceBtn: document.getElementById('voiceBtn') as HTMLButtonElement,
    syncBtn: document.getElementById('syncBtn') as HTMLButtonElement,
    optionsBtn: document.getElementById('optionsBtn') as HTMLButtonElement,
    dashboardBtn: document.getElementById('dashboardBtn') as HTMLButtonElement,
    capturesList: document.getElementById('capturesList') as HTMLDivElement,
    capturesEmpty: document.getElementById('capturesEmpty') as HTMLDivElement,
    syncStatus: document.getElementById('syncStatus') as HTMLDivElement,
    statusIndicator: document.getElementById('statusIndicator') as HTMLSpanElement,
    statusText: document.getElementById('statusText') as HTMLSpanElement,
    footerStats: document.getElementById('footerStats') as HTMLDivElement,
    captureCount: document.getElementById('captureCount') as HTMLSpanElement,
    syncCount: document.getElementById('syncCount') as HTMLSpanElement,
    voiceIndicator: document.getElementById('voiceIndicator') as HTMLDivElement,
    toastContainer: document.getElementById('toastContainer') as HTMLDivElement,
  };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Setup event listeners
      this.setupEventListeners();

      // Load initial data
      await this.loadStorageData();

      // Update sync status
      await this.updateSyncStatus();

      console.log('✅ Popup initialized');

    } catch (error) {
      console.error('❌ Failed to initialize popup:', error);
      this.showToast('Failed to initialize extension', 'error');
    }
  }

  private setupEventListeners(): void {
    // Form submission
    this.elements.captureForm.addEventListener('submit', this.handleCaptureSubmit.bind(this));

    // Voice recording
    this.elements.voiceBtn.addEventListener('click', this.handleVoiceToggle.bind(this));

    // Footer actions
    this.elements.syncBtn.addEventListener('click', this.handleSyncNow.bind(this));
    this.elements.optionsBtn.addEventListener('click', this.handleOpenOptions.bind(this));
    this.elements.dashboardBtn.addEventListener('click', this.handleOpenDashboard.bind(this));

    // Keyboard shortcuts
    this.elements.thoughtInput.addEventListener('keydown', this.handleKeydown.bind(this));

    // Voice indicator click (to stop recording)
    this.elements.voiceIndicator.addEventListener('click', this.stopVoiceRecording.bind(this));
  }

  private async handleCaptureSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const text = this.elements.thoughtInput.value.trim();
    if (!text) return;

    try {
      this.setButtonLoading(this.elements.captureBtn, true);

      // Get current tab context
      const context = await this.getCurrentTabContext();

      // Send to background script
      const response = await browser.runtime.sendMessage({
        type: 'CAPTURE_THOUGHT',
        payload: {
          text,
          context,
          source: 'popup',
          timestamp: Date.now(),
        },
      });

      if (response.success) {
        this.elements.thoughtInput.value = '';
        this.showToast('Thought captured successfully!', 'success');
        await this.loadStorageData(); // Refresh data
      } else {
        throw new Error(response.error || 'Failed to capture thought');
      }

    } catch (error) {
      console.error('Failed to capture thought:', error);
      this.showToast('Failed to capture thought', 'error');
    } finally {
      this.setButtonLoading(this.elements.captureBtn, false);
    }
  }

  private async handleVoiceToggle(): Promise<void> {
    if (this.isRecording) {
      this.stopVoiceRecording();
    } else {
      await this.startVoiceRecording();
    }
  }

  private async startVoiceRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        await this.processVoiceRecording(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      // Update UI
      this.elements.voiceBtn.classList.add('recording');
      this.elements.voiceIndicator.style.display = 'flex';
      this.showToast('Recording started...', 'info');

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.showToast('Microphone access denied', 'error');
    }
  }

  private stopVoiceRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Update UI
      this.elements.voiceBtn.classList.remove('recording');
      this.elements.voiceIndicator.style.display = 'none';
      this.showToast('Processing audio...', 'info');
    }
  }

  private async processVoiceRecording(audioBlob: Blob): Promise<void> {
    try {
      // Convert to base64 for transmission
      const reader = new FileReader();
      reader.onloadend = async () => {
        const audioData = reader.result as string;

        // Send to background for transcription
        const response = await browser.runtime.sendMessage({
          type: 'TRANSCRIBE_AUDIO',
          payload: {
            audioData,
            source: 'popup',
          },
        });

        if (response.success && response.text) {
          this.elements.thoughtInput.value = response.text;
          this.elements.thoughtInput.focus();
          this.showToast('Audio transcribed successfully!', 'success');
        } else {
          throw new Error(response.error || 'Transcription failed');
        }
      };

      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('Failed to process audio:', error);
      this.showToast('Failed to process audio', 'error');
    }
  }

  private async handleSyncNow(): Promise<void> {
    try {
      this.setButtonLoading(this.elements.syncBtn, true);

      const response: SyncResult = await browser.runtime.sendMessage({
        type: 'SYNC_NOW',
      });

      if (response.success) {
        this.showToast(`Synced ${response.synced} captures`, 'success');
        await this.loadStorageData();
        await this.updateSyncStatus();
      } else {
        throw new Error(response.error || 'Sync failed');
      }

    } catch (error) {
      console.error('Sync failed:', error);
      this.showToast('Sync failed', 'error');
    } finally {
      this.setButtonLoading(this.elements.syncBtn, false);
    }
  }

  private async handleOpenOptions(): Promise<void> {
    await browser.runtime.openOptionsPage();
    window.close();
  }

  private async handleOpenDashboard(): Promise<void> {
    const url = (typeof __DEV__ !== 'undefined' && __DEV__) ? 'http://localhost:3000' : 'https://cathcr.com';
    await browser.tabs.create({ url });
    window.close();
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Cmd/Ctrl + Enter to submit
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      this.elements.captureForm.dispatchEvent(new Event('submit'));
    }
  }

  private async loadStorageData(): Promise<void> {
    try {
      const storage: StorageData = await browser.runtime.sendMessage({
        type: 'GET_STORAGE',
      });

      this.updateCapturesList(storage.captures || []);
      this.updateStats(storage);

    } catch (error) {
      console.error('Failed to load storage data:', error);
    }
  }

  private updateCapturesList(captures: CaptureData[]): void {
    const recentCaptures = captures.slice(0, 5);

    if (recentCaptures.length === 0) {
      this.elements.capturesList.style.display = 'none';
      this.elements.capturesEmpty.style.display = 'block';
      return;
    }

    this.elements.capturesList.style.display = 'block';
    this.elements.capturesEmpty.style.display = 'none';

    this.elements.capturesList.innerHTML = recentCaptures
      .map(capture => this.createCaptureItem(capture))
      .join('');
  }

  private createCaptureItem(capture: CaptureData): string {
    const timeAgo = this.getTimeAgo(capture.timestamp);
    const syncIcon = capture.synced ? '✅' : '⏳';
    const truncatedText = capture.text.length > 60
      ? capture.text.substring(0, 60) + '...'
      : capture.text;

    return `
      <div class="capture-item" data-id="${capture.id}">
        <div class="capture-content">
          <p class="capture-text">${this.escapeHtml(truncatedText)}</p>
          <div class="capture-meta">
            <span class="capture-time">${timeAgo}</span>
            <span class="capture-sync" title="${capture.synced ? 'Synced' : 'Pending sync'}">${syncIcon}</span>
          </div>
        </div>
      </div>
    `;
  }

  private updateStats(storage: StorageData): void {
    const totalCaptures = storage.captures?.length || 0;
    const syncedCaptures = storage.captures?.filter(c => c.synced).length || 0;

    this.elements.captureCount.textContent = `${totalCaptures} capture${totalCaptures !== 1 ? 's' : ''}`;
    this.elements.syncCount.textContent = `${syncedCaptures} synced`;
  }

  private async updateSyncStatus(): Promise<void> {
    try {
      const storage: StorageData = await browser.runtime.sendMessage({
        type: 'GET_STORAGE',
      });

      const syncStatus = storage.syncStatus;
      const isOnline = syncStatus?.isOnline ?? navigator.onLine;
      const lastSync = syncStatus?.lastSync;

      // Update indicator
      this.elements.statusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;

      // Update text
      if (isOnline) {
        if (lastSync) {
          const timeAgo = this.getTimeAgo(lastSync);
          this.elements.statusText.textContent = `Synced ${timeAgo}`;
        } else {
          this.elements.statusText.textContent = 'Online';
        }
      } else {
        this.elements.statusText.textContent = 'Offline';
      }

    } catch (error) {
      console.error('Failed to update sync status:', error);
      this.elements.statusText.textContent = 'Unknown';
    }
  }

  private async getCurrentTabContext(): Promise<any> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab) return null;

      return {
        url: activeTab.url,
        title: activeTab.title,
        favicon: activeTab.favIconUrl,
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error('Failed to get tab context:', error);
      return null;
    }
  }

  private setButtonLoading(button: HTMLButtonElement, loading: boolean): void {
    if (loading) {
      button.disabled = true;
      button.classList.add('loading');
    } else {
      button.disabled = false;
      button.classList.remove('loading');
    }
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
    }, 3000);
  }

  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CathcrPopup());
} else {
  new CathcrPopup();
}
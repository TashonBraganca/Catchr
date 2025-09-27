/**
 * CATHCR Chrome Extension Background Script
 * Modern TypeScript service worker with hot reloading support
 */

/// <reference path="../types/global.d.ts" />

import browser from 'webextension-polyfill';
import { CathcrStorage } from './storage';
import { CathcrSync } from './sync';
import { CathcrNotifications } from './notifications';
import type { CaptureData, ExtensionMessage } from '../types';

class CathcrBackground {
  private storage: CathcrStorage;
  private sync: CathcrSync;
  private notifications: CathcrNotifications;

  constructor() {
    this.storage = new CathcrStorage();
    this.sync = new CathcrSync();
    this.notifications = new CathcrNotifications();

    console.log('🚀 CATHCR Background Service Worker initialized');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Set up event listeners
      this.setupEventListeners();

      // Initialize storage
      await this.storage.initialize();

      // Initialize sync
      await this.sync.initialize();

      // Initialize notifications
      await this.notifications.initialize();

      console.log('✅ CATHCR Background Service Worker ready');

    } catch (error) {
      console.error('❌ Failed to initialize CATHCR background:', error);
    }
  }

  private setupEventListeners(): void {
    // Global keyboard shortcuts
    browser.commands.onCommand.addListener(this.handleCommand.bind(this));

    // Extension messages from content scripts and popup
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Tab updates for context awareness
    browser.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));

    // Extension lifecycle
    browser.runtime.onStartup.addListener(this.handleStartup.bind(this));
    browser.runtime.onInstalled.addListener(this.handleInstalled.bind(this));

    // Alarm for periodic sync
    browser.alarms.onAlarm.addListener(this.handleAlarm.bind(this));
  }

  private async handleCommand(command: string, tab?: browser.Tabs.Tab): Promise<void> {
    console.log('📝 Command received:', command, tab?.url);

    switch (command) {
      case 'capture-thought':
        await this.openCaptureModal(tab);
        break;
      default:
        console.warn('Unknown command:', command);
    }
  }

  private async handleMessage(
    message: ExtensionMessage,
    sender: browser.Runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean> {
    console.log('💬 Message received:', message.type, sender.tab?.url);

    try {
      let response: any;

      switch (message.type) {
        case 'CAPTURE_THOUGHT':
          response = await this.handleCaptureThought(message.payload);
          break;

        case 'GET_STORAGE':
          response = await this.storage.getAll();
          break;

        case 'SYNC_NOW':
          response = await this.sync.syncNow();
          break;

        case 'GET_CONTEXT':
          response = await this.getTabContext(sender.tab);
          break;

        default:
          console.warn('Unknown message type:', message.type);
          response = { error: 'Unknown message type' };
      }

      sendResponse(response);
      return true; // Indicates async response

    } catch (error) {
      console.error('Error handling message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      sendResponse({ error: errorMessage });
      return true;
    }
  }

  private async openCaptureModal(tab?: browser.Tabs.Tab): Promise<void> {
    if (!tab?.id) {
      console.warn('No active tab found for capture modal');
      return;
    }

    try {
      // Inject content script if not already present
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Check if CATHCR is already initialized
          return (window as any).CATHCR_INITIALIZED === true;
        },
      });

      // Send message to open modal
      await browser.tabs.sendMessage(tab.id, {
        type: 'OPEN_CAPTURE_MODAL',
        payload: {
          url: tab.url,
          title: tab.title,
          timestamp: Date.now(),
        },
      });

    } catch (error) {
      console.error('Failed to open capture modal:', error);

      // Fallback: Show notification
      await this.notifications.show({
        type: 'basic',
        iconUrl: '/icons/icon-48.png',
        title: 'CATHCR',
        message: 'Unable to capture on this page. Try the extension popup instead.',
      });
    }
  }

  private async handleCaptureThought(captureData: CaptureData): Promise<any> {
    try {
      // Store locally first
      const stored = await this.storage.addCapture(captureData);

      // Queue for sync
      await this.sync.queueCapture(stored);

      // Show success notification
      await this.notifications.show({
        type: 'basic',
        iconUrl: '/icons/icon-48.png',
        title: '📝 Thought Captured',
        message: 'Your thought has been saved and will sync automatically.',
      });

      return { success: true, id: stored.id };

    } catch (error) {
      console.error('Failed to capture thought:', error);
      throw error;
    }
  }

  private async getTabContext(tab?: browser.Tabs.Tab): Promise<any> {
    if (!tab) return null;

    return {
      url: tab.url,
      title: tab.title,
      favicon: tab.favIconUrl,
      timestamp: Date.now(),
    };
  }

  private async handleTabUpdate(
    _tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab
  ): Promise<void> {
    // Update context for active captures
    if (changeInfo.status === 'complete' && tab.active) {
      // Could update context for ongoing captures
    }
  }

  private async handleStartup(): Promise<void> {
    console.log('🔄 Extension startup');
    await this.sync.syncOnStartup();
  }

  private async handleInstalled(details: browser.Runtime.InstalledDetails): Promise<void> {
    console.log('📦 Extension installed/updated:', details.reason);

    if (details.reason === 'install') {
      // First time install
      await this.storage.initialize();
      await this.showWelcomeNotification();

      // Open options page
      browser.runtime.openOptionsPage();

    } else if (details.reason === 'update') {
      // Update existing installation
      await this.storage.migrate(details.previousVersion);
    }
  }

  private async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    console.log('⏰ Alarm triggered:', alarm.name);

    switch (alarm.name) {
      case 'sync-periodic':
        await this.sync.syncPeriodic();
        break;

      case 'cleanup-storage':
        await this.storage.cleanup();
        break;
    }
  }

  private async showWelcomeNotification(): Promise<void> {
    await this.notifications.show({
      type: 'basic',
      iconUrl: '/icons/icon-128.png',
      title: 'Welcome to CATHCR! 🎉',
      message: 'Press Cmd+K (or Ctrl+Shift+C) anywhere to capture your thoughts instantly.',
    });
  }
}

// Initialize the background service
new CathcrBackground();

// Handle hot module replacement in development
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  // @ts-ignore
  if (module.hot) {
    // @ts-ignore
    module.hot.accept();
  }
}
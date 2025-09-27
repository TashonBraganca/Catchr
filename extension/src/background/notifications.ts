/**
 * CATHCR Extension Notifications Service
 * Handles desktop notifications and user feedback
 */

import browser from 'webextension-polyfill';
import type { NotificationOptions } from '../types';

export class CathcrNotifications {
  private readonly MAX_NOTIFICATIONS = 5;
  private activeNotifications: Set<string> = new Set();

  async initialize(): Promise<void> {
    try {
      // Check and request notification permissions
      const permission = await this.checkPermissions();
      if (!permission) {
        console.warn('⚠️ Notification permission not granted');
      }

      // Set up notification click handlers
      browser.notifications.onClicked.addListener(this.handleNotificationClick.bind(this));
      browser.notifications.onClosed.addListener(this.handleNotificationClosed.bind(this));

      console.log('🔔 Notifications service initialized');

    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
    }
  }

  async show(options: NotificationOptions): Promise<string | null> {
    try {
      // Check if we have permission
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.warn('Cannot show notification: permission denied');
        return null;
      }

      // Limit concurrent notifications
      if (this.activeNotifications.size >= this.MAX_NOTIFICATIONS) {
        const oldestId = this.activeNotifications.values().next().value;
        if (oldestId) {
          await this.clear(oldestId);
        }
      }

      // Generate unique ID
      const notificationId = `cathcr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Create notification
      await browser.notifications.create(notificationId, {
        type: options.type,
        iconUrl: options.iconUrl,
        title: options.title,
        message: options.message,
        imageUrl: options.imageUrl,
        items: options.items,
        progress: options.progress,
        // buttons: options.buttons,  // Not supported in all browsers
        contextMessage: 'CATHCR',
        // requireInteraction: false, // Not supported in all browsers
        // silent: false, // Not supported in all browsers
      });

      this.activeNotifications.add(notificationId);

      // Auto-clear after 5 seconds unless it requires interaction
      if (!options.buttons || options.buttons.length === 0) {
        setTimeout(() => {
          this.clear(notificationId);
        }, 5000);
      }

      console.log('🔔 Notification shown:', notificationId);
      return notificationId;

    } catch (error) {
      console.error('❌ Failed to show notification:', error);
      return null;
    }
  }

  async clear(notificationId: string): Promise<void> {
    try {
      await browser.notifications.clear(notificationId);
      this.activeNotifications.delete(notificationId);

    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      const notifications = Array.from(this.activeNotifications);
      await Promise.all(notifications.map(id => this.clear(id)));

    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }

  async showSuccess(message: string, title: string = 'Success'): Promise<string | null> {
    return this.show({
      type: 'basic',
      iconUrl: '/icons/icon-48.png',
      title: `✅ ${title}`,
      message,
    });
  }

  async showError(message: string, title: string = 'Error'): Promise<string | null> {
    return this.show({
      type: 'basic',
      iconUrl: '/icons/icon-48.png',
      title: `❌ ${title}`,
      message,
    });
  }

  async showInfo(message: string, title: string = 'Info'): Promise<string | null> {
    return this.show({
      type: 'basic',
      iconUrl: '/icons/icon-48.png',
      title: `ℹ️ ${title}`,
      message,
    });
  }

  async showSyncStatus(synced: number, total: number): Promise<string | null> {
    if (synced === 0) return null;

    const message = synced === total
      ? `All ${total} captures synced successfully`
      : `${synced} of ${total} captures synced`;

    return this.show({
      type: 'basic',
      iconUrl: '/icons/icon-48.png',
      title: '🔄 Sync Complete',
      message,
    });
  }

  async showQuickCapture(text: string): Promise<string | null> {
    const truncatedText = text.length > 50
      ? text.substring(0, 50) + '...'
      : text;

    return this.show({
      type: 'basic',
      iconUrl: '/icons/icon-48.png',
      title: '📝 Thought Captured',
      message: `"${truncatedText}"`,
    });
  }

  private async checkPermissions(): Promise<boolean> {
    try {
      // Check if notifications permission is granted
      const permissions = await browser.permissions.contains({
        permissions: ['notifications'],
      });

      return permissions;

    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return false;
    }
  }

  private async handleNotificationClick(notificationId: string): Promise<void> {
    console.log('🔔 Notification clicked:', notificationId);

    try {
      // Handle different notification types
      if (notificationId.includes('sync')) {
        // Open popup or dashboard
        await browser.action.openPopup();
      } else if (notificationId.includes('capture')) {
        // Open dashboard to view captures
        const url = (typeof __DEV__ !== 'undefined' && __DEV__) ? 'http://localhost:3000' : 'https://cathcr.com';
        await browser.tabs.create({ url });
      }

      // Clear the notification
      await this.clear(notificationId);

    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  }

  private async handleNotificationClosed(notificationId: string, byUser: boolean): Promise<void> {
    console.log('🔔 Notification closed:', notificationId, 'by user:', byUser);

    this.activeNotifications.delete(notificationId);

    // Track analytics if enabled
    if (byUser) {
      // Could send analytics event here
    }
  }

  // Utility method for development/testing
  async test(): Promise<void> {
    await this.show({
      type: 'basic',
      iconUrl: '/icons/icon-48.png',
      title: '🧪 Test Notification',
      message: 'This is a test notification from CATHCR extension.',
    });
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return !!browser.notifications;
  }

  // Get active notification count
  getActiveCount(): number {
    return this.activeNotifications.size;
  }

  // Update notification badge
  async updateBadge(text: string = '', color: string = '#FFA500'): Promise<void> {
    try {
      await browser.action.setBadgeText({ text });
      await browser.action.setBadgeBackgroundColor({ color });

    } catch (error) {
      console.error('Failed to update badge:', error);
    }
  }

  // Clear notification badge
  async clearBadge(): Promise<void> {
    await this.updateBadge('');
  }

  // Show unsynced count in badge
  async showUnsyncedBadge(count: number): Promise<void> {
    if (count > 0) {
      await this.updateBadge(count > 99 ? '99+' : count.toString(), '#ef4444');
    } else {
      await this.clearBadge();
    }
  }
}
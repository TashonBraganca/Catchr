/**
 * Global TypeScript declarations for CATHCR Extension
 */

// Vite environment globals
declare const __DEV__: boolean;
declare const __VERSION__: string;

// Extension-specific globals
declare global {
  interface Window {
    cathcr?: {
      version: string;
      debug: boolean;
    };
    CATHCR_INITIALIZED?: boolean;
  }
}

// Chrome extension type augmentations for better compatibility
declare namespace chrome {
  namespace tabs {
    interface Tab {
      selected?: boolean;
      groupId?: number;
      windowId: number; // Make required to match browser API expectation
    }

    interface TabChangeInfo {
      status?: string;
      url?: string;
      title?: string;
    }
  }

  namespace runtime {
    type OnInstalledReason = 'install' | 'update' | 'chrome_update' | 'shared_module_update' | 'browser_update';

    interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    interface InstalledDetails {
      reason: chrome.runtime.OnInstalledReason;
      previousVersion?: string;
      id?: string;
    }
  }

  namespace notifications {
    interface NotificationOptions {
      type: string;
      iconUrl?: string;
      title?: string;
      message?: string;
      buttons?: chrome.notifications.ButtonOptions[];
      imageUrl?: string;
      items?: chrome.notifications.ItemOptions[];
      progress?: number;
      isClickable?: boolean;
    }
  }
}

// WebExtension polyfill type augmentations for compatibility
declare module 'webextension-polyfill' {
  namespace Tabs {
    interface Tab {
      selected?: boolean;
      groupId?: number;
      windowId: number; // Match Chrome API requirement
    }
  }

  namespace Runtime {
    interface MessageSender {
      tab?: browser.Tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    interface InstalledDetails {
      reason: 'install' | 'update' | 'chrome_update' | 'shared_module_update' | 'browser_update';
      previousVersion?: string;
      id?: string;
    }
  }

  namespace Notifications {
    interface CreateNotificationOptions {
      type: string;
      iconUrl?: string;
      title?: string;
      message?: string;
      buttons?: Array<{title: string; iconUrl?: string}>;
      imageUrl?: string;
      items?: Array<{title: string; message: string}>;
      progress?: number;
      isClickable?: boolean;
    }
  }
}

export {};
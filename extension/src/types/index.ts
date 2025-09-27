/**
 * CATHCR Extension TypeScript Types
 * Shared type definitions for the entire extension
 */

// Core Data Types
export interface CaptureData {
  id: string;
  text: string;
  audioUrl?: string;
  context?: CaptureContext;
  timestamp: number;
  source: 'extension' | 'popup' | 'content-script' | 'background';
  synced: boolean;
  syncedAt?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CaptureContext {
  url?: string;
  title?: string;
  favicon?: string;
  domain?: string;
  selectedText?: string;
  timestamp: number;
}

// Storage Types
export interface StorageData {
  captures: CaptureData[];
  syncQueue: CaptureData[];
  syncStatus: SyncStatus;
  userSettings: UserSettings;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number | null;
  error?: string;
  syncing?: boolean;
}

export interface UserSettings {
  syncEnabled: boolean;
  autoCapture: boolean;
  notifications: boolean;
  analyticsEnabled: boolean;
  [key: string]: boolean | string | number | undefined;
}

// Sync Types
export interface SyncResult {
  success: boolean;
  synced: number;
  error?: string;
  details?: {
    total: number;
    successful: number;
    failed: number;
    errors?: string[];
  };
}

// Extension Messaging
export interface ExtensionMessage {
  type: MessageType;
  payload?: any;
  requestId?: string;
}

export type MessageType =
  | 'CAPTURE_THOUGHT'
  | 'OPEN_CAPTURE_MODAL'
  | 'CLOSE_CAPTURE_MODAL'
  | 'GET_STORAGE'
  | 'UPDATE_SETTINGS'
  | 'SYNC_NOW'
  | 'CLEANUP_STORAGE'
  | 'CLEAR_ALL_DATA'
  | 'GET_CONTEXT'
  | 'TRANSCRIBE_AUDIO'
  | 'SHOW_NOTIFICATION'
  | 'UPDATE_BADGE';

// API Types
export interface ApiRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Transcription Types
export interface TranscriptionRequest {
  audioData: string | Blob;
  language?: string;
  model?: string;
}

export interface TranscriptionResponse {
  success: boolean;
  text?: string;
  confidence?: number;
  language?: string;
  error?: string;
  processingTime?: number;
}

// Notification Types
export interface NotificationOptions {
  type: 'basic' | 'image' | 'list' | 'progress';
  iconUrl: string;
  title: string;
  message: string;
  imageUrl?: string;
  items?: NotificationItem[];
  progress?: number;
  buttons?: NotificationButton[];
}

export interface NotificationItem {
  title: string;
  message: string;
}

export interface NotificationButton {
  title: string;
  iconUrl?: string;
}

// Chrome Extension Types
export interface ChromeTab {
  id?: number;
  url?: string;
  title?: string;
  favIconUrl?: string;
  active?: boolean;
  pinned?: boolean;
  highlighted?: boolean;
  windowId?: number;
  index?: number;
}

export interface ChromeRuntime {
  id: string;
  onMessage: any;
  onInstalled: any;
  onStartup: any;
  sendMessage: (message: any) => Promise<any>;
  getManifest: () => any;
  openOptionsPage: () => Promise<void>;
}

// Voice Recording Types
export interface VoiceRecordingOptions {
  maxDuration?: number; // in milliseconds
  audioFormat?: 'wav' | 'mp3' | 'ogg';
  sampleRate?: number;
  channels?: number;
}

export interface VoiceRecordingResult {
  success: boolean;
  audioBlob?: Blob;
  duration?: number;
  error?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface AnalyticsData {
  events: AnalyticsEvent[];
  userId?: string;
  sessionId: string;
  deviceInfo: {
    platform: string;
    userAgent: string;
    extensionVersion: string;
  };
}

// Error Types
export interface ExtensionError {
  code: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

// Background Service Types
export interface BackgroundService {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  isInitialized(): boolean;
}

export interface ServiceWorkerMessage {
  type: string;
  data?: any;
  source: 'popup' | 'content' | 'options' | 'background';
  timestamp: number;
}

// Content Script Types
export interface ContentScriptAPI {
  showModal(options?: any): Promise<void>;
  hideModal(): void;
  captureSelection(): Promise<string>;
  getCurrentContext(): CaptureContext;
}

// Popup Types
export interface PopupState {
  isRecording: boolean;
  syncStatus: SyncStatus;
  recentCaptures: CaptureData[];
  isLoading: boolean;
}

// Options Page Types
export interface OptionsPageState {
  settings: UserSettings;
  storageStats: StorageStats;
  accountStatus: AccountStatus;
  isLoading: boolean;
}

export interface StorageStats {
  totalCaptures: number;
  syncedCaptures: number;
  unsyncedCaptures: number;
  storageUsed: number; // in bytes
  lastCleanup?: number;
}

export interface AccountStatus {
  isConnected: boolean;
  userId?: string;
  email?: string;
  lastSync?: number;
  syncEnabled: boolean;
}

// Keyboard Shortcut Types
export interface KeyboardShortcut {
  key: string;
  modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: string;
  description: string;
  enabled: boolean;
}

// Export Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidationRule<T> {
  name: string;
  validate: (value: T) => boolean | string;
  required?: boolean;
}

// Migration Types
export interface MigrationScript {
  version: string;
  description: string;
  migrate: (data: any) => Promise<any>;
  rollback?: (data: any) => Promise<any>;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  migrationsApplied: string[];
  errors?: string[];
}

// Feature Flag Types
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
}

export interface FeatureFlagContext {
  userId?: string;
  extensionVersion: string;
  platform: string;
  locale?: string;
}

// Utility function types for better IntelliSense
export type EventListener<T = any> = (event: T) => void | Promise<void>;
export type AsyncEventListener<T = any> = (event: T) => Promise<void>;
export type ErrorHandler = (error: Error | ExtensionError) => void;
export type Logger = {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
};
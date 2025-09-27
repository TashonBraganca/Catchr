// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },
  THOUGHTS: {
    LIST: '/api/thoughts',
    CREATE: '/api/thoughts',
    DETAIL: (id: string) => `/api/thoughts/${id}`,
    UPDATE: (id: string) => `/api/thoughts/${id}`,
    DELETE: (id: string) => `/api/thoughts/${id}`,
    SEARCH: '/api/thoughts/search',
    CATEGORIZE: '/api/thoughts/categorize',
    BATCH_PROCESS: '/api/thoughts/batch-process',
  },
  AI: {
    TRANSCRIBE: '/api/ai/transcribe',
    CATEGORIZE: '/api/ai/categorize',
    EXTRACT_REMINDERS: '/api/ai/extract-reminders',
    SUGGEST_EXPANSIONS: '/api/ai/suggest-expansions',
  },
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    SETTINGS: '/api/notifications/settings',
  },
  EXPORT: {
    THOUGHTS: '/api/export/thoughts',
    STATS: '/api/export/stats',
  },
} as const;

// Thought Categories (Default)
export const DEFAULT_CATEGORIES = [
  { main: 'self-improvement', color: '#10B981', icon: '🌱' },
  { main: 'mental-health', color: '#8B5CF6', icon: '🧠' },
  { main: 'projects', color: '#F59E0B', icon: '🚀' },
  { main: 'reminders', color: '#EF4444', icon: '⏰' },
  { main: 'ideas', color: '#3B82F6', icon: '💡' },
  { main: 'brainstorm', color: '#EC4899', icon: '🌪️' },
  { main: 'notes', color: '#6B7280', icon: '📝' },
] as const;

// Thought Types
export const THOUGHT_TYPES = {
  IDEA: 'idea',
  REMINDER: 'reminder',
  PROJECT: 'project',
  NOTE: 'note',
  BRAINSTORM: 'brainstorm',
} as const;

// AI Configuration
export const AI_CONFIG = {
  OPENAI: {
    MODEL: 'gpt-4o', // Using latest available model - will update to gpt-5-mini when available
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
  },
  TRANSCRIPTION: {
    WHISPER_MODEL: 'whisper-1', // OpenAI Whisper model
    HUGGINGFACE_WHISPER_MODEL: 'openai/whisper-large-v3', // HuggingFace Whisper model
    LANGUAGE: 'en',
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
    FALLBACK_CHAIN: ['huggingface', 'openai', 'webspeech'] as const,
  },
  CATEGORIZATION: {
    MIN_CONFIDENCE: 0.7,
    MAX_SUGGESTIONS: 3,
    BATCH_SIZE: 10,
  },
} as const;

// Keyboard Shortcuts
export const SHORTCUTS = {
  GLOBAL_CAPTURE: 'ctrl+shift+c',
  QUICK_SAVE: 'ctrl+enter',
  CANCEL_CAPTURE: 'escape',
  TOGGLE_RECORDING: 'space',
  NEW_THOUGHT: 'ctrl+n',
  SEARCH: 'ctrl+k',
} as const;

// Voice Recognition Settings
export const SPEECH_CONFIG = {
  LANGUAGE: 'en-US',
  CONTINUOUS: true,
  INTERIM_RESULTS: true,
  MAX_ALTERNATIVES: 3,
  SILENCE_TIMEOUT: 3000, // 3 seconds
  AUTO_STOP_TIMEOUT: 10000, // 10 seconds
} as const;

// Validation Constants
export const VALIDATION_LIMITS = {
  THOUGHT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 5000,
  },
  CATEGORY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
  },
  TAG: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 30,
    MAX_TAGS: 10,
  },
  USERNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30,
  },
  SEARCH_QUERY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  REMINDER: 'reminder',
  DAILY_DIGEST: 'daily_digest',
  WEEKLY_REVIEW: 'weekly_review',
  AI_PROCESSING_COMPLETE: 'ai_processing_complete',
  SYSTEM_UPDATE: 'system_update',
} as const;

// Export Formats
export const EXPORT_FORMATS = {
  MARKDOWN: 'markdown',
  JSON: 'json',
  PDF: 'pdf',
  CSV: 'csv',
} as const;

// Theme Constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Validation
  REQUIRED: 'REQUIRED',
  INVALID_FORMAT: 'INVALID_FORMAT',
  MIN_LENGTH: 'MIN_LENGTH',
  MAX_LENGTH: 'MAX_LENGTH',
  INVALID_CHARACTERS: 'INVALID_CHARACTERS',

  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',

  // AI Processing
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  CATEGORIZATION_FAILED: 'CATEGORIZATION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // File Upload
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'cathcr_auth_token',
  USER_PREFERENCES: 'cathcr_preferences',
  DRAFT_THOUGHT: 'cathcr_draft',
  THEME: 'cathcr_theme',
  ONBOARDING_COMPLETE: 'cathcr_onboarded',
  SHORTCUTS_ENABLED: 'cathcr_shortcuts',
} as const;

// Reminder Frequencies
export const REMINDER_FREQUENCIES = {
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  DISPLAY_WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: 'yyyy-MM-dd',
  TIME_ONLY: 'h:mm a',
} as const;

// Animation Durations (ms)
export const ANIMATION = {
  FAST: 150,
  MEDIUM: 300,
  SLOW: 500,
  CAPTURE_MODAL: 200,
  TOAST: 300,
} as const;
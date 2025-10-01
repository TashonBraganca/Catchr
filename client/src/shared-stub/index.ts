// Stub exports for Vercel build (shared package not available in monorepo deploy)
// These are duplicated from ../../../shared/src for deployment

export const AI_CONFIG = {
  OPENAI: {
    MODEL: 'gpt-5',
    MAX_TOKENS: 1500,
    TEMPERATURE: 0.3,
    REASONING_EFFORT: 'minimal',
  },
  TRANSCRIPTION: {
    WHISPER_MODEL: 'whisper-1',
    HUGGINGFACE_WHISPER_MODEL: 'openai/whisper-large-v3',
    LANGUAGE: 'en',
    MAX_FILE_SIZE: 25 * 1024 * 1024,
    FALLBACK_CHAIN: ['huggingface', 'openai', 'webspeech'] as const,
  },
  CATEGORIZATION: {
    MIN_CONFIDENCE: 0.7,
    MAX_SUGGESTIONS: 3,
    BATCH_SIZE: 10,
  },
} as const;

export const SHORTCUTS = {
  GLOBAL_CAPTURE: 'ctrl+shift+c',
  QUICK_SAVE: 'ctrl+enter',
  CANCEL_CAPTURE: 'escape',
  TOGGLE_RECORDING: 'space',
  NEW_THOUGHT: 'ctrl+n',
  SEARCH: 'ctrl+k',
} as const;

export const SPEECH_CONFIG = {
  LANGUAGE: 'en-US',
  CONTINUOUS: true,
  INTERIM_RESULTS: true,
  MAX_ALTERNATIVES: 3,
  SILENCE_TIMEOUT: 3000,
  AUTO_STOP_TIMEOUT: 10000,
} as const;

export const ERROR_CODES = {
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  AI_PROCESSING_FAILED: 'AI_PROCESSING_FAILED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
} as const;

export interface ThoughtCategory {
  main: string;
  subcategory?: string;
  color?: string;
  icon?: string;
}

export interface ParsedTask {
  title: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  category?: string;
  confidence: number;
}

// Database type for Supabase (simplified stub)
export interface Database {
  public: {
    Tables: Record<string, any>;
    Views: Record<string, any>;
    Functions: Record<string, any>;
  };
}

// Add other types as needed

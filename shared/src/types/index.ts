// User Types
export interface User {
  id: string;
  email: string;
  username?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  defaultCategories: string[];
  notificationSettings: {
    reminders: boolean;
    dailyDigest: boolean;
    weeklyReview: boolean;
  };
  aiSettings: {
    autoCategory: boolean;
    confidenceThreshold: number;
    personalizedPrompts: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

// Thought Types
export interface Thought {
  id: string;
  userId: string;
  content: string;
  transcribedText?: string;
  category: ThoughtCategory;
  tags: string[];
  type: ThoughtType;
  reminderDate?: Date;
  isProcessed: boolean;
  processedByAi?: Date;
  aiConfidence?: number;
  aiSuggestions?: AISuggestions;
  // Audio related fields
  audio_url?: string | null;
  audio_path?: string | null;
  audio_duration?: number | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ThoughtCategory {
  main: string;
  subcategory?: string;
  color?: string;
  icon?: string;
}

export interface AISuggestions {
  alternativeCategories: ThoughtCategory[];
  extractedEntities: ExtractedEntity[];
  relatedThoughts: string[];
  expansionPrompts: string[];
}

export interface ExtractedEntity {
  type: 'person' | 'date' | 'amount' | 'location' | 'task';
  value: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export type ThoughtType = 'idea' | 'reminder' | 'project' | 'note' | 'brainstorm';

// AI Processing Types
export interface AICategorizationRequest {
  thought: string;
  userPreferences: UserPreferences;
  previousThoughts?: Thought[];
}

export interface AICategorizationResponse {
  category: ThoughtCategory;
  tags: string[];
  confidence: number;
  reminder?: ReminderInfo;
  entities: ExtractedEntity[];
  suggestions: AISuggestions;
}

export interface ReminderInfo {
  date: Date;
  type: 'once' | 'daily' | 'weekly' | 'monthly';
  context: string;
  person?: string;
  amount?: number;
}

// Transcription Types
export interface TranscriptionRequest {
  audioBlob?: Blob;
  useWebSpeech: boolean;
  language?: string;
}

export interface TranscriptionResponse {
  text: string;
  confidence: number;
  alternatives?: string[];
  processingTime?: number;
  language?: string;
  model?: string;
  source?: 'webspeech' | 'openai' | 'huggingface-whisper';
}

// Search Types
export interface SearchQuery {
  query: string;
  filters?: {
    categories?: string[];
    types?: ThoughtType[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    tags?: string[];
    isProcessed?: boolean;
  };
  sortBy?: 'relevance' | 'date' | 'category';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  thoughts: Thought[];
  totalCount: number;
  aggregations: {
    categories: Record<string, number>;
    types: Record<string, number>;
    tags: Record<string, number>;
  };
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'daily_digest' | 'weekly_review' | 'ai_processing_complete';
  title: string;
  message: string;
  thoughtId?: string;
  isRead: boolean;
  scheduledFor?: Date;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication Types (Supabase-based)
export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  phone?: string;
  createdAt: Date;
  lastSignInAt?: Date;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password?: string; // Optional for magic links
  provider?: 'email' | 'google' | 'github';
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  preferences?: Partial<UserPreferences>;
}

// Capture Interface Types
export interface CaptureSession {
  id: string;
  isRecording: boolean;
  startTime: Date;
  duration: number;
  hasAudio: boolean;
  hasText: boolean;
  tempText: string;
}

export interface CaptureModalState {
  isOpen: boolean;
  mode: 'voice' | 'text' | 'mixed';
  isProcessing: boolean;
  error?: string;
}

// Export/Import Types
export interface ExportOptions {
  format: 'markdown' | 'json' | 'pdf' | 'csv';
  includeMetadata: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
}

export interface ImportOptions {
  format: 'json' | 'csv' | 'plaintext';
  autoCategory: boolean;
  defaultCategory?: string;
  batchSize?: number;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

// Dashboard Types
export interface DashboardStats {
  totalThoughts: number;
  thoughtsToday: number;
  pendingReminders: number;
  processingQueue: number;
  categoryBreakdown: Record<string, number>;
  weeklyActivity: Array<{
    date: Date;
    count: number;
  }>;
}

// Export database types
export * from './database';
export type { Database } from './database';
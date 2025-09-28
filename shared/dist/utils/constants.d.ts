export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly REGISTER: "/auth/register";
        readonly ME: "/auth/me";
        readonly LOGOUT: "/auth/logout";
    };
    readonly THOUGHTS: {
        readonly LIST: "/api/thoughts";
        readonly CREATE: "/api/thoughts";
        readonly DETAIL: (id: string) => string;
        readonly UPDATE: (id: string) => string;
        readonly DELETE: (id: string) => string;
        readonly SEARCH: "/api/thoughts/search";
        readonly CATEGORIZE: "/api/thoughts/categorize";
        readonly BATCH_PROCESS: "/api/thoughts/batch-process";
    };
    readonly AI: {
        readonly TRANSCRIBE: "/api/ai/transcribe";
        readonly CATEGORIZE: "/api/ai/categorize";
        readonly EXTRACT_REMINDERS: "/api/ai/extract-reminders";
        readonly SUGGEST_EXPANSIONS: "/api/ai/suggest-expansions";
    };
    readonly NOTIFICATIONS: {
        readonly LIST: "/api/notifications";
        readonly MARK_READ: (id: string) => string;
        readonly SETTINGS: "/api/notifications/settings";
    };
    readonly EXPORT: {
        readonly THOUGHTS: "/api/export/thoughts";
        readonly STATS: "/api/export/stats";
    };
};
export declare const DEFAULT_CATEGORIES: readonly [{
    readonly main: "self-improvement";
    readonly color: "#10B981";
    readonly icon: "🌱";
}, {
    readonly main: "mental-health";
    readonly color: "#8B5CF6";
    readonly icon: "🧠";
}, {
    readonly main: "projects";
    readonly color: "#F59E0B";
    readonly icon: "🚀";
}, {
    readonly main: "reminders";
    readonly color: "#EF4444";
    readonly icon: "⏰";
}, {
    readonly main: "ideas";
    readonly color: "#3B82F6";
    readonly icon: "💡";
}, {
    readonly main: "brainstorm";
    readonly color: "#EC4899";
    readonly icon: "🌪️";
}, {
    readonly main: "notes";
    readonly color: "#6B7280";
    readonly icon: "📝";
}];
export declare const THOUGHT_TYPES: {
    readonly IDEA: "idea";
    readonly REMINDER: "reminder";
    readonly PROJECT: "project";
    readonly NOTE: "note";
    readonly BRAINSTORM: "brainstorm";
};
export declare const AI_CONFIG: {
    readonly OPENAI: {
        readonly MODEL: "gpt-4o-mini";
        readonly MAX_TOKENS: 1000;
        readonly TEMPERATURE: 0.7;
    };
    readonly TRANSCRIPTION: {
        readonly WHISPER_MODEL: "whisper-1";
        readonly HUGGINGFACE_WHISPER_MODEL: "openai/whisper-large-v3";
        readonly LANGUAGE: "en";
        readonly MAX_FILE_SIZE: number;
        readonly FALLBACK_CHAIN: readonly ["huggingface", "openai", "webspeech"];
    };
    readonly CATEGORIZATION: {
        readonly MIN_CONFIDENCE: 0.7;
        readonly MAX_SUGGESTIONS: 3;
        readonly BATCH_SIZE: 10;
    };
};
export declare const SHORTCUTS: {
    readonly GLOBAL_CAPTURE: "ctrl+shift+c";
    readonly QUICK_SAVE: "ctrl+enter";
    readonly CANCEL_CAPTURE: "escape";
    readonly TOGGLE_RECORDING: "space";
    readonly NEW_THOUGHT: "ctrl+n";
    readonly SEARCH: "ctrl+k";
};
export declare const SPEECH_CONFIG: {
    readonly LANGUAGE: "en-US";
    readonly CONTINUOUS: true;
    readonly INTERIM_RESULTS: true;
    readonly MAX_ALTERNATIVES: 3;
    readonly SILENCE_TIMEOUT: 3000;
    readonly AUTO_STOP_TIMEOUT: 10000;
};
export declare const VALIDATION_LIMITS: {
    readonly THOUGHT: {
        readonly MIN_LENGTH: 1;
        readonly MAX_LENGTH: 5000;
    };
    readonly CATEGORY: {
        readonly MIN_LENGTH: 1;
        readonly MAX_LENGTH: 50;
    };
    readonly TAG: {
        readonly MIN_LENGTH: 1;
        readonly MAX_LENGTH: 30;
        readonly MAX_TAGS: 10;
    };
    readonly USERNAME: {
        readonly MIN_LENGTH: 2;
        readonly MAX_LENGTH: 30;
    };
    readonly SEARCH_QUERY: {
        readonly MIN_LENGTH: 1;
        readonly MAX_LENGTH: 200;
    };
};
export declare const NOTIFICATION_TYPES: {
    readonly REMINDER: "reminder";
    readonly DAILY_DIGEST: "daily_digest";
    readonly WEEKLY_REVIEW: "weekly_review";
    readonly AI_PROCESSING_COMPLETE: "ai_processing_complete";
    readonly SYSTEM_UPDATE: "system_update";
};
export declare const EXPORT_FORMATS: {
    readonly MARKDOWN: "markdown";
    readonly JSON: "json";
    readonly PDF: "pdf";
    readonly CSV: "csv";
};
export declare const THEMES: {
    readonly LIGHT: "light";
    readonly DARK: "dark";
    readonly AUTO: "auto";
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
export declare const ERROR_CODES: {
    readonly REQUIRED: "REQUIRED";
    readonly INVALID_FORMAT: "INVALID_FORMAT";
    readonly MIN_LENGTH: "MIN_LENGTH";
    readonly MAX_LENGTH: "MAX_LENGTH";
    readonly INVALID_CHARACTERS: "INVALID_CHARACTERS";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly TOKEN_INVALID: "TOKEN_INVALID";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly EMAIL_NOT_CONFIRMED: "EMAIL_NOT_CONFIRMED";
    readonly AI_SERVICE_UNAVAILABLE: "AI_SERVICE_UNAVAILABLE";
    readonly TRANSCRIPTION_FAILED: "TRANSCRIPTION_FAILED";
    readonly CATEGORIZATION_FAILED: "CATEGORIZATION_FAILED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly ALREADY_EXISTS: "ALREADY_EXISTS";
    readonly PERMISSION_DENIED: "PERMISSION_DENIED";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly UNSUPPORTED_FILE_TYPE: "UNSUPPORTED_FILE_TYPE";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
};
export declare const STORAGE_KEYS: {
    readonly AUTH_TOKEN: "cathcr_auth_token";
    readonly USER_PREFERENCES: "cathcr_preferences";
    readonly DRAFT_THOUGHT: "cathcr_draft";
    readonly THEME: "cathcr_theme";
    readonly ONBOARDING_COMPLETE: "cathcr_onboarded";
    readonly SHORTCUTS_ENABLED: "cathcr_shortcuts";
};
export declare const REMINDER_FREQUENCIES: {
    readonly ONCE: "once";
    readonly DAILY: "daily";
    readonly WEEKLY: "weekly";
    readonly MONTHLY: "monthly";
};
export declare const DATE_FORMATS: {
    readonly DISPLAY: "MMM d, yyyy";
    readonly DISPLAY_WITH_TIME: "MMM d, yyyy h:mm a";
    readonly ISO: "yyyy-MM-dd";
    readonly TIME_ONLY: "h:mm a";
};
export declare const ANIMATION: {
    readonly FAST: 150;
    readonly MEDIUM: 300;
    readonly SLOW: 500;
    readonly CAPTURE_MODAL: 200;
    readonly TOAST: 300;
};
//# sourceMappingURL=constants.d.ts.map
/**
 * Web Speech API Transcription Service for Cathcr
 * Handles real-time speech recognition with fallbacks and error handling
 */

export interface TranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (text: string, confidence: number, isFinal: boolean) => void;
  onError?: (error: TranscriptionError) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onNoMatch?: () => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{ transcript: string; confidence: number }>;
  timestamp: Date;
}

export interface TranscriptionError {
  error: 'not-supported' | 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
  message: string;
  isRecoverable: boolean;
}

// Browser compatibility check
export const isSpeechRecognitionSupported = (): boolean => {
  return typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

export class TranscriptionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private options: TranscriptionOptions = {};
  private startTime: Date | null = null;
  private lastResult: TranscriptionResult | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private restartTimeout: NodeJS.Timeout | null = null;

  constructor(options: TranscriptionOptions = {}) {
    this.options = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      ...options,
    };

    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    if (!isSpeechRecognitionSupported()) {
      this.options.onError?.({
        error: 'not-supported',
        message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
        isRecoverable: false,
      });
      return;
    }

    // Get the constructor (with webkit prefix support)
    const SpeechRecognitionConstructor = 
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRecognitionConstructor();
      this.setupEventListeners();
      this.configureRecognition();
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      this.options.onError?.({
        error: 'not-supported',
        message: 'Failed to initialize speech recognition service.',
        isRecoverable: false,
      });
    }
  }

  private configureRecognition(): void {
    if (!this.recognition) return;

    // Basic configuration
    this.recognition.continuous = this.options.continuous || true;
    this.recognition.interimResults = this.options.interimResults || true;
    this.recognition.maxAlternatives = this.options.maxAlternatives || 3;
    this.recognition.lang = this.options.language || 'en-US';

    // Enhanced settings for better accuracy (if supported)
    try {
      // These properties might not be available in all browsers
      (this.recognition as any).serviceURI = undefined; // Use default service
    } catch (error) {
      // Ignore if not supported
    }
  }

  private setupEventListeners(): void {
    if (!this.recognition) return;

    // Start event
    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isListening = true;
      this.startTime = new Date();
      this.retryCount = 0;
      this.options.onStart?.();
    };

    // End event
    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;
      
      // Auto-restart if it was stopped unexpectedly and we're still supposed to be listening
      if (this.retryCount < this.maxRetries && this.recognition) {
        this.retryCount++;
        console.log(`Auto-restarting speech recognition (attempt ${this.retryCount}/${this.maxRetries})`);
        
        this.restartTimeout = setTimeout(() => {
          this.start();
        }, 100);
      } else {
        this.options.onEnd?.();
      }
    };

    // Result event
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('Speech recognition result:', event);

      let finalTranscript = '';
      let interimTranscript = '';
      let bestConfidence = 0;
      const alternatives: Array<{ transcript: string; confidence: number }> = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
          bestConfidence = Math.max(bestConfidence, confidence);
        } else {
          interimTranscript += transcript;
          bestConfidence = Math.max(bestConfidence, confidence);
        }

        // Collect alternatives
        for (let j = 0; j < result.length && j < (this.options.maxAlternatives || 3); j++) {
          alternatives.push({
            transcript: result[j].transcript,
            confidence: result[j].confidence || 0,
          });
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      const isFinal = finalTranscript.length > 0;

      if (currentTranscript.trim()) {
        const transcriptionResult: TranscriptionResult = {
          transcript: currentTranscript.trim(),
          confidence: bestConfidence,
          isFinal,
          alternatives: alternatives.length > 1 ? alternatives.slice(1) : undefined,
          timestamp: new Date(),
        };

        this.lastResult = transcriptionResult;
        this.options.onResult?.(
          transcriptionResult.transcript,
          transcriptionResult.confidence,
          transcriptionResult.isFinal
        );
      }
    };

    // Error event
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);

      const errorMap: Record<string, TranscriptionError> = {
        'no-speech': {
          error: 'no-speech',
          message: 'No speech was detected. Try speaking closer to the microphone.',
          isRecoverable: true,
        },
        'aborted': {
          error: 'aborted',
          message: 'Speech recognition was aborted.',
          isRecoverable: true,
        },
        'audio-capture': {
          error: 'audio-capture',
          message: 'No microphone was found or there was an error with audio capture.',
          isRecoverable: false,
        },
        'network': {
          error: 'network',
          message: 'Network error occurred during speech recognition.',
          isRecoverable: true,
        },
        'not-allowed': {
          error: 'not-allowed',
          message: 'Microphone permission denied. Please allow access to use voice features.',
          isRecoverable: false,
        },
        'service-not-allowed': {
          error: 'service-not-allowed',
          message: 'Speech recognition service is not allowed in this context.',
          isRecoverable: false,
        },
        'bad-grammar': {
          error: 'bad-grammar',
          message: 'Grammar error in speech recognition.',
          isRecoverable: true,
        },
        'language-not-supported': {
          error: 'language-not-supported',
          message: 'The specified language is not supported.',
          isRecoverable: true,
        },
      };

      const error = errorMap[event.error] || {
        error: event.error as any,
        message: `Unknown speech recognition error: ${event.error}`,
        isRecoverable: false,
      };

      this.options.onError?.(error);

      // Stop listening on non-recoverable errors
      if (!error.isRecoverable) {
        this.stop();
      }
    };

    // Speech start/end events
    this.recognition.onspeechstart = () => {
      console.log('Speech detected');
      this.options.onSpeechStart?.();
    };

    this.recognition.onspeechend = () => {
      console.log('Speech ended');
      this.options.onSpeechEnd?.();
    };

    // Audio start/end events
    this.recognition.onaudiostart = () => {
      console.log('Audio capture started');
      this.options.onAudioStart?.();
    };

    this.recognition.onaudioend = () => {
      console.log('Audio capture ended');
      this.options.onAudioEnd?.();
    };

    // No match event
    this.recognition.onnomatch = () => {
      console.log('No speech match');
      this.options.onNoMatch?.();
    };
  }

  /**
   * Start speech recognition
   */
  public async start(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized');
    }

    if (this.isListening) {
      console.warn('Speech recognition is already running');
      return;
    }

    try {
      // Clear any pending restart timeout
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout);
        this.restartTimeout = null;
      }

      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.options.onError?.({
        error: 'not-supported',
        message: 'Failed to start speech recognition. Please try again.',
        isRecoverable: true,
      });
    }
  }

  /**
   * Stop speech recognition
   */
  public stop(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition && this.isListening) {
      this.retryCount = this.maxRetries; // Prevent auto-restart
      this.recognition.stop();
    }
  }

  /**
   * Abort speech recognition immediately
   */
  public abort(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition && this.isListening) {
      this.retryCount = this.maxRetries; // Prevent auto-restart
      this.recognition.abort();
    }
  }

  /**
   * Change recognition language
   */
  public setLanguage(language: string): void {
    this.options.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Get current recognition state
   */
  public getState(): {
    isListening: boolean;
    isSupported: boolean;
    startTime: Date | null;
    lastResult: TranscriptionResult | null;
    language: string;
  } {
    return {
      isListening: this.isListening,
      isSupported: !!this.recognition,
      startTime: this.startTime,
      lastResult: this.lastResult,
      language: this.options.language || 'en-US',
    };
  }

  /**
   * Update options
   */
  public updateOptions(newOptions: Partial<TranscriptionOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.configureRecognition();
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.stop();
    this.recognition = null;
    
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
  }
}

/**
 * Get available speech recognition languages
 */
export const getSupportedLanguages = (): Array<{ code: string; name: string }> => {
  // Common languages supported by most browsers
  return [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'en-AU', name: 'English (Australia)' },
    { code: 'en-CA', name: 'English (Canada)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'fr-CA', name: 'French (Canada)' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'pt-PT', name: 'Portuguese (Portugal)' },
    { code: 'zh-CN', name: 'Chinese (Mandarin)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'th-TH', name: 'Thai' },
    { code: 'vi-VN', name: 'Vietnamese' },
  ];
};

/**
 * Detect user's preferred language
 */
export const detectUserLanguage = (): string => {
  if (typeof navigator === 'undefined') return 'en-US';
  
  const userLang = navigator.language || (navigator as any).userLanguage || 'en-US';
  const supportedLangs = getSupportedLanguages().map(lang => lang.code);
  
  // Check if exact match exists
  if (supportedLangs.includes(userLang)) {
    return userLang;
  }
  
  // Check if language base exists (e.g., 'en' from 'en-AU')
  const langBase = userLang.split('-')[0];
  const matchingLang = supportedLangs.find(lang => lang.startsWith(langBase + '-'));
  
  return matchingLang || 'en-US';
};

// Export singleton instance for easy use
export const transcriptionService = new TranscriptionService();
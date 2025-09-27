// Enhanced transcription service for Cathcr client
// Implements hybrid Web Speech API + server-side processing

export interface TranscriptionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  enableServerEnhancement?: boolean;
  confidenceThreshold?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  backend: 'web_speech' | 'server_enhanced';
  alternatives?: Array<{
    text: string;
    confidence: number;
  }>;
  wordTimestamps?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export interface AudioRecordingConfig {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  format?: 'webm' | 'wav' | 'mp3';
  maxDuration?: number; // in seconds
}

export class TranscriptionService {
  private recognition: SpeechRecognition | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording = false;
  private isTranscribing = false;
  private recordedChunks: Blob[] = [];
  private config: TranscriptionConfig = {};

  // Event handlers
  private onResultCallback?: (result: TranscriptionResult) => void;
  private onErrorCallback?: (error: Error) => void;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;
  private onAudioLevelCallback?: (level: number) => void;

  constructor() {
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize Web Speech API
   */
  private initializeSpeechRecognition(): void {
    if (!this.isSpeechRecognitionSupported()) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Default configuration
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;
    this.recognition.lang = 'en-US';

    this.setupSpeechRecognitionEvents();
  }

  /**
   * Setup event handlers for Speech Recognition
   */
  private setupSpeechRecognitionEvents(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isTranscribing = true;
      this.onStartCallback?.();
    };

    this.recognition.onend = () => {
      this.isTranscribing = false;
      this.onEndCallback?.();
    };

    this.recognition.onerror = (event) => {
      const error = new Error(`Speech recognition error: ${event.error}`);
      console.error('Speech recognition error:', event);
      this.onErrorCallback?.(error);
    };

    this.recognition.onresult = (event) => {
      this.handleSpeechResult(event);
    };

    this.recognition.onnomatch = () => {
      console.warn('Speech recognition: no match found');
    };

    this.recognition.onspeechstart = () => {
      console.log('Speech detected');
    };

    this.recognition.onspeechend = () => {
      console.log('Speech ended');
    };
  }

  /**
   * Handle speech recognition results
   */
  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    let finalText = '';
    let interimText = '';
    let maxConfidence = 0;
    let alternatives: Array<{ text: string; confidence: number }> = [];

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0].transcript;
      const confidence = result[0].confidence || 0.8;

      if (result.isFinal) {
        finalText += text;
        maxConfidence = Math.max(maxConfidence, confidence);

        // Collect alternatives
        for (let j = 0; j < result.length && j < 3; j++) {
          alternatives.push({
            text: result[j].transcript,
            confidence: result[j].confidence || 0.8,
          });
        }
      } else {
        interimText += text;
      }
    }

    // Send result
    const transcriptionResult: TranscriptionResult = {
      text: finalText || interimText,
      confidence: maxConfidence || 0.8,
      isFinal: !!finalText,
      timestamp: Date.now(),
      backend: 'web_speech',
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    };

    this.onResultCallback?.(transcriptionResult);

    // If final result and server enhancement is enabled, enhance it
    if (finalText && this.config.enableServerEnhancement && this.recordedChunks.length > 0) {
      this.enhanceTranscriptionWithServer(finalText);
    }
  }

  /**
   * Start transcription with optional audio recording
   */
  async startTranscription(config: TranscriptionConfig = {}): Promise<void> {
    this.config = { ...this.config, ...config };

    try {
      // Start audio recording if enhancement is enabled
      if (config.enableServerEnhancement) {
        await this.startAudioRecording();
      }

      // Start speech recognition
      if (this.recognition) {
        this.recognition.lang = config.language || 'en-US';
        this.recognition.continuous = config.continuous !== false;
        this.recognition.interimResults = config.interimResults !== false;
        this.recognition.maxAlternatives = config.maxAlternatives || 3;

        this.recognition.start();
      } else {
        throw new Error('Speech recognition not available');
      }

    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  /**
   * Stop transcription
   */
  async stopTranscription(): Promise<Blob | null> {
    // Stop speech recognition
    if (this.recognition && this.isTranscribing) {
      this.recognition.stop();
    }

    // Stop audio recording and return blob
    if (this.isRecording) {
      return this.stopAudioRecording();
    }

    return null;
  }

  /**
   * Start audio recording for server enhancement
   */
  private async startAudioRecording(config: AudioRecordingConfig = {}): Promise<void> {
    try {
      // Get microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sampleRate || 16000,
          channelCount: config.channels || 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Setup audio context for level monitoring
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      // Start level monitoring
      this.startAudioLevelMonitoring(analyser);

      // Setup media recorder
      const options = {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000,
      };

      this.mediaRecorder = new MediaRecorder(this.audioStream, options);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('Audio recording stopped');
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw error;
    }
  }

  /**
   * Stop audio recording and return blob
   */
  private async stopAudioRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.getSupportedMimeType()
        });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  /**
   * Monitor audio levels
   */
  private startAudioLevelMonitoring(analyser: AnalyserNode): void {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkLevel = () => {
      if (!this.isRecording) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const level = average / 255; // Normalize to 0-1

      this.onAudioLevelCallback?.(level);

      requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Enhance transcription with server processing
   */
  private async enhanceTranscriptionWithServer(webSpeechText: string): Promise<void> {
    try {
      if (this.recordedChunks.length === 0) return;

      const audioBlob = new Blob(this.recordedChunks, {
        type: this.getSupportedMimeType()
      });

      const result = await this.enhanceWithServer(audioBlob);
      if (!result) return;

      // Send enhanced result if significantly better
      if (result.confidence > 0.9 || result.text.length > webSpeechText.length * 1.2) {
        const enhancedResult: TranscriptionResult = {
          text: result.text,
          confidence: result.confidence,
          isFinal: true,
          timestamp: Date.now(),
          backend: 'server_enhanced',
        };

        this.onResultCallback?.(enhancedResult);
      }

    } catch (error) {
      console.error('Server enhancement failed:', error);
      // Don't throw - enhancement is optional
    }
  }

  /**
   * Enhance transcription with server processing (public method)
   */
  async enhanceWithServer(audioBlob: Blob): Promise<TranscriptionResult | null> {
    try {
      // Convert blob to base64 using FileReader
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:audio/...;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const response = await fetch('/api/capture/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`,
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          content_type: audioBlob.type || 'audio/webm',
        }),
      });

      if (!response.ok) {
        throw new Error('Server transcription failed');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return {
          text: result.data.text,
          confidence: result.data.confidence,
          isFinal: true,
          timestamp: Date.now(),
          backend: 'server_enhanced',
        };
      }

      return null;

    } catch (error) {
      console.error('Server enhancement failed:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.recordedChunks = [];
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Check if audio recording is supported
   */
  isAudioRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  /**
   * Get available languages for speech recognition
   */
  getAvailableLanguages(): string[] {
    // Common languages supported by most browsers
    return [
      'en-US',
      'en-GB',
      'es-ES',
      'fr-FR',
      'de-DE',
      'it-IT',
      'pt-BR',
      'ru-RU',
      'ja-JP',
      'ko-KR',
      'zh-CN',
      'ar-SA',
      'hi-IN',
    ];
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: {
    onResult?: (result: TranscriptionResult) => void;
    onError?: (error: Error) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onAudioLevel?: (level: number) => void;
  }): void {
    this.onResultCallback = handlers.onResult;
    this.onErrorCallback = handlers.onError;
    this.onStartCallback = handlers.onStart;
    this.onEndCallback = handlers.onEnd;
    this.onAudioLevelCallback = handlers.onAudioLevel;
  }

  /**
   * Get current status
   */
  getStatus(): {
    isTranscribing: boolean;
    isRecording: boolean;
    isSupported: boolean;
    capabilities: {
      speechRecognition: boolean;
      audioRecording: boolean;
      serverEnhancement: boolean;
    };
  } {
    return {
      isTranscribing: this.isTranscribing,
      isRecording: this.isRecording,
      isSupported: this.isSpeechRecognitionSupported(),
      capabilities: {
        speechRecognition: this.isSpeechRecognitionSupported(),
        audioRecording: this.isAudioRecordingSupported(),
        serverEnhancement: true, // Always available if server is running
      },
    };
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stopTranscription();
    this.cleanup();
    this.recognition = null;
    this.mediaRecorder = null;
  }
}

// Global speech recognition interfaces for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    grammars: SpeechGrammarList;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    serviceURI: string;

    abort(): void;
    start(): void;
    stop(): void;

    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechGrammarList {
    length: number;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
    addFromURI(src: string, weight?: number): void;
    addFromString(string: string, weight?: number): void;
  }

  interface SpeechGrammar {
    src: string;
    weight: number;
  }
}
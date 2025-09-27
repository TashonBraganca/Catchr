export declare enum TranscriptionBackend {
    WEB_SPEECH = "web_speech",
    HUGGINGFACE_WHISPER = "huggingface_whisper",
    OPENAI_WHISPER = "openai_whisper",
    FASTER_WHISPER = "faster_whisper"
}
export interface TranscriptionResult {
    text: string;
    confidence: number;
    backend: TranscriptionBackend;
    processing_time: number;
    word_timestamps?: Array<{
        word: string;
        start: number;
        end: number;
        confidence: number;
    }>;
}
export interface TranscriptionRequest {
    audioBuffer?: Buffer;
    audioUrl?: string;
    webSpeechText?: string;
    language?: string;
    useWebSpeechFallback?: boolean;
}
export declare class TranscriptionService {
    private aiService;
    private huggingFaceService;
    private fasterWhisperEnabled;
    constructor();
    private initializeServices;
    private getAIService;
    private getHuggingFaceService;
    private checkFasterWhisperAvailability;
    /**
     * Main transcription method that uses hybrid approach
     */
    transcribeAudio(request: TranscriptionRequest): Promise<TranscriptionResult>;
    /**
     * Server-side transcription using best available backend
     */
    private transcribeServerSide;
    /**
     * Enhance Web Speech transcription with server-side processing
     */
    private enhanceWebSpeechTranscription;
    /**
     * Compare Web Speech and server transcriptions to choose the best result
     */
    private compareTranscriptions;
    /**
     * Transcribe using Faster-Whisper (when available)
     */
    private transcribeWithFasterWhisper;
    /**
     * Download audio from URL
     */
    private downloadAudio;
    /**
     * Get transcription capabilities and status
     */
    getCapabilities(): Promise<{
        web_speech_available: boolean;
        faster_whisper_available: boolean;
        openai_api_available: boolean;
        recommended_backend: TranscriptionBackend;
    }>;
    /**
     * Process batch transcriptions efficiently
     */
    batchTranscribe(requests: TranscriptionRequest[]): Promise<TranscriptionResult[]>;
    /**
     * Health check for transcription service
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        backends: Record<TranscriptionBackend, boolean>;
        latency_ms?: number;
    }>;
}
export declare const transcriptionService: TranscriptionService;
//# sourceMappingURL=transcriptionService.d.ts.map
import { TranscriptionResponse } from '@cathcr/shared';
export declare class HuggingFaceService {
    private hf;
    private isConfigured;
    constructor();
    transcribeAudio(audioBuffer: Buffer, options?: {
        model?: string;
        language?: string;
    }): Promise<TranscriptionResponse>;
    transcribeAudioFromFile(filePath: string, options?: {
        model?: string;
        language?: string;
    }): Promise<TranscriptionResponse>;
    /**
     * Batch transcription for multiple audio files
     */
    batchTranscribe(audioBuffers: Buffer[], options?: {
        model?: string;
        language?: string;
    }): Promise<TranscriptionResponse[]>;
    /**
     * Check if the service is properly configured
     */
    isAvailable(): boolean;
    /**
     * Get available Whisper models
     */
    getAvailableModels(): string[];
    /**
     * Get model information
     */
    getModelInfo(modelName: string): {
        name: string;
        size: string;
        languages: string[];
    } | null;
}
export default HuggingFaceService;
//# sourceMappingURL=huggingfaceService.d.ts.map
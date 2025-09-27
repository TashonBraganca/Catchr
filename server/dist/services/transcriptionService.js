import { AIService } from './aiService.js';
import { HuggingFaceService } from './huggingfaceService.js';
import { AI_CONFIG } from '@cathcr/shared';
// Transcription backends enum
export var TranscriptionBackend;
(function (TranscriptionBackend) {
    TranscriptionBackend["WEB_SPEECH"] = "web_speech";
    TranscriptionBackend["HUGGINGFACE_WHISPER"] = "huggingface_whisper";
    TranscriptionBackend["OPENAI_WHISPER"] = "openai_whisper";
    TranscriptionBackend["FASTER_WHISPER"] = "faster_whisper";
})(TranscriptionBackend || (TranscriptionBackend = {}));
export class TranscriptionService {
    aiService = null;
    huggingFaceService = null;
    fasterWhisperEnabled = false;
    constructor() {
        this.checkFasterWhisperAvailability();
        this.initializeServices();
    }
    // Initialize all services
    initializeServices() {
        try {
            this.huggingFaceService = new HuggingFaceService();
        }
        catch (error) {
            console.warn('HuggingFace service initialization failed:', error);
            this.huggingFaceService = null;
        }
    }
    // Lazy initialize AIService when needed
    getAIService() {
        if (!this.aiService) {
            this.aiService = new AIService();
        }
        return this.aiService;
    }
    // Get HuggingFace service
    getHuggingFaceService() {
        return this.huggingFaceService;
    }
    async checkFasterWhisperAvailability() {
        try {
            // Try to import faster-whisper (Python binding would be needed)
            // For now, we'll simulate this check
            this.fasterWhisperEnabled = process.env.FASTER_WHISPER_ENABLED === 'true';
            console.log(`Faster-Whisper availability: ${this.fasterWhisperEnabled}`);
        }
        catch (error) {
            console.warn('Faster-Whisper not available, falling back to OpenAI API');
            this.fasterWhisperEnabled = false;
        }
    }
    /**
     * Main transcription method that uses hybrid approach
     */
    async transcribeAudio(request) {
        const startTime = Date.now();
        // If Web Speech text is provided, use it as primary with optional enhancement
        if (request.webSpeechText) {
            const result = {
                text: request.webSpeechText,
                confidence: 0.85, // Web Speech API typically has good confidence
                backend: TranscriptionBackend.WEB_SPEECH,
                processing_time: Date.now() - startTime,
            };
            // Optionally enhance with server-side processing if audio is available
            if (request.audioBuffer || request.audioUrl) {
                try {
                    const enhancedResult = await this.enhanceWebSpeechTranscription(request.webSpeechText, request.audioBuffer, request.audioUrl);
                    if (enhancedResult) {
                        return enhancedResult;
                    }
                }
                catch (error) {
                    console.warn('Enhancement failed, using Web Speech result:', error);
                }
            }
            return result;
        }
        // If no Web Speech text, process audio server-side
        if (request.audioBuffer || request.audioUrl) {
            return this.transcribeServerSide(request);
        }
        throw new Error('No audio data or Web Speech text provided');
    }
    /**
     * Server-side transcription using best available backend
     */
    async transcribeServerSide(request) {
        const startTime = Date.now();
        const fallbackChain = AI_CONFIG.TRANSCRIPTION.FALLBACK_CHAIN;
        // Ensure we have audio data to work with
        let audioBuffer = request.audioBuffer;
        if (!audioBuffer && request.audioUrl) {
            try {
                audioBuffer = await this.downloadAudio(request.audioUrl);
            }
            catch (error) {
                console.error('Failed to download audio from URL:', error);
                throw new Error('Failed to download audio from URL');
            }
        }
        if (!audioBuffer) {
            throw new Error('No valid audio input provided');
        }
        // Try each backend in the fallback chain
        for (const backend of fallbackChain) {
            try {
                let result = null;
                switch (backend) {
                    case 'huggingface':
                        if (this.huggingFaceService?.isAvailable()) {
                            console.log('🤗 Attempting HuggingFace Whisper transcription...');
                            result = await this.huggingFaceService.transcribeAudio(audioBuffer, {
                                language: request.language
                            });
                            if (result) {
                                return {
                                    text: result.text,
                                    confidence: result.confidence,
                                    backend: TranscriptionBackend.HUGGINGFACE_WHISPER,
                                    processing_time: Date.now() - startTime,
                                };
                            }
                        }
                        break;
                    case 'openai':
                        console.log('🔄 Trying OpenAI Whisper...');
                        const aiResult = await this.getAIService().transcribeAudio(audioBuffer);
                        return {
                            text: aiResult.text,
                            confidence: aiResult.confidence,
                            backend: TranscriptionBackend.OPENAI_WHISPER,
                            processing_time: Date.now() - startTime,
                        };
                    case 'webspeech':
                        // WebSpeech would already have been handled at the client level
                        console.log('⚠️ WebSpeech fallback should be handled client-side');
                        break;
                }
            }
            catch (error) {
                console.warn(`❌ ${backend} transcription failed, trying next backend:`, error);
                // Continue to next backend in fallback chain
            }
        }
        // If all configured backends fail, try Faster-Whisper as a last resort
        if (this.fasterWhisperEnabled) {
            try {
                console.log('🚀 Final fallback to Faster-Whisper...');
                const result = await this.transcribeWithFasterWhisper(audioBuffer, request.language);
                return {
                    ...result,
                    backend: TranscriptionBackend.FASTER_WHISPER,
                    processing_time: Date.now() - startTime,
                };
            }
            catch (error) {
                console.error('Faster-Whisper failed as final fallback:', error);
            }
        }
        throw new Error('All transcription backends failed');
    }
    /**
     * Enhance Web Speech transcription with server-side processing
     */
    async enhanceWebSpeechTranscription(webSpeechText, audioBuffer, audioUrl) {
        try {
            const startTime = Date.now();
            // Get server transcription
            const serverResult = await this.transcribeServerSide({
                audioBuffer,
                audioUrl,
            });
            // Compare results and choose the best one
            const enhancedResult = this.compareTranscriptions(webSpeechText, serverResult);
            return {
                ...enhancedResult,
                processing_time: Date.now() - startTime,
            };
        }
        catch (error) {
            console.error('Enhancement failed:', error);
            return null;
        }
    }
    /**
     * Compare Web Speech and server transcriptions to choose the best result
     */
    compareTranscriptions(webSpeechText, serverResult) {
        // Simple heuristics to choose the best transcription
        const webSpeechWords = webSpeechText.trim().split(/\s+/).length;
        const serverWords = serverResult.text.trim().split(/\s+/).length;
        // Prefer server result if:
        // 1. Server confidence is very high (>0.9)
        // 2. Server result is significantly longer (more detailed)
        // 3. Web Speech result seems incomplete (very short)
        if (serverResult.confidence > 0.9) {
            return serverResult;
        }
        if (serverWords > webSpeechWords * 1.5 && serverWords > 5) {
            return serverResult;
        }
        if (webSpeechWords < 3 && serverWords > 5) {
            return serverResult;
        }
        // Otherwise, prefer Web Speech (real-time, user saw it being transcribed)
        return {
            text: webSpeechText,
            confidence: Math.max(0.85, serverResult.confidence * 0.9), // Slight preference for Web Speech
            backend: TranscriptionBackend.WEB_SPEECH,
            processing_time: 0,
        };
    }
    /**
     * Transcribe using Faster-Whisper (when available)
     */
    async transcribeWithFasterWhisper(audioBuffer, language) {
        // TODO: Implement actual Faster-Whisper integration
        // This would require Python subprocess or Python binding
        // For now, simulate the call
        if (process.env.NODE_ENV === 'development') {
            console.log('Simulating Faster-Whisper transcription...');
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                text: 'Simulated Faster-Whisper transcription result',
                confidence: 0.95,
                word_timestamps: [],
            };
        }
        // In production, this would call faster-whisper
        throw new Error('Faster-Whisper not implemented in production yet');
    }
    /**
     * Download audio from URL
     */
    async downloadAudio(audioUrl) {
        try {
            const response = await fetch(audioUrl);
            if (!response.ok) {
                throw new Error(`Failed to download audio: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
        catch (error) {
            console.error('Audio download error:', error);
            throw new Error('Failed to download audio file');
        }
    }
    /**
     * Get transcription capabilities and status
     */
    async getCapabilities() {
        return {
            web_speech_available: true, // Available in browser
            faster_whisper_available: this.fasterWhisperEnabled,
            openai_api_available: !!process.env.OPENAI_API_KEY,
            recommended_backend: this.fasterWhisperEnabled
                ? TranscriptionBackend.FASTER_WHISPER
                : TranscriptionBackend.OPENAI_API,
        };
    }
    /**
     * Process batch transcriptions efficiently
     */
    async batchTranscribe(requests) {
        const results = [];
        // Process in batches to avoid overwhelming the system
        const batchSize = 5;
        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            const batchResults = await Promise.allSettled(batch.map(request => this.transcribeAudio(request)));
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    console.error(`Batch transcription failed for request ${i + index}:`, result.reason);
                    // Add error result
                    results.push({
                        text: '',
                        confidence: 0,
                        backend: TranscriptionBackend.OPENAI_API,
                        processing_time: 0,
                    });
                }
            });
            // Small delay between batches
            if (i + batchSize < requests.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        return results;
    }
    /**
     * Health check for transcription service
     */
    async healthCheck() {
        const startTime = Date.now();
        const backends = {
            [TranscriptionBackend.WEB_SPEECH]: true, // Always available in browser
            [TranscriptionBackend.FASTER_WHISPER]: this.fasterWhisperEnabled,
            [TranscriptionBackend.OPENAI_API]: !!process.env.OPENAI_API_KEY,
        };
        // Test OpenAI API connectivity if available
        let apiHealthy = true;
        if (backends[TranscriptionBackend.OPENAI_API]) {
            try {
                // Simple connectivity test
                await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                });
            }
            catch (error) {
                apiHealthy = false;
                backends[TranscriptionBackend.OPENAI_API] = false;
            }
        }
        const healthyBackends = Object.values(backends).filter(Boolean).length;
        const latency = Date.now() - startTime;
        return {
            status: healthyBackends >= 2 ? 'healthy' : healthyBackends >= 1 ? 'degraded' : 'unhealthy',
            backends,
            latency_ms: latency,
        };
    }
}
// Export singleton instance
export const transcriptionService = new TranscriptionService();
//# sourceMappingURL=transcriptionService.js.map
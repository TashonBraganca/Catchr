import { HfInference } from '@huggingface/inference';
import { AI_CONFIG, ERROR_CODES } from '@cathcr/shared';
export class HuggingFaceService {
    hf;
    isConfigured;
    constructor() {
        this.isConfigured = false;
        this.hf = null;
        try {
            if (process.env.HUGGINGFACE_API_TOKEN && process.env.HUGGINGFACE_API_TOKEN !== 'hf_development_placeholder') {
                this.hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);
                this.isConfigured = true;
                console.log('✅ HuggingFace service initialized');
            }
            else {
                console.warn('⚠️ HuggingFace API token not configured, HF Whisper features disabled');
            }
        }
        catch (error) {
            console.error('❌ HuggingFace Service initialization failed:', error);
            this.isConfigured = false;
        }
    }
    async transcribeAudio(audioBuffer, options) {
        try {
            if (!this.isConfigured || !this.hf) {
                throw new Error('HuggingFace service not configured');
            }
            const model = options?.model || AI_CONFIG.TRANSCRIPTION.HUGGINGFACE_WHISPER_MODEL;
            // Convert buffer to blob for HuggingFace API
            const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
            // Use HuggingFace Inference API for transcription
            const result = await this.hf.automaticSpeechRecognition({
                model: model,
                data: audioBlob,
                parameters: {
                    language: options?.language || AI_CONFIG.TRANSCRIPTION.LANGUAGE,
                    return_timestamps: true,
                }
            });
            // Extract text from HuggingFace response
            let transcriptionText = '';
            let confidence = 0.9; // Default high confidence for Whisper
            if (typeof result === 'string') {
                transcriptionText = result;
            }
            else if (result && typeof result === 'object' && 'text' in result) {
                transcriptionText = result.text || '';
                // HuggingFace doesn't provide confidence scores, use default
                confidence = 0.9;
            }
            return {
                text: transcriptionText,
                confidence,
                language: options?.language || 'en',
                model: model,
                source: 'huggingface-whisper'
            };
        }
        catch (error) {
            console.error('HuggingFace transcription failed:', error);
            throw new Error(ERROR_CODES.TRANSCRIPTION_FAILED);
        }
    }
    async transcribeAudioFromFile(filePath, options) {
        try {
            if (!this.isConfigured || !this.hf) {
                throw new Error('HuggingFace service not configured');
            }
            const fs = await import('fs');
            const audioBuffer = fs.readFileSync(filePath);
            return this.transcribeAudio(audioBuffer, options);
        }
        catch (error) {
            console.error('HuggingFace file transcription failed:', error);
            throw new Error(ERROR_CODES.TRANSCRIPTION_FAILED);
        }
    }
    /**
     * Batch transcription for multiple audio files
     */
    async batchTranscribe(audioBuffers, options) {
        try {
            if (!this.isConfigured || !this.hf) {
                throw new Error('HuggingFace service not configured');
            }
            // Process in batches to avoid rate limits
            const batchSize = 5;
            const results = [];
            for (let i = 0; i < audioBuffers.length; i += batchSize) {
                const batch = audioBuffers.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch.map(buffer => this.transcribeAudio(buffer, options)));
                results.push(...batchResults);
                // Add delay between batches to respect rate limits
                if (i + batchSize < audioBuffers.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            return results;
        }
        catch (error) {
            console.error('HuggingFace batch transcription failed:', error);
            throw new Error(ERROR_CODES.TRANSCRIPTION_FAILED);
        }
    }
    /**
     * Check if the service is properly configured
     */
    isAvailable() {
        return this.isConfigured && this.hf !== null;
    }
    /**
     * Get available Whisper models
     */
    getAvailableModels() {
        return [
            'openai/whisper-large-v3',
            'openai/whisper-large-v2',
            'openai/whisper-medium',
            'openai/whisper-small',
            'openai/whisper-base',
            'openai/whisper-tiny'
        ];
    }
    /**
     * Get model information
     */
    getModelInfo(modelName) {
        const modelMap = {
            'openai/whisper-large-v3': {
                name: 'Whisper Large V3',
                size: '1550M parameters',
                languages: ['multilingual', 'english']
            },
            'openai/whisper-large-v2': {
                name: 'Whisper Large V2',
                size: '1550M parameters',
                languages: ['multilingual', 'english']
            },
            'openai/whisper-medium': {
                name: 'Whisper Medium',
                size: '769M parameters',
                languages: ['multilingual', 'english']
            },
            'openai/whisper-small': {
                name: 'Whisper Small',
                size: '244M parameters',
                languages: ['multilingual', 'english']
            },
            'openai/whisper-base': {
                name: 'Whisper Base',
                size: '74M parameters',
                languages: ['multilingual', 'english']
            },
            'openai/whisper-tiny': {
                name: 'Whisper Tiny',
                size: '39M parameters',
                languages: ['multilingual', 'english']
            }
        };
        return modelMap[modelName] || null;
    }
}
export default HuggingFaceService;
//# sourceMappingURL=huggingfaceService.js.map
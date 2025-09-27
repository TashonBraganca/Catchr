import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { transcriptionService } from '../services/transcriptionService.js';
const router = express.Router();
// Lazy-loading Supabase client to avoid initialization during import
let supabase = null;
let supabaseInitialized = false;
function getSupabaseClient() {
    if (supabaseInitialized) {
        return supabase;
    }
    try {
        if (process.env.SUPABASE_URL &&
            process.env.SUPABASE_SERVICE_ROLE_KEY &&
            process.env.SUPABASE_URL !== 'https://development-placeholder.supabase.co' &&
            process.env.SUPABASE_SERVICE_ROLE_KEY !== 'development-placeholder') {
            supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            console.log('✅ Supabase client initialized for transcription routes');
        }
        else {
            console.warn('⚠️ Supabase not configured, transcription routes will return development placeholders');
            supabase = null;
        }
    }
    catch (error) {
        console.error('❌ Failed to initialize Supabase client for transcription:', error);
        supabase = null;
    }
    supabaseInitialized = true;
    return supabase;
}
// Configure multer for audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only audio files are allowed'), false);
        }
    },
});
// Middleware to verify authentication
const authenticateUser = async (req, res, next) => {
    try {
        const supabaseClient = getSupabaseClient();
        // If Supabase is not configured, use development mode authentication
        if (!supabaseClient) {
            console.warn('🔧 Development mode: Using mock authentication for transcription');
            req.user = {
                id: 'dev-user-123',
                email: 'dev@example.com',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString(),
            };
            return next();
        }
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header required' });
        }
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabaseClient.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};
// Apply authentication middleware to all routes
router.use(authenticateUser);
// POST /api/transcription/enhance - Enhance Web Speech transcription with server processing
router.post('/enhance', upload.single('audio'), async (req, res) => {
    try {
        const { web_speech_text, language } = req.body;
        const audioFile = req.file;
        if (!web_speech_text && !audioFile) {
            return res.status(400).json({
                error: 'Either web_speech_text or audio file is required'
            });
        }
        // Prepare transcription request
        const transcriptionRequest = {
            webSpeechText: web_speech_text,
            language: language || 'en',
            useWebSpeechFallback: true,
        };
        if (audioFile) {
            transcriptionRequest.audioBuffer = audioFile.buffer;
        }
        // Process transcription
        const result = await transcriptionService.transcribeAudio(transcriptionRequest);
        res.json({
            success: true,
            data: {
                text: result.text,
                confidence: result.confidence,
                backend: result.backend,
                processing_time: result.processing_time,
                word_timestamps: result.word_timestamps,
                original_web_speech: web_speech_text,
            },
        });
    }
    catch (error) {
        console.error('Transcription enhancement error:', error);
        res.status(500).json({
            error: 'Transcription enhancement failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// POST /api/transcription/process - Process audio file for transcription
router.post('/process', upload.single('audio'), async (req, res) => {
    try {
        const { language, enhance_accuracy } = req.body;
        const audioFile = req.file;
        if (!audioFile) {
            return res.status(400).json({
                error: 'Audio file is required'
            });
        }
        // Process transcription
        const result = await transcriptionService.transcribeAudio({
            audioBuffer: audioFile.buffer,
            language: language || 'en',
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error('Audio transcription error:', error);
        res.status(500).json({
            error: 'Audio transcription failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// POST /api/transcription/batch - Process multiple audio files
router.post('/batch', upload.array('audio', 10), async (req, res) => {
    try {
        const files = req.files;
        const { language } = req.body;
        if (!files || files.length === 0) {
            return res.status(400).json({
                error: 'At least one audio file is required'
            });
        }
        // Prepare batch requests
        const requests = files.map(file => ({
            audioBuffer: file.buffer,
            language: language || 'en',
        }));
        // Process batch
        const results = await transcriptionService.batchTranscribe(requests);
        res.json({
            success: true,
            data: results,
            processed: results.length,
        });
    }
    catch (error) {
        console.error('Batch transcription error:', error);
        res.status(500).json({
            error: 'Batch transcription failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/transcription/capabilities - Get transcription capabilities
router.get('/capabilities', async (req, res) => {
    try {
        const capabilities = await transcriptionService.getCapabilities();
        res.json({
            success: true,
            data: capabilities,
        });
    }
    catch (error) {
        console.error('Capabilities check error:', error);
        res.status(500).json({
            error: 'Failed to check capabilities',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/transcription/health - Health check for transcription service
router.get('/health', async (req, res) => {
    try {
        const health = await transcriptionService.healthCheck();
        res.json({
            success: true,
            data: health,
        });
    }
    catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// POST /api/transcription/url - Transcribe audio from URL
router.post('/url', async (req, res) => {
    try {
        const { audio_url, language } = req.body;
        if (!audio_url) {
            return res.status(400).json({
                error: 'audio_url is required'
            });
        }
        // Validate URL format
        try {
            new URL(audio_url);
        }
        catch {
            return res.status(400).json({
                error: 'Invalid audio_url format'
            });
        }
        // Process transcription
        const result = await transcriptionService.transcribeAudio({
            audioUrl: audio_url,
            language: language || 'en',
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error('URL transcription error:', error);
        res.status(500).json({
            error: 'URL transcription failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/transcription/languages - Get supported languages
router.get('/languages', async (req, res) => {
    try {
        // Common languages supported by Whisper and Web Speech API
        const languages = [
            { code: 'en', name: 'English', variants: ['en-US', 'en-GB', 'en-AU', 'en-CA'] },
            { code: 'es', name: 'Spanish', variants: ['es-ES', 'es-MX', 'es-AR'] },
            { code: 'fr', name: 'French', variants: ['fr-FR', 'fr-CA'] },
            { code: 'de', name: 'German', variants: ['de-DE', 'de-AT', 'de-CH'] },
            { code: 'it', name: 'Italian', variants: ['it-IT'] },
            { code: 'pt', name: 'Portuguese', variants: ['pt-BR', 'pt-PT'] },
            { code: 'ru', name: 'Russian', variants: ['ru-RU'] },
            { code: 'ja', name: 'Japanese', variants: ['ja-JP'] },
            { code: 'ko', name: 'Korean', variants: ['ko-KR'] },
            { code: 'zh', name: 'Chinese', variants: ['zh-CN', 'zh-TW', 'zh-HK'] },
            { code: 'ar', name: 'Arabic', variants: ['ar-SA', 'ar-EG'] },
            { code: 'hi', name: 'Hindi', variants: ['hi-IN'] },
            { code: 'tr', name: 'Turkish', variants: ['tr-TR'] },
            { code: 'pl', name: 'Polish', variants: ['pl-PL'] },
            { code: 'nl', name: 'Dutch', variants: ['nl-NL', 'nl-BE'] },
            { code: 'sv', name: 'Swedish', variants: ['sv-SE'] },
            { code: 'da', name: 'Danish', variants: ['da-DK'] },
            { code: 'no', name: 'Norwegian', variants: ['no-NO'] },
            { code: 'fi', name: 'Finnish', variants: ['fi-FI'] },
        ];
        res.json({
            success: true,
            data: languages,
        });
    }
    catch (error) {
        console.error('Languages list error:', error);
        res.status(500).json({
            error: 'Failed to get languages',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'Audio file must be less than 50MB'
            });
        }
        return res.status(400).json({
            error: 'File upload error',
            message: error.message
        });
    }
    if (error.message === 'Only audio files are allowed') {
        return res.status(400).json({
            error: 'Invalid file type',
            message: 'Only audio files are supported'
        });
    }
    next(error);
});
export default router;
//# sourceMappingURL=transcription.js.map
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { queueService } from '../services/queueService.js';
import { transcriptionService } from '../services/transcriptionService.js';
const router = express.Router();
// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Middleware to verify authentication
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header required' });
        }
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
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
// POST /api/capture - Create a new thought capture
router.post('/', async (req, res) => {
    try {
        const { content, transcribed_text, audio_url, audio_path, audio_duration, type, category, tags } = req.body;
        const userId = req.user.id;
        // Validate required fields
        if (!content && !transcribed_text && !audio_url) {
            return res.status(400).json({
                error: 'At least one of content, transcribed_text, or audio_url is required'
            });
        }
        // Create the thought in the database
        const thoughtData = {
            user_id: userId,
            content: content || transcribed_text || 'Audio capture pending transcription',
            transcribed_text: transcribed_text || null,
            audio_url: audio_url || null,
            audio_path: audio_path || null,
            audio_duration: audio_duration || null,
            type: type || 'note',
            category: category || {
                main: 'uncategorized',
                subcategory: null,
                color: '#6B7280',
                icon: '📝'
            },
            tags: tags || [],
            is_processed: false,
        };
        const { data: thought, error: insertError } = await supabase
            .from('thoughts')
            .insert(thoughtData)
            .select()
            .single();
        if (insertError) {
            console.error('Error creating thought:', insertError);
            return res.status(500).json({ error: 'Failed to create thought' });
        }
        // Queue for AI processing
        try {
            // If there's audio but no transcription, queue for Whisper transcription
            if (audio_url && !transcribed_text) {
                await queueService.addWhisperTranscribeJob({
                    thoughtId: thought.id,
                    userId,
                    audioUrl: audio_url,
                });
            }
            // Queue for AI enrichment (categorization, reminder extraction)
            await queueService.addEnrichSummaryJob({
                thoughtId: thought.id,
                userId,
                content: content || transcribed_text || '',
            });
            // Add to AI processing queue table for tracking
            await supabase
                .from('ai_processing_queue')
                .insert({
                thought_id: thought.id,
                user_id: userId,
                processing_type: 'categorization',
                status: 'pending',
            });
        }
        catch (queueError) {
            console.error('Error queuing AI processing:', queueError);
            // Don't fail the request if queuing fails, just log it
        }
        res.status(201).json({
            success: true,
            data: thought,
            message: 'Thought captured successfully',
        });
    }
    catch (error) {
        console.error('Capture error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/capture - Get user's captures with pagination
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = '20', offset = '0', category, type, search, include_processed = 'true' } = req.query;
        let query = supabase
            .from('thoughts')
            .select('*')
            .eq('user_id', userId);
        // Apply filters
        if (category) {
            query = query.eq('category->main', category);
        }
        if (type) {
            query = query.eq('type', type);
        }
        if (search) {
            query = query.textSearch('content', search);
        }
        if (include_processed === 'false') {
            query = query.eq('is_processed', false);
        }
        // Apply pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .limit(parseInt(limit))
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        const { data: thoughts, error, count } = await query;
        if (error) {
            console.error('Error fetching thoughts:', error);
            return res.status(500).json({ error: 'Failed to fetch thoughts' });
        }
        res.json({
            success: true,
            data: thoughts || [],
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: count || 0,
            },
        });
    }
    catch (error) {
        console.error('Get captures error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/capture/:id - Get a specific thought
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { data: thought, error } = await supabase
            .from('thoughts')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error || !thought) {
            return res.status(404).json({ error: 'Thought not found' });
        }
        res.json({
            success: true,
            data: thought,
        });
    }
    catch (error) {
        console.error('Get thought error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/capture/:id - Update a thought
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updateData = req.body;
        // Remove fields that shouldn't be updated directly
        delete updateData.id;
        delete updateData.user_id;
        delete updateData.created_at;
        const { data: thought, error } = await supabase
            .from('thoughts')
            .update({
            ...updateData,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) {
            console.error('Error updating thought:', error);
            return res.status(500).json({ error: 'Failed to update thought' });
        }
        if (!thought) {
            return res.status(404).json({ error: 'Thought not found' });
        }
        res.json({
            success: true,
            data: thought,
            message: 'Thought updated successfully',
        });
    }
    catch (error) {
        console.error('Update thought error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/capture/:id - Delete a thought
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { error } = await supabase
            .from('thoughts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            console.error('Error deleting thought:', error);
            return res.status(500).json({ error: 'Failed to delete thought' });
        }
        res.json({
            success: true,
            message: 'Thought deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete thought error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/capture/transcribe - Transcribe audio for real-time enhancement
router.post('/transcribe', async (req, res) => {
    try {
        const { audio_data, content_type = 'audio/webm' } = req.body;
        const userId = req.user.id;
        if (!audio_data) {
            return res.status(400).json({ error: 'Audio data is required' });
        }
        // Convert base64 audio data to buffer
        let audioBuffer;
        try {
            audioBuffer = Buffer.from(audio_data, 'base64');
        }
        catch (error) {
            return res.status(400).json({ error: 'Invalid audio data format' });
        }
        // Use transcription service to process audio
        const result = await transcriptionService.transcribeAudio(audioBuffer, {
            format: content_type.includes('webm') ? 'webm' : 'wav',
            backend: 'faster_whisper', // Use high-quality backend for enhancement
            language: 'en', // Default to English, could be made configurable
        });
        if (!result) {
            return res.status(500).json({ error: 'Transcription failed' });
        }
        res.json({
            success: true,
            data: {
                text: result.text,
                confidence: result.confidence,
                backend: result.backend,
                language_detected: result.language_detected,
                processing_time: result.processing_time,
            },
        });
    }
    catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/capture/sync - Sync offline captures
router.post('/sync', async (req, res) => {
    try {
        const { captures } = req.body;
        const userId = req.user.id;
        if (!Array.isArray(captures)) {
            return res.status(400).json({ error: 'Captures must be an array' });
        }
        const results = [];
        for (const captureData of captures) {
            try {
                // Create thought
                const thoughtData = {
                    user_id: userId,
                    content: captureData.content || 'Offline capture',
                    transcribed_text: captureData.transcribed_text || null,
                    audio_url: captureData.audio_url || null,
                    audio_path: captureData.audio_path || null,
                    audio_duration: captureData.audio_duration || null,
                    type: captureData.type || 'note',
                    category: captureData.category || {
                        main: 'uncategorized',
                        subcategory: null,
                        color: '#6B7280',
                        icon: '📝'
                    },
                    tags: captureData.tags || [],
                    is_processed: false,
                    created_at: captureData.created_at || new Date().toISOString(),
                };
                const { data: thought, error: insertError } = await supabase
                    .from('thoughts')
                    .insert(thoughtData)
                    .select()
                    .single();
                if (insertError) {
                    console.error('Error syncing capture:', insertError);
                    results.push({
                        offline_id: captureData.offline_id,
                        success: false,
                        error: insertError.message,
                    });
                    continue;
                }
                // Queue for AI processing
                if (thought) {
                    try {
                        if (captureData.audio_url && !captureData.transcribed_text) {
                            await queueService.addWhisperTranscribeJob({
                                thoughtId: thought.id,
                                userId,
                                audioUrl: captureData.audio_url,
                            });
                        }
                        await queueService.addEnrichSummaryJob({
                            thoughtId: thought.id,
                            userId,
                            content: captureData.content || captureData.transcribed_text || '',
                        });
                    }
                    catch (queueError) {
                        console.error('Error queuing sync processing:', queueError);
                    }
                }
                results.push({
                    offline_id: captureData.offline_id,
                    success: true,
                    thought_id: thought?.id,
                });
            }
            catch (error) {
                console.error('Error processing sync capture:', error);
                results.push({
                    offline_id: captureData.offline_id,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        res.json({
            success: true,
            data: results,
            message: `Synced ${results.filter(r => r.success).length} of ${results.length} captures`,
        });
    }
    catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/capture/queue/status - Get processing queue status
router.get('/queue/status', async (req, res) => {
    try {
        const userId = req.user.id;
        // Get user's items in processing queue
        const { data: queueItems, error } = await supabase
            .from('ai_processing_queue')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) {
            console.error('Error fetching queue status:', error);
            return res.status(500).json({ error: 'Failed to fetch queue status' });
        }
        // Get overall queue health
        const queueHealth = await queueService.getQueueHealth();
        res.json({
            success: true,
            data: {
                user_queue_items: queueItems || [],
                queue_health: queueHealth,
            },
        });
    }
    catch (error) {
        console.error('Queue status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=capture.js.map
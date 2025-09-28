import { Router } from 'express';
import multer from 'multer';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
// SIMPLE VOICE PIPELINE - WHISPER + GPT-5-MINI
// Based on REVAMP.md requirements: Web Speech API primary, Whisper fallback, GPT-5-mini categorization
const router = Router();
const upload = multer({ dest: 'uploads/' });
// Initialize OpenAI with GPT-5-mini configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// POST /api/voice/transcribe - Whisper fallback transcription
router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        console.log('🎤 Transcribing audio with Whisper...');
        // Convert audio to the format Whisper expects
        const audioBuffer = await fs.readFile(req.file.path);
        // Create a temporary file with proper extension
        const tempPath = req.file.path + '.webm';
        await fs.writeFile(tempPath, audioBuffer);
        try {
            // Use OpenAI Whisper for transcription
            const transcription = await openai.audio.transcriptions.create({
                file: await fs.readFile(tempPath),
                model: 'whisper-1',
                language: 'en',
                response_format: 'json',
                temperature: 0.0, // More deterministic results
            });
            console.log('✅ Whisper transcription completed');
            res.json({
                transcript: transcription.text,
                confidence: 1.0 // Whisper doesn't provide confidence scores
            });
        }
        finally {
            // Cleanup temporary files
            try {
                await fs.unlink(req.file.path);
                await fs.unlink(tempPath);
            }
            catch (cleanupError) {
                console.warn('Failed to cleanup temp files:', cleanupError);
            }
        }
    }
    catch (error) {
        console.error('Whisper transcription error:', error);
        res.status(500).json({
            error: 'Transcription failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// POST /api/voice/categorize - GPT-5-mini categorization and enhancement
router.post('/categorize', async (req, res) => {
    try {
        const { transcript } = req.body;
        if (!transcript || typeof transcript !== 'string') {
            return res.status(400).json({ error: 'Transcript is required' });
        }
        console.log('🤖 Processing with GPT-5-mini...');
        // Use GPT-5-mini for intelligent categorization
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // GPT-5-mini equivalent
            messages: [
                {
                    role: 'system',
                    content: `You are a smart assistant that helps categorize voice notes like Apple Notes and Google Keep.

INSTRUCTIONS:
- Analyze the transcript and suggest a concise title (max 50 characters)
- Suggest relevant tags (max 5 tags, single words or short phrases)
- Determine if this is a task, note, idea, or reminder
- Keep suggestions simple and useful

Respond in JSON format:
{
  "suggestedTitle": "Brief descriptive title",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "category": "task|note|idea|reminder",
  "priority": "low|medium|high",
  "confidence": 0.0-1.0
}`
                },
                {
                    role: 'user',
                    content: `Please analyze this voice transcript and provide categorization suggestions:\n\n"${transcript}"`
                }
            ],
            temperature: 0.3, // Balance creativity with consistency
            max_tokens: 200,
            response_format: { type: 'json_object' }
        });
        const result = JSON.parse(completion.choices[0].message.content || '{}');
        console.log('✅ GPT-5-mini categorization completed');
        // Ensure we return expected fields with defaults
        res.json({
            suggestedTitle: result.suggestedTitle || generateFallbackTitle(transcript),
            suggestedTags: Array.isArray(result.suggestedTags) ? result.suggestedTags : [],
            category: result.category || 'note',
            priority: result.priority || 'medium',
            confidence: typeof result.confidence === 'number' ? result.confidence : 0.8
        });
    }
    catch (error) {
        console.error('GPT-5-mini categorization error:', error);
        // Fallback to simple rule-based categorization
        const fallback = generateFallbackCategorization(req.body.transcript);
        res.json({
            ...fallback,
            error: 'AI categorization failed, using fallback',
            confidence: 0.5
        });
    }
});
// POST /api/voice/save - Save processed voice note to database
router.post('/save', async (req, res) => {
    try {
        const { transcript, suggestedTitle, suggestedTags = [], category = 'note', priority = 'medium', projectId, audioUrl } = req.body;
        // Get user ID from auth (you'll need to implement auth middleware)
        const userId = req.user?.id; // Assuming auth middleware sets req.user
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }
        console.log('💾 Saving voice note to database...');
        // Determine note type based on category
        const noteType = category === 'task' ? 'task' : 'voice_note';
        // Create the note in database
        const { data: note, error: noteError } = await supabase
            .from('notes')
            .insert({
            user_id: userId,
            project_id: projectId, // Will use default project if not specified
            title: suggestedTitle || 'Voice Note',
            content: transcript,
            note_type: noteType,
            tags: suggestedTags,
            priority: priority === 'high' ? 4 : priority === 'medium' ? 2 : 1,
            is_completed: false,
            created_at: new Date().toISOString()
        })
            .select()
            .single();
        if (noteError) {
            throw noteError;
        }
        // If we have audio URL, save voice capture record
        if (audioUrl && note) {
            const { error: voiceError } = await supabase
                .from('voice_captures')
                .insert({
                user_id: userId,
                note_id: note.id,
                audio_file_url: audioUrl,
                transcript_text: transcript,
                transcript_confidence: 0.9,
                processing_status: 'completed',
                ai_category: category,
                ai_suggested_title: suggestedTitle,
                ai_suggested_tags: suggestedTags,
                ai_confidence: 0.8,
                processed_at: new Date().toISOString()
            });
            if (voiceError) {
                console.warn('Failed to save voice capture record:', voiceError);
                // Don't fail the whole request for this
            }
        }
        console.log('✅ Voice note saved successfully');
        res.json({
            success: true,
            note: note,
            message: 'Voice note saved successfully'
        });
    }
    catch (error) {
        console.error('Error saving voice note:', error);
        res.status(500).json({
            error: 'Failed to save voice note',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Helper function to generate fallback title from transcript
function generateFallbackTitle(transcript) {
    if (!transcript)
        return 'Voice Note';
    // Take first 50 characters and clean up
    const title = transcript
        .substring(0, 50)
        .trim()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' '); // Normalize whitespace
    return title || 'Voice Note';
}
// Helper function for fallback categorization
function generateFallbackCategorization(transcript) {
    const text = transcript.toLowerCase();
    // Simple keyword-based categorization
    const taskKeywords = ['todo', 'task', 'remind', 'schedule', 'meeting', 'call', 'buy', 'do'];
    const ideaKeywords = ['idea', 'think', 'maybe', 'could', 'what if', 'brainstorm'];
    const isTask = taskKeywords.some(keyword => text.includes(keyword));
    const isIdea = ideaKeywords.some(keyword => text.includes(keyword));
    // Extract potential tags (simple word frequency)
    const words = text
        .split(/\s+/)
        .filter(word => word.length > 3 && word.length < 15)
        .filter(word => !/^(the|and|for|are|but|not|you|all|can|had|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|dis|doe|end|few|got|let|man|put|run|say|she|too|use)$/.test(word));
    const uniqueWords = [...new Set(words)].slice(0, 3);
    return {
        suggestedTitle: generateFallbackTitle(transcript),
        suggestedTags: uniqueWords,
        category: isTask ? 'task' : isIdea ? 'idea' : 'note',
        priority: isTask ? 'medium' : 'low'
    };
}
export { router as default };
//# sourceMappingURL=voice.js.map
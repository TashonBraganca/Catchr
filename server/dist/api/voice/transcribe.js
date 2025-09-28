import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
// VERCEL EDGE FUNCTION - VOICE TRANSCRIPTION
// Handles Whisper API transcription for voice notes
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const { audioUrl, userId } = req.body;
        if (!audioUrl || !userId) {
            res.status(400).json({ error: 'Audio URL and user ID are required' });
            return;
        }
        console.log('🎤 Processing voice transcription via Whisper...');
        // Download audio from Supabase storage
        const { data: audioData, error: downloadError } = await supabase.storage
            .from('voice-recordings')
            .download(audioUrl);
        if (downloadError) {
            throw new Error(`Failed to download audio: ${downloadError.message}`);
        }
        // Convert blob to buffer for Whisper API
        const audioBuffer = Buffer.from(await audioData.arrayBuffer());
        // Transcribe with OpenAI Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
            model: 'whisper-1',
            language: 'en',
            response_format: 'json',
            temperature: 0.0,
        });
        console.log('✅ Whisper transcription completed');
        // Store transcription result
        const { error: updateError } = await supabase
            .from('voice_captures')
            .update({
            transcript_text: transcription.text,
            transcript_confidence: 1.0,
            processing_status: 'completed',
            processed_at: new Date().toISOString(),
        })
            .eq('audio_file_url', audioUrl)
            .eq('user_id', userId);
        if (updateError) {
            console.warn('Failed to update voice capture record:', updateError);
        }
        res.status(200).json({
            transcript: transcription.text,
            confidence: 1.0,
            success: true,
        });
    }
    catch (error) {
        console.error('Whisper transcription error:', error);
        res.status(500).json({
            error: 'Transcription failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
}
//# sourceMappingURL=transcribe.js.map
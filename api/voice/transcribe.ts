import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import OpenAI, { toFile } from 'openai';

// VERCEL SERVERLESS FUNCTION - VOICE TRANSCRIPTION
// Handles Whisper API transcription for voice notes

// Validate API key exists (Context7 best practice)
if (!process.env.OPENAI_API_KEY) {
  throw new Error('❌ OPENAI_API_KEY not configured in Vercel environment variables');
}

// Initialize OpenAI client with retry logic (Context7 best practice)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3, // Auto-retry on network errors (Context7 recommendation)
  timeout: 60 * 1000, // 60 seconds for large audio files
});

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    console.log('🎤 [Whisper] Starting voice transcription...');

    // Log API key format for debugging (first 7 and last 4 chars only)
    const apiKey = process.env.OPENAI_API_KEY!;
    console.log(`🔑 [Whisper] API Key format: ${apiKey.slice(0, 7)}...${apiKey.slice(-4)} (length: ${apiKey.length})`);

    // Parse form data (audio file)
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB max (Whisper limit)
    });

    const { files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req as any, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    console.log('📁 [Whisper] Audio file received:', {
      name: audioFile.originalFilename,
      size: audioFile.size,
      type: audioFile.mimetype,
      filepath: audioFile.filepath,
    });

    // CRITICAL: Use toFile helper with proper extension (Context7 best practice)
    // Client now prioritizes MP4/OGG over WebM for better Whisper compatibility

    // Map MIME types to extensions (Whisper-compatible formats)
    const mimeToExt: Record<string, string> = {
      'audio/mp4': '.m4a',
      'audio/mp4;codecs=opus': '.m4a', // CRITICAL FIX: MP4 with opus codec
      'audio/ogg': '.ogg',
      'audio/oga': '.oga',
      'audio/webm': '.webm',
      'audio/webm;codecs=opus': '.webm',
      'audio/wav': '.wav',
      'audio/mpeg': '.mp3',
    };

    const extension = mimeToExt[audioFile.mimetype || ''] || '.m4a'; // Default to .m4a instead of .webm
    const filename = `audio${extension}`;

    console.log('🔍 [Whisper] File analysis:', {
      mimeType: audioFile.mimetype,
      extension: extension,
      filename: filename,
      size: audioFile.size,
    });

    // Read file and use toFile helper
    const fileBuffer = fs.readFileSync(audioFile.filepath);
    const audioFileForWhisper = await toFile(fileBuffer, filename);

    console.log('📤 [Whisper] Uploading to Whisper API...');

    const transcription = await openai.audio.transcriptions.create({
      file: audioFileForWhisper,
      model: 'whisper-1',
      language: 'en', // Set language for better accuracy
      response_format: 'json',
      temperature: 0.0, // Deterministic output
      prompt: 'Voice note transcription. Capture the exact words spoken clearly.', // Hint for better accuracy
    });

    console.log('✅ [Whisper] Transcription completed:', {
      text: transcription.text.substring(0, 100),
      length: transcription.text.length,
    });

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    res.status(200).json({
      transcript: transcription.text,
      confidence: 1.0,
      success: true,
    });

  } catch (error) {
    // Context7 best practice: Handle OpenAI.APIError specifically
    if (error instanceof OpenAI.APIError) {
      console.error('❌ [Whisper] OpenAI API Error:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type,
        headers: error.headers,
      });
      res.status(error.status || 500).json({
        error: 'OpenAI API Error',
        message: error.message,
        code: error.code,
        type: error.type,
      });
    } else {
      console.error('❌ [Whisper] Transcription error:', error);
      res.status(500).json({
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

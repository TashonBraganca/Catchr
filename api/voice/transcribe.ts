import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

// VERCEL SERVERLESS FUNCTION - VOICE TRANSCRIPTION
// Handles Whisper API transcription for voice notes

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    });

    // Use OpenAI SDK with fs.createReadStream (Context7 best practice)
    console.log('📤 [Whisper] Uploading to OpenAI Whisper API...');

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
      temperature: 0.0,
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
    console.error('❌ [Whisper] Transcription error:', error);
    res.status(500).json({
      error: 'Transcription failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

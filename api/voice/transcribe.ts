import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import OpenAI, { toFile } from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

// VERCEL SERVERLESS FUNCTION - VOICE TRANSCRIPTION
// Handles Whisper API transcription for voice notes

// Set FFmpeg path for audio conversion
ffmpeg.setFfmpegPath(ffmpegPath.path);

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

    // CRITICAL FIX: Convert WebM/Opus to MP3 using FFmpeg
    // Research conclusively shows: WebM with Opus codec has severe compatibility issues with Whisper API
    // Even though "webm" is listed as supported, the Opus codec causes "Invalid file format" errors
    // Solution: Convert ALL audio to MP3 format using FFmpeg before sending to Whisper

    const isWebM = audioFile.mimetype?.includes('webm');

    console.log('🔍 [Whisper] Audio format analysis:', {
      receivedMimeType: audioFile.mimetype,
      isWebM: isWebM,
      needsConversion: isWebM,
      originalSize: audioFile.size,
    });

    let fileForWhisper: string;

    if (isWebM) {
      // Convert WebM to MP3 using FFmpeg
      const mp3Path = `${audioFile.filepath}.mp3`;

      console.log('🔄 [FFmpeg] Converting WebM to MP3...', {
        inputPath: audioFile.filepath,
        outputPath: mp3Path,
      });

      await new Promise<void>((resolve, reject) => {
        ffmpeg(audioFile.filepath)
          .toFormat('mp3')
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .on('start', (cmd) => {
            console.log('▶️ [FFmpeg] Command:', cmd);
          })
          .on('progress', (progress) => {
            console.log('⏳ [FFmpeg] Progress:', progress.percent?.toFixed(2) + '%');
          })
          .on('end', () => {
            console.log('✅ [FFmpeg] Conversion completed');
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ [FFmpeg] Conversion error:', err);
            reject(err);
          })
          .save(mp3Path);
      });

      fileForWhisper = mp3Path;

      const mp3Stats = fs.statSync(mp3Path);
      console.log('📦 [FFmpeg] MP3 file created:', {
        path: mp3Path,
        size: mp3Stats.size,
        compressionRatio: ((audioFile.size - mp3Stats.size) / audioFile.size * 100).toFixed(2) + '%',
      });

    } else {
      // Use original file for non-WebM formats (WAV, MP4, etc.)
      fileForWhisper = audioFile.filepath;
      console.log('✅ [Whisper] Using original file (no conversion needed)');
    }

    // Send to Whisper API with fs.createReadStream
    console.log('📤 [Whisper] Uploading to OpenAI Whisper API...');

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(fileForWhisper),
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
      temperature: 0.0,
    });

    console.log('✅ [Whisper] Transcription completed:', {
      text: transcription.text.substring(0, 100),
      length: transcription.text.length,
    });

    // Clean up temp files
    fs.unlinkSync(audioFile.filepath);
    if (isWebM && fs.existsSync(fileForWhisper)) {
      fs.unlinkSync(fileForWhisper);
    }

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

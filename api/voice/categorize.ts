import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// VERCEL SERVERLESS FUNCTION - VOICE CATEGORIZATION
// Uses GPT-5 Nano to categorize and enhance voice transcripts
// Note: GPT-5 does NOT support temperature, top_p, or logprobs parameters

// Validate API key (Context7 best practice)
if (!process.env.OPENAI_API_KEY) {
  throw new Error('❌ OPENAI_API_KEY not configured');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3, // Context7 recommendation
  timeout: 30 * 1000, // 30 seconds
});

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
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ error: 'Transcript is required' });
      return;
    }

    console.log('🤖 [GPT-5 Nano] Categorizing transcript:', transcript.substring(0, 100));

    // Use GPT-5 Nano for categorization
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano', // Using gpt-5-nano as production model
      messages: [
        {
          role: 'developer',
          content: `You are a supernatural AI thought organizer for Catchr app. Your mission: "Capture at speed of thought, organize at speed of AI".

Analyze the voice transcript and extract:
1. suggestedTitle: A concise, descriptive title (5-8 words max)
2. suggestedTags: Relevant tags for categorization (3-5 tags)
3. category: Primary category (task/idea/note/reminder/meeting/learning/personal)
4. priority: Urgency level (urgent/high/medium/low)
5. actionItems: Any action items mentioned
6. entities: People, places, dates, amounts mentioned

Return JSON only.`,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    console.log('✅ [GPT-5 Nano] Categorization completed');

    res.status(200).json({
      suggestedTitle: result.suggestedTitle || '',
      suggestedTags: result.suggestedTags || [],
      category: result.category || 'note',
      priority: result.priority || 'medium',
      actionItems: result.actionItems || [],
      entities: result.entities || {},
      success: true,
    });

  } catch (error) {
    console.error('❌ [GPT-5 Nano] Categorization error:', error);
    res.status(500).json({
      error: 'Categorization failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

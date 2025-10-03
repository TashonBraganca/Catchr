import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

// VERCEL SERVERLESS FUNCTION - AI CATEGORIZATION
// Uses GPT-5 Nano to categorize thoughts and notes

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    const { text, content } = req.body;
    const inputText = text || content;

    if (!inputText || typeof inputText !== 'string') {
      res.status(400).json({ error: 'Text or content is required' });
      return;
    }

    console.log('🤖 [GPT-5 Nano AI] Categorizing thought:', inputText.substring(0, 100));

    // Use GPT-5 Nano for supernatural thought organization
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'developer',
          content: `You are Catchr's supernatural AI orchestrator. Mission: "Capture at speed of thought, organize at speed of AI"

Analyze this thought and provide supernatural organization with 95%+ accuracy:

1. **category**: Primary category (task/idea/note/reminder/meeting/learning/personal)
2. **folder**: Main folder (Work/Personal/Projects/Learning/Inbox)
3. **project**: Specific project name (if applicable)
4. **subfolder**: Sub-categorization within project
5. **priority**: Urgency (urgent/high/medium/low)
6. **tags**: Relevant tags (3-7 tags max)
7. **suggestedTitle**: Concise title (5-8 words)
8. **actionItems**: Extracted action items with deadlines
9. **entities**: People, places, dates, amounts, topics, tools mentioned
10. **sentiment**: Overall sentiment (positive/neutral/negative)
11. **estimatedDuration**: Time estimate if it's a task (e.g., "30min", "2h")

Return JSON only. Be precise and supernatural.`,
        },
        {
          role: 'user',
          content: inputText,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    console.log('✅ [GPT-5 Nano AI] Categorization completed:', {
      category: result.category,
      priority: result.priority,
      tags: result.tags?.length || 0,
    });

    res.status(200).json({
      category: result.category || 'note',
      folder: result.folder || 'Inbox',
      project: result.project || null,
      subfolder: result.subfolder || null,
      priority: result.priority || 'medium',
      tags: result.tags || [],
      suggestedTitle: result.suggestedTitle || '',
      actionItems: result.actionItems || [],
      entities: result.entities || {},
      sentiment: result.sentiment || 'neutral',
      estimatedDuration: result.estimatedDuration || null,
      success: true,
    });

  } catch (error) {
    console.error('❌ [GPT-5 Nano AI] Categorization error:', error);
    res.status(500).json({
      error: 'AI categorization failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

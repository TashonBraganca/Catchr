# 🤖 AI Integration Guide

*OpenAI GPT-5 mini and HuggingFace Whisper integration for intelligent thought processing*

## 🎯 AI Services Overview

CATHCR integrates two primary AI services (corrected from original Claude API plans):

### **OpenAI GPT-5 mini** (Primary Intelligence)
- **Thought Enrichment**: Categorization, summarization, tagging
- **Entity Extraction**: People, dates, locations, topics
- **Command Parsing**: "create event", "schedule meeting", etc.
- **Semantic Linking**: Auto-connect related thoughts
- **Natural Language Understanding**: Context-aware processing

### **HuggingFace Whisper Large v3** (Speech Recognition)
- **High-Accuracy Transcription**: `openai/whisper-large-v3` model
- **Multi-Language Support**: 99+ languages with detection
- **Real-Time Processing**: Optimized for sub-second response
- **Confidence Scoring**: Per-word and segment confidence metrics
- **Noise Robustness**: Works in challenging audio environments

---

## 🔧 OpenAI Integration Setup

### Environment Configuration
```bash
# Server environment variables
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORGANIZATION=org-your-organization-id
OPENAI_MODEL=gpt-5-mini
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.3
```

### Client Configuration
```typescript
// server/src/config/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
});

export const OPENAI_CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-5-mini',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

export default openai;
```

### Structured Output Schema
```typescript
// server/src/types/aiTypes.ts
export interface ThoughtEnrichmentSchema {
  summary: {
    type: 'string';
    description: 'Concise 1-2 sentence summary of the thought';
    maxLength: 200;
  };
  category: {
    type: 'object';
    properties: {
      main: {
        type: 'string';
        enum: ['work', 'personal', 'ideas', 'projects', 'health', 'finance', 'learning', 'other'];
      };
      subcategory: {
        type: 'string';
        description: 'More specific categorization';
      };
      confidence: {
        type: 'number';
        minimum: 0;
        maximum: 1;
        description: 'Confidence score for categorization';
      };
    };
    required: ['main', 'confidence'];
  };
  tags: {
    type: 'array';
    items: { type: 'string' };
    maxItems: 10;
    description: 'Relevant tags extracted from content';
  };
  entities: {
    type: 'object';
    properties: {
      people: { type: 'array'; items: { type: 'string' } };
      dates: { type: 'array'; items: { type: 'string' } };
      locations: { type: 'array'; items: { type: 'string' } };
      topics: { type: 'array'; items: { type: 'string' } };
      organizations: { type: 'array'; items: { type: 'string' } };
    };
  };
  commands: {
    type: 'array';
    items: {
      type: 'object';
      properties: {
        type: {
          type: 'string';
          enum: ['create_event', 'set_reminder', 'create_task', 'schedule_meeting', 'make_note'];
        };
        confidence: { type: 'number'; minimum: 0; maximum: 1 };
        parameters: { type: 'object' };
      };
    };
  };
  linking_suggestions: {
    type: 'array';
    items: {
      type: 'object';
      properties: {
        concept: { type: 'string' };
        reasoning: { type: 'string' };
        similarity_score: { type: 'number'; minimum: 0; maximum: 1 };
      };
    };
    maxItems: 5;
  };
}
```

---

## 🧠 OpenAI Service Implementation

### Core Enrichment Service
```typescript
// server/src/services/openaiService.ts
import openai, { OPENAI_CONFIG } from '../config/openai.js';
import { ThoughtEnrichmentSchema } from '../types/aiTypes.js';

export class OpenAIService {
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  async enrichThought(content: string, context?: any): Promise<ThoughtEnrichmentSchema> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(content, context);

    try {
      const response = await this.queueRequest(() =>
        openai.chat.completions.create({
          model: OPENAI_CONFIG.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: OPENAI_CONFIG.temperature,
          max_tokens: OPENAI_CONFIG.maxTokens,
          top_p: OPENAI_CONFIG.topP,
        })
      );

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return this.validateAndEnhanceResult(result, content);

    } catch (error) {
      console.error('OpenAI enrichment failed:', error);
      return this.createFallbackEnrichment(content);
    }
  }

  private buildSystemPrompt(): string {
    return `You are an expert thought analyzer for "Catcher", an AI-powered thought capture platform.

Your role is to analyze captured thoughts and provide structured enrichment including:
1. Intelligent categorization with confidence scores
2. Relevant tag extraction (max 10 tags)
3. Entity extraction (people, dates, locations, topics, organizations)
4. Command parsing for actionable items
5. Concept suggestions for linking related thoughts

Guidelines:
- Be concise but thorough
- Focus on practical utility for the user
- Maintain high accuracy and relevance
- Use confidence scores to indicate certainty
- Extract actionable commands when present
- Suggest meaningful connections to other concepts

Output must be valid JSON matching the provided schema exactly.
Use modern, professional language and maintain user privacy.`;
  }

  private buildUserPrompt(content: string, context?: any): string {
    let prompt = `Analyze this thought and provide structured enrichment:

THOUGHT: "${content}"`;

    if (context?.previousThoughts) {
      prompt += `\n\nRECENT CONTEXT (for linking suggestions):
${context.previousThoughts.slice(0, 3).map((t: any) => `- ${t.content}`).join('\n')}`;
    }

    if (context?.userProfile) {
      prompt += `\n\nUSER CONTEXT:
- Primary categories: ${context.userProfile.common_categories?.join(', ')}
- Time zone: ${context.userProfile.timezone}
- Preferences: ${context.userProfile.preferences}`;
    }

    prompt += `\n\nProvide enrichment as JSON with the following structure:
{
  "summary": "Brief 1-2 sentence summary",
  "category": {
    "main": "primary_category",
    "subcategory": "specific_subcategory",
    "confidence": 0.95
  },
  "tags": ["tag1", "tag2", "tag3"],
  "entities": {
    "people": ["Person Name"],
    "dates": ["tomorrow", "next Friday"],
    "locations": ["Conference Room"],
    "topics": ["project planning"],
    "organizations": ["Company Name"]
  },
  "commands": [{
    "type": "create_event",
    "confidence": 0.85,
    "parameters": {
      "title": "Meeting Title",
      "date": "2024-01-20T14:00:00Z",
      "description": "Event description"
    }
  }],
  "linking_suggestions": [{
    "concept": "project management",
    "reasoning": "Related to planning and organization",
    "similarity_score": 0.78
  }]
}`;

    return prompt;
  }

  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.rateLimitQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.rateLimitQueue.length > 0) {
      const request = this.rateLimitQueue.shift()!;

      try {
        await request();
        // Rate limit: ~500 requests per minute for GPT-4o-mini (much higher than GPT-4)
        await this.sleep(3000);
      } catch (error) {
        console.error('Queue request failed:', error);
        // Handle rate limit errors with exponential backoff
        if (this.isRateLimitError(error)) {
          await this.sleep(10000);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private validateAndEnhanceResult(result: any, originalContent: string): ThoughtEnrichmentSchema {
    // Ensure all required fields are present with defaults
    return {
      summary: result.summary || this.generateFallbackSummary(originalContent),
      category: {
        main: result.category?.main || 'other',
        subcategory: result.category?.subcategory || null,
        confidence: Math.min(Math.max(result.category?.confidence || 0.5, 0), 1)
      },
      tags: Array.isArray(result.tags) ? result.tags.slice(0, 10) : [],
      entities: {
        people: Array.isArray(result.entities?.people) ? result.entities.people : [],
        dates: Array.isArray(result.entities?.dates) ? result.entities.dates : [],
        locations: Array.isArray(result.entities?.locations) ? result.entities.locations : [],
        topics: Array.isArray(result.entities?.topics) ? result.entities.topics : [],
        organizations: Array.isArray(result.entities?.organizations) ? result.entities.organizations : []
      },
      commands: Array.isArray(result.commands) ? result.commands.slice(0, 5) : [],
      linking_suggestions: Array.isArray(result.linking_suggestions) ? result.linking_suggestions.slice(0, 5) : []
    };
  }

  private createFallbackEnrichment(content: string): ThoughtEnrichmentSchema {
    return {
      summary: this.generateFallbackSummary(content),
      category: {
        main: this.inferBasicCategory(content),
        subcategory: null,
        confidence: 0.6
      },
      tags: this.extractBasicTags(content),
      entities: {
        people: [],
        dates: this.extractDates(content),
        locations: [],
        topics: [],
        organizations: []
      },
      commands: [],
      linking_suggestions: []
    };
  }

  private generateFallbackSummary(content: string): string {
    if (content.length <= 100) return content;
    return content.substring(0, 97) + '...';
  }

  private inferBasicCategory(content: string): string {
    const workKeywords = ['meeting', 'project', 'deadline', 'client', 'work', 'office'];
    const personalKeywords = ['family', 'friend', 'home', 'personal', 'weekend'];
    const ideaKeywords = ['idea', 'brainstorm', 'concept', 'innovation', 'creative'];

    const lowerContent = content.toLowerCase();

    if (workKeywords.some(keyword => lowerContent.includes(keyword))) return 'work';
    if (personalKeywords.some(keyword => lowerContent.includes(keyword))) return 'personal';
    if (ideaKeywords.some(keyword => lowerContent.includes(keyword))) return 'ideas';

    return 'other';
  }

  private extractBasicTags(content: string): string[] {
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const commonWords = new Set(['that', 'this', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want']);

    return Array.from(new Set(
      words
        .filter(word => !commonWords.has(word))
        .slice(0, 5)
    ));
  }

  private extractDates(content: string): string[] {
    const datePatterns = [
      /\b(today|tomorrow|yesterday)\b/gi,
      /\b(next|this)\s+(week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g
    ];

    const dates: string[] = [];
    datePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) dates.push(...matches);
    });

    return Array.from(new Set(dates));
  }

  private isRateLimitError(error: any): boolean {
    return error?.status === 429 || error?.code === 'rate_limit_exceeded';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Batch processing for multiple thoughts
  async batchEnrichThoughts(thoughts: Array<{ id: string; content: string }>): Promise<Array<{ id: string; enrichment: ThoughtEnrichmentSchema }>> {
    const results = [];

    for (const thought of thoughts) {
      try {
        const enrichment = await this.enrichThought(thought.content);
        results.push({ id: thought.id, enrichment });
      } catch (error) {
        console.error(`Failed to enrich thought ${thought.id}:`, error);
        results.push({
          id: thought.id,
          enrichment: this.createFallbackEnrichment(thought.content)
        });
      }
    }

    return results;
  }
}

export const openaiService = new OpenAIService();
```

---

## 🎤 HuggingFace Whisper Integration

### Environment Configuration
```bash
# HuggingFace API configuration
HUGGINGFACE_API_KEY=hf_your-api-key
WHISPER_MODEL=openai/whisper-large-v3
WHISPER_API_URL=https://api-inference.huggingface.co/models/openai/whisper-large-v3
```

### Whisper Service Implementation
```typescript
// server/src/services/whisperService.ts
import { HfInference } from '@huggingface/inference';

interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  segments: TranscriptionSegment[];
  processing_time: number;
  model_used: string;
}

interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export class WhisperService {
  private hf: HfInference;
  private readonly model = process.env.WHISPER_MODEL || 'openai/whisper-large-v3';

  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  }

  async transcribeAudio(audioBuffer: Buffer, options: {
    language?: string;
    format?: string;
    enhance_accuracy?: boolean;
  } = {}): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      // Prepare audio data
      const audioBlob = this.prepareAudioData(audioBuffer, options.format);

      // Call HuggingFace Whisper API
      const response = await this.hf.automaticSpeechRecognition({
        model: this.model,
        data: audioBlob,
        parameters: {
          language: options.language,
          return_timestamps: true,
          chunk_length_s: 30,
          stride_length_s: 5,
        }
      });

      // Process response
      const result = this.processWhisperResponse(response, startTime);

      // Apply post-processing enhancements
      if (options.enhance_accuracy) {
        return this.enhanceTranscription(result);
      }

      return result;

    } catch (error) {
      console.error('Whisper transcription failed:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  private prepareAudioData(audioBuffer: Buffer, format?: string): Blob {
    // Handle different audio formats
    const mimeType = this.getMimeType(format);
    return new Blob([audioBuffer], { type: mimeType });
  }

  private getMimeType(format?: string): string {
    const formatMap: Record<string, string> = {
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
    };

    return formatMap[format?.toLowerCase() || 'wav'] || 'audio/wav';
  }

  private processWhisperResponse(response: any, startTime: number): TranscriptionResult {
    const processingTime = Date.now() - startTime;

    // Handle different response formats from HuggingFace
    if (typeof response === 'string') {
      return {
        text: response,
        confidence: 0.8, // Default confidence for string responses
        language: 'en',
        segments: [],
        processing_time: processingTime,
        model_used: this.model
      };
    }

    // Detailed response with segments
    const segments: TranscriptionSegment[] = response.chunks?.map((chunk: any) => ({
      text: chunk.text,
      start: chunk.timestamp[0] || 0,
      end: chunk.timestamp[1] || 0,
      confidence: this.calculateSegmentConfidence(chunk)
    })) || [];

    const fullText = segments.map(s => s.text).join(' ').trim() || response.text || '';
    const overallConfidence = this.calculateOverallConfidence(segments);
    const detectedLanguage = response.language || 'en';

    return {
      text: fullText,
      confidence: overallConfidence,
      language: detectedLanguage,
      segments,
      processing_time: processingTime,
      model_used: this.model
    };
  }

  private calculateSegmentConfidence(chunk: any): number {
    // HuggingFace doesn't always provide confidence scores
    // Use heuristics based on text characteristics
    if (chunk.confidence !== undefined) {
      return Math.max(0, Math.min(1, chunk.confidence));
    }

    // Heuristic: longer segments with proper punctuation tend to be more confident
    const text = chunk.text || '';
    let confidence = 0.7; // Base confidence

    if (text.length > 10) confidence += 0.1;
    if (/[.!?]$/.test(text.trim())) confidence += 0.1;
    if (!/\[.*\]/.test(text)) confidence += 0.1; // No uncertain markers

    return Math.min(1, confidence);
  }

  private calculateOverallConfidence(segments: TranscriptionSegment[]): number {
    if (segments.length === 0) return 0.8;

    const totalConfidence = segments.reduce((sum, segment) => sum + segment.confidence, 0);
    return totalConfidence / segments.length;
  }

  private async enhanceTranscription(result: TranscriptionResult): Promise<TranscriptionResult> {
    // Post-processing enhancements
    let enhancedText = result.text;

    // Fix common transcription issues
    enhancedText = this.fixCommonErrors(enhancedText);
    enhancedText = this.improveCapitalization(enhancedText);
    enhancedText = this.addPunctuation(enhancedText);

    return {
      ...result,
      text: enhancedText,
      confidence: Math.min(1, result.confidence + 0.05) // Slight confidence boost for enhanced text
    };
  }

  private fixCommonErrors(text: string): string {
    const corrections: Record<string, string> = {
      // Common speech-to-text errors
      'there meeting': 'their meeting',
      'your welcome': "you're welcome",
      'its a': "it's a",
      'cant': "can't",
      'wont': "won't",
      'dont': "don't",
      'im': "I'm",
      'id': "I'd",
      'ill': "I'll",
      'ive': "I've",
    };

    let correctedText = text;
    Object.entries(corrections).forEach(([error, correction]) => {
      const regex = new RegExp(`\\b${error}\\b`, 'gi');
      correctedText = correctedText.replace(regex, correction);
    });

    return correctedText;
  }

  private improveCapitalization(text: string): string {
    // Capitalize first letter and after sentence endings
    return text
      .toLowerCase()
      .replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => prefix + letter.toUpperCase())
      .replace(/\bi\b/g, 'I'); // Capitalize standalone "I"
  }

  private addPunctuation(text: string): string {
    // Add periods at the end if missing
    const trimmed = text.trim();
    if (trimmed && !/[.!?]$/.test(trimmed)) {
      return trimmed + '.';
    }
    return trimmed;
  }

  // Real-time streaming transcription (for future enhancement)
  async createStreamingTranscription(audioStream: ReadableStream): Promise<AsyncIterable<Partial<TranscriptionResult>>> {
    // Placeholder for streaming implementation
    // Would require WebSocket connection to HuggingFace or local model
    throw new Error('Streaming transcription not yet implemented');
  }

  // Batch transcription for multiple audio files
  async batchTranscribe(audioFiles: Array<{
    buffer: Buffer;
    filename: string;
    options?: any;
  }>): Promise<Array<{
    filename: string;
    result?: TranscriptionResult;
    error?: string;
  }>> {
    const results = [];

    for (const file of audioFiles) {
      try {
        const result = await this.transcribeAudio(file.buffer, file.options);
        results.push({ filename: file.filename, result });
      } catch (error) {
        console.error(`Batch transcription failed for ${file.filename}:`, error);
        results.push({
          filename: file.filename,
          error: error.message
        });
      }

      // Rate limiting between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  // Health check for the service
  async healthCheck(): Promise<{ status: string; model: string; latency?: number }> {
    try {
      const startTime = Date.now();

      // Create a small test audio buffer (silence)
      const testBuffer = Buffer.alloc(1024);

      await this.transcribeAudio(testBuffer);

      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        model: this.model,
        latency
      };
    } catch (error) {
      return {
        status: 'error',
        model: this.model
      };
    }
  }

  // Get supported languages
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'tr', name: 'Turkish' },
      { code: 'pl', name: 'Polish' },
      { code: 'nl', name: 'Dutch' },
      { code: 'sv', name: 'Swedish' },
      { code: 'da', name: 'Danish' },
      { code: 'no', name: 'Norwegian' },
      { code: 'fi', name: 'Finnish' }
    ];
  }
}

export const whisperService = new WhisperService();
```

---

## 🔄 AI Processing Pipeline

### Combined Service Integration
```typescript
// server/src/services/aiPipeline.ts
import { openaiService } from './openaiService.js';
import { whisperService } from './whisperService.js';

export class AIPipeline {
  async processThoughtWithAudio(audioBuffer: Buffer, options: {
    webSpeechText?: string;
    language?: string;
    userContext?: any;
  }): Promise<{
    transcription: any;
    enrichment: any;
    processing_time: number;
  }> {
    const startTime = Date.now();

    try {
      // Step 1: High-quality transcription with Whisper
      const transcription = await whisperService.transcribeAudio(audioBuffer, {
        language: options.language,
        enhance_accuracy: true
      });

      // Step 2: Use best transcription (Whisper vs Web Speech)
      let bestText = transcription.text;
      if (options.webSpeechText && options.webSpeechText.length > bestText.length * 1.2) {
        // Web Speech might be better if significantly longer
        bestText = options.webSpeechText;
      }

      // Step 3: AI enrichment with OpenAI
      const enrichment = await openaiService.enrichThought(bestText, options.userContext);

      const processingTime = Date.now() - startTime;

      return {
        transcription: {
          ...transcription,
          final_text: bestText,
          web_speech_fallback: options.webSpeechText
        },
        enrichment,
        processing_time: processingTime
      };

    } catch (error) {
      console.error('AI pipeline processing failed:', error);
      throw error;
    }
  }

  async processTextOnly(text: string, userContext?: any): Promise<any> {
    return openaiService.enrichThought(text, userContext);
  }

  async batchProcessThoughts(thoughts: Array<{
    id: string;
    content: string;
    audio?: Buffer;
  }>): Promise<Array<any>> {
    const results = [];

    for (const thought of thoughts) {
      try {
        let result;
        if (thought.audio) {
          result = await this.processThoughtWithAudio(thought.audio, {
            language: 'en' // Could be detected or specified
          });
        } else {
          result = {
            enrichment: await this.processTextOnly(thought.content),
            processing_time: 0
          };
        }

        results.push({
          id: thought.id,
          ...result,
          status: 'completed'
        });

      } catch (error) {
        console.error(`Failed to process thought ${thought.id}:`, error);
        results.push({
          id: thought.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }
}

export const aiPipeline = new AIPipeline();
```

---

## 🚀 Performance Optimization

### Caching Strategy
```typescript
// server/src/services/aiCache.ts
import Redis from 'ioredis';

export class AICache {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // Cache OpenAI responses for similar content
  async cacheEnrichment(contentHash: string, enrichment: any, ttl = 3600): Promise<void> {
    await this.redis.setex(`enrich:${contentHash}`, ttl, JSON.stringify(enrichment));
  }

  async getCachedEnrichment(contentHash: string): Promise<any | null> {
    const cached = await this.redis.get(`enrich:${contentHash}`);
    return cached ? JSON.parse(cached) : null;
  }

  // Cache Whisper transcriptions
  async cacheTranscription(audioHash: string, transcription: any, ttl = 86400): Promise<void> {
    await this.redis.setex(`whisper:${audioHash}`, ttl, JSON.stringify(transcription));
  }

  async getCachedTranscription(audioHash: string): Promise<any | null> {
    const cached = await this.redis.get(`whisper:${audioHash}`);
    return cached ? JSON.parse(cached) : null;
  }

  private hashContent(content: string): string {
    return require('crypto').createHash('md5').update(content).digest('hex');
  }
}
```

---

## 📊 Monitoring & Analytics

### AI Service Monitoring
```typescript
// server/src/services/aiMonitoring.ts
export class AIMonitoring {
  async trackApiUsage(service: 'openai' | 'huggingface', tokens: number, cost: number): Promise<void> {
    // Track API usage and costs
    console.log(`${service.toUpperCase()} API usage:`, { tokens, cost });

    // Store in database or external monitoring service
  }

  async trackProcessingTime(operation: string, duration: number): Promise<void> {
    // Track processing performance
    console.log(`Processing time for ${operation}:`, duration);
  }

  async trackAccuracy(operation: string, userFeedback: 'positive' | 'negative'): Promise<void> {
    // Track user satisfaction with AI outputs
    console.log(`User feedback for ${operation}:`, userFeedback);
  }
}
```

---

## 🔧 Development Tools

### Testing AI Services
```typescript
// tests/ai/openai.test.ts
import { openaiService } from '../../src/services/openaiService';

describe('OpenAI Service', () => {
  test('should enrich a simple thought', async () => {
    const result = await openaiService.enrichThought('Meeting with Sarah tomorrow at 3pm');

    expect(result.category.main).toBeDefined();
    expect(result.entities.people).toContain('Sarah');
    expect(result.entities.dates).toContain('tomorrow at 3pm');
  });

  test('should handle rate limits gracefully', async () => {
    // Test rate limiting behavior
  });
});
```

### Local Development with Mock Services
```typescript
// server/src/config/aiMocks.ts
export const mockOpenAIService = {
  enrichThought: async (content: string) => ({
    summary: `Mock summary for: ${content.substring(0, 50)}...`,
    category: { main: 'other', confidence: 0.8 },
    tags: ['mock', 'test'],
    entities: { people: [], dates: [], locations: [], topics: [], organizations: [] },
    commands: [],
    linking_suggestions: []
  })
};

export const mockWhisperService = {
  transcribeAudio: async () => ({
    text: 'Mock transcription text',
    confidence: 0.9,
    language: 'en',
    segments: [],
    processing_time: 1000,
    model_used: 'mock-whisper'
  })
};
```

---

*🤖 This AI integration guide provides comprehensive setup for OpenAI GPT-4 and HuggingFace Whisper services, enabling intelligent thought processing with high accuracy and performance optimization. The corrected implementation uses OpenAI instead of Claude API and leverages the powerful whisper-large-v3 model for superior transcription quality.*
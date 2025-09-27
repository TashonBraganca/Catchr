import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as chrono from 'chrono-node';
import { AI_CONFIG, DEFAULT_CATEGORIES, ERROR_CODES } from '@cathcr/shared';
export class AIService {
    openai;
    supabase;
    isConfigured;
    constructor() {
        this.isConfigured = false;
        this.openai = null;
        this.supabase = null;
        try {
            // Initialize services with environment variables
            // Only initialize if API keys are provided
            if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-development-placeholder') {
                this.openai = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY,
                    organization: process.env.OPENAI_ORGANIZATION,
                });
                this.isConfigured = true;
                console.log('✅ OpenAI service initialized');
            }
            else {
                console.warn('⚠️ OpenAI API key not configured, using fallback methods only');
            }
            if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            }
            else {
                console.warn('⚠️ Supabase not configured, database features disabled');
            }
        }
        catch (error) {
            console.error('❌ AI Service initialization failed:', error);
            this.isConfigured = false;
        }
    }
    async categorizeThought(request) {
        try {
            const { thought, userPreferences, previousThoughts } = request;
            // If OpenAI is not configured, use fallback immediately
            if (!this.isConfigured || !this.openai) {
                console.log('Using fallback categorization (OpenAI not configured)');
                return this.fallbackCategorization(thought);
            }
            // Build context from user preferences and previous thoughts
            const context = this.buildCategorizationContext(userPreferences, previousThoughts);
            // Create the prompt for OpenAI
            const prompt = this.buildCategorizationPrompt(thought, context);
            // Call OpenAI API
            const completion = await this.openai.chat.completions.create({
                model: AI_CONFIG.OPENAI.MODEL,
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPrompt(),
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: AI_CONFIG.OPENAI.MAX_TOKENS,
                temperature: AI_CONFIG.OPENAI.TEMPERATURE,
                response_format: { type: 'json_object' },
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI');
            }
            const aiResult = JSON.parse(response);
            // Process and validate the AI response
            return this.processAIResponse(aiResult, thought);
        }
        catch (error) {
            console.error('AI Categorization failed:', error);
            // Fallback to rule-based categorization
            return this.fallbackCategorization(request.thought);
        }
    }
    async extractReminders(thought) {
        try {
            // Use chrono-node to parse natural language dates
            const parsedDates = chrono.parse(thought);
            if (parsedDates.length === 0) {
                return null;
            }
            const firstDate = parsedDates[0];
            const reminderDate = firstDate.start.date();
            // If OpenAI is not configured, return basic reminder info
            if (!this.isConfigured || !this.openai) {
                return {
                    date: reminderDate,
                    type: 'once',
                    context: thought,
                };
            }
            // Use OpenAI to extract additional context
            const prompt = `
        Analyze this text for reminder information: "${thought}"
        
        Extract:
        - Type of reminder (once, daily, weekly, monthly)
        - Person mentioned (if any)
        - Amount/number mentioned (if any)
        - Context/what to be reminded about
        
        Return JSON format:
        {
          "type": "once|daily|weekly|monthly",
          "person": "person name or null",
          "amount": number or null,
          "context": "brief description"
        }
      `;
            const completion = await this.openai.chat.completions.create({
                model: AI_CONFIG.OPENAI.MODEL,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.3,
                response_format: { type: 'json_object' },
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI for reminder extraction');
            }
            const reminderInfo = JSON.parse(response);
            return {
                date: reminderDate,
                type: reminderInfo.type || 'once',
                context: reminderInfo.context || thought,
                person: reminderInfo.person || undefined,
                amount: reminderInfo.amount || undefined,
            };
        }
        catch (error) {
            console.error('Reminder extraction failed:', error);
            return null;
        }
    }
    async transcribeAudio(audioBuffer, filename = 'audio.webm') {
        try {
            // If OpenAI is not configured, return empty transcription
            if (!this.isConfigured || !this.openai) {
                console.log('Audio transcription not available (OpenAI not configured)');
                return { text: '', confidence: 0 };
            }
            // Import toFile for Node.js compatibility
            const { toFile } = await import('openai/uploads');
            // Create file from buffer for OpenAI
            const file = await toFile(audioBuffer, filename);
            const transcription = await this.openai.audio.transcriptions.create({
                file: file,
                model: AI_CONFIG.TRANSCRIPTION.WHISPER_MODEL,
                language: AI_CONFIG.TRANSCRIPTION.LANGUAGE,
                response_format: 'verbose_json',
            });
            return {
                text: transcription.text || '',
                confidence: 0.9, // Whisper doesn't provide confidence, use default high value
            };
        }
        catch (error) {
            console.error('Audio transcription failed:', error);
            throw new Error(ERROR_CODES.TRANSCRIPTION_FAILED);
        }
    }
    async transcribeAudioFromFile(filePath) {
        try {
            const fs = await import('fs');
            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: AI_CONFIG.TRANSCRIPTION.WHISPER_MODEL,
                language: AI_CONFIG.TRANSCRIPTION.LANGUAGE,
                response_format: 'verbose_json',
            });
            return {
                text: transcription.text || '',
                confidence: 0.9, // Whisper doesn't provide confidence, use default high value
            };
        }
        catch (error) {
            console.error('Audio transcription from file failed:', error);
            throw new Error(ERROR_CODES.TRANSCRIPTION_FAILED);
        }
    }
    async suggestExpansions(thought, category) {
        try {
            const prompt = `
        Based on this thought: "${thought}"
        Category: ${category.main}${category.subcategory ? ` > ${category.subcategory}` : ''}
        
        Suggest 3 expansion prompts that would help the user develop this thought further.
        Make them actionable and specific to the category.
        
        Return as JSON array of strings.
        Example: ["What specific steps could you take?", "How does this relate to your goals?", "What resources would you need?"]
      `;
            const completion = await this.openai.chat.completions.create({
                model: AI_CONFIG.OPENAI.MODEL,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 300,
                temperature: 0.8,
                response_format: { type: 'json_object' },
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                return [];
            }
            const result = JSON.parse(response);
            return Array.isArray(result.suggestions) ? result.suggestions : [];
        }
        catch (error) {
            console.error('Expansion suggestions failed:', error);
            return [];
        }
    }
    getSystemPrompt() {
        return `You are an AI assistant specialized in categorizing and analyzing personal thoughts for a thought-capture application called Cathcr.

Your task is to categorize thoughts into meaningful categories and extract relevant information.

Available categories: ${DEFAULT_CATEGORIES.map(c => c.main).join(', ')}

Always respond with valid JSON in this format:
{
  "category": {
    "main": "category_name",
    "subcategory": "optional_subcategory",
    "color": "#hex_color",
    "icon": "emoji"
  },
  "tags": ["tag1", "tag2"],
  "confidence": 0.85,
  "entities": [
    {
      "type": "person|date|amount|location|task",
      "value": "extracted_value",
      "confidence": 0.9
    }
  ],
  "isReminder": true,
  "reminderInfo": {
    "type": "once|daily|weekly|monthly",
    "urgency": "high|medium|low"
  }
}

Be concise but thorough in your analysis.`;
    }
    buildCategorizationContext(userPreferences, previousThoughts) {
        let context = `User preferences:\n`;
        context += `- Default categories: ${userPreferences.defaultCategories.join(', ')}\n`;
        context += `- AI auto-categorization: ${userPreferences.aiSettings.autoCategory}\n`;
        context += `- Confidence threshold: ${userPreferences.aiSettings.confidenceThreshold}\n`;
        if (previousThoughts && previousThoughts.length > 0) {
            context += `\nRecent thoughts context:\n`;
            previousThoughts.slice(0, 3).forEach((thought, index) => {
                context += `${index + 1}. "${thought.content.slice(0, 100)}..." [${thought.category?.main}]\n`;
            });
        }
        return context;
    }
    buildCategorizationPrompt(thought, context) {
        return `${context}

Please categorize and analyze this thought:
"${thought}"

Consider the user's preferences and recent thought patterns. Provide detailed categorization with high confidence scores.`;
    }
    async processAIResponse(aiResult, originalThought) {
        // Validate and clean the AI response
        const category = {
            main: aiResult.category?.main || 'notes',
            subcategory: aiResult.category?.subcategory || undefined,
            color: aiResult.category?.color || '#6B7280',
            icon: aiResult.category?.icon || '📝',
        };
        const tags = Array.isArray(aiResult.tags) ? aiResult.tags.slice(0, 10) : [];
        const confidence = Math.min(Math.max(aiResult.confidence || 0.5, 0), 1);
        const entities = (aiResult.entities || []).map((entity) => ({
            type: entity.type || 'task',
            value: entity.value || '',
            confidence: Math.min(Math.max(entity.confidence || 0.5, 0), 1),
            metadata: entity.metadata || {},
        }));
        let reminder;
        if (aiResult.isReminder && aiResult.reminderInfo) {
            const extractedReminder = await this.extractReminders(originalThought);
            if (extractedReminder) {
                reminder = extractedReminder;
            }
        }
        const suggestions = {
            alternativeCategories: aiResult.alternativeCategories || [],
            extractedEntities: entities,
            relatedThoughts: aiResult.relatedThoughts || [],
            expansionPrompts: await this.suggestExpansions(originalThought, category),
        };
        return {
            category,
            tags,
            confidence,
            reminder,
            entities,
            suggestions,
        };
    }
    fallbackCategorization(thought) {
        // Simple rule-based categorization as fallback
        const lowerThought = thought.toLowerCase();
        let category = { main: 'notes', color: '#6B7280', icon: '📝' };
        const tags = [];
        // Simple keyword matching
        if (lowerThought.includes('remind') || lowerThought.includes('remember') || lowerThought.includes('todo')) {
            category = { main: 'reminders', color: '#EF4444', icon: '⏰' };
            tags.push('reminder');
        }
        else if (lowerThought.includes('idea') || lowerThought.includes('think') || lowerThought.includes('maybe')) {
            category = { main: 'ideas', color: '#3B82F6', icon: '💡' };
            tags.push('idea');
        }
        else if (lowerThought.includes('project') || lowerThought.includes('work') || lowerThought.includes('build')) {
            category = { main: 'projects', color: '#F59E0B', icon: '🚀' };
            tags.push('project');
        }
        return {
            category,
            tags,
            confidence: 0.5, // Low confidence for fallback
            entities: [],
            suggestions: {
                alternativeCategories: [],
                extractedEntities: [],
                relatedThoughts: [],
                expansionPrompts: [],
            },
        };
    }
    async batchProcessThoughts(thoughtIds, userId) {
        try {
            // Process thoughts in batches to avoid rate limits
            const batchSize = AI_CONFIG.CATEGORIZATION.BATCH_SIZE;
            for (let i = 0; i < thoughtIds.length; i += batchSize) {
                const batch = thoughtIds.slice(i, i + batchSize);
                await Promise.all(batch.map(async (thoughtId) => {
                    try {
                        // Get thought from database
                        const { data: thought } = await this.supabase
                            .from('thoughts')
                            .select('*')
                            .eq('id', thoughtId)
                            .eq('user_id', userId)
                            .single();
                        if (!thought)
                            return;
                        // Get user preferences
                        const { data: profile } = await this.supabase
                            .from('profiles')
                            .select('preferences')
                            .eq('id', userId)
                            .single();
                        // Categorize the thought
                        const result = await this.categorizeThought({
                            thought: thought.content,
                            userPreferences: profile?.preferences || {},
                        });
                        // Update the thought with AI results
                        await this.supabase
                            .from('thoughts')
                            .update({
                            category: result.category,
                            tags: result.tags,
                            ai_confidence: result.confidence,
                            ai_suggestions: result.suggestions,
                            is_processed: true,
                            processed_by_ai: new Date().toISOString(),
                            reminder_date: result.reminder?.date?.toISOString(),
                        })
                            .eq('id', thoughtId);
                        // Create notification if it's a reminder
                        if (result.reminder) {
                            await this.supabase.from('notifications').insert({
                                user_id: userId,
                                type: 'reminder',
                                title: 'Reminder Set',
                                message: result.reminder.context,
                                thought_id: thoughtId,
                                scheduled_for: result.reminder.date.toISOString(),
                            });
                        }
                    }
                    catch (error) {
                        console.error(`Failed to process thought ${thoughtId}:`, error);
                    }
                }));
                // Add delay between batches to respect rate limits
                if (i + batchSize < thoughtIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        catch (error) {
            console.error('Batch processing failed:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=aiService.js.map
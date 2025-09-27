import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
export class UltrathinkAI {
    openai;
    supabase;
    isConfigured;
    constructor() {
        this.isConfigured = false;
        try {
            // Initialize OpenAI with GPT-5 Mini
            if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-development-placeholder') {
                this.openai = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY,
                    organization: process.env.OPENAI_ORGANIZATION,
                });
                this.isConfigured = true;
            }
            // Initialize Supabase for user patterns
            if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            }
        }
        catch (error) {
            console.error('Failed to initialize UltrathinkAI:', error);
        }
    }
    async categorizeThought(content, userId, context) {
        if (!this.isConfigured || !this.openai) {
            return this.generateFallbackCategorization(content);
        }
        try {
            // Get user's thinking patterns for personalization
            const userPatterns = await this.getUserThinkingPatterns(userId);
            // Build the perfect categorization prompt
            const systemPrompt = this.buildUltrathinkPrompt(userPatterns, context);
            const response = await this.openai.chat.completions.create({
                model: 'gpt-5-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: content }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1, // Low temperature for consistency
                max_tokens: 1000,
                top_p: 0.9
            });
            const result = JSON.parse(response.choices[0].message.content || '{}');
            // Validate and enhance the result
            const categorization = this.validateAndEnhance(result, content);
            // Learn from this categorization for future improvements
            await this.updateUserPatterns(userId, content, categorization);
            return categorization;
        }
        catch (error) {
            console.error('GPT-5 Mini categorization failed:', error);
            return this.generateFallbackCategorization(content);
        }
    }
    buildUltrathinkPrompt(userPatterns, context) {
        return `You are the CATHCR ULTRATHINK BRAIN - the world's most accurate thought categorization AI.

PERFECT CATEGORIZATION SYSTEM:

PRIMARY FOLDERS (choose exactly one):
- Tasks: Actionable items, todos, deadlines, things to do
- Ideas: Creative thoughts, concepts, inspiration, innovations
- Reminders: Time-based items, appointments, follow-ups, things to remember
- Notes: Information, observations, documentation, references
- Meetings: Meeting notes, discussions, decisions, team interactions
- Learning: Education, tutorials, study notes, research, knowledge
- Personal: Private thoughts, family matters, non-work items

SUBFOLDER CREATION RULES:
- Create intelligent subfolders based on content (max 2 levels deep)
- Examples: "Tasks/Work/Project Alpha", "Ideas/Technology/AI Tools", "Learning/Programming/React"
- Use user's project names and topics when possible

PRIORITY ASSIGNMENT:
- urgent: Critical, time-sensitive, immediate action required
- high: Important, should be done soon, significant impact
- medium: Normal priority, standard workflow
- low: Nice to have, can be delayed, low impact

TAG GENERATION:
- Extract 3-5 relevant keywords/tags
- Include project names, people, tools, topics
- Use user's vocabulary and preferred terms
- Make tags searchable and meaningful

ACTION ITEMS EXTRACTION:
- Identify specific actionable tasks within the thought
- Format as clear, concise action statements
- Include deadlines/timelines if mentioned

REMINDER EXTRACTION:
- Parse natural language dates and times
- Identify follow-up actions and deadlines
- Create reminder descriptions with context

ENTITY EXTRACTION:
- People: Names, roles, contacts mentioned
- Places: Locations, addresses, venues
- Dates: Specific dates, deadlines, timeframes
- Topics: Subject areas, projects, themes

CONFIDENCE SCORING:
- Only return confidence >0.9 for auto-categorization
- Lower confidence suggests user confirmation needed
- Base confidence on clarity and match to patterns

USER PERSONALIZATION:
${this.formatUserPatterns(userPatterns)}

CONTEXT AWARENESS:
${context ? this.formatContext(context) : 'No additional context provided'}

RETURN JSON FORMAT:
{
  "category": "Tasks|Ideas|Reminders|Notes|Meetings|Learning|Personal",
  "folder": "Primary Folder Name",
  "subFolder": "Optional Subfolder",
  "tags": ["tag1", "tag2", "tag3"],
  "priority": "urgent|high|medium|low",
  "actionItems": ["action 1", "action 2"],
  "reminders": ["reminder 1 with timing"],
  "confidence": 0.95,
  "suggestedConnections": ["related topic 1", "related topic 2"],
  "entities": {
    "people": ["person1", "person2"],
    "places": ["location1", "location2"],
    "dates": ["date1", "date2"],
    "topics": ["topic1", "topic2"]
  }
}

EXAMPLES:

Input: "Call dentist tomorrow to schedule cleaning"
Output: {
  "category": "Tasks",
  "folder": "Tasks",
  "subFolder": "Health",
  "tags": ["dentist", "health", "appointment"],
  "priority": "high",
  "actionItems": ["Call dentist to schedule cleaning"],
  "reminders": ["Call dentist tomorrow"],
  "confidence": 0.98,
  "suggestedConnections": ["health appointments", "dental care"],
  "entities": {
    "people": ["dentist"],
    "places": [],
    "dates": ["tomorrow"],
    "topics": ["dental", "health"]
  }
}

Input: "App idea: voice notes with AI transcription like Whisper"
Output: {
  "category": "Ideas",
  "folder": "Ideas",
  "subFolder": "Technology",
  "tags": ["app", "ai", "voice", "transcription"],
  "priority": "medium",
  "actionItems": ["Research Whisper API", "Design app mockups"],
  "reminders": [],
  "confidence": 0.96,
  "suggestedConnections": ["AI projects", "mobile development"],
  "entities": {
    "people": [],
    "places": [],
    "dates": [],
    "topics": ["AI", "voice recognition", "mobile apps"]
  }
}

Analyze the user's thought and return perfect categorization:`;
    }
    formatUserPatterns(patterns) {
        return `
LEARNED USER PATTERNS:
- Vocabulary preferences: ${Object.entries(patterns.vocabularyWeights)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word, weight]) => `${word}(${weight})`)
            .join(', ')}
- Category preferences: ${Object.entries(patterns.categoryPreferences)
            .slice(0, 5)
            .map(([key, value]) => `${key}→${value}`)
            .join(', ')}
- Accuracy rate: ${Math.round(patterns.accuracyRate * 100)}%
- Total thoughts processed: ${patterns.totalThoughts}
    `;
    }
    formatContext(context) {
        const parts = [];
        if (context.timeOfDay)
            parts.push(`Time: ${context.timeOfDay}`);
        if (context.location)
            parts.push(`Location: ${context.location}`);
        if (context.browserContext)
            parts.push(`Browser: ${context.browserContext}`);
        if (context.recentThoughts?.length) {
            parts.push(`Recent thoughts: ${context.recentThoughts.slice(0, 3).join(', ')}`);
        }
        return parts.join(' | ');
    }
    validateAndEnhance(result, originalContent) {
        // Validate required fields and provide defaults
        const validCategories = ['Tasks', 'Ideas', 'Reminders', 'Notes', 'Meetings', 'Learning', 'Personal'];
        const validPriorities = ['urgent', 'high', 'medium', 'low'];
        return {
            category: validCategories.includes(result.category) ? result.category : 'Notes',
            folder: result.folder || result.category || 'General',
            subFolder: result.subFolder || undefined,
            tags: Array.isArray(result.tags) ? result.tags.slice(0, 5) : [],
            priority: validPriorities.includes(result.priority) ? result.priority : 'medium',
            actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
            reminders: Array.isArray(result.reminders) ? result.reminders : [],
            confidence: typeof result.confidence === 'number' ? Math.min(result.confidence, 1) : 0.8,
            suggestedConnections: Array.isArray(result.suggestedConnections) ? result.suggestedConnections : [],
            entities: {
                people: result.entities?.people || [],
                places: result.entities?.places || [],
                dates: result.entities?.dates || [],
                topics: result.entities?.topics || []
            }
        };
    }
    generateFallbackCategorization(content) {
        const lowerContent = content.toLowerCase();
        // Enhanced keyword-based categorization
        let category = 'Notes';
        let folder = 'General';
        let subFolder;
        let priority = 'medium';
        // Task detection with enhanced patterns
        if (this.containsTaskKeywords(lowerContent)) {
            category = 'Tasks';
            folder = 'Tasks';
            subFolder = this.detectTaskSubfolder(lowerContent);
        }
        // Idea detection
        if (this.containsIdeaKeywords(lowerContent)) {
            category = 'Ideas';
            folder = 'Ideas';
            subFolder = this.detectIdeaSubfolder(lowerContent);
        }
        // Reminder detection
        if (this.containsReminderKeywords(lowerContent)) {
            category = 'Reminders';
            folder = 'Reminders';
        }
        // Learning detection
        if (this.containsLearningKeywords(lowerContent)) {
            category = 'Learning';
            folder = 'Learning';
            subFolder = this.detectLearningSubfolder(lowerContent);
        }
        // Meeting detection
        if (this.containsMeetingKeywords(lowerContent)) {
            category = 'Meetings';
            folder = 'Meetings';
        }
        // Priority detection
        priority = this.detectPriority(lowerContent);
        // Extract basic tags and entities
        const tags = this.extractBasicTags(content);
        const entities = this.extractBasicEntities(content);
        return {
            category,
            folder,
            subFolder,
            tags,
            priority,
            actionItems: this.extractBasicActionItems(content),
            reminders: this.extractBasicReminders(content),
            confidence: 0.7, // Lower confidence for fallback
            suggestedConnections: [],
            entities
        };
    }
    containsTaskKeywords(content) {
        const taskKeywords = [
            'todo', 'task', 'need to', 'have to', 'must', 'should',
            'remember to', 'don\'t forget', 'action item', 'deadline',
            'due', 'complete', 'finish', 'do', 'call', 'email', 'buy',
            'send', 'create', 'update', 'fix', 'resolve'
        ];
        return taskKeywords.some(keyword => content.includes(keyword));
    }
    containsIdeaKeywords(content) {
        const ideaKeywords = [
            'idea', 'concept', 'what if', 'maybe', 'could', 'might',
            'inspiration', 'thought', 'brainstorm', 'creative',
            'innovation', 'solution', 'approach', 'strategy'
        ];
        return ideaKeywords.some(keyword => content.includes(keyword));
    }
    containsReminderKeywords(content) {
        const reminderKeywords = [
            'remind', 'remember', 'tomorrow', 'next week', 'next month',
            'appointment', 'meeting', 'deadline', 'due date', 'follow up',
            'check back', 'revisit', 'later', 'schedule'
        ];
        return reminderKeywords.some(keyword => content.includes(keyword));
    }
    containsLearningKeywords(content) {
        const learningKeywords = [
            'learn', 'study', 'tutorial', 'course', 'research', 'read',
            'book', 'article', 'documentation', 'guide', 'how to',
            'understand', 'practice', 'skill', 'knowledge'
        ];
        return learningKeywords.some(keyword => content.includes(keyword));
    }
    containsMeetingKeywords(content) {
        const meetingKeywords = [
            'meeting', 'standup', 'call', 'discussion', 'presentation',
            'demo', 'review', 'sync', 'catch up', 'one on one',
            'team', 'client', 'interview'
        ];
        return meetingKeywords.some(keyword => content.includes(keyword));
    }
    detectTaskSubfolder(content) {
        if (content.includes('work') || content.includes('project'))
            return 'Work';
        if (content.includes('personal') || content.includes('home'))
            return 'Personal';
        if (content.includes('health') || content.includes('doctor'))
            return 'Health';
        if (content.includes('shopping') || content.includes('buy'))
            return 'Shopping';
        return undefined;
    }
    detectIdeaSubfolder(content) {
        if (content.includes('app') || content.includes('software') || content.includes('code'))
            return 'Technology';
        if (content.includes('business') || content.includes('startup'))
            return 'Business';
        if (content.includes('creative') || content.includes('design'))
            return 'Creative';
        return undefined;
    }
    detectLearningSubfolder(content) {
        if (content.includes('programming') || content.includes('code') || content.includes('development'))
            return 'Programming';
        if (content.includes('business') || content.includes('management'))
            return 'Business';
        if (content.includes('design') || content.includes('ui') || content.includes('ux'))
            return 'Design';
        return undefined;
    }
    detectPriority(content) {
        if (content.includes('urgent') || content.includes('asap') || content.includes('critical'))
            return 'urgent';
        if (content.includes('important') || content.includes('high priority'))
            return 'high';
        if (content.includes('low priority') || content.includes('when i have time'))
            return 'low';
        return 'medium';
    }
    extractBasicTags(content) {
        const words = content.split(/\s+/).map(w => w.toLowerCase().replace(/[^\w]/g, ''));
        const commonTags = [
            'work', 'personal', 'project', 'meeting', 'call', 'email',
            'buy', 'read', 'write', 'learn', 'study', 'health', 'idea',
            'reminder', 'task', 'important', 'urgent'
        ];
        return commonTags.filter(tag => words.includes(tag)).slice(0, 3);
    }
    extractBasicActionItems(content) {
        const actionVerbs = ['call', 'email', 'buy', 'send', 'create', 'update', 'fix', 'complete'];
        const sentences = content.split(/[.!?]+/);
        const actionItems = [];
        sentences.forEach(sentence => {
            const lowerSentence = sentence.toLowerCase();
            if (actionVerbs.some(verb => lowerSentence.includes(verb))) {
                actionItems.push(sentence.trim());
            }
        });
        return actionItems.slice(0, 3);
    }
    extractBasicReminders(content) {
        const timeWords = ['tomorrow', 'next week', 'next month', 'later', 'soon'];
        const reminders = [];
        timeWords.forEach(timeWord => {
            if (content.toLowerCase().includes(timeWord)) {
                reminders.push(`Follow up ${timeWord}`);
            }
        });
        return reminders.slice(0, 2);
    }
    extractBasicEntities(content) {
        return {
            people: this.extractPeopleEntities(content),
            places: this.extractPlaceEntities(content),
            dates: this.extractDateEntities(content),
            topics: this.extractTopicEntities(content)
        };
    }
    extractPeopleEntities(content) {
        // Simple pattern matching for names (capitalized words)
        const words = content.split(/\s+/);
        const potentialNames = words.filter(word => /^[A-Z][a-z]+$/.test(word) && word.length > 2);
        return [...new Set(potentialNames)].slice(0, 3);
    }
    extractPlaceEntities(content) {
        const placeWords = ['office', 'home', 'store', 'restaurant', 'hospital', 'school', 'library'];
        return placeWords.filter(place => content.toLowerCase().includes(place)).slice(0, 2);
    }
    extractDateEntities(content) {
        const dateWords = ['today', 'tomorrow', 'yesterday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return dateWords.filter(date => content.toLowerCase().includes(date)).slice(0, 2);
    }
    extractTopicEntities(content) {
        const topicWords = ['project', 'meeting', 'presentation', 'report', 'email', 'call', 'task', 'idea'];
        return topicWords.filter(topic => content.toLowerCase().includes(topic)).slice(0, 3);
    }
    async getUserThinkingPatterns(userId) {
        if (!this.supabase) {
            return this.getDefaultThinkingPattern();
        }
        try {
            const { data, error } = await this.supabase
                .from('user_learning_patterns')
                .select('*')
                .eq('user_id', userId)
                .single();
            if (error || !data) {
                return this.getDefaultThinkingPattern();
            }
            return {
                vocabularyWeights: data.vocabulary_weights || {},
                categoryPreferences: data.category_preferences || {},
                timePatterns: data.time_patterns || {},
                contextClues: data.context_patterns || {},
                accuracyRate: data.categorization_accuracy || 0.7,
                totalThoughts: data.total_thoughts || 0
            };
        }
        catch (error) {
            console.error('Failed to load user patterns:', error);
            return this.getDefaultThinkingPattern();
        }
    }
    getDefaultThinkingPattern() {
        return {
            vocabularyWeights: {},
            categoryPreferences: {},
            timePatterns: {},
            contextClues: {},
            accuracyRate: 0.7,
            totalThoughts: 0
        };
    }
    async updateUserPatterns(userId, content, categorization) {
        if (!this.supabase)
            return;
        try {
            // Update vocabulary weights
            const words = content.toLowerCase().split(/\s+/);
            const vocabularyUpdates = {};
            words.forEach(word => {
                const cleanWord = word.replace(/[^\w]/g, '');
                if (cleanWord.length > 2) {
                    vocabularyUpdates[cleanWord] = (vocabularyUpdates[cleanWord] || 0) + 1;
                }
            });
            // Update category preferences
            const categoryUpdates = {};
            categorization.tags.forEach(tag => {
                categoryUpdates[tag] = categorization.category;
            });
            await this.supabase
                .from('user_learning_patterns')
                .upsert({
                user_id: userId,
                vocabulary_weights: vocabularyUpdates,
                category_preferences: categoryUpdates,
                total_thoughts: 1 // This will be incremented properly in production
            });
        }
        catch (error) {
            console.error('Failed to update user patterns:', error);
        }
    }
}
//# sourceMappingURL=ultrathinkAI.js.map
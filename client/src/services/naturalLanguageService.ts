/**
 * Natural Language Processing Service
 *
 * Reddit-inspired feature: Todoist users love "buy milk Monday" → auto-scheduled task
 * Based on research showing "natural language makes adding a new task on the fly quick and easy"
 *
 * Key insight: "telepathic-like task creation" that "sets Todoist apart for speed of capture"
 */

import * as chrono from 'chrono-node';

export interface NLPResult {
  cleanText: string;
  extractedDate?: Date;
  taskType: 'note' | 'task' | 'reminder' | 'idea';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  context: {
    hasTimeContext: boolean;
    hasLocationContext: boolean;
    hasPersonContext: boolean;
    isActionable: boolean;
  };
}

export interface DateExtraction {
  date: Date;
  text: string;
  confidence: number;
}

// Task detection patterns (inspired by Todoist's natural language)
const TASK_PATTERNS = [
  /\b(buy|get|pick up|purchase|order|grab)\b/i,
  /\b(call|email|text|message|contact)\b/i,
  /\b(schedule|book|arrange|plan|set up)\b/i,
  /\b(finish|complete|work on|do|handle)\b/i,
  /\b(remember to|don't forget to|need to|have to)\b/i,
  /\b(remind me to|tell me to)\b/i,
];

// Priority keywords
const PRIORITY_PATTERNS = {
  urgent: /\b(urgent|asap|emergency|critical|now|immediately)\b/i,
  high: /\b(important|priority|high|crucial|vital|key)\b/i,
  medium: /\b(should|ought|medium|normal)\b/i,
  low: /\b(later|eventually|sometime|when possible|low)\b/i,
};

// Context detection patterns
const CONTEXT_PATTERNS = {
  time: /\b(today|tomorrow|next week|this week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening|night|am|pm|\d{1,2}:\d{2}|\d{1,2}(am|pm))\b/i,
  location: /\b(at|in|near|store|office|home|work|school|gym|mall|restaurant)\b/i,
  person: /\b(with|for|tell|ask|call|email|meet)\s+([A-Z][a-z]+)\b/i,
};

/**
 * Extract dates and times from natural language
 * Examples: "buy milk Monday", "call mom tomorrow at 3pm", "meeting next week"
 */
export function extractDates(text: string): DateExtraction[] {
  try {
    const results = chrono.parse(text, new Date(), { forwardDate: true });

    return results.map(result => ({
      date: result.start.date(),
      text: result.text,
      confidence: result.start.isCertain('day') ? 0.9 : 0.7
    }));
  } catch (error) {
    console.warn('Date extraction failed:', error);
    return [];
  }
}

/**
 * Clean text by removing extracted date/time references
 * "buy milk Monday" → "buy milk" + extracted date
 */
export function cleanTextFromDates(text: string, extractions: DateExtraction[]): string {
  let cleaned = text;

  // Remove date phrases but preserve the core action
  extractions.forEach(extraction => {
    cleaned = cleaned.replace(extraction.text, '').trim();
  });

  // Clean up extra spaces
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Detect if text describes a task vs note vs idea
 * Based on action words and structure
 */
export function detectTaskType(text: string): NLPResult['taskType'] {
  const lowerText = text.toLowerCase();

  // Check for explicit task patterns
  if (TASK_PATTERNS.some(pattern => pattern.test(lowerText))) {
    return 'task';
  }

  // Check for reminder patterns
  if (/\b(remind|reminder|don't forget|remember)\b/i.test(lowerText)) {
    return 'reminder';
  }

  // Check for idea patterns
  if (/\b(idea|thought|concept|maybe|what if|consider)\b/i.test(lowerText)) {
    return 'idea';
  }

  // Default to note for general content
  return 'note';
}

/**
 * Extract priority level from text
 */
export function detectPriority(text: string): NLPResult['priority'] {
  const lowerText = text.toLowerCase();

  if (PRIORITY_PATTERNS.urgent.test(lowerText)) return 'urgent';
  if (PRIORITY_PATTERNS.high.test(lowerText)) return 'high';
  if (PRIORITY_PATTERNS.low.test(lowerText)) return 'low';

  return 'medium'; // Default priority
}

/**
 * Extract hashtags and contextual tags
 */
export function extractTags(text: string): string[] {
  const tags: string[] = [];

  // Extract hashtags
  const hashtagMatches = text.match(/#[\w]+/g);
  if (hashtagMatches) {
    tags.push(...hashtagMatches.map(tag => tag.substring(1).toLowerCase()));
  }

  // Auto-generate contextual tags
  const lowerText = text.toLowerCase();

  if (/\b(work|job|office|meeting|project)\b/i.test(lowerText)) {
    tags.push('work');
  }

  if (/\b(home|house|family|personal)\b/i.test(lowerText)) {
    tags.push('personal');
  }

  if (/\b(health|doctor|medicine|workout|gym)\b/i.test(lowerText)) {
    tags.push('health');
  }

  if (/\b(buy|shop|store|purchase|order)\b/i.test(lowerText)) {
    tags.push('shopping');
  }

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Analyze context and actionability
 */
export function analyzeContext(text: string): NLPResult['context'] {
  const lowerText = text.toLowerCase();

  return {
    hasTimeContext: CONTEXT_PATTERNS.time.test(lowerText),
    hasLocationContext: CONTEXT_PATTERNS.location.test(lowerText),
    hasPersonContext: CONTEXT_PATTERNS.person.test(lowerText),
    isActionable: TASK_PATTERNS.some(pattern => pattern.test(lowerText))
  };
}

/**
 * Main NLP processing function
 *
 * Examples:
 * - "buy milk Monday" → { cleanText: "buy milk", extractedDate: [Monday], taskType: "task", ... }
 * - "call mom tomorrow at 3pm" → { cleanText: "call mom", extractedDate: [Tomorrow 3pm], taskType: "task", ... }
 * - "interesting idea about AI" → { cleanText: "interesting idea about AI", taskType: "idea", ... }
 */
export function processNaturalLanguage(text: string): NLPResult {
  // Extract dates first
  const dateExtractions = extractDates(text);
  const primaryDate = dateExtractions.length > 0 ? dateExtractions[0].date : undefined;

  // Clean text by removing date references
  const cleanText = cleanTextFromDates(text, dateExtractions);

  // Analyze the content
  const taskType = detectTaskType(text);
  const priority = detectPriority(text);
  const tags = extractTags(text);
  const context = analyzeContext(text);

  return {
    cleanText,
    extractedDate: primaryDate,
    taskType,
    priority,
    tags,
    context
  };
}

/**
 * Format result for display (Todoist-style preview)
 * "buy milk Monday" → "📝 Task: buy milk (Due: Monday, Dec 4)"
 */
export function formatNLPPreview(result: NLPResult): string {
  const typeEmojis = {
    task: '✅',
    reminder: '⏰',
    idea: '💡',
    note: '📝'
  };

  const priorityText = result.priority === 'urgent' ? '🔥 ' :
                     result.priority === 'high' ? '⭐ ' : '';

  let preview = `${typeEmojis[result.taskType]} ${result.taskType.charAt(0).toUpperCase() + result.taskType.slice(1)}: ${result.cleanText}`;

  if (result.extractedDate) {
    const dateStr = result.extractedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    preview += ` (Due: ${dateStr})`;
  }

  if (result.tags.length > 0) {
    preview += ` #${result.tags.join(' #')}`;
  }

  return priorityText + preview;
}

/**
 * Check if natural language processing is available
 */
export function isNLPAvailable(): boolean {
  try {
    // Test chrono parsing
    chrono.parse('tomorrow');
    return true;
  } catch {
    return false;
  }
}
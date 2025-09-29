/**
 * Natural Language Processing Service
 *
 * Based on Reddit research insights:
 * - Todoist: "Natural language makes adding tasks so quick and easy"
 * - "Type 'buy milk Monday' and the task 'buy milk' will be added with the next Monday set as your due date"
 * - "Tell the computer like you'd tell a human"
 *
 * Features:
 * - Smart date parsing (tomorrow, next Friday, Dec 25)
 * - Task intent recognition (buy, call, email, remind)
 * - Priority detection (urgent, important, ASAP)
 * - Context extraction (location, person, project)
 * - Tag suggestions based on content
 */

import { format, addDays, nextDay, startOfDay, parse, isValid } from 'date-fns';

// Types for parsed results
export interface ParsedTask {
  title: string;
  originalText: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  taskType: 'task' | 'reminder' | 'note' | 'idea';
  tags: string[];
  context?: {
    person?: string;
    location?: string;
    project?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
  };
  confidence: number; // How confident we are in the parsing (0-1)
  isRecurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number; // every 2 days, every 3 weeks
  };
}

export class NaturalLanguageService {
  private readonly dateKeywords = {
    // Relative dates (Reddit insight: natural human language)
    today: () => new Date(),
    tomorrow: () => addDays(new Date(), 1),
    yesterday: () => addDays(new Date(), -1),

    // Next weekdays
    'next monday': () => nextDay(new Date(), 1),
    'next tuesday': () => nextDay(new Date(), 2),
    'next wednesday': () => nextDay(new Date(), 3),
    'next thursday': () => nextDay(new Date(), 4),
    'next friday': () => nextDay(new Date(), 5),
    'next saturday': () => nextDay(new Date(), 6),
    'next sunday': () => nextDay(new Date(), 0),

    // Current week
    monday: () => nextDay(new Date(), 1),
    tuesday: () => nextDay(new Date(), 2),
    wednesday: () => nextDay(new Date(), 3),
    thursday: () => nextDay(new Date(), 4),
    friday: () => nextDay(new Date(), 5),
    saturday: () => nextDay(new Date(), 6),
    sunday: () => nextDay(new Date(), 0),
  };

  private readonly priorityKeywords = {
    urgent: ['urgent', 'asap', 'emergency', 'critical', '!!!', 'now'],
    high: ['important', 'high', 'priority', 'soon', '!!'],
    medium: ['medium', '!'],
    low: ['low', 'eventually', 'someday', 'maybe']
  };

  private readonly taskTypeKeywords = {
    task: ['buy', 'get', 'pick up', 'purchase', 'do', 'complete', 'finish'],
    reminder: ['remind', 'remember', 'don\'t forget', 'note to self'],
    note: ['note', 'idea', 'thought', 'remember that'],
    idea: ['idea', 'brainstorm', 'concept', 'think about']
  };

  private readonly contextKeywords = {
    person: ['call', 'text', 'email', 'meet', 'talk to', 'contact'],
    location: ['at', 'in', '@', 'from', 'to'],
    project: ['for', 'regarding', 'about', 'project', 'work on']
  };

  private readonly recurringKeywords = {
    daily: ['every day', 'daily', 'each day'],
    weekly: ['every week', 'weekly', 'each week', 'every monday', 'every tuesday', 'every wednesday', 'every thursday', 'every friday'],
    monthly: ['every month', 'monthly', 'each month'],
    yearly: ['every year', 'yearly', 'annually']
  };

  /**
   * Main parsing function - converts natural language to structured task
   * Based on Todoist's "telepathic-like" natural language processing
   */
  public parseNaturalLanguage(text: string): ParsedTask {
    const normalizedText = text.toLowerCase().trim();

    // Extract components
    const dueDate = this.extractDueDate(normalizedText);
    const priority = this.extractPriority(normalizedText);
    const taskType = this.extractTaskType(normalizedText);
    const context = this.extractContext(normalizedText);
    const tags = this.generateTags(normalizedText, context);
    const isRecurring = this.extractRecurring(normalizedText);

    // Clean title (remove parsed elements)
    const title = this.cleanTitle(text, dueDate, priority, isRecurring);

    // Calculate confidence based on how many elements we successfully parsed
    const confidence = this.calculateConfidence(normalizedText, {
      dueDate: !!dueDate,
      priority: priority !== 'medium',
      taskType: taskType !== 'task',
      context: Object.keys(context).length > 0,
      recurring: !!isRecurring
    });

    return {
      title,
      originalText: text,
      dueDate,
      priority,
      taskType,
      tags,
      context,
      confidence,
      isRecurring
    };
  }

  /**
   * Extract due date from natural language
   * Handles: "tomorrow", "next Friday", "Dec 25", "in 3 days"
   */
  private extractDueDate(text: string): Date | undefined {
    // Check for relative date keywords
    for (const [keyword, dateFunction] of Object.entries(this.dateKeywords)) {
      if (text.includes(keyword)) {
        return startOfDay(dateFunction());
      }
    }

    // Check for "in X days/weeks" patterns
    const relativePattern = /in (\d+) (day|days|week|weeks)/;
    const relativeMatch = text.match(relativePattern);
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2];
      const multiplier = unit.includes('week') ? 7 : 1;
      return startOfDay(addDays(new Date(), amount * multiplier));
    }

    // Check for specific dates (MM/DD, Dec 25, etc.)
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})/, // MM/DD
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})/i, // Dec 25
      /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i // 25 Dec
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          let dateString = match[0];
          let parsedDate;

          if (pattern === datePatterns[0]) { // MM/DD
            parsedDate = parse(dateString + '/' + new Date().getFullYear(), 'M/d/yyyy', new Date());
          } else {
            parsedDate = parse(dateString + ' ' + new Date().getFullYear(), 'MMM d yyyy', new Date());
          }

          if (isValid(parsedDate)) {
            return startOfDay(parsedDate);
          }
        } catch (error) {
          // Continue to next pattern
        }
      }
    }

    return undefined;
  }

  /**
   * Extract priority level from text
   * Based on urgency keywords and punctuation
   */
  private extractPriority(text: string): 'low' | 'medium' | 'high' | 'urgent' {
    for (const [level, keywords] of Object.entries(this.priorityKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return level as 'low' | 'medium' | 'high' | 'urgent';
        }
      }
    }
    return 'medium'; // Default priority
  }

  /**
   * Extract task type based on action verbs
   */
  private extractTaskType(text: string): 'task' | 'reminder' | 'note' | 'idea' {
    for (const [type, keywords] of Object.entries(this.taskTypeKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return type as 'task' | 'reminder' | 'note' | 'idea';
        }
      }
    }
    return 'task'; // Default to task
  }

  /**
   * Extract context information (person, location, project)
   */
  private extractContext(text: string): ParsedTask['context'] {
    const context: ParsedTask['context'] = {};

    // Extract person names (after "call", "text", "email", etc.)
    const personPattern = /(call|text|email|meet|contact)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
    const personMatch = text.match(personPattern);
    if (personMatch) {
      context.person = personMatch[2];
    }

    // Extract locations (after "at", "in", "@")
    const locationPattern = /(?:at|in|@)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
    const locationMatch = text.match(locationPattern);
    if (locationMatch) {
      context.location = locationMatch[1];
    }

    // Extract time of day
    if (text.includes('morning') || text.includes('am')) {
      context.timeOfDay = 'morning';
    } else if (text.includes('afternoon') || text.includes('pm')) {
      context.timeOfDay = 'afternoon';
    } else if (text.includes('evening') || text.includes('night')) {
      context.timeOfDay = 'evening';
    }

    return context;
  }

  /**
   * Generate relevant tags based on content and context
   */
  private generateTags(text: string, context: ParsedTask['context']): string[] {
    const tags: string[] = [];

    // Add context-based tags
    if (context?.person) tags.push('people');
    if (context?.location) tags.push('location');

    // Content-based tags
    const tagPatterns = {
      shopping: ['buy', 'purchase', 'get', 'pick up', 'store', 'mall'],
      work: ['work', 'office', 'meeting', 'project', 'deadline'],
      health: ['doctor', 'appointment', 'medicine', 'exercise', 'gym'],
      finance: ['pay', 'bill', 'money', 'bank', 'budget', 'tax'],
      home: ['clean', 'fix', 'repair', 'maintenance', 'house'],
      family: ['mom', 'dad', 'family', 'kids', 'parent'],
      travel: ['flight', 'hotel', 'vacation', 'trip', 'travel']
    };

    for (const [tag, keywords] of Object.entries(tagPatterns)) {
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword)) {
          tags.push(tag);
          break;
        }
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract recurring information
   */
  private extractRecurring(text: string): ParsedTask['isRecurring'] {
    for (const [frequency, keywords] of Object.entries(this.recurringKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return { frequency: frequency as 'daily' | 'weekly' | 'monthly' | 'yearly' };
        }
      }
    }

    // Check for "every X days/weeks" patterns
    const intervalPattern = /every (\d+) (day|days|week|weeks|month|months)/;
    const intervalMatch = text.match(intervalPattern);
    if (intervalMatch) {
      const interval = parseInt(intervalMatch[1]);
      const unit = intervalMatch[2];

      if (unit.includes('day')) {
        return { frequency: 'daily', interval };
      } else if (unit.includes('week')) {
        return { frequency: 'weekly', interval };
      } else if (unit.includes('month')) {
        return { frequency: 'monthly', interval };
      }
    }

    return undefined;
  }

  /**
   * Clean the title by removing parsed elements
   */
  private cleanTitle(original: string, dueDate?: Date, priority?: string, recurring?: ParsedTask['isRecurring']): string {
    let cleaned = original.trim();

    // Remove date references
    cleaned = cleaned.replace(/\b(tomorrow|today|yesterday|next \w+day|\w+day|in \d+ \w+)\b/gi, '');

    // Remove priority indicators
    cleaned = cleaned.replace(/\b(urgent|asap|important|high|low|priority|!!+|!+)\b/gi, '');

    // Remove recurring indicators
    cleaned = cleaned.replace(/\b(every \w+|daily|weekly|monthly|yearly)\b/gi, '');

    // Clean up extra spaces and punctuation
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/^[^\w]+|[^\w]+$/g, ''); // Remove leading/trailing non-word chars

    // Capitalize first letter
    if (cleaned) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned || original; // Fallback to original if cleaning resulted in empty string
  }

  /**
   * Calculate confidence score based on parsing success
   */
  private calculateConfidence(text: string, parsed: Record<string, boolean>): number {
    const weights = {
      dueDate: 0.3,
      priority: 0.2,
      taskType: 0.2,
      context: 0.2,
      recurring: 0.1
    };

    let score = 0.5; // Base score

    for (const [key, found] of Object.entries(parsed)) {
      if (found) {
        score += weights[key as keyof typeof weights] || 0;
      }
    }

    // Bonus for longer, more descriptive text
    if (text.length > 20) score += 0.1;
    if (text.split(' ').length > 5) score += 0.1;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Quick test method for development
   */
  public test(): void {
    const testCases = [
      "buy milk tomorrow",
      "call mom next friday at 2pm",
      "pay bills every month",
      "doctor appointment dec 15",
      "urgent: fix the printer asap!",
      "remind me to take medicine daily",
      "meeting with john about project next tuesday"
    ];

    console.log('🧠 Natural Language Processing Test Results:');
    testCases.forEach(test => {
      const result = this.parseNaturalLanguage(test);
      console.log(`\n📝 "${test}"`);
      console.log(`   Title: "${result.title}"`);
      console.log(`   Due: ${result.dueDate ? format(result.dueDate, 'MMM dd, yyyy') : 'None'}`);
      console.log(`   Priority: ${result.priority}`);
      console.log(`   Type: ${result.taskType}`);
      console.log(`   Tags: ${result.tags.join(', ') || 'None'}`);
      console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
    });
  }
}

// Export singleton instance
export const nlpService = new NaturalLanguageService();
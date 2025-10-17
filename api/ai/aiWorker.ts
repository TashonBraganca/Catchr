import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import {
  createQuickCalendarEvent,
  isCalendarIntegrationEnabled,
} from '../services/googleCalendarService';

// AI WORKER SERVICE
// Background processor for AI categorization and calendar event creation
// Runs async to process thoughts and create calendar events

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Thought {
  id: string;
  user_id: string;
  content: string;
  category?: any;
  tags?: string[];
  type?: string;
  created_at: string;
}

interface CalendarEventSuggestion {
  hasEvent: boolean;
  naturalLanguageText?: string;
  confidence?: number;
  reason?: string;
}

/**
 * Analyze thought for potential calendar events using GPT-5-nano
 */
async function detectCalendarEvent(thought: Thought): Promise<CalendarEventSuggestion> {
  try {
    console.log('🔍 [AI Worker] Analyzing thought for calendar event:', thought.content.substring(0, 50));

    // Use GPT-5-nano to detect calendar events (Responses API)
    const completion = await openai.responses.create({
      model: 'gpt-5-nano',
      input: [
        {
          role: 'developer',
          content: `You are Catchr's calendar event detector. Analyze thoughts to identify calendar-worthy events.

Detect if this thought contains:
1. Meeting mentions (with people, times, or dates)
2. Appointments (doctor, dentist, etc.)
3. Events (concerts, conferences, parties)
4. Deadlines with specific dates
5. Time-based reminders

Return JSON with:
- hasEvent (boolean): true if calendar-worthy
- naturalLanguageText (string): Google Calendar quickAdd format (e.g., "Meeting with Sarah tomorrow at 3pm")
- confidence (number): 0-1 confidence score
- reason (string): Why this should/shouldn't be a calendar event

Be precise. Only create events for time-specific activities.`,
        },
        {
          role: 'user',
          content: thought.content,
        },
      ],
      reasoning: { effort: 'low' },
      text: {
        format: { type: 'json_object' },
      },
    });

    const result: CalendarEventSuggestion = JSON.parse(completion.output[0].content || '{"hasEvent": false}');

    console.log('✅ [AI Worker] Calendar event detection:', {
      hasEvent: result.hasEvent,
      confidence: result.confidence,
    });

    return result;

  } catch (error) {
    console.error('❌ [AI Worker] Error detecting calendar event:', error);
    return { hasEvent: false };
  }
}

/**
 * Queue calendar event creation for a thought
 * Only queues if user has calendar integration enabled
 */
async function queueCalendarEvent(thought: Thought): Promise<void> {
  try {
    console.log('📅 [AI Worker] Checking calendar queue for thought:', thought.id);

    // CRITICAL FIX: Check if user has calendar integration enabled
    const isEnabled = await isCalendarIntegrationEnabled(thought.user_id);

    if (!isEnabled) {
      console.log(`ℹ️ [AI Worker] Calendar integration disabled for user ${thought.user_id}, skipping event creation`);
      return;
    }

    // Detect if thought contains a calendar event
    const eventSuggestion = await detectCalendarEvent(thought);

    if (!eventSuggestion.hasEvent || !eventSuggestion.naturalLanguageText) {
      console.log('ℹ️ [AI Worker] No calendar event detected in thought');
      return;
    }

    // Only create event if confidence is high enough
    if (eventSuggestion.confidence && eventSuggestion.confidence < 0.7) {
      console.log(`ℹ️ [AI Worker] Confidence too low (${eventSuggestion.confidence}), skipping event creation`);
      return;
    }

    console.log('🎯 [AI Worker] High-confidence calendar event detected, creating...');

    // Create calendar event using quickAdd API
    const result = await createQuickCalendarEvent(
      thought.user_id,
      eventSuggestion.naturalLanguageText
    );

    if (result.success) {
      console.log('✅ [AI Worker] Calendar event created:', result.eventId);

      // Update thought with calendar event link
      await supabase
        .from('thoughts')
        .update({
          ai_suggestions: {
            ...thought.category,
            calendarEvent: {
              created: true,
              eventId: result.eventId,
              eventLink: result.eventLink,
              createdAt: new Date().toISOString(),
            },
          },
        })
        .eq('id', thought.id);

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: thought.user_id,
          type: 'ai_processing_complete',
          title: 'Calendar Event Created',
          message: `Created calendar event: ${eventSuggestion.naturalLanguageText}`,
          thought_id: thought.id,
        });

    } else {
      console.error('❌ [AI Worker] Failed to create calendar event:', result.error);
    }

  } catch (error) {
    console.error('❌ [AI Worker] Error queuing calendar event:', error);
  }
}

/**
 * Process a single thought
 * - Categorize with AI
 * - Detect and create calendar events if enabled
 */
export async function processThought(thoughtId: string): Promise<void> {
  try {
    console.log('🤖 [AI Worker] Processing thought:', thoughtId);

    // Fetch thought
    const { data: thought, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('id', thoughtId)
      .single();

    if (error || !thought) {
      console.error('❌ [AI Worker] Thought not found:', thoughtId);
      return;
    }

    // Check if already processed
    if (thought.is_processed) {
      console.log('ℹ️ [AI Worker] Thought already processed, skipping');
      return;
    }

    // Queue calendar event creation (only if user has it enabled)
    await queueCalendarEvent(thought);

    // Mark as processed
    await supabase
      .from('thoughts')
      .update({
        is_processed: true,
        processed_by_ai: new Date().toISOString(),
      })
      .eq('id', thoughtId);

    console.log('✅ [AI Worker] Thought processed successfully');

  } catch (error) {
    console.error('❌ [AI Worker] Error processing thought:', error);
  }
}

/**
 * Process pending thoughts from AI queue
 */
export async function processAIQueue(): Promise<void> {
  try {
    console.log('🔄 [AI Worker] Processing AI queue...');

    // Fetch pending items from queue
    const { data: queueItems, error } = await supabase
      .from('ai_processing_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ [AI Worker] Error fetching queue:', error);
      return;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('ℹ️ [AI Worker] No pending items in queue');
      return;
    }

    console.log(`📋 [AI Worker] Processing ${queueItems.length} queue items`);

    // Process each item
    for (const item of queueItems) {
      try {
        // Update status to processing
        await supabase
          .from('ai_processing_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);

        // Process the thought
        await processThought(item.thought_id);

        // Mark as completed
        await supabase
          .from('ai_processing_queue')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

      } catch (error) {
        console.error(`❌ [AI Worker] Error processing queue item ${item.id}:`, error);

        // Mark as failed with retry
        await supabase
          .from('ai_processing_queue')
          .update({
            status: item.retry_count >= 3 ? 'failed' : 'pending',
            retry_count: item.retry_count + 1,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      }
    }

    console.log('✅ [AI Worker] Queue processing complete');

  } catch (error) {
    console.error('❌ [AI Worker] Error processing queue:', error);
  }
}

export { queueCalendarEvent, detectCalendarEvent };

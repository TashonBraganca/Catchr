import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { AIService } from '../services/aiService.js';
import {
  queueService,
  JobType,
  WhisperTranscribeJob,
  EnrichSummaryJob,
  CalendarCreateJob
} from '../services/queueService.js';
import { Database } from '@cathcr/shared';

// Initialize services
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const aiService = new AIService();

export class AIWorker {
  private workers: Map<string, Worker> = new Map();

  constructor() {
    this.setupWorkers();
  }

  private setupWorkers(): void {
    // Whisper transcription worker
    const whisperWorker = new Worker(
      JobType.WHISPER_TRANSCRIBE,
      async (job: Job<WhisperTranscribeJob>) => {
        return this.processWhisperTranscription(job);
      },
      {
        connection: queueService.getRedisConnection(),
        concurrency: 2, // Process 2 transcriptions concurrently
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    whisperWorker.on('completed', (job) => {
      console.log(`Whisper transcription completed: ${job.id}`);
    });

    whisperWorker.on('failed', (job, err) => {
      console.error(`Whisper transcription failed: ${job?.id}`, err);
    });

    this.workers.set(JobType.WHISPER_TRANSCRIBE, whisperWorker);

    // AI enrichment worker
    const enrichWorker = new Worker(
      JobType.ENRICH_SUMMARY,
      async (job: Job<EnrichSummaryJob>) => {
        return this.processEnrichment(job);
      },
      {
        connection: queueService.getRedisConnection(),
        concurrency: 3, // Process 3 enrichments concurrently
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    enrichWorker.on('completed', (job) => {
      console.log(`AI enrichment completed: ${job.id}`);
    });

    enrichWorker.on('failed', (job, err) => {
      console.error(`AI enrichment failed: ${job?.id}`, err);
    });

    this.workers.set(JobType.ENRICH_SUMMARY, enrichWorker);

    // Calendar creation worker
    const calendarWorker = new Worker(
      JobType.CALENDAR_CREATE,
      async (job: Job<CalendarCreateJob>) => {
        return this.processCalendarCreation(job);
      },
      {
        connection: queueService.getRedisConnection(),
        concurrency: 1, // Process calendar events one at a time
        removeOnComplete: 50,
        removeOnFail: 25,
      }
    );

    calendarWorker.on('completed', (job) => {
      console.log(`Calendar creation completed: ${job.id}`);
    });

    calendarWorker.on('failed', (job, err) => {
      console.error(`Calendar creation failed: ${job?.id}`, err);
    });

    this.workers.set(JobType.CALENDAR_CREATE, calendarWorker);
  }

  private async processWhisperTranscription(job: Job<WhisperTranscribeJob>): Promise<any> {
    const { thoughtId, userId, audioUrl } = job.data;

    try {
      // Update processing status
      await this.updateProcessingStatus(thoughtId, 'processing', 'whisper_transcription');

      // Download audio file
      const audioBuffer = await this.downloadAudio(audioUrl);

      // Transcribe using Whisper
      const transcriptionResult = await aiService.transcribeAudio(audioBuffer);

      // Update thought with transcription
      const { error: updateError } = await supabase
        .from('thoughts')
        .update({
          transcribed_text: transcriptionResult.text,
          updated_at: new Date().toISOString(),
        })
        .eq('id', thoughtId)
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to update thought with transcription: ${updateError.message}`);
      }

      // Queue for AI enrichment with the transcribed text
      await queueService.addEnrichSummaryJob({
        thoughtId,
        userId,
        content: transcriptionResult.text,
      });

      // Update processing status
      await this.updateProcessingStatus(thoughtId, 'completed', 'whisper_transcription');

      // Send real-time notification
      await this.sendRealtimeNotification(userId, 'transcription_complete', {
        thought_id: thoughtId,
        transcribed_text: transcriptionResult.text,
      });

      return {
        success: true,
        transcribed_text: transcriptionResult.text,
        confidence: transcriptionResult.confidence,
      };

    } catch (error) {
      console.error('Whisper transcription error:', error);

      // Update processing status
      await this.updateProcessingStatus(
        thoughtId,
        'failed',
        'whisper_transcription',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  private async processEnrichment(job: Job<EnrichSummaryJob>): Promise<any> {
    const { thoughtId, userId, content } = job.data;

    try {
      // Update processing status
      await this.updateProcessingStatus(thoughtId, 'processing', 'categorization');

      // Get user preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      // Get recent thoughts for context
      const { data: recentThoughts } = await supabase
        .from('thoughts')
        .select('content, category, created_at')
        .eq('user_id', userId)
        .eq('is_processed', true)
        .order('created_at', { ascending: false })
        .limit(5);

      // Process with AI
      const categorizationResult = await aiService.categorizeThought({
        thought: content,
        userPreferences: profile?.preferences || {
          defaultCategories: ['ideas', 'reminders', 'notes'],
          notificationSettings: {
            reminders: true,
            dailyDigest: false,
            weeklyReview: false
          },
          aiSettings: {
            autoCategory: true,
            confidenceThreshold: 0.7,
            personalizedPrompts: true
          },
          theme: 'auto'
        },
        previousThoughts: recentThoughts || [],
      });

      // Extract reminders if needed
      let reminderInfo = null;
      if (content.toLowerCase().includes('remind') ||
          content.toLowerCase().includes('remember') ||
          content.toLowerCase().includes('todo')) {
        reminderInfo = await aiService.extractReminders(content);
      }

      // Update thought with AI results
      const updateData: Database['public']['Tables']['thoughts']['Update'] = {
        category: categorizationResult.category,
        tags: categorizationResult.tags,
        ai_confidence: categorizationResult.confidence,
        ai_suggestions: categorizationResult.suggestions,
        is_processed: true,
        processed_by_ai: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (reminderInfo) {
        updateData.reminder_date = reminderInfo.date.toISOString();
      }

      const { error: updateError } = await supabase
        .from('thoughts')
        .update(updateData)
        .eq('id', thoughtId)
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to update thought with AI results: ${updateError.message}`);
      }

      // Create reminder notification if needed
      if (reminderInfo) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'reminder',
          title: 'Reminder Set',
          message: reminderInfo.context,
          thought_id: thoughtId,
          scheduled_for: reminderInfo.date.toISOString(),
        });

        // Queue calendar creation if user has integration enabled
        // TODO: Check if user has calendar integration enabled
        await queueService.addCalendarCreateJob({
          thoughtId,
          userId,
          eventData: {
            title: reminderInfo.context,
            date: reminderInfo.date.toISOString(),
            description: content,
          },
        });
      }

      // Update processing status
      await this.updateProcessingStatus(thoughtId, 'completed', 'categorization');

      // Send real-time notification
      await this.sendRealtimeNotification(userId, 'enrichment_complete', {
        thought_id: thoughtId,
        category: categorizationResult.category,
        confidence: categorizationResult.confidence,
        has_reminder: !!reminderInfo,
      });

      return {
        success: true,
        category: categorizationResult.category,
        tags: categorizationResult.tags,
        confidence: categorizationResult.confidence,
        reminder: reminderInfo,
      };

    } catch (error) {
      console.error('AI enrichment error:', error);

      // Update processing status
      await this.updateProcessingStatus(
        thoughtId,
        'failed',
        'categorization',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  private async processCalendarCreation(job: Job<CalendarCreateJob>): Promise<any> {
    const { thoughtId, userId, eventData } = job.data;

    try {
      // Update processing status
      await this.updateProcessingStatus(thoughtId, 'processing', 'calendar_integration');

      // TODO: Implement Google Calendar integration
      // This will be implemented when we add Google Calendar OAuth
      console.log('Calendar creation queued:', { thoughtId, userId, eventData });

      // For now, just mark as completed
      await this.updateProcessingStatus(thoughtId, 'completed', 'calendar_integration');

      return {
        success: true,
        message: 'Calendar integration not yet implemented',
      };

    } catch (error) {
      console.error('Calendar creation error:', error);

      await this.updateProcessingStatus(
        thoughtId,
        'failed',
        'calendar_integration',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  private async downloadAudio(audioUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Audio download error:', error);
      throw new Error('Failed to download audio file');
    }
  }

  private async updateProcessingStatus(
    thoughtId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    processingType: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('ai_processing_queue')
        .update(updateData)
        .eq('thought_id', thoughtId)
        .eq('processing_type', processingType);

      if (error) {
        console.error('Failed to update processing status:', error);
      }
    } catch (error) {
      console.error('Error updating processing status:', error);
    }
  }

  private async sendRealtimeNotification(
    userId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    try {
      // Send real-time notification via Supabase
      const channel = supabase.channel(`user:${userId}`);
      await channel.send({
        type: 'broadcast',
        event: eventType,
        payload,
      });
    } catch (error) {
      console.error('Failed to send real-time notification:', error);
    }
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down AI workers...');

    await Promise.all(
      Array.from(this.workers.values()).map(worker => worker.close())
    );

    console.log('AI workers shutdown complete');
  }

  getWorkers(): Map<string, Worker> {
    return this.workers;
  }
}

// Export singleton instance
export const aiWorker = new AIWorker();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down AI workers...');
  await aiWorker.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down AI workers...');
  await aiWorker.shutdown();
  process.exit(0);
});
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Define job types
export interface WhisperTranscribeJob {
  thoughtId: string;
  userId: string;
  audioUrl: string;
}

export interface EnrichSummaryJob {
  thoughtId: string;
  userId: string;
  content: string;
}

export interface CalendarCreateJob {
  thoughtId: string;
  userId: string;
  eventData: {
    title: string;
    date: string;
    description?: string;
  };
}

export type JobData = WhisperTranscribeJob | EnrichSummaryJob | CalendarCreateJob;

// Job types enum
export enum JobType {
  WHISPER_TRANSCRIBE = 'whisper_transcribe',
  ENRICH_SUMMARY = 'enrich_summary',
  CALENDAR_CREATE = 'calendar_create',
}

export class QueueService {
  private redis: Redis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });

    this.setupQueues();
  }

  private setupQueues(): void {
    // Create queues for different job types
    this.queues.set(JobType.WHISPER_TRANSCRIBE, new Queue(JobType.WHISPER_TRANSCRIBE, {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }));

    this.queues.set(JobType.ENRICH_SUMMARY, new Queue(JobType.ENRICH_SUMMARY, {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }));

    this.queues.set(JobType.CALENDAR_CREATE, new Queue(JobType.CALENDAR_CREATE, {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 25,
      },
    }));
  }

  async addWhisperTranscribeJob(data: WhisperTranscribeJob, options?: {
    delay?: number;
    priority?: number;
  }): Promise<Job> {
    const queue = this.queues.get(JobType.WHISPER_TRANSCRIBE);
    if (!queue) {
      throw new Error('Whisper transcribe queue not initialized');
    }

    return queue.add('transcribe-audio', data, {
      delay: options?.delay,
      priority: options?.priority,
    });
  }

  async addEnrichSummaryJob(data: EnrichSummaryJob, options?: {
    delay?: number;
    priority?: number;
  }): Promise<Job> {
    const queue = this.queues.get(JobType.ENRICH_SUMMARY);
    if (!queue) {
      throw new Error('Enrich summary queue not initialized');
    }

    return queue.add('enrich-thought', data, {
      delay: options?.delay,
      priority: options?.priority,
    });
  }

  async addCalendarCreateJob(data: CalendarCreateJob, options?: {
    delay?: number;
    priority?: number;
  }): Promise<Job> {
    const queue = this.queues.get(JobType.CALENDAR_CREATE);
    if (!queue) {
      throw new Error('Calendar create queue not initialized');
    }

    return queue.add('create-calendar-event', data, {
      delay: options?.delay,
      priority: options?.priority,
    });
  }

  async getJobCounts(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return {
      waiting: await queue.getWaiting().then(jobs => jobs.length),
      active: await queue.getActive().then(jobs => jobs.length),
      completed: await queue.getCompleted().then(jobs => jobs.length),
      failed: await queue.getFailed().then(jobs => jobs.length),
      delayed: await queue.getDelayed().then(jobs => jobs.length),
    };
  }

  async getJob(queueName: string, jobId: string): Promise<Job | undefined> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getJob(jobId);
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
    }
  }

  async retryJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.retry();
    }
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
  }

  async cleanQueue(queueName: string, olderThan: number = 24 * 60 * 60 * 1000): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    // Clean completed and failed jobs older than specified time
    await queue.clean(olderThan, 100, 'completed');
    await queue.clean(olderThan, 50, 'failed');
  }

  async getQueueHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};

    for (const [queueName, queue] of this.queues) {
      try {
        const counts = await this.getJobCounts(queueName);
        const isPaused = await queue.isPaused();

        health[queueName] = {
          status: isPaused ? 'paused' : 'active',
          counts,
          lastCleanup: new Date().toISOString(),
        };
      } catch (error) {
        health[queueName] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return health;
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down queue service...');

    // Close all workers first
    await Promise.all(
      Array.from(this.workers.values()).map(worker => worker.close())
    );

    // Close all queues
    await Promise.all(
      Array.from(this.queues.values()).map(queue => queue.close())
    );

    // Close Redis connection
    await this.redis.quit();

    console.log('Queue service shutdown complete');
  }

  // Utility method to check Redis connection
  async ping(): Promise<string> {
    return this.redis.ping();
  }

  // Get Redis connection for health checks
  getRedisConnection(): Redis {
    return this.redis;
  }
}

// Export singleton instance
export const queueService = new QueueService();
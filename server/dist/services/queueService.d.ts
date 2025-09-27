import { Job } from 'bullmq';
import Redis from 'ioredis';
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
export declare enum JobType {
    WHISPER_TRANSCRIBE = "whisper_transcribe",
    ENRICH_SUMMARY = "enrich_summary",
    CALENDAR_CREATE = "calendar_create"
}
export declare class QueueService {
    private redis;
    private queues;
    private workers;
    constructor();
    private setupQueues;
    addWhisperTranscribeJob(data: WhisperTranscribeJob, options?: {
        delay?: number;
        priority?: number;
    }): Promise<Job>;
    addEnrichSummaryJob(data: EnrichSummaryJob, options?: {
        delay?: number;
        priority?: number;
    }): Promise<Job>;
    addCalendarCreateJob(data: CalendarCreateJob, options?: {
        delay?: number;
        priority?: number;
    }): Promise<Job>;
    getJobCounts(queueName: string): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
    getJob(queueName: string, jobId: string): Promise<Job | undefined>;
    removeJob(queueName: string, jobId: string): Promise<void>;
    retryJob(queueName: string, jobId: string): Promise<void>;
    pauseQueue(queueName: string): Promise<void>;
    resumeQueue(queueName: string): Promise<void>;
    cleanQueue(queueName: string, olderThan?: number): Promise<void>;
    getQueueHealth(): Promise<Record<string, any>>;
    shutdown(): Promise<void>;
    ping(): Promise<string>;
    getRedisConnection(): Redis;
}
export declare const queueService: QueueService;
//# sourceMappingURL=queueService.d.ts.map
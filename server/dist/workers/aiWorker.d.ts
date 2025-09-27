import { Worker } from 'bullmq';
export declare class AIWorker {
    private workers;
    constructor();
    private setupWorkers;
    private processWhisperTranscription;
    private processEnrichment;
    private processCalendarCreation;
    private downloadAudio;
    private updateProcessingStatus;
    private sendRealtimeNotification;
    shutdown(): Promise<void>;
    getWorkers(): Map<string, Worker>;
}
export declare const aiWorker: AIWorker;
//# sourceMappingURL=aiWorker.d.ts.map
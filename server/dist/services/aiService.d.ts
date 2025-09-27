import { AICategorizationRequest, AICategorizationResponse, ReminderInfo, ThoughtCategory } from '@cathcr/shared';
export declare class AIService {
    private openai;
    private supabase;
    constructor();
    categorizeThought(request: AICategorizationRequest): Promise<AICategorizationResponse>;
    extractReminders(thought: string): Promise<ReminderInfo | null>;
    transcribeAudio(audioBuffer: Buffer, filename?: string): Promise<{
        text: string;
        confidence: number;
    }>;
    transcribeAudioFromFile(filePath: string): Promise<{
        text: string;
        confidence: number;
    }>;
    suggestExpansions(thought: string, category: ThoughtCategory): Promise<string[]>;
    private getSystemPrompt;
    private buildCategorizationContext;
    private buildCategorizationPrompt;
    private processAIResponse;
    private fallbackCategorization;
    batchProcessThoughts(thoughtIds: string[], userId: string): Promise<void>;
}
//# sourceMappingURL=aiService.d.ts.map
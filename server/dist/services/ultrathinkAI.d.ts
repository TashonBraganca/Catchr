export interface UltrathinkCategorization {
    category: string;
    folder: string;
    subFolder?: string;
    tags: string[];
    priority: 'urgent' | 'high' | 'medium' | 'low';
    actionItems: string[];
    reminders: string[];
    confidence: number;
    suggestedConnections: string[];
    entities: {
        people: string[];
        places: string[];
        dates: string[];
        topics: string[];
    };
}
export interface UserThinkingPattern {
    vocabularyWeights: Record<string, number>;
    categoryPreferences: Record<string, string>;
    timePatterns: Record<string, string>;
    contextClues: Record<string, string>;
    accuracyRate: number;
    totalThoughts: number;
}
export declare class UltrathinkAI {
    private openai;
    private supabase;
    private isConfigured;
    constructor();
    categorizeThought(content: string, userId: string, context?: {
        timeOfDay?: string;
        location?: string;
        browserContext?: string;
        recentThoughts?: string[];
    }): Promise<UltrathinkCategorization>;
    private buildUltrathinkPrompt;
    private formatUserPatterns;
    private formatContext;
    private validateAndEnhance;
    private generateFallbackCategorization;
    private containsTaskKeywords;
    private containsIdeaKeywords;
    private containsReminderKeywords;
    private containsLearningKeywords;
    private containsMeetingKeywords;
    private detectTaskSubfolder;
    private detectIdeaSubfolder;
    private detectLearningSubfolder;
    private detectPriority;
    private extractBasicTags;
    private extractBasicActionItems;
    private extractBasicReminders;
    private extractBasicEntities;
    private extractPeopleEntities;
    private extractPlaceEntities;
    private extractDateEntities;
    private extractTopicEntities;
    private getUserThinkingPatterns;
    private getDefaultThinkingPattern;
    private updateUserPatterns;
}
//# sourceMappingURL=ultrathinkAI.d.ts.map
/**
 * COGNITIVE AI SERVICE
 * Advanced Intelligence Engine for Proactive Thought Assistance
 */
export interface PredictiveSuggestion {
    id: string;
    type: 'task' | 'idea' | 'reminder' | 'note' | 'follow_up' | 'project';
    content: string;
    reasoning: string;
    confidence: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    contextTriggers: ContextTrigger[];
    suggestedCategory?: any;
    suggestedTags?: string[];
    expiresAt: Date;
}
export interface ContextTrigger {
    type: 'time_pattern' | 'location' | 'calendar_event' | 'related_thought' | 'project_context';
    value: string;
    confidence: number;
}
export interface ThoughtConnection {
    thoughtAId: string;
    thoughtBId: string;
    connectionType: 'semantic' | 'temporal' | 'causal' | 'thematic' | 'project_related' | 'contextual';
    strength: number;
    reasoning: string;
    actionableInsights: string[];
    suggestedActions: ConnectionAction[];
}
export interface ConnectionAction {
    type: 'merge_thoughts' | 'create_project' | 'schedule_follow_up' | 'tag_relationship';
    description: string;
    confidence: number;
}
export interface UserPattern {
    userId: string;
    vocabularyWeights: Record<string, number>;
    categoryPreferences: Record<string, string>;
    timePatterns: Record<string, any>;
    contextPatterns: Record<string, any>;
    productivityPeaks: string[];
    thinkingThemes: string[];
}
export interface InsightReport {
    period: 'daily' | 'weekly' | 'monthly';
    userId: string;
    insights: PersonalInsight[];
    recommendations: ActionableRecommendation[];
    patterns: ThinkingPattern[];
    productivity: ProductivityAnalysis;
}
export interface PersonalInsight {
    type: 'pattern' | 'productivity' | 'creativity' | 'focus' | 'growth';
    title: string;
    description: string;
    supportingData: any[];
    confidence: number;
    actionability: 'high' | 'medium' | 'low';
}
export interface ActionableRecommendation {
    title: string;
    description: string;
    actions: string[];
    expectedImpact: 'high' | 'medium' | 'low';
    difficulty: 'easy' | 'medium' | 'hard';
}
export interface ThinkingPattern {
    type: 'temporal' | 'thematic' | 'productivity' | 'creative' | 'focus' | 'emotional';
    name: string;
    description: string;
    strength: number;
    frequency: string;
    trend: 'increasing' | 'stable' | 'decreasing';
}
export interface ProductivityAnalysis {
    peakHours: string[];
    focusPatterns: string[];
    completionRate: number;
    thinkingVelocity: number;
    creativityScore: number;
    organizationEfficiency: number;
}
export declare class CognitiveAI {
    private openai;
    constructor();
    generatePredictiveSuggestions(userId: string): Promise<PredictiveSuggestion[]>;
    discoverThoughtConnections(userId: string): Promise<ThoughtConnection[]>;
    aiConnectionAnalysis(thoughts: any[]): Promise<ThoughtConnection[]>;
    generateInsightReport(userId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<InsightReport>;
    private analyzeUserPatterns;
    private getRecentThoughts;
    private getCurrentContext;
    private getTimeOfDay;
    private extractProductivityPeaks;
    private extractThinkingThemes;
    private generateId;
    private findSemanticConnections;
    private findTemporalConnections;
    private findProjectConnections;
    private storePredictiveSuggestions;
    private storeThoughtConnections;
    private storeInsightReport;
    private getTimeRange;
    private getThoughtsInRange;
    private getThinkingPatterns;
    private getCompletionData;
    private convertPatternsFormat;
    private calculateDefaultProductivity;
    private createEmptyReport;
}
export default CognitiveAI;
//# sourceMappingURL=cognitiveAI.d.ts.map
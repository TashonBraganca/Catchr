/**
 * COGNITIVE AI SERVICE
 * Advanced Intelligence Engine for Proactive Thought Assistance
 */

import OpenAI from 'openai';
import { supabaseAdmin as supabase } from '../config/supabase.js';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface PredictiveSuggestion {
  id: string;
  type: 'task' | 'idea' | 'reminder' | 'note' | 'follow_up' | 'project';
  content: string;
  reasoning: string;
  confidence: number; // 0-100
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
  strength: number; // 0-100
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

// =====================================================
// COGNITIVE AI ENGINE
// =====================================================

export class CognitiveAI {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION
    });
  }

  // =====================================================
  // PREDICTIVE SUGGESTIONS ENGINE
  // =====================================================

  async generatePredictiveSuggestions(userId: string): Promise<PredictiveSuggestion[]> {
    try {
      console.log(`🧠 Generating predictive suggestions for user: ${userId}`);

      // Get user patterns and context
      const userPatterns = await this.analyzeUserPatterns(userId);
      const recentThoughts = await this.getRecentThoughts(userId, 7);
      const currentContext = await this.getCurrentContext(userId);

      if (recentThoughts.length === 0) {
        console.log('No recent thoughts found for prediction');
        return [];
      }

      // Generate AI-powered suggestions
      const aiResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an advanced cognitive intelligence system that predicts what thoughts a user might want to capture next. Analyze patterns, context, and behavior to make proactive suggestions.

Return suggestions as JSON array with this structure:
{
  "suggestions": [
    {
      "type": "task|idea|reminder|note|follow_up|project",
      "content": "Specific actionable thought suggestion",
      "reasoning": "Why this suggestion makes sense based on patterns",
      "confidence": 75,
      "priority": "high",
      "contextTriggers": [
        {
          "type": "time_pattern",
          "value": "Monday morning planning",
          "confidence": 85
        }
      ],
      "suggestedTags": ["work", "planning"]
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Generate 3-5 predictive suggestions for this user based on their patterns:

USER PATTERNS:
${JSON.stringify(userPatterns, null, 2)}

RECENT THOUGHTS (last 7 days):
${recentThoughts.map(t => `- ${t.content} (${t.category?.main || 'uncategorized'}) [${new Date(t.created_at).toLocaleDateString()}]`).join('\n')}

CURRENT CONTEXT:
${JSON.stringify(currentContext, null, 2)}

Focus on:
1. Following up on incomplete thoughts
2. Patterns in their thinking (recurring themes, times, projects)
3. Natural next steps based on recent captures
4. Seasonal or time-based suggestions
5. Project progression suggestions

Make suggestions specific, actionable, and personally relevant. Only suggest things with >70% confidence.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const aiSuggestions = JSON.parse(aiResponse.choices[0].message.content || '{"suggestions": []}');

      // Process and validate suggestions
      const suggestions: PredictiveSuggestion[] = aiSuggestions.suggestions
        .filter((s: any) => s.confidence >= 70)
        .map((s: any) => ({
          id: this.generateId(),
          type: s.type,
          content: s.content,
          reasoning: s.reasoning,
          confidence: s.confidence,
          priority: s.priority || 'medium',
          contextTriggers: s.contextTriggers || [],
          suggestedTags: s.suggestedTags || [],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }));

      // Store suggestions in database
      await this.storePredictiveSuggestions(userId, suggestions);

      console.log(`✅ Generated ${suggestions.length} predictive suggestions`);
      return suggestions;

    } catch (error) {
      console.error('Error generating predictive suggestions:', error);
      return [];
    }
  }

  // =====================================================
  // CONNECTION INTELLIGENCE ENGINE
  // =====================================================

  async discoverThoughtConnections(userId: string): Promise<ThoughtConnection[]> {
    try {
      console.log(`🔗 Discovering thought connections for user: ${userId}`);

      const recentThoughts = await this.getRecentThoughts(userId, 30);
      if (recentThoughts.length < 2) {
        console.log('Not enough thoughts for connection analysis');
        return [];
      }

      const connections: ThoughtConnection[] = [];

      // Semantic similarity analysis
      const semanticConnections = await this.findSemanticConnections(recentThoughts);
      connections.push(...semanticConnections);

      // Temporal pattern analysis
      const temporalConnections = await this.findTemporalConnections(recentThoughts);
      connections.push(...temporalConnections);

      // Project relationship analysis
      const projectConnections = await this.findProjectConnections(recentThoughts);
      connections.push(...projectConnections);

      // AI-powered deep connection analysis
      const aiConnections = await this.aiConnectionAnalysis(recentThoughts);
      connections.push(...aiConnections);

      // Filter and rank connections
      const meaningfulConnections = connections
        .filter(c => c.strength >= 60)
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 10); // Top 10 connections

      // Store connections in database
      await this.storeThoughtConnections(userId, meaningfulConnections);

      console.log(`✅ Discovered ${meaningfulConnections.length} thought connections`);
      return meaningfulConnections;

    } catch (error) {
      console.error('Error discovering thought connections:', error);
      return [];
    }
  }

  async aiConnectionAnalysis(thoughts: any[]): Promise<ThoughtConnection[]> {
    try {
      const aiResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at finding hidden connections and relationships between thoughts. Analyze the provided thoughts to discover meaningful relationships.

Return connections as JSON:
{
  "connections": [
    {
      "thoughtAIndex": 0,
      "thoughtBIndex": 3,
      "connectionType": "thematic",
      "strength": 85,
      "reasoning": "Both thoughts relate to improving team communication",
      "actionableInsights": ["Consider creating a communication framework", "Schedule team alignment meeting"],
      "suggestedActions": [
        {
          "type": "create_project",
          "description": "Create a team communication improvement project",
          "confidence": 80
        }
      ]
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Find meaningful connections between these thoughts:

${thoughts.map((t, i) => `${i}. "${t.content}" (${t.category?.main || 'uncategorized'}) [${new Date(t.created_at).toLocaleDateString()}]`).join('\n')}

Look for:
- Thematic connections (similar topics or themes)
- Causal relationships (one thought leading to another)
- Project relationships (thoughts that could be part of the same project)
- Complementary ideas (thoughts that work well together)
- Progression patterns (evolution of an idea over time)

Only return connections with strength >60. Focus on actionable insights.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const result = JSON.parse(aiResponse.choices[0].message.content || '{"connections": []}');

      return result.connections.map((c: any) => ({
        thoughtAId: thoughts[c.thoughtAIndex]?.id,
        thoughtBId: thoughts[c.thoughtBIndex]?.id,
        connectionType: c.connectionType,
        strength: c.strength,
        reasoning: c.reasoning,
        actionableInsights: c.actionableInsights || [],
        suggestedActions: c.suggestedActions || []
      })).filter((c: any) => c.thoughtAId && c.thoughtBId);

    } catch (error) {
      console.error('Error in AI connection analysis:', error);
      return [];
    }
  }

  // =====================================================
  // INSIGHT ANALYTICS ENGINE
  // =====================================================

  async generateInsightReport(userId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<InsightReport> {
    try {
      console.log(`📊 Generating ${period} insight report for user: ${userId}`);

      const timeRange = this.getTimeRange(period);
      const thoughts = await this.getThoughtsInRange(userId, timeRange.start, timeRange.end);
      const patterns = await this.getThinkingPatterns(userId);
      const completionData = await this.getCompletionData(userId, timeRange.start, timeRange.end);

      if (thoughts.length === 0) {
        console.log('No thoughts found for insight generation');
        return this.createEmptyReport(userId, period);
      }

      // AI-powered insight analysis
      const aiResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a personal intelligence analyst that generates insights about thinking patterns and productivity. Analyze the user's thought data to provide valuable, actionable insights.

Return analysis as JSON:
{
  "insights": [
    {
      "type": "productivity",
      "title": "Peak Productivity Hours",
      "description": "You are most productive between 9-11 AM",
      "supportingData": ["75% of tasks completed in morning", "Higher creativity scores"],
      "confidence": 85,
      "actionability": "high"
    }
  ],
  "recommendations": [
    {
      "title": "Optimize Morning Routine",
      "description": "Focus your most important work during 9-11 AM peak hours",
      "actions": ["Schedule deep work for 9 AM", "Avoid meetings before 11 AM"],
      "expectedImpact": "high",
      "difficulty": "easy"
    }
  ],
  "productivity": {
    "peakHours": ["9-11 AM"],
    "focusPatterns": ["Deep work in morning", "Creative tasks afternoon"],
    "completionRate": 78,
    "thinkingVelocity": 85,
    "creativityScore": 72,
    "organizationEfficiency": 89
  }
}`
          },
          {
            role: 'user',
            content: `Generate a ${period} intelligence report for this user:

THOUGHTS (${thoughts.length} total):
${thoughts.slice(0, 20).map(t => `- "${t.content}" (${t.category?.main || 'uncategorized'}) [${new Date(t.created_at).toLocaleDateString()}]`).join('\n')}
${thoughts.length > 20 ? '... and more' : ''}

THINKING PATTERNS:
${patterns.map(p => `- ${p.name}: ${p.description} (strength: ${p.confidence_score}%)`).join('\n')}

COMPLETION DATA:
- Total thoughts: ${thoughts.length}
- Completed tasks: ${completionData.completed}
- In progress: ${completionData.inProgress}
- Time range: ${timeRange.start.toLocaleDateString()} - ${timeRange.end.toLocaleDateString()}

Provide insights about:
1. Productivity patterns and peak performance times
2. Thinking themes and recurring interests
3. Goal alignment and progress
4. Creative vs. analytical thinking balance
5. Areas for improvement and optimization

Make insights specific, encouraging, and actionable.`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      });

      const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content || '{}');

      const report: InsightReport = {
        period,
        userId,
        insights: aiAnalysis.insights || [],
        recommendations: aiAnalysis.recommendations || [],
        patterns: this.convertPatternsFormat(patterns),
        productivity: aiAnalysis.productivity || this.calculateDefaultProductivity(thoughts)
      };

      // Store report in database
      await this.storeInsightReport(report);

      console.log(`✅ Generated ${period} insight report with ${report.insights.length} insights`);
      return report;

    } catch (error) {
      console.error('Error generating insight report:', error);
      return this.createEmptyReport(userId, period);
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async analyzeUserPatterns(userId: string): Promise<UserPattern> {
    try {
      // Get user's learning patterns from existing table
      const { data: learningData } = await supabase
        .from('user_learning_patterns')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get recent thoughts for analysis
      const recentThoughts = await this.getRecentThoughts(userId, 30);

      // Build comprehensive pattern analysis
      return {
        userId,
        vocabularyWeights: learningData?.vocabulary_weights || {},
        categoryPreferences: learningData?.category_preferences || {},
        timePatterns: learningData?.time_patterns || {},
        contextPatterns: learningData?.context_patterns || {},
        productivityPeaks: this.extractProductivityPeaks(recentThoughts),
        thinkingThemes: this.extractThinkingThemes(recentThoughts)
      };

    } catch (error) {
      console.error('Error analyzing user patterns:', error);
      return {
        userId,
        vocabularyWeights: {},
        categoryPreferences: {},
        timePatterns: {},
        contextPatterns: {},
        productivityPeaks: [],
        thinkingThemes: []
      };
    }
  }

  private async getRecentThoughts(userId: string, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: thoughts } = await supabase
      .from('thoughts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    return thoughts || [];
  }

  private async getCurrentContext(userId: string): Promise<any> {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = this.getTimeOfDay(now);

    return {
      dayOfWeek,
      timeOfDay,
      hour: now.getHours(),
      isWeekend: dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday',
      isBusinessHours: now.getHours() >= 9 && now.getHours() <= 17
    };
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'late_night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private extractProductivityPeaks(thoughts: any[]): string[] {
    const hourCounts: Record<number, number> = {};

    thoughts.forEach(thought => {
      const hour = new Date(thought.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return sortedHours;
  }

  private extractThinkingThemes(thoughts: any[]): string[] {
    const themes: Record<string, number> = {};

    thoughts.forEach(thought => {
      const category = thought.category?.main || 'general';
      themes[category] = (themes[category] || 0) + 1;
    });

    return Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  private generateId(): string {
    return 'pred_' + Math.random().toString(36).substring(2, 15);
  }

  private async findSemanticConnections(thoughts: any[]): Promise<ThoughtConnection[]> {
    // Placeholder for semantic similarity using embeddings
    // Would use vector similarity search in production
    return [];
  }

  private async findTemporalConnections(thoughts: any[]): Promise<ThoughtConnection[]> {
    const connections: ThoughtConnection[] = [];

    // Find thoughts created within similar time patterns
    for (let i = 0; i < thoughts.length; i++) {
      for (let j = i + 1; j < thoughts.length; j++) {
        const thoughtA = thoughts[i];
        const thoughtB = thoughts[j];

        const timeA = new Date(thoughtA.created_at);
        const timeB = new Date(thoughtB.created_at);

        // Check if thoughts were created at similar times on different days
        if (Math.abs(timeA.getHours() - timeB.getHours()) <= 1 &&
            Math.abs(timeA.getTime() - timeB.getTime()) > 24 * 60 * 60 * 1000) {

          connections.push({
            thoughtAId: thoughtA.id,
            thoughtBId: thoughtB.id,
            connectionType: 'temporal',
            strength: 70,
            reasoning: `Both thoughts were captured at similar times (${timeA.getHours()}:00 and ${timeB.getHours()}:00)`,
            actionableInsights: ['Consider if this timing represents a regular thinking pattern'],
            suggestedActions: [{
              type: 'schedule_follow_up',
              description: 'Set a recurring reminder for this time period',
              confidence: 65
            }]
          });
        }
      }
    }

    return connections;
  }

  private async findProjectConnections(thoughts: any[]): Promise<ThoughtConnection[]> {
    const connections: ThoughtConnection[] = [];

    // Group thoughts by category and find relationships
    const categoryGroups: Record<string, any[]> = {};
    thoughts.forEach(thought => {
      const category = thought.category?.main || 'general';
      if (!categoryGroups[category]) categoryGroups[category] = [];
      categoryGroups[category].push(thought);
    });

    // Find connections within same category
    Object.values(categoryGroups).forEach(groupThoughts => {
      if (groupThoughts.length >= 2) {
        for (let i = 0; i < groupThoughts.length; i++) {
          for (let j = i + 1; j < groupThoughts.length; j++) {
            connections.push({
              thoughtAId: groupThoughts[i].id,
              thoughtBId: groupThoughts[j].id,
              connectionType: 'project_related',
              strength: 65,
              reasoning: `Both thoughts belong to the same category: ${groupThoughts[i].category?.main}`,
              actionableInsights: ['Consider grouping these thoughts into a project'],
              suggestedActions: [{
                type: 'create_project',
                description: `Create a project for ${groupThoughts[i].category?.main} thoughts`,
                confidence: 70
              }]
            });
          }
        }
      }
    });

    return connections.slice(0, 5); // Limit to top 5 connections
  }

  private async storePredictiveSuggestions(userId: string, suggestions: PredictiveSuggestion[]): Promise<void> {
    for (const suggestion of suggestions) {
      await supabase
        .from('predictive_suggestions')
        .insert({
          user_id: userId,
          suggestion_type: suggestion.type,
          content: suggestion.content,
          reasoning: suggestion.reasoning,
          confidence_score: suggestion.confidence,
          priority: suggestion.priority,
          context_triggers: suggestion.contextTriggers,
          suggested_tags: suggestion.suggestedTags,
          expires_at: suggestion.expiresAt.toISOString()
        });
    }
  }

  private async storeThoughtConnections(userId: string, connections: ThoughtConnection[]): Promise<void> {
    for (const connection of connections) {
      await supabase
        .from('thought_connections')
        .insert({
          user_id: userId,
          thought_a_id: connection.thoughtAId,
          thought_b_id: connection.thoughtBId,
          connection_type: connection.connectionType,
          strength_score: connection.strength,
          reasoning: connection.reasoning,
          actionable_insights: connection.actionableInsights,
          suggested_actions: connection.suggestedActions
        });
    }
  }

  private async storeInsightReport(report: InsightReport): Promise<void> {
    const timeRange = this.getTimeRange(report.period);

    await supabase
      .from('insight_reports')
      .insert({
        user_id: report.userId,
        report_type: report.period,
        period_start: timeRange.start.toISOString(),
        period_end: timeRange.end.toISOString(),
        insights: report.insights,
        recommendations: report.recommendations,
        thinking_patterns: report.patterns,
        productivity_analysis: report.productivity
      });
  }

  private getTimeRange(period: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setDate(start.getDate() - 30);
        break;
    }

    return { start, end };
  }

  private async getThoughtsInRange(userId: string, start: Date, end: Date): Promise<any[]> {
    const { data: thoughts } = await supabase
      .from('thoughts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    return thoughts || [];
  }

  private async getThinkingPatterns(userId: string): Promise<any[]> {
    const { data: patterns } = await supabase
      .from('thinking_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('confidence_score', { ascending: false });

    return patterns || [];
  }

  private async getCompletionData(userId: string, start: Date, end: Date): Promise<any> {
    const thoughts = await this.getThoughtsInRange(userId, start, end);

    return {
      total: thoughts.length,
      completed: thoughts.filter(t => t.is_completed).length,
      inProgress: thoughts.filter(t => !t.is_completed && !t.is_archived).length
    };
  }

  private convertPatternsFormat(patterns: any[]): ThinkingPattern[] {
    return patterns.map(p => ({
      type: p.pattern_type,
      name: p.pattern_name,
      description: p.description,
      strength: p.confidence_score,
      frequency: p.frequency,
      trend: p.strength_trend || 'stable'
    }));
  }

  private calculateDefaultProductivity(thoughts: any[]): ProductivityAnalysis {
    const hourCounts: Record<number, number> = {};
    thoughts.forEach(thought => {
      const hour = new Date(thought.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return {
      peakHours,
      focusPatterns: ['Morning focus', 'Afternoon creativity'],
      completionRate: 75,
      thinkingVelocity: 80,
      creativityScore: 70,
      organizationEfficiency: 85
    };
  }

  private createEmptyReport(userId: string, period: 'daily' | 'weekly' | 'monthly'): InsightReport {
    return {
      period,
      userId,
      insights: [],
      recommendations: [],
      patterns: [],
      productivity: {
        peakHours: [],
        focusPatterns: [],
        completionRate: 0,
        thinkingVelocity: 0,
        creativityScore: 0,
        organizationEfficiency: 0
      }
    };
  }
}

export default CognitiveAI;
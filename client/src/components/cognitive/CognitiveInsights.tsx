import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Lightbulb,
  TrendingUp,
  Clock,
  Search,
  Star,
  Filter,
  ArrowRight,
  CheckCircle2,
  X,
  AlertCircle,
  BarChart3,
  Activity,
  Loader2,
  RefreshCw,
  Zap,
  Target,
  Eye,
  Link2
} from 'lucide-react';

import { GlassCard, GlassButton, GlassInput } from '@/components/glass';
import { BentoGrid, BentoItem } from '@/components/layout/BentoGrid';
import { ScrollFadeWrapper, ScrollRevealCard } from '@/components/animations/ScrollFadeWrapper';
import { cn } from '@/lib/utils';

// COGNITIVE INSIGHTS Dashboard Component
// Implements the predictive intelligence features from Phase 2

interface PredictiveSuggestion {
  id: string;
  type: 'task' | 'idea' | 'reminder' | 'connection';
  title: string;
  description: string;
  confidence: number;
  relevanceScore: number;
  suggestedAction: string;
  createdAt: Date;
  context?: {
    triggerPattern?: string;
    relatedThoughts?: string[];
    timeContext?: string;
  };
}

interface ThoughtConnection {
  id: string;
  sourceThoughtId: string;
  targetThoughtId: string;
  connectionType: 'semantic' | 'temporal' | 'causal' | 'thematic';
  strength: number;
  discovered: boolean;
  sourceContent: string;
  targetContent: string;
  similarity: number;
}

interface InsightReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  title: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  generatedAt: Date;
  metrics: {
    thoughtsAnalyzed: number;
    patternsIdentified: number;
    productivityScore: number;
    creativityIndex: number;
  };
}

interface CognitiveInsightsProps {
  className?: string;
}

export const CognitiveInsights: React.FC<CognitiveInsightsProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'connections' | 'insights' | 'patterns'>('suggestions');
  const [suggestions, setSuggestions] = useState<PredictiveSuggestion[]>([]);
  const [connections, setConnections] = useState<ThoughtConnection[]>([]);
  const [insights, setInsights] = useState<InsightReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data for development
  const mockSuggestions: PredictiveSuggestion[] = [
    {
      id: '1',
      type: 'idea',
      title: 'Expand on AI Voice Interface Concept',
      description: 'Based on your recent thoughts about voice AI and user experience, consider exploring multi-modal voice interfaces that adapt to emotional context.',
      confidence: 0.87,
      relevanceScore: 0.92,
      suggestedAction: 'Create a detailed specification document',
      createdAt: new Date(Date.now() - 3600000),
      context: {
        triggerPattern: 'High engagement with AI and UX topics',
        relatedThoughts: ['voice-ai-interface', 'emotional-ux-design'],
        timeContext: 'Peak creative hours (morning)'
      }
    },
    {
      id: '2',
      type: 'task',
      title: 'Follow up on Design System Discussion',
      description: 'You mentioned reviewing the glass component system 2 days ago. The team is likely waiting for your feedback on the implementation.',
      confidence: 0.94,
      relevanceScore: 0.88,
      suggestedAction: 'Schedule design review meeting',
      createdAt: new Date(Date.now() - 7200000),
      context: {
        triggerPattern: 'Pending task with team dependency',
        relatedThoughts: ['glass-ui-system', 'design-feedback'],
        timeContext: 'Work hours optimal for collaboration'
      }
    },
    {
      id: '3',
      type: 'connection',
      title: 'Link Your Performance Ideas',
      description: 'Your thoughts on user performance metrics could be connected to your earlier ideas about cognitive load in interfaces.',
      confidence: 0.75,
      relevanceScore: 0.81,
      suggestedAction: 'Explore the connection between these concepts',
      createdAt: new Date(Date.now() - 10800000),
      context: {
        triggerPattern: 'Semantic similarity detected',
        relatedThoughts: ['performance-metrics', 'cognitive-load-ux']
      }
    }
  ];

  const mockConnections: ThoughtConnection[] = [
    {
      id: '1',
      sourceThoughtId: 'thought-123',
      targetThoughtId: 'thought-456',
      connectionType: 'semantic',
      strength: 0.89,
      discovered: true,
      sourceContent: 'Voice interfaces need to understand emotional context for better UX',
      targetContent: 'Emotional design patterns create more engaging user experiences',
      similarity: 0.89
    },
    {
      id: '2',
      sourceThoughtId: 'thought-789',
      targetThoughtId: 'thought-321',
      connectionType: 'causal',
      strength: 0.76,
      discovered: false,
      sourceContent: 'Performance optimization reduces cognitive load on users',
      targetContent: 'Faster interfaces lead to better user satisfaction scores',
      similarity: 0.76
    }
  ];

  const mockInsights: InsightReport[] = [
    {
      id: '1',
      type: 'weekly',
      title: 'Weekly Thinking Patterns Analysis',
      summary: 'This week showed increased focus on AI and user experience topics, with strong creative output during morning hours.',
      keyFindings: [
        'Peak creativity between 9-11 AM with 85% higher idea quality',
        'AI-related thoughts increased by 34% compared to last week',
        'Strong correlation between UX thoughts and afternoon productivity',
        'Weekend ideation sessions produced highest-rated concepts'
      ],
      recommendations: [
        'Schedule important brainstorming sessions during morning peak hours',
        'Explore AI-UX intersection more deeply - high engagement pattern detected',
        'Consider weekend dedicated thinking time for breakthrough ideas',
        'Block afternoon calendar for UX-focused deep work'
      ],
      generatedAt: new Date(Date.now() - 86400000),
      metrics: {
        thoughtsAnalyzed: 47,
        patternsIdentified: 12,
        productivityScore: 8.4,
        creativityIndex: 9.1
      }
    }
  ];

  useEffect(() => {
    // Initialize with mock data
    setSuggestions(mockSuggestions);
    setConnections(mockConnections);
    setInsights(mockInsights);
  }, []);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/cognitive/suggestions/generate', { method: 'POST' });
      // const newSuggestions = await response.json();

      // Mock delay for development
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add timestamp to existing suggestions to simulate new ones
      const newSuggestion: PredictiveSuggestion = {
        id: Date.now().toString(),
        type: 'idea',
        title: 'New AI-Generated Suggestion',
        description: 'Based on your latest activity patterns, consider exploring this new direction.',
        confidence: 0.82,
        relevanceScore: 0.87,
        suggestedAction: 'Research and prototype',
        createdAt: new Date(),
        context: {
          triggerPattern: 'Recent pattern analysis',
          timeContext: 'Real-time generation'
        }
      };

      setSuggestions(prev => [newSuggestion, ...prev]);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptSuggestion = async (suggestionId: string) => {
    try {
      // TODO: Implement actual API call
      // await fetch(`/api/cognitive/suggestions/${suggestionId}/accept`, { method: 'POST' });

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    }
  };

  const dismissSuggestion = async (suggestionId: string) => {
    try {
      // TODO: Implement actual API call
      // await fetch(`/api/cognitive/suggestions/${suggestionId}/dismiss`, { method: 'POST' });

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
    }
  };

  const discoverConnections = async () => {
    setIsGenerating(true);
    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/cognitive/connections/discover', { method: 'POST' });

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock new connection discovery
      const newConnection: ThoughtConnection = {
        id: Date.now().toString(),
        sourceThoughtId: 'thought-new1',
        targetThoughtId: 'thought-new2',
        connectionType: 'thematic',
        strength: 0.83,
        discovered: true,
        sourceContent: 'Recently discovered thought connection...',
        targetContent: 'Links to your pattern about...',
        similarity: 0.83
      };

      setConnections(prev => [newConnection, ...prev]);
    } catch (error) {
      console.error('Failed to discover connections:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-400';
    if (confidence >= 0.6) return 'text-orange-400';
    return 'text-amber-400';
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'semantic': return <Brain className="h-4 w-4" />;
      case 'temporal': return <Clock className="h-4 w-4" />;
      case 'causal': return <ArrowRight className="h-4 w-4" />;
      case 'thematic': return <Target className="h-4 w-4" />;
      default: return <Link2 className="h-4 w-4" />;
    }
  };

  const TabContent = () => {
    switch (activeTab) {
      case 'suggestions':
        return (
          <div className="space-y-6">
            {/* Generate Suggestions Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Predictive Suggestions</h3>
                <p className="text-white/60 text-sm">AI-powered recommendations based on your thinking patterns</p>
              </div>
              <GlassButton
                variant="orange"
                leftIcon={isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                onClick={generateSuggestions}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate New'}
              </GlassButton>
            </div>

            {/* Suggestions List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -300, scale: 0.95 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                      exit: { duration: 0.2 }
                    }}
                    layout
                  >
                    <GlassCard variant="orange" className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            {suggestion.type === 'idea' && <Lightbulb className="h-5 w-5 text-orange-400" />}
                            {suggestion.type === 'task' && <CheckCircle2 className="h-5 w-5 text-orange-400" />}
                            {suggestion.type === 'reminder' && <Clock className="h-5 w-5 text-orange-400" />}
                            {suggestion.type === 'connection' && <Link2 className="h-5 w-5 text-orange-400" />}
                          </div>
                          <div>
                            <span className="text-xs px-2 py-1 bg-orange-400/20 text-orange-300 rounded-lg uppercase font-medium">
                              {suggestion.type}
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-white/50">Confidence:</span>
                              <span className={cn("text-xs font-medium", getConfidenceColor(suggestion.confidence))}>
                                {Math.round(suggestion.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <GlassButton
                            variant="subtle"
                            size="sm"
                            leftIcon={<CheckCircle2 className="h-4 w-4" />}
                            onClick={() => acceptSuggestion(suggestion.id)}
                          >
                            Accept
                          </GlassButton>
                          <GlassButton
                            variant="subtle"
                            size="sm"
                            leftIcon={<X className="h-4 w-4" />}
                            onClick={() => dismissSuggestion(suggestion.id)}
                          >
                            Dismiss
                          </GlassButton>
                        </div>
                      </div>

                      <h4 className="text-lg font-semibold text-white mb-2">{suggestion.title}</h4>
                      <p className="text-white/70 text-sm mb-4">{suggestion.description}</p>

                      {suggestion.context && (
                        <div className="bg-white/5 rounded-lg p-3 mb-4">
                          <div className="text-xs text-white/50 mb-2">CONTEXT ANALYSIS</div>
                          {suggestion.context.triggerPattern && (
                            <div className="text-xs text-white/70 mb-1">
                              <span className="text-orange-400">Pattern:</span> {suggestion.context.triggerPattern}
                            </div>
                          )}
                          {suggestion.context.timeContext && (
                            <div className="text-xs text-white/70">
                              <span className="text-orange-400">Timing:</span> {suggestion.context.timeContext}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-white/50">
                          Suggested: {suggestion.createdAt.toLocaleTimeString()}
                        </div>
                        <GlassButton
                          variant="orange"
                          size="sm"
                          rightIcon={<ArrowRight className="h-4 w-4" />}
                        >
                          {suggestion.suggestedAction}
                        </GlassButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>

              {suggestions.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-orange-400/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white/70 mb-2">No Suggestions Yet</h3>
                  <p className="text-white/50 text-sm mb-6">Generate AI-powered suggestions based on your thinking patterns</p>
                  <GlassButton
                    variant="orange"
                    leftIcon={<Zap className="h-4 w-4" />}
                    onClick={generateSuggestions}
                  >
                    Generate Suggestions
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
        );

      case 'connections':
        return (
          <div className="space-y-6">
            {/* Discover Connections Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Thought Connections</h3>
                <p className="text-white/60 text-sm">Discover relationships between your ideas using semantic analysis</p>
              </div>
              <GlassButton
                variant="orange"
                leftIcon={isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                onClick={discoverConnections}
                disabled={isGenerating}
              >
                {isGenerating ? 'Analyzing...' : 'Discover New'}
              </GlassButton>
            </div>

            {/* Connections List */}
            <div className="space-y-4">
              {connections.map((connection, index) => (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <GlassCard variant="secondary" className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          {getConnectionTypeIcon(connection.connectionType)}
                        </div>
                        <div>
                          <span className="text-xs px-2 py-1 bg-blue-400/20 text-blue-300 rounded-lg uppercase font-medium">
                            {connection.connectionType}
                          </span>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-white/50">Strength:</span>
                            <span className="text-xs font-medium text-blue-400">
                              {Math.round(connection.strength * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      {connection.discovered && (
                        <span className="text-xs px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded-lg">
                          New Discovery
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Source Thought */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-xs text-white/50 mb-2">SOURCE THOUGHT</div>
                        <p className="text-white/80 text-sm">{connection.sourceContent}</p>
                      </div>

                      {/* Connection Arrow */}
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <ArrowRight className="h-4 w-4 text-orange-400" />
                        </div>
                      </div>

                      {/* Target Thought */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-xs text-white/50 mb-2">CONNECTED THOUGHT</div>
                        <p className="text-white/80 text-sm">{connection.targetContent}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                      <div className="text-xs text-white/50">
                        Similarity: {Math.round(connection.similarity * 100)}%
                      </div>
                      <GlassButton
                        variant="subtle"
                        size="sm"
                        rightIcon={<Eye className="h-4 w-4" />}
                      >
                        Explore Connection
                      </GlassButton>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}

              {connections.length === 0 && (
                <div className="text-center py-12">
                  <Link2 className="h-16 w-16 text-blue-400/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white/70 mb-2">No Connections Found</h3>
                  <p className="text-white/50 text-sm mb-6">Analyze your thoughts to discover hidden relationships</p>
                  <GlassButton
                    variant="secondary"
                    leftIcon={<Search className="h-4 w-4" />}
                    onClick={discoverConnections}
                  >
                    Discover Connections
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-6">
            {/* Insights Header */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Intelligence Reports</h3>
              <p className="text-white/60 text-sm">Deep analysis of your thinking patterns and productivity metrics</p>
            </div>

            {/* Insights List */}
            <div className="space-y-6">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <GlassCard variant="strong" className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white">{insight.title}</h4>
                            <span className="text-xs px-2 py-1 bg-purple-400/20 text-purple-300 rounded-lg uppercase font-medium">
                              {insight.type} Report
                            </span>
                          </div>
                        </div>
                        <p className="text-white/70 text-sm">{insight.summary}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/50">Generated</div>
                        <div className="text-xs text-white/70">{insight.generatedAt.toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-white">{insight.metrics.thoughtsAnalyzed}</div>
                        <div className="text-xs text-white/50">Thoughts Analyzed</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-orange-400">{insight.metrics.patternsIdentified}</div>
                        <div className="text-xs text-white/50">Patterns Found</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-emerald-400">{insight.metrics.productivityScore}</div>
                        <div className="text-xs text-white/50">Productivity Score</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-blue-400">{insight.metrics.creativityIndex}</div>
                        <div className="text-xs text-white/50">Creativity Index</div>
                      </div>
                    </div>

                    {/* Key Findings */}
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-white/90 mb-3">Key Findings</h5>
                      <div className="space-y-2">
                        {insight.keyFindings.map((finding, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <Star className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                            <span className="text-white/70 text-sm">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h5 className="text-sm font-medium text-white/90 mb-3">Recommendations</h5>
                      <div className="space-y-2">
                        {insight.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <Target className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-white/70 text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}

              {insights.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-purple-400/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white/70 mb-2">No Insights Generated</h3>
                  <p className="text-white/50 text-sm mb-6">Generate intelligence reports from your thinking patterns</p>
                  <GlassButton
                    variant="subtle"
                    leftIcon={<Activity className="h-4 w-4" />}
                  >
                    Generate Insights
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
        );

      case 'patterns':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Thinking Patterns</h3>
              <p className="text-white/60 text-sm">Adaptive analysis of your behavior and cognitive patterns</p>
            </div>

            {/* Coming Soon Placeholder */}
            <div className="text-center py-16">
              <Activity className="h-20 w-20 text-orange-400/30 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-white/70 mb-3">Pattern Analysis Coming Soon</h3>
              <p className="text-white/50 text-sm max-w-md mx-auto">
                Advanced behavior pattern recognition and trend analysis will be available in the next update.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('min-h-screen bg-black p-6', className)}>
      {/* Header */}
      <ScrollFadeWrapper>
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Cognitive Insights</h1>
              <p className="text-white/60">AI-powered intelligence for your thinking patterns</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-4 border-b border-white/10">
            {[
              { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
              { id: 'connections', label: 'Connections', icon: Link2 },
              { id: 'insights', label: 'Insights', icon: BarChart3 },
              { id: 'patterns', label: 'Patterns', icon: Activity }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                    activeTab === tab.id
                      ? 'text-orange-400 border-orange-400'
                      : 'text-white/60 border-transparent hover:text-white/80'
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </ScrollFadeWrapper>

      {/* Tab Content */}
      <ScrollFadeWrapper>
        <div className="max-w-6xl mx-auto">
          <TabContent />
        </div>
      </ScrollFadeWrapper>
    </div>
  );
};

export default CognitiveInsights;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  CheckCircle2,
  X,
  Clock,
  Star,
  TrendingUp,
  Target,
  ArrowRight,
  Zap,
  Brain,
  AlertTriangle,
  Loader2
} from 'lucide-react';

import { GlassCard, GlassButton } from '@/components/glass';
import { cn } from '@/lib/utils';

// PREDICTIVE SUGGESTIONS Component
// Proactive AI-powered suggestions based on user patterns and context

interface PredictiveSuggestion {
  id: string;
  type: 'task' | 'idea' | 'reminder' | 'connection' | 'optimization';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  confidence: number;
  relevanceScore: number;
  suggestedAction: string;
  estimatedTimeToComplete?: string;
  createdAt: Date;
  expiresAt?: Date;
  context: {
    triggerPattern: string;
    relatedThoughts: string[];
    timeContext: string;
    userState?: 'focused' | 'creative' | 'planning' | 'reviewing';
    locationContext?: string;
    emotionalContext?: 'productive' | 'stressed' | 'inspired' | 'tired';
  };
  metadata?: {
    source: 'pattern_analysis' | 'semantic_similarity' | 'temporal_correlation' | 'user_behavior';
    modelVersion: string;
    processingTime: number;
  };
}

interface PredictiveSuggestionsProps {
  userId?: string;
  limit?: number;
  autoRefresh?: boolean;
  className?: string;
  onSuggestionAction?: (action: 'accept' | 'dismiss' | 'defer', suggestionId: string) => void;
}

export const PredictiveSuggestions: React.FC<PredictiveSuggestionsProps> = ({
  userId,
  limit = 10,
  autoRefresh = true,
  className,
  onSuggestionAction
}) => {
  const [suggestions, setSuggestions] = useState<PredictiveSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Enhanced mock suggestions with rich context
  const generateMockSuggestions = (): PredictiveSuggestion[] => [
    {
      id: '1',
      type: 'idea',
      priority: 'high',
      title: 'Expand Voice AI Multimodal Interface Concept',
      description: 'Your recent thoughts about voice interfaces and emotional UX show high synergy. Consider exploring voice interfaces that adapt to user emotional state through tone analysis and contextual understanding.',
      confidence: 0.89,
      relevanceScore: 0.94,
      suggestedAction: 'Create detailed specification and prototype',
      estimatedTimeToComplete: '2-3 hours',
      createdAt: new Date(Date.now() - 900000), // 15 minutes ago
      expiresAt: new Date(Date.now() + 86400000 * 3), // 3 days
      context: {
        triggerPattern: 'High engagement with AI + UX topics (3 related thoughts in 24h)',
        relatedThoughts: ['voice-ai-interface-v2', 'emotional-ux-design', 'adaptive-interfaces'],
        timeContext: 'Peak creative hours detected (morning productivity boost)',
        userState: 'creative',
        emotionalContext: 'inspired'
      },
      metadata: {
        source: 'semantic_similarity',
        modelVersion: 'cognitive-v2.1',
        processingTime: 147
      }
    },
    {
      id: '2',
      type: 'task',
      priority: 'urgent',
      title: 'Follow Up: Design System Implementation Review',
      description: 'You mentioned reviewing the glass component system 2 days ago, and the design team tagged you in a related discussion 4 hours ago. This appears to be blocking other team members.',
      confidence: 0.96,
      relevanceScore: 0.91,
      suggestedAction: 'Schedule 30-minute review meeting today',
      estimatedTimeToComplete: '30 minutes',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      expiresAt: new Date(Date.now() + 86400000), // 1 day
      context: {
        triggerPattern: 'Pending task with team dependency + recent mention',
        relatedThoughts: ['glass-ui-system', 'design-feedback', 'component-architecture'],
        timeContext: 'Work hours optimal for collaboration (team available)',
        userState: 'planning',
        emotionalContext: 'productive'
      },
      metadata: {
        source: 'temporal_correlation',
        modelVersion: 'cognitive-v2.1',
        processingTime: 89
      }
    },
    {
      id: '3',
      type: 'connection',
      priority: 'medium',
      title: 'Link Performance Metrics with Cognitive Load Theory',
      description: 'Your thoughts on user performance metrics (yesterday) and cognitive load in interfaces (3 days ago) show 87% semantic similarity. Exploring this connection could lead to breakthrough insights.',
      confidence: 0.75,
      relevanceScore: 0.83,
      suggestedAction: 'Create mind map connecting these concepts',
      estimatedTimeToComplete: '45 minutes',
      createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      context: {
        triggerPattern: 'Semantic similarity above threshold (0.87)',
        relatedThoughts: ['performance-metrics-ux', 'cognitive-load-theory', 'user-experience-optimization'],
        timeContext: 'Afternoon analysis time (historical pattern)',
        userState: 'reviewing',
        emotionalContext: 'focused'
      },
      metadata: {
        source: 'pattern_analysis',
        modelVersion: 'cognitive-v2.1',
        processingTime: 203
      }
    },
    {
      id: '4',
      type: 'optimization',
      priority: 'low',
      title: 'Optimize Morning Brainstorming Routine',
      description: 'Data shows your idea quality peaks at 9:47 AM on average, but you often start ideation at 10:30 AM. Shifting your schedule could increase creative output by 23%.',
      confidence: 0.81,
      relevanceScore: 0.76,
      suggestedAction: 'Block calendar 9:30-10:30 AM for creative work',
      estimatedTimeToComplete: '5 minutes to reschedule',
      createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
      context: {
        triggerPattern: 'Productivity pattern analysis (14-day trend)',
        relatedThoughts: ['morning-productivity', 'creative-scheduling', 'optimal-timing'],
        timeContext: 'Pattern detected across 2-week period',
        userState: 'planning',
        emotionalContext: 'productive'
      },
      metadata: {
        source: 'user_behavior',
        modelVersion: 'cognitive-v2.1',
        processingTime: 412
      }
    },
    {
      id: '5',
      type: 'reminder',
      priority: 'medium',
      title: 'Weekend Innovation Session Opportunity',
      description: 'Your weekend thinking sessions have produced 78% of your highest-rated ideas. You haven\'t scheduled dedicated thinking time for this weekend yet.',
      confidence: 0.84,
      relevanceScore: 0.88,
      suggestedAction: 'Block 2-hour weekend innovation session',
      estimatedTimeToComplete: '2 minutes to schedule',
      createdAt: new Date(Date.now() - 10800000), // 3 hours ago
      expiresAt: new Date(Date.now() + 86400000 * 2), // 2 days
      context: {
        triggerPattern: 'Weekend productivity correlation + missing calendar block',
        relatedThoughts: ['weekend-creativity', 'innovation-sessions', 'breakthrough-ideas'],
        timeContext: 'Friday afternoon - optimal for weekend planning',
        userState: 'planning',
        emotionalContext: 'inspired'
      },
      metadata: {
        source: 'temporal_correlation',
        modelVersion: 'cognitive-v2.1',
        processingTime: 178
      }
    }
  ];

  useEffect(() => {
    loadSuggestions();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadSuggestions(true); // Silent refresh
      }, 300000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [userId, limit, autoRefresh]);

  const loadSuggestions = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/cognitive/suggestions?userId=${userId}&limit=${limit}`);
      // const data = await response.json();

      // Mock delay for development
      await new Promise(resolve => setTimeout(resolve, silent ? 500 : 1000));

      const mockSuggestions = generateMockSuggestions();
      setSuggestions(mockSuggestions.slice(0, limit));
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load suggestions. Please try again.');
      console.error('Error loading suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewSuggestions = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/cognitive/suggestions/generate', { method: 'POST' });
      // const newSuggestions = await response.json();

      await new Promise(resolve => setTimeout(resolve, 2000));

      const newSuggestion: PredictiveSuggestion = {
        id: Date.now().toString(),
        type: 'idea',
        priority: 'medium',
        title: 'Real-time Generated Suggestion',
        description: 'Fresh AI analysis suggests exploring this new direction based on your latest activity patterns.',
        confidence: 0.78,
        relevanceScore: 0.82,
        suggestedAction: 'Research and evaluate potential',
        estimatedTimeToComplete: '1-2 hours',
        createdAt: new Date(),
        context: {
          triggerPattern: 'Real-time pattern analysis',
          relatedThoughts: ['recent-activity'],
          timeContext: 'Generated on demand',
          userState: 'focused'
        },
        metadata: {
          source: 'pattern_analysis',
          modelVersion: 'cognitive-v2.1',
          processingTime: 1847
        }
      };

      setSuggestions(prev => [newSuggestion, ...prev.slice(0, limit - 1)]);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to generate new suggestions. Please try again.');
      console.error('Error generating suggestions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionAction = async (action: 'accept' | 'dismiss' | 'defer', suggestion: PredictiveSuggestion) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/cognitive/suggestions/${suggestion.id}/${action}`, { method: 'POST' });

      // Remove suggestion from UI
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

      // Notify parent component
      onSuggestionAction?.(action, suggestion.id);
    } catch (err) {
      setError(`Failed to ${action} suggestion. Please try again.`);
      console.error(`Error ${action}ing suggestion:`, err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'high': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'low': return 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'idea': return <Lightbulb className="h-5 w-5" />;
      case 'task': return <CheckCircle2 className="h-5 w-5" />;
      case 'reminder': return <Clock className="h-5 w-5" />;
      case 'connection': return <ArrowRight className="h-5 w-5" />;
      case 'optimization': return <TrendingUp className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-400';
    if (confidence >= 0.6) return 'text-orange-400';
    return 'text-amber-400';
  };

  if (isLoading && suggestions.length === 0) {
    return (
      <div className={cn('p-6', className)}>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400 mx-auto mb-4" />
          <p className="text-white/60">Loading intelligent suggestions...</p>
        </div>
      </div>
    );
  }

  if (error && suggestions.length === 0) {
    return (
      <div className={cn('p-6', className)}>
        <div className="text-center py-12">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-white/60 mb-4">{error}</p>
          <GlassButton variant="orange" onClick={() => loadSuggestions()}>
            Try Again
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Predictive Suggestions</h3>
          <p className="text-white/60 text-sm">
            AI-powered recommendations • {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <GlassButton
            variant="subtle"
            size="sm"
            leftIcon={<Zap className="h-4 w-4" />}
            onClick={() => loadSuggestions()}
            disabled={isLoading}
          >
            Refresh
          </GlassButton>
          <GlassButton
            variant="orange"
            leftIcon={isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            onClick={generateNewSuggestions}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate New'}
          </GlassButton>
        </div>
      </div>

      {/* Error Banner */}
      {error && suggestions.length > 0 && (
        <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

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
                delay: index * 0.05,
                exit: { duration: 0.2 }
              }}
              layout
            >
              <GlassCard variant="orange" className="p-6 hover:bg-orange-500/5 transition-colors">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", getPriorityColor(suggestion.priority))}>
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs px-2 py-1 bg-orange-400/20 text-orange-300 rounded-lg uppercase font-medium">
                          {suggestion.type}
                        </span>
                        <span className={cn("text-xs px-2 py-1 rounded-lg uppercase font-medium border", getPriorityColor(suggestion.priority))}>
                          {suggestion.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-white/50">
                        <span>Confidence: <span className={getConfidenceColor(suggestion.confidence)}>{Math.round(suggestion.confidence * 100)}%</span></span>
                        <span>Relevance: <span className="text-blue-400">{Math.round(suggestion.relevanceScore * 100)}%</span></span>
                        {suggestion.estimatedTimeToComplete && (
                          <span>Time: <span className="text-purple-400">{suggestion.estimatedTimeToComplete}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GlassButton
                      variant="subtle"
                      size="sm"
                      leftIcon={<Clock className="h-4 w-4" />}
                      onClick={() => handleSuggestionAction('defer', suggestion)}
                    >
                      Later
                    </GlassButton>
                    <GlassButton
                      variant="subtle"
                      size="sm"
                      leftIcon={<X className="h-4 w-4" />}
                      onClick={() => handleSuggestionAction('dismiss', suggestion)}
                    >
                      Dismiss
                    </GlassButton>
                    <GlassButton
                      variant="orange"
                      size="sm"
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() => handleSuggestionAction('accept', suggestion)}
                    >
                      Accept
                    </GlassButton>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-white mb-2">{suggestion.title}</h4>
                  <p className="text-white/70 text-sm leading-relaxed">{suggestion.description}</p>
                </div>

                {/* Context Analysis */}
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <div className="text-xs text-orange-400 font-medium mb-3 uppercase tracking-wide">Context Analysis</div>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <Target className="h-3 w-3 text-orange-400 mt-1 flex-shrink-0" />
                      <div className="text-xs text-white/70">
                        <span className="text-orange-300 font-medium">Pattern:</span> {suggestion.context.triggerPattern}
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Clock className="h-3 w-3 text-blue-400 mt-1 flex-shrink-0" />
                      <div className="text-xs text-white/70">
                        <span className="text-blue-300 font-medium">Timing:</span> {suggestion.context.timeContext}
                      </div>
                    </div>
                    {suggestion.context.userState && (
                      <div className="flex items-start space-x-2">
                        <Brain className="h-3 w-3 text-purple-400 mt-1 flex-shrink-0" />
                        <div className="text-xs text-white/70">
                          <span className="text-purple-300 font-medium">State:</span> {suggestion.context.userState}
                          {suggestion.context.emotionalContext && ` • ${suggestion.context.emotionalContext}`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/50">
                    Suggested {suggestion.createdAt.toLocaleTimeString()}
                    {suggestion.expiresAt && (
                      <span className="ml-2">• Expires {suggestion.expiresAt.toLocaleDateString()}</span>
                    )}
                  </div>
                  <GlassButton
                    variant="orange"
                    size="sm"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    onClick={() => handleSuggestionAction('accept', suggestion)}
                  >
                    {suggestion.suggestedAction}
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {suggestions.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Brain className="h-16 w-16 text-orange-400/30 mx-auto mb-6" />
            <h3 className="text-lg font-medium text-white/70 mb-3">No Suggestions Available</h3>
            <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
              Generate AI-powered suggestions based on your thinking patterns and recent activity.
            </p>
            <GlassButton
              variant="orange"
              leftIcon={<Zap className="h-4 w-4" />}
              onClick={generateNewSuggestions}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Suggestions'}
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveSuggestions;
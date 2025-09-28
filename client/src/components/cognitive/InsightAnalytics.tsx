import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Star,
  Target,
  Clock,
  Brain,
  Zap,
  Calendar,
  Eye,
  Download,
  RefreshCw,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  Lightbulb,
  Users,
  Loader2
} from 'lucide-react';

import { GlassCard, GlassButton } from '@/components/glass';
import { BentoGrid, BentoItem } from '@/components/layout/BentoGrid';
import { ScrollFadeWrapper, ScrollRevealCard } from '@/components/animations/ScrollFadeWrapper';
import { cn } from '@/lib/utils';

// INSIGHT ANALYTICS Component
// Advanced analytics dashboard for thinking patterns and productivity insights

interface InsightReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  title: string;
  summary: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    thoughtsAnalyzed: number;
    patternsIdentified: number;
    productivityScore: number;
    creativityIndex: number;
    focusTime: number;
    ideaQuality: number;
  };
  keyFindings: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
  }>;
  recommendations: Array<{
    priority: 'urgent' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImpact: string;
    estimatedTime: string;
    category: 'productivity' | 'creativity' | 'workflow' | 'health';
  }>;
  trends: Array<{
    metric: string;
    value: number;
    change: number;
    direction: 'up' | 'down' | 'stable';
    period: string;
  }>;
}

interface ThinkingPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  strength: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  category: 'temporal' | 'thematic' | 'behavioral' | 'cognitive';
  examples: string[];
  insights: string[];
  lastDetected: Date;
}

interface ProductivityMetric {
  name: string;
  value: number;
  change: number;
  target?: number;
  unit: string;
  category: 'time' | 'quality' | 'volume' | 'efficiency';
  description: string;
}

interface InsightAnalyticsProps {
  className?: string;
  timeframe?: 'week' | 'month' | 'quarter';
  userId?: string;
}

export const InsightAnalytics: React.FC<InsightAnalyticsProps> = ({
  className,
  timeframe = 'week',
  userId
}) => {
  const [insights, setInsights] = useState<InsightReport[]>([]);
  const [patterns, setPatterns] = useState<ThinkingPattern[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<InsightReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'reports'>('overview');

  // Enhanced mock data
  const generateMockInsights = (): InsightReport[] => [
    {
      id: '1',
      type: 'weekly',
      title: 'Weekly Intelligence Analysis',
      summary: 'Exceptional week with 34% increase in creative output and strong pattern convergence in AI-UX thinking.',
      generatedAt: new Date(),
      period: {
        start: new Date(Date.now() - 604800000), // 1 week ago
        end: new Date()
      },
      metrics: {
        thoughtsAnalyzed: 87,
        patternsIdentified: 23,
        productivityScore: 8.7,
        creativityIndex: 9.2,
        focusTime: 42.5,
        ideaQuality: 8.9
      },
      keyFindings: [
        {
          type: 'positive',
          title: 'Peak Creative Period Identified',
          description: 'Morning hours (9:15-11:30 AM) show 89% higher idea quality scores and breakthrough concept generation',
          impact: 'high',
          confidence: 0.94
        },
        {
          type: 'positive',
          title: 'AI-UX Convergence Pattern',
          description: 'Strong thematic clustering around AI interfaces and user experience design showing potential for innovation',
          impact: 'high',
          confidence: 0.87
        },
        {
          type: 'negative',
          title: 'Afternoon Productivity Dip',
          description: 'Consistent 45% decrease in cognitive performance between 2-4 PM across all thinking categories',
          impact: 'medium',
          confidence: 0.91
        },
        {
          type: 'neutral',
          title: 'Weekend Creative Surge',
          description: 'Saturday morning sessions produced 67% of highest-rated innovative concepts this period',
          impact: 'medium',
          confidence: 0.83
        }
      ],
      recommendations: [
        {
          priority: 'high',
          title: 'Optimize Morning Creative Blocks',
          description: 'Schedule breakthrough thinking sessions during 9:15-11:30 AM window when creativity peaks',
          expectedImpact: '25-40% increase in innovative output',
          estimatedTime: '5 minutes to reschedule',
          category: 'productivity'
        },
        {
          priority: 'medium',
          title: 'Develop AI-UX Innovation Framework',
          description: 'Create structured approach to explore convergence between AI technology and user experience',
          expectedImpact: 'Potential breakthrough product concepts',
          estimatedTime: '2-3 hours initial framework',
          category: 'creativity'
        },
        {
          priority: 'medium',
          title: 'Afternoon Energy Management',
          description: 'Implement short meditation or physical activity during 2-4 PM energy dip',
          expectedImpact: '15-20% productivity improvement',
          estimatedTime: '10-15 minutes daily',
          category: 'health'
        }
      ],
      trends: [
        { metric: 'Creativity Index', value: 9.2, change: 1.4, direction: 'up', period: 'vs last week' },
        { metric: 'Focus Time', value: 42.5, change: -2.1, direction: 'down', period: 'hours this week' },
        { metric: 'Idea Quality', value: 8.9, change: 0.8, direction: 'up', period: 'average rating' },
        { metric: 'Pattern Recognition', value: 23, change: 7, direction: 'up', period: 'patterns identified' }
      ]
    }
  ];

  const generateMockPatterns = (): ThinkingPattern[] => [
    {
      id: '1',
      name: 'Morning Creative Peak',
      description: 'Consistent high-quality idea generation during 9-11 AM timeframe with 89% success rate',
      frequency: 0.94,
      strength: 0.91,
      trend: 'increasing',
      category: 'temporal',
      examples: [
        'Best breakthrough concepts generated at 9:47 AM average',
        '78% of innovative solutions emerge in this window',
        'Creative flow state consistently achieved during morning hours'
      ],
      insights: [
        'Circadian rhythm optimization for cognitive creativity',
        'Natural energy alignment with demanding intellectual tasks',
        'Minimal distractions enhance deep thinking capacity'
      ],
      lastDetected: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      name: 'AI-UX Convergence Thinking',
      description: 'Strong thematic pattern linking artificial intelligence concepts with user experience design principles',
      frequency: 0.78,
      strength: 0.85,
      trend: 'increasing',
      category: 'thematic',
      examples: [
        'Voice interface emotional adaptation concepts',
        'AI-powered personalization in design systems',
        'Ethical AI considerations in user interaction design'
      ],
      insights: [
        'Interdisciplinary innovation opportunity identified',
        'Potential for breakthrough product development',
        'Market gap in human-centered AI interfaces'
      ],
      lastDetected: new Date(Date.now() - 7200000)
    },
    {
      id: '3',
      name: 'Weekend Innovation Sessions',
      description: 'Saturday and Sunday thinking sessions produce disproportionately high-value creative output',
      frequency: 0.67,
      strength: 0.82,
      trend: 'stable',
      category: 'temporal',
      examples: [
        '67% of highest-rated ideas generated on weekends',
        'Longer uninterrupted thinking periods enable deeper insights',
        'Relaxed mental state correlates with creative breakthroughs'
      ],
      insights: [
        'Work-life balance enhances creative thinking',
        'Pressure-free environment optimal for innovation',
        'Extended time blocks essential for complex problem solving'
      ],
      lastDetected: new Date(Date.now() - 172800000)
    },
    {
      id: '4',
      name: 'Performance-Cognitive Load Connection',
      description: 'Recurring pattern linking user performance metrics with cognitive load theory applications',
      frequency: 0.71,
      strength: 0.76,
      trend: 'increasing',
      category: 'cognitive',
      examples: [
        'Interface complexity directly impacts user task completion',
        'Cognitive load reduction strategies improve user satisfaction',
        'Mental effort measurement in design decision making'
      ],
      insights: [
        'Scientific approach to user experience optimization',
        'Quantifiable design impact methodology',
        'Psychology-driven interface development framework'
      ],
      lastDetected: new Date(Date.now() - 14400000)
    }
  ];

  const mockProductivityMetrics: ProductivityMetric[] = [
    {
      name: 'Deep Focus Sessions',
      value: 12,
      change: 3,
      target: 15,
      unit: 'sessions/week',
      category: 'time',
      description: 'Uninterrupted thinking periods of 25+ minutes'
    },
    {
      name: 'Idea Quality Score',
      value: 8.9,
      change: 0.8,
      target: 9.0,
      unit: 'avg rating',
      category: 'quality',
      description: 'AI-evaluated concept innovation and feasibility'
    },
    {
      name: 'Thought Capture Rate',
      value: 34,
      change: -2,
      unit: 'thoughts/day',
      category: 'volume',
      description: 'Daily idea and insight documentation frequency'
    },
    {
      name: 'Pattern Recognition',
      value: 23,
      change: 7,
      unit: 'patterns/week',
      category: 'efficiency',
      description: 'AI-identified thinking patterns and connections'
    }
  ];

  useEffect(() => {
    loadAnalytics();
  }, [timeframe, userId]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API calls
      // const [insightsRes, patternsRes] = await Promise.all([
      //   fetch(`/api/cognitive/insights?timeframe=${timeframe}&userId=${userId}`),
      //   fetch(`/api/cognitive/patterns?userId=${userId}`)
      // ]);

      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockInsights = generateMockInsights();
      const mockPatterns = generateMockPatterns();

      setInsights(mockInsights);
      setPatterns(mockPatterns);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewReport = async () => {
    setIsGenerating(true);
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/cognitive/insights/generate', { method: 'POST' });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const newReport: InsightReport = {
        id: Date.now().toString(),
        type: 'custom',
        title: 'Real-Time Intelligence Report',
        summary: 'Fresh analysis of current thinking patterns with latest behavioral insights.',
        generatedAt: new Date(),
        period: {
          start: new Date(Date.now() - 86400000),
          end: new Date()
        },
        metrics: {
          thoughtsAnalyzed: 15,
          patternsIdentified: 4,
          productivityScore: 7.8,
          creativityIndex: 8.1,
          focusTime: 8.5,
          ideaQuality: 7.9
        },
        keyFindings: [
          {
            type: 'positive',
            title: 'New Pattern Discovery',
            description: 'Emerging trend in cognitive enhancement thinking with technology integration focus',
            impact: 'medium',
            confidence: 0.78
          }
        ],
        recommendations: [
          {
            priority: 'medium',
            title: 'Explore Cognitive Enhancement Trend',
            description: 'Investigate the emerging pattern for potential innovation opportunities',
            expectedImpact: 'Could lead to new product concepts',
            estimatedTime: '1-2 hours research',
            category: 'creativity'
          }
        ],
        trends: [
          { metric: 'New Patterns', value: 4, change: 4, direction: 'up', period: 'since last report' }
        ]
      };

      setInsights(prev => [newReport, ...prev]);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <ArrowUp className="h-4 w-4 text-emerald-400" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-400" />;
      default: return <Minus className="h-4 w-4 text-amber-400" />;
    }
  };

  const getFindingIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4 text-blue-400" />;
    }
  };

  const getPatternTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-emerald-400';
      case 'decreasing': return 'text-red-400';
      default: return 'text-amber-400';
    }
  };

  if (isLoading && insights.length === 0) {
    return (
      <div className={cn('p-6', className)}>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/60">Generating intelligence insights...</p>
        </div>
      </div>
    );
  }

  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <BentoGrid layout="dashboard" className="mb-8">
        {mockProductivityMetrics.map((metric, index) => (
          <ScrollRevealCard key={metric.name} className="md:col-span-2" index={index}>
            <BentoItem size="sm" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-white/90">{metric.name}</h4>
                {getTrendIcon(metric.change > 0 ? 'up' : metric.change < 0 ? 'down' : 'stable')}
              </div>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-2xl font-bold text-white">{metric.value}</span>
                <span className="text-sm text-white/60">{metric.unit}</span>
              </div>
              <div className="flex items-center space-x-2 mb-3">
                <span className={cn(
                  "text-xs font-medium",
                  metric.change > 0 ? "text-emerald-400" : metric.change < 0 ? "text-red-400" : "text-amber-400"
                )}>
                  {metric.change > 0 ? '+' : ''}{metric.change}
                </span>
                <span className="text-xs text-white/50">vs last {timeframe}</span>
              </div>
              {metric.target && (
                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <motion.div
                    className="h-full bg-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(metric.value / metric.target) * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
              )}
              <p className="text-xs text-white/60">{metric.description}</p>
            </BentoItem>
          </ScrollRevealCard>
        ))}
      </BentoGrid>

      {/* Latest Insights */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Latest Intelligence Report</h3>
          <GlassCard variant="strong" className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">{insights[0].title}</h4>
                <p className="text-white/70 text-sm">{insights[0].summary}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/50">Generated</div>
                <div className="text-xs text-white/70">{insights[0].generatedAt.toLocaleDateString()}</div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {Object.entries(insights[0].metrics).map(([key, value]) => (
                <div key={key} className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-400">{value}</div>
                  <div className="text-xs text-white/50 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
              ))}
            </div>

            {/* Top Findings */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-white/90">Key Findings</h5>
              {insights[0].keyFindings.slice(0, 3).map((finding, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-white/5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {getFindingIcon(finding.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white/90 text-sm font-medium">{finding.title}</span>
                      <span className="text-xs px-2 py-1 bg-orange-400/20 text-orange-300 rounded">
                        {Math.round(finding.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-white/70 text-xs">{finding.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div className="text-xs text-white/50">
                {insights[0].metrics.thoughtsAnalyzed} thoughts analyzed • {insights[0].metrics.patternsIdentified} patterns found
              </div>
              <GlassButton
                variant="orange"
                size="sm"
                rightIcon={<Eye className="h-4 w-4" />}
                onClick={() => setSelectedInsight(insights[0])}
              >
                View Full Report
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );

  const PatternsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patterns.map((pattern, index) => (
          <motion.div
            key={pattern.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <GlassCard variant="secondary" className="p-6 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Brain className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{pattern.name}</h4>
                    <span className="text-xs px-2 py-1 bg-purple-400/20 text-purple-300 rounded-lg uppercase">
                      {pattern.category}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("text-sm font-medium", getPatternTrendColor(pattern.trend))}>
                    {pattern.trend}
                  </div>
                  <div className="text-xs text-white/50">
                    {Math.round(pattern.frequency * 100)}% frequency
                  </div>
                </div>
              </div>

              <p className="text-white/70 text-sm mb-4">{pattern.description}</p>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-xs text-white/50 mb-2">PATTERN STRENGTH</div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      className="h-full bg-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pattern.strength * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                  <div className="text-xs text-purple-400 mt-1">{Math.round(pattern.strength * 100)}% strength</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-white/50 mb-2">EXAMPLES</div>
                  <div className="space-y-1">
                    {pattern.examples.slice(0, 2).map((example, idx) => (
                      <div key={idx} className="text-xs text-white/70 flex items-start space-x-2">
                        <Star className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-white/50 mb-2">KEY INSIGHTS</div>
                  <div className="space-y-1">
                    {pattern.insights.slice(0, 2).map((insight, idx) => (
                      <div key={idx} className="text-xs text-white/70 flex items-start space-x-2">
                        <Target className="h-3 w-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-white/50">
                  Last detected: {pattern.lastDetected.toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < Math.floor(pattern.strength * 5)
                          ? "text-purple-400 fill-purple-400"
                          : "text-white/20"
                      )}
                    />
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {patterns.length === 0 && (
        <div className="text-center py-16">
          <Activity className="h-16 w-16 text-purple-400/30 mx-auto mb-6" />
          <h3 className="text-lg font-medium text-white/70 mb-3">No Patterns Detected Yet</h3>
          <p className="text-white/50 text-sm">Continue using the system to build pattern recognition data.</p>
        </div>
      )}
    </div>
  );

  const ReportsTab = () => (
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
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{insight.title}</h4>
                    <span className="text-xs px-2 py-1 bg-orange-400/20 text-orange-300 rounded-lg uppercase">
                      {insight.type} Report
                    </span>
                  </div>
                </div>
                <p className="text-white/70 text-sm">{insight.summary}</p>
              </div>
              <div className="flex items-center space-x-2">
                <GlassButton
                  variant="subtle"
                  size="sm"
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Export
                </GlassButton>
                <GlassButton
                  variant="orange"
                  size="sm"
                  leftIcon={<Eye className="h-4 w-4" />}
                  onClick={() => setSelectedInsight(insight)}
                >
                  View Details
                </GlassButton>
              </div>
            </div>

            {/* Trends */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {insight.trends.map((trend, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/60">{trend.metric}</span>
                    {getTrendIcon(trend.direction)}
                  </div>
                  <div className="text-lg font-bold text-white">{trend.value}</div>
                  <div className="text-xs text-white/50">{trend.period}</div>
                </div>
              ))}
            </div>

            {/* Top Recommendations */}
            <div>
              <h5 className="text-sm font-medium text-white/90 mb-3">Top Recommendations</h5>
              <div className="space-y-2">
                {insight.recommendations.slice(0, 2).map((rec, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-purple-500/10">
                    <Target className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white/90 text-sm font-medium">{rec.title}</span>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded uppercase font-medium",
                          rec.priority === 'high' ? "bg-red-400/20 text-red-300" :
                          rec.priority === 'medium' ? "bg-orange-400/20 text-orange-300" :
                          "bg-emerald-400/20 text-emerald-300"
                        )}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-white/70 text-xs mb-1">{rec.description}</p>
                      <div className="text-xs text-white/50">
                        Expected impact: {rec.expectedImpact} • Time: {rec.estimatedTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}

      {insights.length === 0 && (
        <div className="text-center py-16">
          <BarChart3 className="h-16 w-16 text-orange-400/30 mx-auto mb-6" />
          <h3 className="text-lg font-medium text-white/70 mb-3">No Reports Generated</h3>
          <p className="text-white/50 text-sm mb-6">Generate your first intelligence report to see insights.</p>
          <GlassButton
            variant="orange"
            leftIcon={<Zap className="h-4 w-4" />}
            onClick={generateNewReport}
          >
            Generate Report
          </GlassButton>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Intelligence Analytics</h3>
          <p className="text-white/60 text-sm">
            Deep insights into your thinking patterns and productivity metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <GlassButton
            variant="subtle"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={loadAnalytics}
            disabled={isLoading}
          >
            Refresh
          </GlassButton>
          <GlassButton
            variant="orange"
            leftIcon={isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            onClick={generateNewReport}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </GlassButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-4 border-b border-white/10">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'patterns', label: 'Patterns', icon: Brain },
          { id: 'reports', label: 'Reports', icon: BarChart3 }
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

      {/* Tab Content */}
      <ScrollFadeWrapper>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'patterns' && <PatternsTab />}
        {activeTab === 'reports' && <ReportsTab />}
      </ScrollFadeWrapper>

      {/* Detailed Report Modal */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedInsight(null)}
          >
            <motion.div
              className="bg-black/90 border border-white/20 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedInsight.title}</h2>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-white/50 hover:text-white/80"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Full report content would go here */}
              <div className="space-y-6">
                <p className="text-white/70">{selectedInsight.summary}</p>

                {/* Detailed findings, recommendations, etc. */}
                {/* Implementation truncated for brevity */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InsightAnalytics;
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  Brain,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Clock,
  Target,
  Zap,
  Star,
  TrendingUp,
  Loader2,
  RefreshCw,
  Settings,
  Maximize2,
  X
} from 'lucide-react';

import { GlassCard, GlassButton, GlassInput } from '@/components/glass';
import { cn } from '@/lib/utils';

// CONNECTION VISUALIZATION Component
// Interactive thought connection discovery and relationship mapping

interface ThoughtConnection {
  id: string;
  sourceThoughtId: string;
  targetThoughtId: string;
  connectionType: 'semantic' | 'temporal' | 'causal' | 'thematic' | 'creative';
  strength: number;
  discovered: boolean;
  sourceContent: string;
  targetContent: string;
  similarity: number;
  metadata: {
    discoveredAt: Date;
    lastUpdated: Date;
    userConfirmed?: boolean;
    confidenceScore: number;
    relatedConnections?: string[];
  };
  insights?: {
    pattern: string;
    potentialValue: string;
    suggestedAction: string;
  };
}

interface ConnectionNode {
  id: string;
  content: string;
  category: string;
  createdAt: Date;
  x?: number;
  y?: number;
  connectionCount: number;
  importance: number;
}

interface ConnectionVisualizationProps {
  className?: string;
  maxConnections?: number;
  showVisualization?: boolean;
  onConnectionSelect?: (connection: ThoughtConnection) => void;
}

export const ConnectionVisualization: React.FC<ConnectionVisualizationProps> = ({
  className,
  maxConnections = 50,
  showVisualization = true,
  onConnectionSelect
}) => {
  const [connections, setConnections] = useState<ThoughtConnection[]>([]);
  const [nodes, setNodes] = useState<ConnectionNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ThoughtConnection | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const svgRef = useRef<SVGSVGElement>(null);

  // Enhanced mock data with rich relationships
  const generateMockConnections = (): ThoughtConnection[] => [
    {
      id: '1',
      sourceThoughtId: 'thought-ai-voice',
      targetThoughtId: 'thought-emotional-ux',
      connectionType: 'semantic',
      strength: 0.91,
      discovered: true,
      sourceContent: 'Voice interfaces need sophisticated emotion recognition to create truly intuitive user experiences that adapt to user state',
      targetContent: 'Emotional design patterns in UX create deeper user engagement by responding to psychological and contextual cues',
      similarity: 0.91,
      metadata: {
        discoveredAt: new Date(Date.now() - 3600000),
        lastUpdated: new Date(Date.now() - 1800000),
        userConfirmed: true,
        confidenceScore: 0.94,
        relatedConnections: ['2', '3']
      },
      insights: {
        pattern: 'Strong convergence between AI technology and human psychology',
        potentialValue: 'Could lead to breakthrough in adaptive interface design',
        suggestedAction: 'Develop prototype combining voice AI with emotion detection'
      }
    },
    {
      id: '2',
      sourceThoughtId: 'thought-performance-metrics',
      targetThoughtId: 'thought-cognitive-load',
      connectionType: 'causal',
      strength: 0.84,
      discovered: false,
      sourceContent: 'User performance metrics show direct correlation with interface complexity and cognitive overhead in digital experiences',
      targetContent: 'Cognitive load theory suggests that reducing mental effort improves task completion and user satisfaction significantly',
      similarity: 0.84,
      metadata: {
        discoveredAt: new Date(Date.now() - 7200000),
        lastUpdated: new Date(Date.now() - 3600000),
        confidenceScore: 0.87,
        relatedConnections: ['1', '4']
      },
      insights: {
        pattern: 'Performance optimization through cognitive load reduction',
        potentialValue: 'Foundation for user-centered design methodology',
        suggestedAction: 'Create cognitive load assessment framework'
      }
    },
    {
      id: '3',
      sourceThoughtId: 'thought-creative-timing',
      targetThoughtId: 'thought-productivity-patterns',
      connectionType: 'temporal',
      strength: 0.78,
      discovered: true,
      sourceContent: 'Creative breakthroughs consistently occur during specific time windows when mental clarity peaks around 9-11 AM',
      targetContent: 'Productivity analysis reveals optimal work patterns align with circadian rhythms and energy cycle fluctuations',
      similarity: 0.78,
      metadata: {
        discoveredAt: new Date(Date.now() - 10800000),
        lastUpdated: new Date(Date.now() - 5400000),
        userConfirmed: false,
        confidenceScore: 0.81,
        relatedConnections: ['5']
      },
      insights: {
        pattern: 'Temporal correlation between creativity and biological rhythms',
        potentialValue: 'Personalized productivity optimization system',
        suggestedAction: 'Track and analyze individual creative timing patterns'
      }
    },
    {
      id: '4',
      sourceThoughtId: 'thought-ai-ethics',
      targetThoughtId: 'thought-user-privacy',
      connectionType: 'thematic',
      strength: 0.89,
      discovered: true,
      sourceContent: 'AI ethics frameworks must prioritize transparency, fairness, and user agency in algorithmic decision-making processes',
      targetContent: 'User privacy protection requires comprehensive data governance and user control over personal information usage',
      similarity: 0.89,
      metadata: {
        discoveredAt: new Date(Date.now() - 14400000),
        lastUpdated: new Date(Date.now() - 7200000),
        userConfirmed: true,
        confidenceScore: 0.92,
        relatedConnections: ['6']
      },
      insights: {
        pattern: 'Intersection of ethical AI and privacy rights',
        potentialValue: 'Comprehensive ethical framework for AI products',
        suggestedAction: 'Draft ethical AI guidelines with privacy-first principles'
      }
    },
    {
      id: '5',
      sourceThoughtId: 'thought-design-systems',
      targetThoughtId: 'thought-component-architecture',
      connectionType: 'creative',
      strength: 0.76,
      discovered: false,
      sourceContent: 'Design systems need modular, scalable architectures that maintain consistency while enabling creative flexibility',
      targetContent: 'Component-based architecture patterns provide reusability and maintainability across large-scale applications',
      similarity: 0.76,
      metadata: {
        discoveredAt: new Date(Date.now() - 18000000),
        lastUpdated: new Date(Date.now() - 9000000),
        confidenceScore: 0.79
      },
      insights: {
        pattern: 'Systematic approach to scalable design implementation',
        potentialValue: 'Streamlined development workflow and design consistency',
        suggestedAction: 'Develop comprehensive component library documentation'
      }
    }
  ];

  const generateMockNodes = (): ConnectionNode[] => [
    {
      id: 'thought-ai-voice',
      content: 'Voice AI Interface Development',
      category: 'Technology',
      createdAt: new Date(Date.now() - 86400000),
      connectionCount: 3,
      importance: 0.92,
      x: 150,
      y: 100
    },
    {
      id: 'thought-emotional-ux',
      content: 'Emotional UX Design Patterns',
      category: 'Design',
      createdAt: new Date(Date.now() - 172800000),
      connectionCount: 2,
      importance: 0.88,
      x: 400,
      y: 120
    },
    {
      id: 'thought-performance-metrics',
      content: 'User Performance Metrics',
      category: 'Analytics',
      createdAt: new Date(Date.now() - 259200000),
      connectionCount: 2,
      importance: 0.85,
      x: 250,
      y: 300
    },
    {
      id: 'thought-cognitive-load',
      content: 'Cognitive Load Theory',
      category: 'Psychology',
      createdAt: new Date(Date.now() - 345600000),
      connectionCount: 1,
      importance: 0.83,
      x: 500,
      y: 280
    },
    {
      id: 'thought-creative-timing',
      content: 'Creative Timing Optimization',
      category: 'Productivity',
      createdAt: new Date(Date.now() - 432000000),
      connectionCount: 1,
      importance: 0.79,
      x: 180,
      y: 450
    }
  ];

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/cognitive/connections');
      // const data = await response.json();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockConnections = generateMockConnections();
      const mockNodes = generateMockNodes();

      setConnections(mockConnections.slice(0, maxConnections));
      setNodes(mockNodes);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const discoverNewConnections = async () => {
    setIsDiscovering(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/cognitive/connections/discover', { method: 'POST' });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const newConnection: ThoughtConnection = {
        id: Date.now().toString(),
        sourceThoughtId: 'thought-new-source',
        targetThoughtId: 'thought-new-target',
        connectionType: 'semantic',
        strength: 0.82,
        discovered: true,
        sourceContent: 'Newly discovered connection source thought content...',
        targetContent: 'Connected thought revealing unexpected relationship...',
        similarity: 0.82,
        metadata: {
          discoveredAt: new Date(),
          lastUpdated: new Date(),
          confidenceScore: 0.85
        },
        insights: {
          pattern: 'Fresh pattern discovered in real-time',
          potentialValue: 'Could unlock new research direction',
          suggestedAction: 'Investigate this connection further'
        }
      };

      setConnections(prev => [newConnection, ...prev]);
    } catch (error) {
      console.error('Failed to discover connections:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const confirmConnection = async (connectionId: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/cognitive/connections/${connectionId}/confirm`, { method: 'POST' });

      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, metadata: { ...conn.metadata, userConfirmed: true } }
            : conn
        )
      );
    } catch (error) {
      console.error('Failed to confirm connection:', error);
    }
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'semantic': return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      case 'temporal': return 'text-purple-400 bg-purple-400/20 border-purple-400/30';
      case 'causal': return 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30';
      case 'thematic': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'creative': return 'text-pink-400 bg-pink-400/20 border-pink-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'semantic': return <Brain className="h-4 w-4" />;
      case 'temporal': return <Clock className="h-4 w-4" />;
      case 'causal': return <ArrowRight className="h-4 w-4" />;
      case 'thematic': return <Target className="h-4 w-4" />;
      case 'creative': return <Star className="h-4 w-4" />;
      default: return <Link2 className="h-4 w-4" />;
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'text-emerald-400';
    if (strength >= 0.6) return 'text-orange-400';
    return 'text-amber-400';
  };

  const filteredConnections = connections
    .filter(conn => filterType === 'all' || conn.connectionType === filterType)
    .filter(conn =>
      searchQuery === '' ||
      conn.sourceContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.targetContent.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const GraphVisualization = () => (
    <div className="relative h-96 bg-black/20 rounded-xl border border-white/10 overflow-hidden">
      <svg ref={svgRef} className="w-full h-full">
        {/* Connection Lines */}
        {connections.map((connection) => {
          const sourceNode = nodes.find(n => n.id === connection.sourceThoughtId);
          const targetNode = nodes.find(n => n.id === connection.targetThoughtId);

          if (!sourceNode || !targetNode) return null;

          return (
            <motion.line
              key={connection.id}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke={`rgba(249, 115, 22, ${connection.strength})`}
              strokeWidth={connection.strength * 3}
              strokeDasharray={connection.discovered ? "0" : "5,5"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="cursor-pointer"
              onClick={() => setSelectedConnection(connection)}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, index) => (
          <g key={node.id}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={Math.max(20, node.importance * 30)}
              fill="rgba(249, 115, 22, 0.2)"
              stroke="rgba(249, 115, 22, 0.6)"
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="cursor-pointer hover:fill-orange-400/30"
            />
            <motion.text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              className="text-xs fill-white/80 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
            >
              {node.content.slice(0, 15)}...
            </motion.text>
          </g>
        ))}
      </svg>

      {/* Graph Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <GlassButton
          variant="subtle"
          size="sm"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={loadConnections}
        >
          Refresh
        </GlassButton>
        <GlassButton
          variant="subtle"
          size="sm"
          leftIcon={<Settings className="h-4 w-4" />}
        >
          Layout
        </GlassButton>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={cn('p-6', className)}>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white/60">Analyzing thought connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Thought Connections</h3>
          <p className="text-white/60 text-sm">
            {filteredConnections.length} relationships discovered • Semantic analysis powered
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <GlassButton
            variant="subtle"
            size="sm"
            leftIcon={viewMode === 'list' ? <Maximize2 className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            onClick={() => setViewMode(viewMode === 'list' ? 'graph' : 'list')}
          >
            {viewMode === 'list' ? 'Graph View' : 'List View'}
          </GlassButton>
          <GlassButton
            variant="orange"
            leftIcon={isDiscovering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            onClick={discoverNewConnections}
            disabled={isDiscovering}
          >
            {isDiscovering ? 'Discovering...' : 'Discover New'}
          </GlassButton>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <GlassInput
            placeholder="Search connections by content..."
            leftIcon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="secondary"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white/80 text-sm focus:border-blue-400/50 focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="semantic">Semantic</option>
          <option value="temporal">Temporal</option>
          <option value="causal">Causal</option>
          <option value="thematic">Thematic</option>
          <option value="creative">Creative</option>
        </select>
      </div>

      {/* Graph View */}
      {viewMode === 'graph' && showVisualization && (
        <div className="space-y-4">
          <GraphVisualization />
          {selectedConnection && (
            <GlassCard variant="orange" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">Connection Details</h4>
                <button
                  onClick={() => setSelectedConnection(null)}
                  className="text-white/50 hover:text-white/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-white/70 text-sm">{selectedConnection.insights?.pattern}</p>
            </GlassCard>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredConnections.map((connection, index) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <GlassCard
                  variant="secondary"
                  className="p-6 hover:bg-blue-500/5 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedConnection(connection);
                    onConnectionSelect?.(connection);
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", getConnectionTypeColor(connection.connectionType))}>
                        {getConnectionTypeIcon(connection.connectionType)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={cn("text-xs px-2 py-1 rounded-lg uppercase font-medium border", getConnectionTypeColor(connection.connectionType))}>
                            {connection.connectionType}
                          </span>
                          {connection.discovered && (
                            <span className="text-xs px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded-lg border border-emerald-400/30">
                              New Discovery
                            </span>
                          )}
                          {connection.metadata.userConfirmed && (
                            <span className="text-xs px-2 py-1 bg-orange-400/20 text-orange-300 rounded-lg border border-orange-400/30">
                              Confirmed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-white/50">
                          <span>Strength: <span className={getStrengthColor(connection.strength)}>{Math.round(connection.strength * 100)}%</span></span>
                          <span>Similarity: <span className="text-blue-400">{Math.round(connection.similarity * 100)}%</span></span>
                          <span>Confidence: <span className="text-purple-400">{Math.round(connection.metadata.confidenceScore * 100)}%</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!connection.metadata.userConfirmed && (
                        <GlassButton
                          variant="subtle"
                          size="sm"
                          leftIcon={<Star className="h-4 w-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmConnection(connection.id);
                          }}
                        >
                          Confirm
                        </GlassButton>
                      )}
                      <GlassButton
                        variant="subtle"
                        size="sm"
                        leftIcon={<Eye className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConnection(connection);
                        }}
                      >
                        Explore
                      </GlassButton>
                    </div>
                  </div>

                  {/* Source Thought */}
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-xs text-blue-400 font-medium mb-2 uppercase tracking-wide">Source Thought</div>
                      <p className="text-white/80 text-sm leading-relaxed">{connection.sourceContent}</p>
                    </div>

                    {/* Connection Indicator */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-orange-400"></div>
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", getConnectionTypeColor(connection.connectionType))}>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <div className="w-8 h-0.5 bg-gradient-to-r from-orange-400 to-purple-400"></div>
                      </div>
                    </div>

                    {/* Target Thought */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-xs text-purple-400 font-medium mb-2 uppercase tracking-wide">Connected Thought</div>
                      <p className="text-white/80 text-sm leading-relaxed">{connection.targetContent}</p>
                    </div>
                  </div>

                  {/* Insights */}
                  {connection.insights && (
                    <div className="mt-4 bg-gradient-to-r from-orange-500/10 to-purple-500/10 rounded-lg p-4 border border-orange-400/20">
                      <div className="text-xs text-orange-400 font-medium mb-3 uppercase tracking-wide">AI Insights</div>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <TrendingUp className="h-3 w-3 text-orange-400 mt-1 flex-shrink-0" />
                          <div className="text-xs text-white/80">
                            <span className="text-orange-300 font-medium">Pattern:</span> {connection.insights.pattern}
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Star className="h-3 w-3 text-purple-400 mt-1 flex-shrink-0" />
                          <div className="text-xs text-white/80">
                            <span className="text-purple-300 font-medium">Value:</span> {connection.insights.potentialValue}
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Target className="h-3 w-3 text-emerald-400 mt-1 flex-shrink-0" />
                          <div className="text-xs text-white/80">
                            <span className="text-emerald-300 font-medium">Action:</span> {connection.insights.suggestedAction}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-white/50">
                      Discovered {connection.metadata.discoveredAt.toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < Math.floor(connection.strength * 5)
                              ? "text-orange-400 fill-orange-400"
                              : "text-white/20"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {filteredConnections.length === 0 && (
            <div className="text-center py-16">
              <Link2 className="h-16 w-16 text-blue-400/30 mx-auto mb-6" />
              <h3 className="text-lg font-medium text-white/70 mb-3">
                {searchQuery || filterType !== 'all' ? 'No Matching Connections' : 'No Connections Found'}
              </h3>
              <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Analyze your thoughts to discover hidden relationships and patterns.'
                }
              </p>
              {(!searchQuery && filterType === 'all') && (
                <GlassButton
                  variant="secondary"
                  leftIcon={<Search className="h-4 w-4" />}
                  onClick={discoverNewConnections}
                  disabled={isDiscovering}
                >
                  {isDiscovering ? 'Discovering...' : 'Discover Connections'}
                </GlassButton>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionVisualization;
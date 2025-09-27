import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Search,
  Mic,
  Clock,
  BarChart3,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '@/components/glass';

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const mockStats = {
    totalThoughts: 156,
    weeklyThoughts: 23,
    completedTasks: 89,
    ideasGenerated: 42
  };

  const mockThoughts = [
    {
      id: '1',
      content: 'Revolutionary AI idea: Context-aware voice notes that automatically categorize and remind based on location and time patterns.',
      category: 'Ideas',
      createdAt: new Date(),
      tags: ['AI', 'Innovation', 'Voice']
    },
    {
      id: '2',
      content: 'Remember to follow up with the design team about the new glass component system implementation.',
      category: 'Tasks',
      createdAt: new Date(Date.now() - 86400000),
      tags: ['Work', 'Design']
    },
    {
      id: '3',
      content: 'Interesting observation: Users prefer glass morphism with subtle orange accents over bold gradients.',
      category: 'Notes',
      createdAt: new Date(Date.now() - 172800000),
      tags: ['UX', 'Research']
    }
  ];

  return (
    <div className="min-h-screen bg-background-primary text-text-primary p-4 sm:p-6 font-primary">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange-primary focus:text-black focus:rounded focus-ring"
      >
        Skip to main content
      </a>

      {/* Status announcements for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="status-announcement"
        role="status"
      >
        {statusMessage}
      </div>
      {/* Header Section */}
      <div className="mb-8 lg:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 space-y-6 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-2 font-primary">
              Good morning, User
            </h1>
            <p className="text-text-secondary text-sm sm:text-base font-primary">
              You have {mockStats.totalThoughts} thoughts captured
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3" role="toolbar" aria-label="Quick actions">
            <GlassButton
              variant="light"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              aria-label="Create a new thought quickly"
            >
              <span className="hidden sm:inline">Quick Capture</span>
              <span className="sm:hidden">Capture</span>
            </GlassButton>

            <GlassButton
              variant="premium"
              size="sm"
              glow
              leftIcon={<Mic className="h-4 w-4" />}
              aria-label="Start voice recording for thought capture"
            >
              <span className="hidden sm:inline">Voice Note</span>
              <span className="sm:hidden">Voice</span>
            </GlassButton>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-full sm:max-w-md mx-auto sm:mx-0">
          <GlassInput
            id="search-input"
            type="search"
            placeholder="Search thoughts, ideas, tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            variant="primary"
            aria-describedby="search-help"
            autoComplete="off"
          />
          <div id="search-help" className="sr-only">
            Type to search through your thoughts by content, tags, or categories
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content">
        {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10 lg:mb-12">
        <GlassCard variant="light" size="sm">
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-2">Total Thoughts</h3>
          <div className="text-xl sm:text-2xl font-bold text-text-primary mb-2">{mockStats.totalThoughts}</div>
          <div className="text-xs text-emerald-400">+15% vs last month</div>
        </GlassCard>

        <GlassCard variant="light" size="sm">
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-2">This Week</h3>
          <div className="text-xl sm:text-2xl font-bold text-text-primary mb-2">{mockStats.weeklyThoughts}</div>
          <div className="text-xs text-emerald-400">+8% vs last week</div>
        </GlassCard>

        <GlassCard variant="light" size="sm">
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-2">Ideas Generated</h3>
          <div className="text-xl sm:text-2xl font-bold text-text-primary mb-2">{mockStats.ideasGenerated}</div>
          <div className="text-xs text-emerald-400">+12% this month</div>
        </GlassCard>

        <GlassCard variant="light" size="sm">
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-2">Tasks Completed</h3>
          <div className="text-xl sm:text-2xl font-bold text-text-primary mb-2">{mockStats.completedTasks}</div>
          <div className="text-xs text-emerald-400">89% completion rate</div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10 lg:mb-12">
        <GlassCard
          variant="medium"
          interactive
          icon={<Mic className="h-6 w-6 text-text-orange" />}
          title="Voice Capture"
          description="Start recording your thoughts"
          aria-label="Start voice recording to capture new thoughts"
        />

        <GlassCard
          variant="medium"
          interactive
          icon={<Search className="h-6 w-6 text-text-orange" />}
          title="Advanced Search"
          description="Find thoughts by content, tags, or date"
          aria-label="Open advanced search to find thoughts by content, tags, or date"
        />

        <GlassCard
          variant="medium"
          interactive
          icon={<BarChart3 className="h-6 w-6 text-text-orange" />}
          title="Analytics"
          description="View your thinking patterns"
          aria-label="View analytics dashboard to analyze your thinking patterns"
        />

        <GlassCard
          variant="medium"
          interactive
          icon={<Clock className="h-6 w-6 text-text-orange" />}
          title="Reminders"
          description="Manage your thought reminders"
          aria-label="Manage thought reminders, 7 pending reminders"
        >
          <span className="inline-block px-2 py-1 bg-glass-orange-20 text-text-orange text-xs rounded-lg mt-2">7</span>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-10 lg:mb-12">
        <GlassCard variant="strong">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { action: 'Created thought about AI innovation', time: '2 minutes ago', category: 'Ideas', icon: Brain },
              { action: 'Completed task: Design review', time: '1 hour ago', category: 'Tasks', icon: CheckCircle2 },
              { action: 'Added reminder for follow-up', time: '3 hours ago', category: 'Reminders', icon: Clock },
              { action: 'Captured voice note about UX research', time: '1 day ago', category: 'Notes', icon: Mic }
            ].map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-glass-orange-5 transition-colors cursor-pointer">
                  <div className="w-8 h-8 bg-glass-orange-20 border border-border-glass-light rounded-lg flex items-center justify-center text-text-orange">
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm truncate">{activity.action}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-text-secondary text-xs">{activity.time}</span>
                      <span className="px-2 py-1 bg-glass-orange-20 text-text-orange text-xs rounded-lg">
                        {activity.category}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Categories Overview */}
        <GlassCard variant="strong">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Categories Overview</h2>
          <div className="space-y-4">
            {[
              { name: 'Ideas', count: 42, percentage: 68 },
              { name: 'Tasks', count: 28, percentage: 45 },
              { name: 'Notes', count: 67, percentage: 84 },
              { name: 'Reminders', count: 19, percentage: 31 }
            ].map((category, index) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-primary font-medium">{category.name}</span>
                  <span className="text-text-secondary">{category.count} items</span>
                </div>
                <div className="w-full bg-glass-orange-10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-orange-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Recent Thoughts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Recent Thoughts</h2>
          <GlassButton variant="minimal" leftIcon={<Filter className="h-4 w-4" />}>
            Filter
          </GlassButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {mockThoughts.map((thought) => (
            <GlassCard key={thought.id} variant="medium" interactive>
              <p className="text-text-primary text-sm line-clamp-3 mb-3">{thought.content}</p>

              {thought.tags && thought.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {thought.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-glass-orange-20 text-text-orange text-xs rounded-lg">
                      {tag}
                    </span>
                  ))}
                  {thought.tags.length > 2 && (
                    <span className="px-2 py-1 bg-glass-orange-10 text-text-secondary text-xs rounded-lg">
                      +{thought.tags.length - 2}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-text-tertiary">
                <span>{thought.category || 'Uncategorized'}</span>
                <span>{thought.createdAt.toLocaleDateString()}</span>
              </div>
            </GlassCard>
          ))}

          {/* Add More Thoughts Card */}
          <div className="border-2 border-dashed border-border-glass-light rounded-xl p-6 cursor-pointer hover:border-border-glass-medium hover:bg-glass-orange-5 transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-glass-orange-20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Plus className="h-6 w-6 text-text-orange" />
              </div>
              <p className="text-text-secondary font-medium mb-1">Add Thought</p>
              <p className="text-text-tertiary text-sm">Capture new ideas</p>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
};

export default HomePage;
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Plus,
  Search,
  Mic,
  TrendingUp,
  Clock,
  Star,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Target,
  Zap,
  BarChart3,
  Activity,
  Loader2
} from 'lucide-react';

import { BentoGrid, BentoItem, QuickActionCard, StatCard, ThoughtCard } from '@/components/layout/BentoGrid';
import { GlassCard, GlassButton, GlassInput } from '@/components/glass';
import { ScrollFadeWrapper, ScrollRevealCard } from '@/components/animations/ScrollFadeWrapper';
import { cn } from '@/lib/utils';
import { useDashboardData } from '@/hooks/useDashboardData';

// Orange AMOLED Dashboard with Bento Grid Layout
// Implements the exact design system specified in UI.md

interface DashboardProps {
  className?: string;
}

export const OrangeDashboard: React.FC<DashboardProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  // Fetch real dashboard data
  const { thoughts, stats, activities, isLoading, error, refetch } = useDashboardData();

  const handleQuickCapture = () => {
    // Open capture modal
    console.log('Opening capture modal');
  };

  const handleVoiceCapture = () => {
    // Start voice recording
    console.log('Starting voice capture');
  };

  const handleSearchThoughts = () => {
    // Open advanced search
    console.log('Opening search modal');
  };

  const handleThoughtClick = (id: string) => {
    // Navigate to thought detail
    console.log('Opening thought:', id);
  };

  // Loading state
  if (isLoading && !stats) {
    return (
      <div className={cn('min-h-screen bg-black p-6 flex items-center justify-center', className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400 mx-auto mb-4" />
          <p className="text-white/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('min-h-screen bg-black p-6 flex items-center justify-center', className)}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-white/60 mb-4">Failed to load dashboard data</p>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <GlassButton variant="orange" onClick={refetch}>
            Try Again
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-black p-6', className)}>

      {/* Header Section */}
      <ScrollFadeWrapper>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Good morning, User
              </h1>
              <p className="text-white/60">
                You have {mockStats.totalThoughts} thoughts captured
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <GlassButton
                variant="orange"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={handleQuickCapture}
              >
                Quick Capture
              </GlassButton>

              <GlassButton
                variant="secondary"
                leftIcon={<Mic className="h-4 w-4" />}
                onClick={handleVoiceCapture}
              >
                Voice Note
              </GlassButton>
            </div>
          </div>

          {/* Search Bar */}
          <GlassInput
            placeholder="Search thoughts, ideas, tasks..."
            leftIcon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="orange"
            className="max-w-md"
          />
        </div>
      </ScrollFadeWrapper>

      {/* Main Bento Grid Dashboard */}
      <BentoGrid layout="dashboard" className="mb-8">

        {/* Quick Stats - Top Row */}
        <ScrollRevealCard className="md:col-span-2 md:row-span-1" index={0}>
          <StatCard
            title="Total Thoughts"
            value={stats?.totalThoughts || 0}
            change={{
              value: 15,
              label: 'vs last month',
              positive: true
            }}
            size="md"
          />
        </ScrollRevealCard>

        <ScrollRevealCard className="md:col-span-2 md:row-span-1" index={1}>
          <StatCard
            title="This Week"
            value={stats?.weeklyThoughts || 0}
            change={{
              value: 8,
              label: 'vs last week',
              positive: true
            }}
            size="md"
          />
        </ScrollRevealCard>

        <ScrollRevealCard className="md:col-span-2 md:row-span-1" index={2}>
          <StatCard
            title="Ideas Generated"
            value={stats?.ideasGenerated || 0}
            change={{
              value: 12,
              label: 'this month',
              positive: true
            }}
            size="md"
          />
        </ScrollRevealCard>

        <ScrollRevealCard className="md:col-span-2 md:row-span-1" index={3}>
          <StatCard
            title="Tasks Completed"
            value={stats?.completedTasks || 0}
            change={{
              value: 23,
              label: 'completion rate',
              positive: true
            }}
            size="md"
          />
        </ScrollRevealCard>

        {/* Quick Actions - Second Row */}
        <ScrollRevealCard className="md:col-span-2 md:row-span-2" index={4}>
          <QuickActionCard
            title="Voice Capture"
            description="Start recording your thoughts"
            icon={<Mic className="h-6 w-6" />}
            onClick={handleVoiceCapture}
            size="lg"
          />
        </ScrollRevealCard>

        <ScrollRevealCard className="md:col-span-2 md:row-span-2" index={5}>
          <QuickActionCard
            title="Advanced Search"
            description="Find thoughts by content, tags, or date"
            icon={<Search className="h-6 w-6" />}
            onClick={handleSearchThoughts}
            size="lg"
          />
        </ScrollRevealCard>

        <ScrollRevealCard className="md:col-span-2 md:row-span-2" index={6}>
          <QuickActionCard
            title="Analytics"
            description="View your thinking patterns"
            icon={<BarChart3 className="h-6 w-6" />}
            onClick={() => console.log('Opening analytics')}
            size="lg"
          />
        </ScrollRevealCard>

        <ScrollRevealCard className="md:col-span-2 md:row-span-2" index={7}>
          <QuickActionCard
            title="Reminders"
            description="Manage your thought reminders"
            icon={<Clock className="h-6 w-6" />}
            onClick={() => console.log('Opening reminders')}
            size="lg"
            count={7}
          />
        </ScrollRevealCard>

        {/* Activity Feed - Third Row */}
        <ScrollRevealCard className="md:col-span-4 md:row-span-2" index={8}>
          <GlassCard
            title="Recent Activity"
            variant="orange"
            className="h-full"
          >
            <div className="space-y-3 mt-4">
              {activities.length > 0 ? activities.map((activity, index) => {
                const getActivityIcon = (icon: string) => {
                  switch (icon) {
                    case 'mic': return <Mic className="h-4 w-4" />;
                    case 'brain': return <Brain className="h-4 w-4" />;
                    case 'check': return <CheckCircle2 className="h-4 w-4" />;
                    case 'clock': return <Clock className="h-4 w-4" />;
                    default: return <Brain className="h-4 w-4" />;
                  }
                };

                return (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-xl hover:bg-orange-500/5 transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="w-8 h-8 bg-orange-500/20 border border-orange-400/30 rounded-lg flex items-center justify-center text-orange-400">
                    {getActivityIcon(activity.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm truncate">
                      {activity.action}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-white/50 text-xs">{activity.time}</span>
                      <span className="px-2 py-1 bg-orange-400/20 text-orange-300 text-xs rounded-lg">
                        {activity.category}
                      </span>
                    </div>
                  </div>
                </motion.div>
                );
              }) : (
                <div className="text-center py-8">
                  <Brain className="h-8 w-8 text-orange-400/30 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No recent activity</p>
                  <p className="text-white/30 text-xs mt-1">Start capturing thoughts to see activity here</p>
                </div>
              )}
            </div>
          </GlassCard>
        </ScrollRevealCard>

        {/* Categories Overview */}
        <ScrollRevealCard className="md:col-span-4 md:row-span-2" index={9}>
          <GlassCard
            title="Categories Overview"
            variant="secondary"
            className="h-full"
          >
            <div className="space-y-3 mt-4">
              {stats && Object.keys(stats.categoryBreakdown).length > 0 ?
                Object.entries(stats.categoryBreakdown).map(([name, count], index) => {
                  const maxCount = Math.max(...Object.values(stats.categoryBreakdown));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const category = {
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    count,
                    percentage,
                    color: 'orange'
                  };

                  return (
                <motion.div
                  key={category.name}
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/90 font-medium">{category.name}</span>
                    <span className="text-white/60">{category.count} items</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-orange-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
                  );
                }) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-8 w-8 text-orange-400/30 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No categories yet</p>
                    <p className="text-white/30 text-xs mt-1">Create thoughts to see category breakdown</p>
                  </div>
                )}
            </div>
          </GlassCard>
        </ScrollRevealCard>
      </BentoGrid>

      {/* Recent Thoughts Section */}
      <ScrollFadeWrapper>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Recent Thoughts
            </h2>
            <GlassButton
              variant="subtle"
              rightIcon={<Filter className="h-4 w-4" />}
            >
              Filter
            </GlassButton>
          </div>

          <BentoGrid layout="thoughts">
            {mockThoughts.map((thought, index) => (
              <ScrollRevealCard key={thought.id} index={index} threshold={0.1}>
                <ThoughtCard
                  thought={thought}
                  onClick={handleThoughtClick}
                  size="md"
                />
              </ScrollRevealCard>
            ))}

            {/* Add More Thoughts Card */}
            <ScrollRevealCard index={mockThoughts.length}>
              <BentoItem size="md" className="cursor-pointer">
                <motion.div
                  className="h-full flex items-center justify-center border-2 border-dashed border-orange-400/30 rounded-xl hover:border-orange-400/50 transition-colors"
                  onClick={handleQuickCapture}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Plus className="h-6 w-6 text-orange-400" />
                    </div>
                    <p className="text-white/70 font-medium mb-1">Add Thought</p>
                    <p className="text-white/50 text-sm">Capture new ideas</p>
                  </div>
                </motion.div>
              </BentoItem>
            </ScrollRevealCard>
          </BentoGrid>
        </div>
      </ScrollFadeWrapper>
    </div>
  );
};

export default OrangeDashboard;
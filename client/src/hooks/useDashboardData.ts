/**
 * Dashboard Data Hook
 * Fetches real-time data for the dashboard components
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';

interface ThoughtData {
  id: string;
  content: string;
  category?: any;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  type?: string;
}

interface DashboardStats {
  totalThoughts: number;
  weeklyThoughts: number;
  completedTasks: number;
  ideasGenerated: number;
  categoryBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  pendingReminders: number;
  processingQueue: number;
}

interface ActivityItem {
  id: string;
  action: string;
  time: string;
  category: string;
  icon: string;
  thought_id?: string;
}

interface UseDashboardDataReturn {
  thoughts: ThoughtData[];
  stats: DashboardStats | null;
  activities: ActivityItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [thoughts, setThoughts] = useState<ThoughtData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch recent thoughts
      const thoughtsResponse = await apiClient.getCaptures({
        limit: 10,
        include_processed: true
      });

      if (thoughtsResponse.status === 'error') {
        throw new Error(thoughtsResponse.error || 'Failed to fetch thoughts');
      }

      const thoughtsData = thoughtsResponse.data || [];
      setThoughts(thoughtsData);

      // Generate mock stats based on available data for now
      // TODO: Replace with actual stats API endpoint when available
      const mockStats: DashboardStats = {
        totalThoughts: thoughtsData.length * 15, // Simulate total based on recent
        weeklyThoughts: thoughtsData.filter(t => {
          const created = new Date(t.created_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return created > weekAgo;
        }).length,
        completedTasks: Math.floor(thoughtsData.length * 0.6),
        ideasGenerated: thoughtsData.filter(t =>
          t.category?.main === 'ideas' ||
          t.type === 'idea' ||
          (t.tags && t.tags.some(tag => tag.toLowerCase().includes('idea')))
        ).length,
        categoryBreakdown: {},
        typeBreakdown: {},
        pendingReminders: Math.floor(thoughtsData.length * 0.1),
        processingQueue: 0
      };

      // Calculate category and type breakdowns
      thoughtsData.forEach(thought => {
        const category = thought.category?.main || 'uncategorized';
        const type = thought.type || 'note';

        mockStats.categoryBreakdown[category] = (mockStats.categoryBreakdown[category] || 0) + 1;
        mockStats.typeBreakdown[type] = (mockStats.typeBreakdown[type] || 0) + 1;
      });

      setStats(mockStats);

      // Generate activity feed from recent thoughts
      const activities: ActivityItem[] = thoughtsData.slice(0, 5).map((thought, index) => {
        const timeDiff = Date.now() - new Date(thought.created_at).getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutesAgo = Math.floor(timeDiff / (1000 * 60));

        let timeString;
        if (hoursAgo > 24) {
          timeString = `${Math.floor(hoursAgo / 24)} day${Math.floor(hoursAgo / 24) > 1 ? 's' : ''} ago`;
        } else if (hoursAgo > 0) {
          timeString = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else {
          timeString = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
        }

        const category = thought.category?.main || 'notes';

        return {
          id: thought.id,
          action: `Created ${thought.type || 'thought'}: ${thought.content.substring(0, 50)}${thought.content.length > 50 ? '...' : ''}`,
          time: timeString,
          category: category.charAt(0).toUpperCase() + category.slice(1),
          icon: thought.type === 'voice' ? 'mic' : 'brain',
          thought_id: thought.id
        };
      });

      setActivities(activities);

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    thoughts,
    stats,
    activities,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
};
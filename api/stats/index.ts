import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// VERCEL SERVERLESS FUNCTION - DASHBOARD STATISTICS
// Provides real-time stats for the dashboard
// Used by: client/src/hooks/useDashboardData.ts

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface StatsResponse {
  totalNotes: number;
  notesThisWeek: number;
  totalVoiceNotes: number;
  voiceNotesThisWeek: number;
  averageNotesPerDay: number;
  mostUsedTags: string[];
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get user ID from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      res.status(401).json({ error: 'Invalid token', details: authError?.message });
      return;
    }

    const userId = user.id;
    console.log('📊 [Stats API] Fetching stats for user:', userId);

    // Calculate date ranges
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch total notes count
    const { count: totalNotes, error: totalError } = await supabase
      .from('thoughts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (totalError) {
      console.error('Error fetching total notes:', totalError);
    }

    // Fetch notes from last 7 days
    const { data: weekNotes, error: weekError } = await supabase
      .from('thoughts')
      .select('id, created_at, type, tags')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (weekError) {
      console.error('Error fetching week notes:', weekError);
    }

    // Fetch voice notes (type: voice or has audio_url)
    const { data: allVoiceNotes, error: voiceError } = await supabase
      .from('thoughts')
      .select('id, created_at, type, audio_url')
      .eq('user_id', userId)
      .or('type.eq.voice,audio_url.not.is.null');

    if (voiceError) {
      console.error('Error fetching voice notes:', voiceError);
    }

    const totalVoiceNotes = allVoiceNotes?.length || 0;
    const voiceNotesThisWeek = allVoiceNotes?.filter(note => {
      const noteDate = new Date(note.created_at);
      return noteDate >= sevenDaysAgo;
    }).length || 0;

    // Fetch notes from last 30 days for activity chart
    const { data: monthNotes, error: monthError } = await supabase
      .from('thoughts')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (monthError) {
      console.error('Error fetching month notes:', monthError);
    }

    // Calculate daily activity for the last 7 days
    const recentActivity: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

      const count = monthNotes?.filter(note => {
        const noteDate = new Date(note.created_at).toISOString().split('T')[0];
        return noteDate === dateStr;
      }).length || 0;

      recentActivity.push({ date: dateStr, count });
    }

    // Calculate average notes per day (last 30 days)
    const daysWithData = 30;
    const averageNotesPerDay = monthNotes ? Number((monthNotes.length / daysWithData).toFixed(1)) : 0;

    // Extract most used tags from week notes
    const tagFrequency: Record<string, number> = {};
    weekNotes?.forEach(note => {
      if (Array.isArray(note.tags)) {
        note.tags.forEach(tag => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
      }
    });

    // Sort tags by frequency and get top 5
    const mostUsedTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    const stats: StatsResponse = {
      totalNotes: totalNotes || 0,
      notesThisWeek: weekNotes?.length || 0,
      totalVoiceNotes,
      voiceNotesThisWeek,
      averageNotesPerDay,
      mostUsedTags,
      recentActivity,
    };

    console.log('✅ [Stats API] Stats calculated:', {
      totalNotes: stats.totalNotes,
      notesThisWeek: stats.notesThisWeek,
      totalVoiceNotes: stats.totalVoiceNotes,
    });

    res.status(200).json(stats);

  } catch (error) {
    console.error('❌ [Stats API] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

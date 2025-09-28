/**
 * COGNITIVE INSIGHTS API ROUTES
 * Advanced Intelligence Endpoints for Proactive Thought Assistance
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { CognitiveAI } from '../services/cognitiveAI.js';
import { supabaseAdmin as supabase } from '../config/supabase.js';

const router = express.Router();
const cognitiveAI = new CognitiveAI();

// =====================================================
// PREDICTIVE SUGGESTIONS ENDPOINTS
// =====================================================

/**
 * GET /api/cognitive/suggestions
 * Get current predictive suggestions for the user
 */
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to get suggestions'
      });
    }

    console.log(`🔮 Getting predictive suggestions for user: ${userId}`);

    // Get active suggestions from database
    const { data: suggestions, error } = await supabase
      .from('predictive_suggestions')
      .select('*')
      .eq('user_id', userId)
      .is('is_accepted', null) // Only pending suggestions
      .gt('expires_at', new Date().toISOString())
      .order('confidence_score', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Database error fetching suggestions:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch suggestions'
      });
    }

    res.json({
      success: true,
      suggestions: suggestions || [],
      count: suggestions?.length || 0
    });

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch predictive suggestions'
    });
  }
});

/**
 * POST /api/cognitive/suggestions/generate
 * Generate new predictive suggestions using AI
 */
router.post('/suggestions/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to generate suggestions'
      });
    }

    console.log(`✨ Generating new suggestions for user: ${userId}`);

    // Generate new suggestions using AI
    const suggestions = await cognitiveAI.generatePredictiveSuggestions(userId);

    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
      message: `Generated ${suggestions.length} new suggestions`
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate suggestions'
    });
  }
});

/**
 * POST /api/cognitive/suggestions/:id/accept
 * Accept a predictive suggestion
 */
router.post('/suggestions/:id/accept', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const suggestionId = req.params.id;
    const { feedback } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }

    console.log(`✅ User accepting suggestion: ${suggestionId}`);

    // Update suggestion as accepted
    const { error } = await supabase
      .from('predictive_suggestions')
      .update({
        is_accepted: true,
        user_feedback: feedback || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', suggestionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Database error accepting suggestion:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to accept suggestion'
      });
    }

    res.json({
      success: true,
      message: 'Suggestion accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting suggestion:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to accept suggestion'
    });
  }
});

/**
 * POST /api/cognitive/suggestions/:id/dismiss
 * Dismiss a predictive suggestion
 */
router.post('/suggestions/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const suggestionId = req.params.id;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }

    console.log(`❌ User dismissing suggestion: ${suggestionId}`);

    // Update suggestion as dismissed
    const { error } = await supabase
      .from('predictive_suggestions')
      .update({
        is_accepted: false,
        user_feedback: reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', suggestionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Database error dismissing suggestion:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to dismiss suggestion'
      });
    }

    res.json({
      success: true,
      message: 'Suggestion dismissed successfully'
    });

  } catch (error) {
    console.error('Error dismissing suggestion:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to dismiss suggestion'
    });
  }
});

// =====================================================
// THOUGHT CONNECTIONS ENDPOINTS
// =====================================================

/**
 * GET /api/cognitive/connections
 * Get discovered thought connections for the user
 */
router.get('/connections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 10, type } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to get connections'
      });
    }

    console.log(`🔗 Getting thought connections for user: ${userId}`);

    let query = supabase
      .from('thought_connections')
      .select(`
        *,
        thought_a:thoughts!thought_connections_thought_a_id_fkey(id, content, category),
        thought_b:thoughts!thought_connections_thought_b_id_fkey(id, content, category)
      `)
      .eq('user_id', userId)
      .order('strength_score', { ascending: false })
      .limit(parseInt(limit as string));

    if (type) {
      query = query.eq('connection_type', type);
    }

    const { data: connections, error } = await query;

    if (error) {
      console.error('Database error fetching connections:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch connections'
      });
    }

    res.json({
      success: true,
      connections: connections || [],
      count: connections?.length || 0
    });

  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch thought connections'
    });
  }
});

/**
 * POST /api/cognitive/connections/discover
 * Discover new thought connections using AI
 */
router.post('/connections/discover', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to discover connections'
      });
    }

    console.log(`🕸️ Discovering connections for user: ${userId}`);

    // Discover new connections using AI
    const connections = await cognitiveAI.discoverThoughtConnections(userId);

    res.json({
      success: true,
      connections,
      count: connections.length,
      message: `Discovered ${connections.length} new connections`
    });

  } catch (error) {
    console.error('Error discovering connections:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to discover connections'
    });
  }
});

/**
 * POST /api/cognitive/connections/:id/confirm
 * Confirm a discovered thought connection
 */
router.post('/connections/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const connectionId = req.params.id;
    const { notes } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }

    console.log(`✅ User confirming connection: ${connectionId}`);

    // Update connection as confirmed
    const { error } = await supabase
      .from('thought_connections')
      .update({
        is_user_confirmed: true,
        user_notes: notes || null
      })
      .eq('id', connectionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Database error confirming connection:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to confirm connection'
      });
    }

    res.json({
      success: true,
      message: 'Connection confirmed successfully'
    });

  } catch (error) {
    console.error('Error confirming connection:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to confirm connection'
    });
  }
});

// =====================================================
// INSIGHT ANALYTICS ENDPOINTS
// =====================================================

/**
 * GET /api/cognitive/insights
 * Get insight reports for the user
 */
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { period = 'weekly', limit = 5 } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to get insights'
      });
    }

    console.log(`📊 Getting insight reports for user: ${userId}`);

    // Get recent reports from database
    const { data: reports, error } = await supabase
      .from('insight_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('report_type', period)
      .order('generated_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      console.error('Database error fetching insights:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch insights'
      });
    }

    res.json({
      success: true,
      reports: reports || [],
      count: reports?.length || 0
    });

  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch insights'
    });
  }
});

/**
 * POST /api/cognitive/insights/generate
 * Generate a new insight report using AI
 */
router.post('/insights/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { period = 'weekly' } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to generate insights'
      });
    }

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({
        error: 'Invalid period',
        message: 'Period must be daily, weekly, or monthly'
      });
    }

    console.log(`🧠 Generating ${period} insight report for user: ${userId}`);

    // Generate new insight report using AI
    const report = await cognitiveAI.generateInsightReport(userId, period);

    res.json({
      success: true,
      report,
      message: `Generated ${period} insight report with ${report.insights.length} insights`
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate insight report'
    });
  }
});

/**
 * POST /api/cognitive/insights/:id/rate
 * Rate an insight report
 */
router.post('/insights/:id/rate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const reportId = req.params.id;
    const { rating, feedback } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    console.log(`⭐ User rating insight report: ${reportId} - ${rating}/5`);

    // Update report with user rating
    const { error } = await supabase
      .from('insight_reports')
      .update({
        user_rating: rating,
        user_feedback: feedback || null,
        is_viewed: true
      })
      .eq('id', reportId)
      .eq('user_id', userId);

    if (error) {
      console.error('Database error rating insight:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to rate insight report'
      });
    }

    res.json({
      success: true,
      message: 'Insight report rated successfully'
    });

  } catch (error) {
    console.error('Error rating insight:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to rate insight report'
    });
  }
});

// =====================================================
// PATTERN ANALYSIS ENDPOINTS
// =====================================================

/**
 * GET /api/cognitive/patterns
 * Get thinking patterns for the user
 */
router.get('/patterns', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type, active_only = 'true' } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to get patterns'
      });
    }

    console.log(`🧠 Getting thinking patterns for user: ${userId}`);

    let query = supabase
      .from('thinking_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('confidence_score', { ascending: false });

    if (type) {
      query = query.eq('pattern_type', type);
    }

    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    const { data: patterns, error } = await query;

    if (error) {
      console.error('Database error fetching patterns:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch patterns'
      });
    }

    res.json({
      success: true,
      patterns: patterns || [],
      count: patterns?.length || 0
    });

  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch thinking patterns'
    });
  }
});

// =====================================================
// INTELLIGENCE SUMMARY ENDPOINT
// =====================================================

/**
 * GET /api/cognitive/summary
 * Get comprehensive intelligence summary for the user
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to get summary'
      });
    }

    console.log(`📋 Getting intelligence summary for user: ${userId}`);

    // Get intelligence summary from view
    const { data: summary, error } = await supabase
      .from('user_intelligence_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Database error fetching summary:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch summary'
      });
    }

    res.json({
      success: true,
      summary: summary || {
        user_id: userId,
        pending_suggestions: 0,
        discovered_connections: 0,
        active_reminders: 0,
        tracked_patterns: 0,
        last_report_generated: null
      }
    });

  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch intelligence summary'
    });
  }
});

export default router;
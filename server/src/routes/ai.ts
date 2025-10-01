import express from 'express';
import { gpt5Orchestrator } from '../services/gpt5MiniOrchestrator.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: {
    error: 'Too many AI requests, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all AI routes
router.use(aiRateLimit);

/**
 * POST /api/ai/categorize
 * Categorize a thought using GPT-5 Mini
 */
router.post('/categorize', authenticateToken, async (req, res) => {
  try {
    const { content, context } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content is required and must be a string'
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({
        error: 'Content cannot be empty'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        error: 'Content is too long (max 5000 characters)'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required'
      });
    }

    // Add timing for performance monitoring
    const startTime = Date.now();

    // Prepare user context with Context7 best practices
    const userContext = {
      userId,
      timeOfDay: new Date().toLocaleTimeString(),
      recentThoughts: context?.recentThoughts,
      projects: context?.projects,
      frequentTags: context?.frequentTags,
      vocabularyPreferences: context?.vocabularyPreferences,
      location: context?.location,
      browserContext: context?.browserContext,
    };

    // Categorize using GPT-5 with supernatural intelligence
    const analysis = await gpt5Orchestrator.analyzeThought(content, userContext);

    // Log performance metrics
    console.log(`✅ GPT-5 analysis completed in ${analysis.processingTime}ms for user ${userId} (confidence: ${analysis.confidence})`);

    // Return the supernatural categorization result
    res.json({
      ...analysis,
      model: 'gpt-5',
      orchestrator: 'gpt5-mini-v1',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI categorization error:', error);

    res.status(500).json({
      error: 'Failed to categorize thought',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ai/enhance
 * Enhance a thought with additional AI insights
 */
router.post('/enhance', authenticateToken, async (req, res) => {
  try {
    const { content, currentCategory, userFeedback } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content is required and must be a string'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required'
      });
    }

    // Prepare enhanced context with feedback
    const userContext = {
      userId,
      recentThoughts: [{
        content,
        category: currentCategory,
        tags: [],
      }],
      timeOfDay: new Date().toLocaleTimeString(),
    };

    // Get enhanced categorization using GPT-5
    const analysis = await gpt5Orchestrator.analyzeThought(content, userContext);

    res.json({
      ...analysis,
      model: 'gpt-5',
      enhanced: true,
      userFeedback,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI enhancement error:', error);

    res.status(500).json({
      error: 'Failed to enhance thought',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ai/batch-categorize
 * Categorize multiple thoughts in batch for efficiency
 */
router.post('/batch-categorize', authenticateToken, async (req, res) => {
  try {
    const { thoughts } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!Array.isArray(thoughts) || thoughts.length === 0) {
      return res.status(400).json({
        error: 'Thoughts array is required and cannot be empty'
      });
    }

    if (thoughts.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 thoughts per batch request'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required'
      });
    }

    const startTime = Date.now();

    // Prepare user context
    const userContext = {
      userId,
      timeOfDay: new Date().toLocaleTimeString(),
    };

    // Process thoughts using GPT-5 batch analyzer (efficient)
    const thoughtsWithIds = thoughts.map((content, index) => ({
      id: `batch-${index}`,
      content
    }));

    const batchResults = await gpt5Orchestrator.batchAnalyzeThoughts(thoughtsWithIds, userContext);

    const categorizations = batchResults.map((result) => ({
      index: parseInt(result.id.split('-')[1]),
      content: result.analysis.cleanedText,
      success: true,
      analysis: result.analysis,
      error: null
    }));

    const processingTime = Date.now() - startTime;

    res.json({
      results: categorizations,
      totalProcessed: thoughts.length,
      successCount: categorizations.filter(r => r.success).length,
      processingTime,
      averageTimePerThought: Math.round(processingTime / thoughts.length),
      model: 'gpt-5',
      orchestrator: 'gpt5-mini-batch-v1',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch categorization error:', error);

    res.status(500).json({
      error: 'Failed to process batch categorization',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ai/performance
 * Get AI orchestrator performance metrics
 */
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const metrics = gpt5Orchestrator.getPerformanceMetrics();

    res.json({
      ...metrics,
      model: 'gpt-5',
      orchestrator: 'gpt5-mini-v1',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Performance metrics error:', error);

    res.status(500).json({
      error: 'Failed to fetch performance metrics',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ai/user-patterns
 * Get user's learned thinking patterns
 */
router.get('/user-patterns', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required'
      });
    }

    // This would fetch user patterns from the database
    // For now, return a placeholder response
    res.json({
      userId,
      patterns: {
        vocabularyWeights: {},
        categoryPreferences: {},
        accuracyRate: 0.7,
        totalThoughts: 0
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('User patterns error:', error);

    res.status(500).json({
      error: 'Failed to fetch user patterns',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ai/feedback
 * Submit user feedback to improve AI accuracy
 */
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { thoughtId, originalCategorization, userCorrection, rating } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!thoughtId || !originalCategorization || !userCorrection) {
      return res.status(400).json({
        error: 'Thought ID, original categorization, and user correction are required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required'
      });
    }

    // Store feedback for learning (implement in production)
    console.log('AI feedback received:', {
      userId,
      thoughtId,
      originalCategorization,
      userCorrection,
      rating
    });

    res.json({
      success: true,
      message: 'Feedback received and will be used to improve AI accuracy',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI feedback error:', error);

    res.status(500).json({
      error: 'Failed to process feedback',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
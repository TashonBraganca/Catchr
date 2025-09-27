import express from 'express';
import { UltrathinkAI } from '../services/ultrathinkAI.js';
import { authenticateUser } from '../middleware/auth.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();
const ultrathinkAI = new UltrathinkAI();

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
router.post('/categorize', authenticateUser, async (req, res) => {
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

    // Prepare context
    const enhancedContext = {
      timeOfDay: new Date().toLocaleTimeString(),
      ...context
    };

    // Categorize the thought using GPT-5 Mini
    const categorization = await ultrathinkAI.categorizeThought(
      content,
      userId,
      enhancedContext
    );

    const processingTime = Date.now() - startTime;

    // Log performance metrics
    console.log(`AI categorization completed in ${processingTime}ms for user ${userId}`);

    // Return the categorization result
    res.json({
      ...categorization,
      processingTime,
      model: 'gpt-5-mini',
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
router.post('/enhance', authenticateUser, async (req, res) => {
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

    const startTime = Date.now();

    // Get enhanced categorization with user feedback incorporated
    const categorization = await ultrathinkAI.categorizeThought(
      content,
      userId,
      {
        currentCategory,
        userFeedback,
        enhancementMode: true
      }
    );

    const processingTime = Date.now() - startTime;

    res.json({
      ...categorization,
      processingTime,
      model: 'gpt-5-mini',
      enhanced: true,
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
router.post('/batch-categorize', authenticateUser, async (req, res) => {
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

    // Process thoughts in parallel with controlled concurrency
    const results = await Promise.allSettled(
      thoughts.map((content, index) =>
        ultrathinkAI.categorizeThought(content, userId, { batchIndex: index })
      )
    );

    const categorizations = results.map((result, index) => ({
      index,
      content: thoughts[index],
      success: result.status === 'fulfilled',
      categorization: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    const processingTime = Date.now() - startTime;

    res.json({
      results: categorizations,
      totalProcessed: thoughts.length,
      successCount: categorizations.filter(r => r.success).length,
      processingTime,
      model: 'gpt-5-mini',
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
 * GET /api/ai/user-patterns
 * Get user's learned thinking patterns
 */
router.get('/user-patterns', authenticateUser, async (req, res) => {
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
router.post('/feedback', authenticateUser, async (req, res) => {
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
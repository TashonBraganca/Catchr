/**
 * GOOGLE CALENDAR API ROUTES
 *
 * Natural language event creation and calendar integration
 * Using Context7 best practices learned from documentation
 */

import express from 'express';
import { googleCalendarService } from '../services/googleCalendarService.js';
import { gpt5Orchestrator } from '../services/gpt5MiniOrchestrator.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for calendar endpoints
const calendarRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    error: 'Too many calendar requests, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(calendarRateLimit);

/**
 * GET /api/calendar/auth-url
 * Get Google OAuth consent screen URL
 */
router.get('/auth-url', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    const authUrl = googleCalendarService.getAuthUrl(userId);

    res.json({
      authUrl,
      message: 'Navigate to this URL to authorize Google Calendar access',
    });

  } catch (error) {
    console.error('Auth URL generation error:', error);
    res.status(500).json({
      error: 'Failed to generate authorization URL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/calendar/callback
 * Handle OAuth callback from Google
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Authorization code is required',
      });
    }

    const userId = state as string;
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
      });
    }

    // Exchange code for tokens
    await googleCalendarService.handleOAuthCallback(code, userId);

    // Redirect to success page
    res.redirect('http://localhost:5173/settings?calendar=connected');

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('http://localhost:5173/settings?calendar=error');
  }
});

/**
 * POST /api/calendar/create-event
 * Create calendar event from natural language
 */
router.post('/create-event', authenticateToken, async (req, res) => {
  try {
    const { text, sendUpdates, calendarId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Event text is required',
      });
    }

    // Create event using natural language (quickAdd API)
    const event = await googleCalendarService.createEventFromNaturalLanguage(
      userId,
      text,
      { sendUpdates, calendarId }
    );

    res.json({
      success: true,
      event,
      message: 'Calendar event created successfully',
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      error: 'Failed to create calendar event',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/calendar/create-from-thought
 * Analyze thought with GPT-5 and create calendar events automatically
 */
router.post('/create-from-thought', authenticateToken, async (req, res) => {
  try {
    const { thought, autoCreate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    if (!thought || typeof thought !== 'string') {
      return res.status(400).json({
        error: 'Thought text is required',
      });
    }

    // Analyze thought with GPT-5
    const analysis = await gpt5Orchestrator.analyzeThought(thought, { userId });

    // Extract reminders that should be calendar events
    const calendarEvents = analysis.reminders.filter(
      reminder => reminder.date && reminder.type === 'once'
    );

    if (calendarEvents.length === 0) {
      return res.json({
        success: true,
        message: 'No calendar events detected in thought',
        analysis,
        eventsCreated: [],
      });
    }

    // Check if user wants auto-create or just suggestions
    if (!autoCreate) {
      return res.json({
        success: true,
        message: 'Calendar event suggestions ready',
        analysis,
        suggestions: calendarEvents.map(event => ({
          text: event.text,
          date: event.date,
        })),
        eventsCreated: [],
      });
    }

    // Auto-create events if user authorized
    const createdEvents = [];

    for (const reminder of calendarEvents) {
      try {
        const event = await googleCalendarService.createEventFromNaturalLanguage(
          userId,
          reminder.text,
          { sendUpdates: 'none' }
        );
        createdEvents.push(event);
      } catch (error) {
        console.error('Failed to create event from reminder:', error);
      }
    }

    res.json({
      success: true,
      message: `Created ${createdEvents.length} calendar event(s)`,
      analysis,
      eventsCreated: createdEvents,
    });

  } catch (error) {
    console.error('Create from thought error:', error);
    res.status(500).json({
      error: 'Failed to process thought for calendar events',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/calendar/upcoming
 * Get upcoming calendar events
 */
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    const { maxResults, timeMin, timeMax, calendarId } = req.query;

    const events = await googleCalendarService.listUpcomingEvents(userId, {
      maxResults: maxResults ? parseInt(maxResults as string) : 10,
      timeMin: timeMin as string,
      timeMax: timeMax as string,
      calendarId: calendarId as string,
    });

    res.json({
      success: true,
      events,
      count: events.length,
    });

  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({
      error: 'Failed to retrieve calendar events',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/calendar/event/:eventId
 * Delete calendar event
 */
router.delete('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { eventId } = req.params;
    const { calendarId } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    if (!eventId) {
      return res.status(400).json({
        error: 'Event ID is required',
      });
    }

    await googleCalendarService.deleteEvent(
      userId,
      eventId,
      (calendarId as string) || 'primary'
    );

    res.json({
      success: true,
      message: 'Calendar event deleted successfully',
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      error: 'Failed to delete calendar event',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/calendar/status
 * Check if user has Google Calendar connected
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    const isConnected = await googleCalendarService.isUserConnected(userId);

    res.json({
      connected: isConnected,
      service: 'google_calendar',
    });

  } catch (error) {
    console.error('Calendar status error:', error);
    res.status(500).json({
      error: 'Failed to check calendar status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

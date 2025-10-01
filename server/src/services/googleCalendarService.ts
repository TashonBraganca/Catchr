/**
 * GOOGLE CALENDAR SERVICE
 *
 * Natural language event creation using Context7 best practices
 * Based on Google Calendar API documentation from Context7 MCP
 *
 * Features:
 * - OAuth 2.0 authentication
 * - quickAdd API for natural language events
 * - Automatic event creation from GPT-5 analysis
 * - Bi-directional sync (coming soon)
 *
 * Example: "Meeting with Sarah tomorrow at 3pm" → Calendar event created
 */

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// OAuth2 scopes required for Calendar access (from Context7 docs)
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface NaturalLanguageEvent {
  text: string;
  userTimeZone?: string;
}

export class GoogleCalendarService {
  private oauth2Client: any;
  private supabase: ReturnType<typeof createClient> | null;

  constructor() {
    this.supabase = null;

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback'
    );

    // Initialize Supabase for storing refresh tokens
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }

    console.log('✅ Google Calendar Service initialized');
  }

  /**
   * GENERATE AUTH URL
   * Create OAuth consent screen URL
   */
  getAuthUrl(userId: string): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: CALENDAR_SCOPES,
      state: userId, // Pass user ID for callback
      prompt: 'consent', // Force consent screen to get refresh token
    });

    console.log('🔐 Generated OAuth URL for user:', userId);
    return authUrl;
  }

  /**
   * HANDLE OAUTH CALLBACK
   * Exchange authorization code for tokens
   */
  async handleOAuthCallback(code: string, userId: string): Promise<void> {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      // Store refresh token in database
      if (this.supabase && tokens.refresh_token) {
        await this.supabase
          .from('user_integrations')
          .upsert({
            user_id: userId,
            service: 'google_calendar',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expiry: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
            scopes: CALENDAR_SCOPES,
            updated_at: new Date().toISOString(),
          });

        console.log('✅ Google Calendar tokens stored for user:', userId);
      }

      // Set credentials
      this.oauth2Client.setCredentials(tokens);

    } catch (error) {
      console.error('❌ OAuth callback failed:', error);
      throw new Error('Failed to authenticate with Google Calendar');
    }
  }

  /**
   * GET USER CREDENTIALS
   * Load stored tokens for user
   */
  async getUserCredentials(userId: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not configured');
      return false;
    }

    try {
      const { data, error } = await this.supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('service', 'google_calendar')
        .single();

      if (error || !data) {
        console.log('❌ No Google Calendar credentials for user:', userId);
        return false;
      }

      // Check if token is expired
      const isExpired = new Date(data.token_expiry) < new Date();

      if (isExpired && data.refresh_token) {
        // Refresh token
        this.oauth2Client.setCredentials({
          refresh_token: data.refresh_token,
        });

        const { credentials } = await this.oauth2Client.refreshAccessToken();

        // Update stored token
        await this.supabase
          .from('user_integrations')
          .update({
            access_token: credentials.access_token,
            token_expiry: new Date(credentials.expiry_date || Date.now() + 3600000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('service', 'google_calendar');

        this.oauth2Client.setCredentials(credentials);
        console.log('🔄 Token refreshed for user:', userId);
      } else {
        this.oauth2Client.setCredentials({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      return true;

    } catch (error) {
      console.error('❌ Failed to get user credentials:', error);
      return false;
    }
  }

  /**
   * CREATE EVENT FROM NATURAL LANGUAGE
   *
   * Using Google Calendar quickAdd API (Context7 pattern)
   * Example: "Meeting with Sarah tomorrow at 3pm" → Creates event
   */
  async createEventFromNaturalLanguage(
    userId: string,
    eventText: string,
    options?: {
      sendUpdates?: 'all' | 'externalOnly' | 'none';
      calendarId?: string;
    }
  ): Promise<CalendarEvent> {
    try {
      // Load user credentials
      const hasCredentials = await this.getUserCredentials(userId);
      if (!hasCredentials) {
        throw new Error('User not authenticated with Google Calendar');
      }

      // Initialize Calendar API
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Use quickAdd for natural language processing
      // From Context7: POST https://www.googleapis.com/calendar/v3/calendars/calendarId/events/quickAdd
      const response = await calendar.events.quickAdd({
        calendarId: options?.calendarId || 'primary',
        text: eventText,
        sendUpdates: options?.sendUpdates || 'none',
      });

      const event = response.data as CalendarEvent;

      console.log('✅ Calendar event created:', event.summary);

      return event;

    } catch (error) {
      console.error('❌ Failed to create calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * CREATE STRUCTURED EVENT
   * Create event with detailed structure
   */
  async createStructuredEvent(
    userId: string,
    eventData: {
      summary: string;
      description?: string;
      startTime: string; // ISO 8601 format
      endTime: string; // ISO 8601 format
      attendees?: string[];
      location?: string;
      reminders?: boolean;
      calendarId?: string;
    }
  ): Promise<CalendarEvent> {
    try {
      // Load user credentials
      const hasCredentials = await this.getUserCredentials(userId);
      if (!hasCredentials) {
        throw new Error('User not authenticated with Google Calendar');
      }

      // Initialize Calendar API
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Create event
      const event: any = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: 'America/Los_Angeles', // TODO: Get from user preferences
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: 'America/Los_Angeles',
        },
      };

      if (eventData.location) {
        event.location = eventData.location;
      }

      if (eventData.attendees && eventData.attendees.length > 0) {
        event.attendees = eventData.attendees.map(email => ({ email }));
      }

      if (eventData.reminders) {
        event.reminders = {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        };
      }

      const response = await calendar.events.insert({
        calendarId: eventData.calendarId || 'primary',
        requestBody: event,
        sendUpdates: 'all',
      });

      console.log('✅ Structured calendar event created:', response.data.summary);

      return response.data as CalendarEvent;

    } catch (error) {
      console.error('❌ Failed to create structured event:', error);
      throw new Error('Failed to create structured event');
    }
  }

  /**
   * LIST UPCOMING EVENTS
   * Get user's upcoming calendar events
   */
  async listUpcomingEvents(
    userId: string,
    options?: {
      maxResults?: number;
      timeMin?: string;
      timeMax?: string;
      calendarId?: string;
    }
  ): Promise<CalendarEvent[]> {
    try {
      // Load user credentials
      const hasCredentials = await this.getUserCredentials(userId);
      if (!hasCredentials) {
        throw new Error('User not authenticated with Google Calendar');
      }

      // Initialize Calendar API
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: options?.calendarId || 'primary',
        timeMin: options?.timeMin || new Date().toISOString(),
        timeMax: options?.timeMax,
        maxResults: options?.maxResults || 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = (response.data.items || []) as CalendarEvent[];

      console.log(`✅ Retrieved ${events.length} upcoming events for user:`, userId);

      return events;

    } catch (error) {
      console.error('❌ Failed to list events:', error);
      throw new Error('Failed to list calendar events');
    }
  }

  /**
   * DELETE EVENT
   * Remove event from calendar
   */
  async deleteEvent(
    userId: string,
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<void> {
    try {
      // Load user credentials
      const hasCredentials = await this.getUserCredentials(userId);
      if (!hasCredentials) {
        throw new Error('User not authenticated with Google Calendar');
      }

      // Initialize Calendar API
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId,
        eventId,
      });

      console.log('✅ Calendar event deleted:', eventId);

    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * UPDATE EVENT
   * Modify existing calendar event
   */
  async updateEvent(
    userId: string,
    eventId: string,
    updates: Partial<CalendarEvent>,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> {
    try {
      // Load user credentials
      const hasCredentials = await this.getUserCredentials(userId);
      if (!hasCredentials) {
        throw new Error('User not authenticated with Google Calendar');
      }

      // Initialize Calendar API
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: updates as any,
      });

      console.log('✅ Calendar event updated:', response.data.summary);

      return response.data as CalendarEvent;

    } catch (error) {
      console.error('❌ Failed to update event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * CHECK INTEGRATION STATUS
   * Verify if user has Google Calendar connected
   */
  async isUserConnected(userId: string): Promise<boolean> {
    return await this.getUserCredentials(userId);
  }
}

// Singleton export
export const googleCalendarService = new GoogleCalendarService();

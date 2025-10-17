import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

// GOOGLE CALENDAR SERVICE
// Handles calendar event creation with natural language and timezone support
// Used by: AI worker for auto-creating calendar events from thoughts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CalendarEventOptions {
  userId: string;
  summary: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  attendees?: string[];
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

interface UserSettings {
  timezone: string;
  default_calendar_id: string | null;
  google_calendar_access_token: string;
  google_calendar_refresh_token: string;
  google_calendar_token_expires_at: string | null;
}

/**
 * Get user's timezone from settings
 * Falls back to America/Los_Angeles if not set
 */
async function getUserTimezone(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('timezone')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.warn(`⚠️ [Calendar] No timezone found for user ${userId}, using default`);
      return 'America/Los_Angeles'; // Default fallback
    }

    return data.timezone || 'America/Los_Angeles';
  } catch (error) {
    console.error('❌ [Calendar] Error fetching user timezone:', error);
    return 'America/Los_Angeles'; // Safe fallback
  }
}

/**
 * Get user's calendar settings
 * Returns null if calendar integration is not enabled
 */
async function getUserCalendarSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('timezone, default_calendar_id, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expires_at, calendar_integration_enabled')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.warn(`⚠️ [Calendar] No settings found for user ${userId}`);
      return null;
    }

    // Check if calendar integration is enabled
    if (!data.calendar_integration_enabled) {
      console.log(`ℹ️ [Calendar] Calendar integration disabled for user ${userId}`);
      return null;
    }

    // Check if we have access token
    if (!data.google_calendar_access_token) {
      console.warn(`⚠️ [Calendar] No access token for user ${userId}`);
      return null;
    }

    return data as UserSettings;
  } catch (error) {
    console.error('❌ [Calendar] Error fetching calendar settings:', error);
    return null;
  }
}

/**
 * Create OAuth2 client with user's tokens
 */
function createOAuth2Client(settings: UserSettings) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  oauth2Client.setCredentials({
    access_token: settings.google_calendar_access_token,
    refresh_token: settings.google_calendar_refresh_token,
    expiry_date: settings.google_calendar_token_expires_at
      ? new Date(settings.google_calendar_token_expires_at).getTime()
      : undefined,
  });

  return oauth2Client;
}

/**
 * Create a calendar event using Google Calendar API
 * Automatically uses user's timezone from settings
 */
export async function createCalendarEvent(options: CalendarEventOptions): Promise<{
  success: boolean;
  eventId?: string;
  eventLink?: string;
  error?: string;
}> {
  const { userId, summary, description, startTime, endTime, location, attendees, reminders } = options;

  try {
    console.log('📅 [Calendar] Creating event for user:', userId);

    // Get user's calendar settings (includes timezone)
    const settings = await getUserCalendarSettings(userId);

    if (!settings) {
      return {
        success: false,
        error: 'Calendar integration not enabled or not configured',
      };
    }

    // Create OAuth2 client
    const auth = createOAuth2Client(settings);
    const calendar = google.calendar({ version: 'v3', auth });

    // Get user's timezone from settings
    const userTimezone = settings.timezone || 'America/Los_Angeles';

    console.log(`🌍 [Calendar] Using timezone: ${userTimezone}`);

    // Prepare event data
    const event: any = {
      summary,
      description,
      location,
      start: startTime
        ? {
            dateTime: startTime.toISOString(),
            timeZone: userTimezone, // Use user's actual timezone
          }
        : {
            date: new Date().toISOString().split('T')[0], // All-day event
          },
      end: endTime
        ? {
            dateTime: endTime.toISOString(),
            timeZone: userTimezone, // Use user's actual timezone
          }
        : {
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next day for all-day events
          },
      attendees: attendees?.map(email => ({ email })),
      reminders: reminders || {
        useDefault: true,
      },
    };

    // Insert event
    const response = await calendar.events.insert({
      calendarId: settings.default_calendar_id || 'primary',
      requestBody: event,
    });

    console.log('✅ [Calendar] Event created:', response.data.id);

    return {
      success: true,
      eventId: response.data.id || undefined,
      eventLink: response.data.htmlLink || undefined,
    };

  } catch (error: any) {
    console.error('❌ [Calendar] Error creating event:', error);

    // Handle specific Google API errors
    if (error.code === 401) {
      return {
        success: false,
        error: 'Calendar authorization expired. Please reconnect your Google Calendar.',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a calendar event from natural language text using quickAdd API
 * This is the recommended approach for AI-generated events
 */
export async function createQuickCalendarEvent(
  userId: string,
  naturalLanguageText: string
): Promise<{
  success: boolean;
  eventId?: string;
  eventLink?: string;
  error?: string;
}> {
  try {
    console.log('⚡ [Calendar] Creating quick event from text:', naturalLanguageText);

    // Get user's calendar settings
    const settings = await getUserCalendarSettings(userId);

    if (!settings) {
      return {
        success: false,
        error: 'Calendar integration not enabled or not configured',
      };
    }

    // Create OAuth2 client
    const auth = createOAuth2Client(settings);
    const calendar = google.calendar({ version: 'v3', auth });

    // Use quickAdd API for natural language processing
    const response = await calendar.events.quickAdd({
      calendarId: settings.default_calendar_id || 'primary',
      text: naturalLanguageText,
    });

    console.log('✅ [Calendar] Quick event created:', response.data.id);

    return {
      success: true,
      eventId: response.data.id || undefined,
      eventLink: response.data.htmlLink || undefined,
    };

  } catch (error: any) {
    console.error('❌ [Calendar] Error creating quick event:', error);

    if (error.code === 401) {
      return {
        success: false,
        error: 'Calendar authorization expired. Please reconnect your Google Calendar.',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user has calendar integration enabled
 * Use this before queuing calendar events
 */
export async function isCalendarIntegrationEnabled(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('calendar_integration_enabled, ai_auto_calendar_events')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    // Both calendar integration AND auto calendar events must be enabled
    return data.calendar_integration_enabled === true && data.ai_auto_calendar_events === true;

  } catch (error) {
    console.error('❌ [Calendar] Error checking integration status:', error);
    return false;
  }
}

export { getUserTimezone, getUserCalendarSettings };

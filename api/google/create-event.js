// Google Calendar Create Event
import { withAuth, getUserIntegration, saveIntegration, supabaseAdmin } from '../lib/auth.js';

async function refreshAccessToken(integration, clientId, clientSecret) {
  if (!integration.refresh_token) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Token refresh failed: ${errorData}`);
  }

  const tokenData = await response.json();
  const { access_token, expires_in } = tokenData;

  // Update integration with new token
  const tokenExpiry = new Date(Date.now() + (expires_in * 1000)).toISOString();
  await saveIntegration(integration.user_id, 'google', {
    ...integration,
    access_token,
    token_expiry: tokenExpiry,
  });

  return access_token;
}

async function createEventHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const eventData = req.body;

  if (!eventData.summary || !eventData.start || !eventData.end) {
    return res.status(400).json({ error: 'Event summary, start, and end are required' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  try {
    // Get user's Google integration
    let integration = await getUserIntegration(userId, 'google');

    if (!integration || !integration.access_token) {
      return res.status(400).json({ error: 'Google Calendar integration not found' });
    }

    let accessToken = integration.access_token;

    // Check if token is expired and refresh if needed
    if (integration.token_expiry && new Date(integration.token_expiry) < new Date()) {
      accessToken = await refreshAccessToken(integration, clientId, clientSecret);
    }

    // Create event in Google Calendar
    const calendarId = eventData.calendarId || 'primary';
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees,
        reminders: eventData.reminders,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      
      // If unauthorized, try refreshing token once more
      if (response.status === 401 && integration.refresh_token) {
        try {
          accessToken = await refreshAccessToken(integration, clientId, clientSecret);
          
          // Retry the request with new token
          const retryResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: eventData.summary,
              description: eventData.description,
              location: eventData.location,
              start: eventData.start,
              end: eventData.end,
              attendees: eventData.attendees,
              reminders: eventData.reminders,
            }),
          });

          if (!retryResponse.ok) {
            const retryError = await retryResponse.text();
            throw new Error(`Google Calendar API error: ${retryError}`);
          }

          const event = await retryResponse.json();
          await saveEventToDatabase(userId, event, calendarId);
          return res.status(200).json({ success: true, event });
        } catch (refreshError) {
          throw new Error(`Token refresh and retry failed: ${refreshError.message}`);
        }
      }
      
      throw new Error(`Google Calendar API error: ${errorData}`);
    }

    const event = await response.json();

    // Save event to database
    await saveEventToDatabase(userId, event, calendarId);

    return res.status(200).json({ success: true, event });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ 
      error: 'Failed to create calendar event',
      details: error.message 
    });
  }
}

async function saveEventToDatabase(userId, event, calendarId) {
  await supabaseAdmin
    .from('calendar_events')
    .upsert({
      user_id: userId,
      google_event_id: event.id,
      calendar_id: calendarId,
      summary: event.summary,
      description: event.description,
      location: event.location,
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      timezone: event.start.timeZone,
      is_all_day: !event.start.dateTime,
      recurrence: event.recurrence,
      attendees: event.attendees,
    });
}

export default withAuth(createEventHandler);

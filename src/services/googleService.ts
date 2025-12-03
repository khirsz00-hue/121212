// Google Calendar Service - Frontend wrapper for API calls

async function getAuthHeaders(): Promise<HeadersInit> {
  // Get Supabase session token
  const { supabase } = await import('../lib/supabaseClient');
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export const googleService = {
  async createEvent(eventData: {
    summary: string;
    description?: string;
    location?: string;
    start: {
      dateTime?: string;
      date?: string;
      timeZone?: string;
    };
    end: {
      dateTime?: string;
      date?: string;
      timeZone?: string;
    };
    attendees?: Array<{ email: string }>;
    reminders?: {
      useDefault?: boolean;
      overrides?: Array<{ method: string; minutes: number }>;
    };
  }) {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/google/create-event', {
      method: 'POST',
      headers,
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create calendar event');
    }

    return response.json();
  },

  startOAuth() {
    window.location.href = '/api/google/oauth-start';
  },
};

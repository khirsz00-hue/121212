import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface CalendarEvent {
  id: string;
  user_id: string;
  google_event_id: string;
  calendar_id: string;
  summary: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  is_all_day: boolean;
  recurrence?: string[];
  attendees?: any;
  created_at: string;
  updated_at: string;
}

export function useGoogleEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (startDate) {
        query = query.gte('start_time', startDate);
      }
      if (endDate) {
        query = query.lte('start_time', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('calendar_events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
}

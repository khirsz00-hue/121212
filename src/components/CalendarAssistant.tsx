import React, { useState } from 'react';
import { googleService } from '../services/googleService';
import './CalendarAssistant.css';

interface CalendarAssistantProps {
  events: any[];
  hasIntegration: boolean;
}

const CalendarAssistant: React.FC<CalendarAssistantProps> = ({ events, hasIntegration }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAIAssist = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const { supabase } = await import('../lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const aiResponse = await fetch('/api/openai/proxy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an ADHD-friendly calendar assistant. Help users schedule events, manage their time, and avoid overwhelm. Current events: ${events.length}`,
            },
            {
              role: 'user',
              content: input,
            },
          ],
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('AI request failed');
      }

      const data = await aiResponse.json();
      setResponse(data.choices[0]?.message?.content || 'No response');
    } catch (err: any) {
      setError(err.message || 'Failed to get AI assistance');
    } finally {
      setLoading(false);
    }
  };

  if (!hasIntegration) {
    return (
      <div className="calendar-assistant">
        <div className="no-integration">
          <h2>Connect Google Calendar</h2>
          <p>To use the Calendar Assistant, please connect your Google Calendar account in the Integrations tab.</p>
          <button onClick={() => googleService.startOAuth()} className="connect-button">
            Connect Google Calendar
          </button>
        </div>
      </div>
    );
  }

  const upcomingEvents = events
    .filter(e => new Date(e.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  return (
    <div className="calendar-assistant">
      <h2>📅 Calendar Assistant</h2>

      <div className="calendar-stats">
        <div className="stat-card">
          <span className="stat-number">{upcomingEvents.length}</span>
          <span className="stat-label">Upcoming Events</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{events.length}</span>
          <span className="stat-label">Total Events</span>
        </div>
      </div>

      <div className="ai-chat">
        <div className="chat-input-group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your schedule... e.g., 'What's on my calendar today?' or 'Schedule a meeting tomorrow at 2pm'"
            rows={4}
          />
          <button 
            onClick={handleAIAssist}
            disabled={loading || !input.trim()}
            className="ai-button"
          >
            {loading ? 'Thinking...' : '✨ Ask AI Assistant'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        
        {response && (
          <div className="ai-response">
            <h3>AI Assistant:</h3>
            <p>{response}</p>
          </div>
        )}
      </div>

      <div className="events-list">
        <h3>Upcoming Events</h3>
        {upcomingEvents.length === 0 ? (
          <p className="empty-state">No upcoming events. Use the AI assistant to schedule something!</p>
        ) : (
          <div className="event-items">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="event-item">
                <div className="event-time">
                  <span className="event-date">
                    {new Date(event.start_time).toLocaleDateString()}
                  </span>
                  <span className="event-hour">
                    {new Date(event.start_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="event-content">
                  <h4>{event.summary}</h4>
                  {event.description && <p className="event-description">{event.description}</p>}
                  {event.location && (
                    <span className="event-location">📍 {event.location}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarAssistant;

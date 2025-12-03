import React, { useEffect } from 'react';
import { useUser } from './hooks/useUser';
import { useIntegrations } from './hooks/useIntegrations';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const { user, loading, session } = useUser();
  const { integrations, refetch: refetchIntegrations } = useIntegrations();

  // Handle OAuth callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Handle Todoist OAuth callback
    if (params.get('todoist_setup') === '1' && params.get('todoist_token')) {
      const token = params.get('todoist_token');
      handleTodoistSetup(token);
      // Clean URL
      window.history.replaceState({}, '', '/');
    }

    // Handle Google OAuth callback
    if (params.get('google_setup') === '1' && params.get('google_token')) {
      const token = params.get('google_token');
      const refreshToken = params.get('google_refresh');
      const expiry = params.get('google_expiry');
      handleGoogleSetup(token, refreshToken, expiry);
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleTodoistSetup = async (token: string) => {
    if (!session) return;

    try {
      // Save Todoist integration
      const response = await fetch('/api/todoist/save-integration', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: token }),
      });

      if (response.ok) {
        refetchIntegrations();
        alert('Todoist connected successfully!');
      }
    } catch (error) {
      console.error('Failed to save Todoist integration:', error);
    }
  };

  const handleGoogleSetup = async (token: string, refreshToken: string | null, expiry: string | null) => {
    if (!session) return;

    try {
      // Save Google integration
      const response = await fetch('/api/google/save-integration', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          access_token: token,
          refresh_token: refreshToken,
          token_expiry: expiry,
        }),
      });

      if (response.ok) {
        refetchIntegrations();
        alert('Google Calendar connected successfully!');
      }
    } catch (error) {
      console.error('Failed to save Google integration:', error);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Dashboard integrations={integrations} />;
}

export default App;

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
    if (params.get('todoist_setup') === 'pending' && session) {
      handleTodoistSetup();
      // Clean URL
      window.history.replaceState({}, '', '/');
    }

    // Handle Google OAuth callback
    if (params.get('google_setup') === 'pending' && session) {
      handleGoogleSetup();
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, [session]);

  const handleTodoistSetup = async () => {
    if (!session) return;

    try {
      // Get token from secure endpoint
      const tokenResponse = await fetch('/api/todoist/get-temp-token', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to retrieve token');
      }

      const { token } = await tokenResponse.json();

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
      alert('Failed to connect Todoist. Please try again.');
    }
  };

  const handleGoogleSetup = async () => {
    if (!session) return;

    try {
      // Get tokens from secure endpoint
      const tokensResponse = await fetch('/api/google/get-temp-tokens', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!tokensResponse.ok) {
        throw new Error('Failed to retrieve tokens');
      }

      const { token, refresh_token, token_expiry } = await tokensResponse.json();

      // Save Google integration
      const response = await fetch('/api/google/save-integration', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          access_token: token,
          refresh_token: refresh_token,
          token_expiry: token_expiry,
        }),
      });

      if (response.ok) {
        refetchIntegrations();
        alert('Google Calendar connected successfully!');
      }
    } catch (error) {
      console.error('Failed to save Google integration:', error);
      alert('Failed to connect Google Calendar. Please try again.');
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

// Todoist OAuth Callback - Exchange code for token and save to database
import { supabaseAdmin } from '../lib/auth.js';

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `OAuth error: ${error}` });
  }

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.TODOIST_CLIENT_ID;
  const clientSecret = process.env.TODOIST_CLIENT_SECRET;
  const baseUrl = process.env.BASE_URL;

  if (!clientId || !clientSecret || !baseUrl) {
    return res.status(500).json({ error: 'Missing Todoist configuration' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://todoist.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    if (!access_token) {
      throw new Error('No access token received');
    }

    // Get user info from Todoist
    const userResponse = await fetch('https://api.todoist.com/sync/v9/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sync_token: '*',
        resource_types: ['user'],
      }),
    });

    const userData = await userResponse.json();
    
    // For now, we'll need the user to be logged in to Supabase
    // In a real implementation, you'd maintain session state
    // For this demo, redirect to a page where they can link their account
    
    // Store token temporarily in URL (in production, use proper session management)
    const redirectUrl = `${baseUrl}/?todoist_token=${access_token}&todoist_setup=1`;
    
    return res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Todoist OAuth error:', error);
    return res.status(500).json({ 
      error: 'OAuth callback failed',
      details: error.message 
    });
  }
}

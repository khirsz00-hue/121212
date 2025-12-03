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
    
    // Redirect to frontend with a success flag
    // Frontend should use a secure POST endpoint to save the token
    // This is a workaround - in production, use server-side session storage
    const redirectUrl = `${baseUrl}/?todoist_setup=pending`;
    
    // Set a secure, httpOnly cookie with the token (expires in 5 minutes)
    res.setHeader('Set-Cookie', [
      `todoist_temp_token=${access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=300`
    ]);
    
    return res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Todoist OAuth error:', error);
    return res.status(500).json({ 
      error: 'OAuth callback failed',
      details: error.message 
    });
  }
}

// Google OAuth Callback - Exchange code for tokens and save to database
import { supabaseAdmin } from '../lib/auth.js';

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `OAuth error: ${error}` });
  }

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.BASE_URL;

  if (!clientId || !clientSecret || !baseUrl) {
    return res.status(500).json({ error: 'Missing Google configuration' });
  }

  try {
    const redirectUri = `${baseUrl}/api/google/oauth-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, scope } = tokenData;

    if (!access_token) {
      throw new Error('No access token received');
    }

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + (expires_in * 1000)).toISOString();

    // Redirect to frontend with a success flag
    // Set secure cookies with the tokens (expires in 5 minutes)
    const cookies = [
      `google_temp_token=${access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=300`
    ];
    
    if (refresh_token) {
      cookies.push(`google_temp_refresh=${refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=300`);
    }
    
    cookies.push(`google_temp_expiry=${tokenExpiry}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=300`);
    
    res.setHeader('Set-Cookie', cookies);
    
    const redirectUrl = `${baseUrl}/?google_setup=pending`;
    
    return res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    return res.status(500).json({ 
      error: 'OAuth callback failed',
      details: error.message 
    });
  }
}

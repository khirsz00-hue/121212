// Google OAuth Start - Redirect to Google authorization
export default async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.BASE_URL;

  if (!clientId || !baseUrl) {
    return res.status(500).json({ error: 'Missing Google configuration' });
  }

  const redirectUri = `${baseUrl}/api/google/oauth-callback`;
  const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
  
  // Generate state for CSRF protection
  const state = Buffer.from(JSON.stringify({ timestamp: Date.now() })).toString('base64');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&state=${state}&prompt=consent`;

  return res.redirect(authUrl);
}

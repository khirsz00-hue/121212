// Todoist OAuth Start - Redirect to Todoist authorization
export default async function handler(req, res) {
  const clientId = process.env.TODOIST_CLIENT_ID;
  const baseUrl = process.env.BASE_URL;

  if (!clientId || !baseUrl) {
    return res.status(500).json({ error: 'Missing Todoist configuration' });
  }

  const scope = 'data:read_write,data:delete,project:delete';
  const redirectUri = `${baseUrl}/api/todoist/oauth-callback`;
  
  // Generate state for CSRF protection (in production, store this in session)
  const state = Buffer.from(JSON.stringify({ timestamp: Date.now() })).toString('base64');

  const authUrl = `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return res.redirect(authUrl);
}

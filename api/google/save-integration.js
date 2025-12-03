// Save Google Calendar Integration
import { withAuth, saveIntegration } from '../lib/auth.js';

async function saveIntegrationHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const { access_token, refresh_token, token_expiry } = req.body;

  if (!access_token) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    await saveIntegration(userId, 'google', {
      access_token,
      refresh_token,
      token_expiry,
      scope: 'https://www.googleapis.com/auth/calendar',
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save integration error:', error);
    return res.status(500).json({ 
      error: 'Failed to save integration',
      details: error.message 
    });
  }
}

export default withAuth(saveIntegrationHandler);

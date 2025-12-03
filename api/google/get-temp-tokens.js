// Get temporary Google tokens from cookies
import { withAuth } from '../lib/auth.js';

async function getGoogleTokensHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse cookies
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/google_temp_token=([^;]+)/);
    const refreshMatch = cookies.match(/google_temp_refresh=([^;]+)/);
    const expiryMatch = cookies.match(/google_temp_expiry=([^;]+)/);
    
    if (!tokenMatch) {
      return res.status(404).json({ error: 'No temporary token found' });
    }

    const token = tokenMatch[1];
    const refreshToken = refreshMatch ? refreshMatch[1] : null;
    const expiry = expiryMatch ? expiryMatch[1] : null;

    // Clear the cookies
    res.setHeader('Set-Cookie', [
      'google_temp_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
      'google_temp_refresh=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
      'google_temp_expiry=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    ]);

    return res.status(200).json({ 
      token,
      refresh_token: refreshToken,
      token_expiry: expiry
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve tokens',
      details: error.message 
    });
  }
}

export default withAuth(getGoogleTokensHandler);

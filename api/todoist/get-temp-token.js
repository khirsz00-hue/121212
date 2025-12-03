// Get temporary Todoist token from cookie
import { withAuth } from '../lib/auth.js';

async function getTodoistTokenHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse cookies
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/todoist_temp_token=([^;]+)/);
    
    if (!tokenMatch) {
      return res.status(404).json({ error: 'No temporary token found' });
    }

    const token = tokenMatch[1];

    // Clear the cookie
    res.setHeader('Set-Cookie', 'todoist_temp_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Get token error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve token',
      details: error.message 
    });
  }
}

export default withAuth(getTodoistTokenHandler);

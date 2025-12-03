// Todoist Add Comment to Task
import { withAuth, getUserIntegration } from '../lib/auth.js';

async function addCommentHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const { taskId, content } = req.body;

  if (!taskId || !content) {
    return res.status(400).json({ error: 'Task ID and content are required' });
  }

  try {
    // Get user's Todoist integration
    const integration = await getUserIntegration(userId, 'todoist');

    if (!integration || !integration.access_token) {
      return res.status(400).json({ error: 'Todoist integration not found' });
    }

    // Add comment to task in Todoist
    const response = await fetch('https://api.todoist.com/rest/v2/comments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: taskId,
        content,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Todoist API error: ${errorData}`);
    }

    const comment = await response.json();

    return res.status(200).json({ success: true, comment });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ 
      error: 'Failed to add comment',
      details: error.message 
    });
  }
}

export default withAuth(addCommentHandler);

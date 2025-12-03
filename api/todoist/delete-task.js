// Todoist Delete Task
import { withAuth, getUserIntegration, supabaseAdmin } from '../lib/auth.js';

async function deleteTaskHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const { taskId } = req.body;

  if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    // Get user's Todoist integration
    const integration = await getUserIntegration(userId, 'todoist');

    if (!integration || !integration.access_token) {
      return res.status(400).json({ error: 'Todoist integration not found' });
    }

    // Delete task from Todoist
    const response = await fetch(`https://api.todoist.com/rest/v2/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.text();
      throw new Error(`Todoist API error: ${errorData}`);
    }

    // Delete from database
    await supabaseAdmin
      .from('todoist_tasks')
      .delete()
      .eq('user_id', userId)
      .eq('todoist_id', taskId);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ 
      error: 'Failed to delete task',
      details: error.message 
    });
  }
}

export default withAuth(deleteTaskHandler);

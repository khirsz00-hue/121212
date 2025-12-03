// Todoist Update Task
import { withAuth, getUserIntegration, supabaseAdmin } from '../lib/auth.js';

async function updateTaskHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const { taskId, content, description, project_id, parent_id, priority, due_date, due_string, labels, is_completed } = req.body;

  if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    // Get user's Todoist integration
    const integration = await getUserIntegration(userId, 'todoist');

    if (!integration || !integration.access_token) {
      return res.status(400).json({ error: 'Todoist integration not found' });
    }

    // Handle task completion separately
    if (is_completed !== undefined) {
      const completeResponse = await fetch(`https://api.todoist.com/rest/v2/tasks/${taskId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
        },
      });

      if (!completeResponse.ok && completeResponse.status !== 204) {
        const errorData = await completeResponse.text();
        throw new Error(`Todoist API error: ${errorData}`);
      }

      // Update in database
      await supabaseAdmin
        .from('todoist_tasks')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('todoist_id', taskId);

      return res.status(200).json({ success: true, completed: true });
    }

    // Build update payload
    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (description !== undefined) updateData.description = description;
    if (project_id !== undefined) updateData.project_id = project_id;
    if (parent_id !== undefined) updateData.parent_id = parent_id;
    if (priority !== undefined) updateData.priority = priority;
    if (labels !== undefined) updateData.labels = labels;
    
    if (due_date !== undefined) {
      updateData.due_date = due_date;
    } else if (due_string !== undefined) {
      updateData.due_string = due_string;
    }

    // Update task in Todoist
    const response = await fetch(`https://api.todoist.com/rest/v2/tasks/${taskId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Todoist API error: ${errorData}`);
    }

    const task = await response.json();

    // Update in database
    await supabaseAdmin
      .from('todoist_tasks')
      .update({
        content: task.content,
        description: task.description,
        project_id: task.project_id,
        parent_id: task.parent_id,
        order_index: task.order,
        priority: task.priority,
        due_date: task.due?.date,
        due_datetime: task.due?.datetime,
        due_string: task.due?.string,
        labels: task.labels,
      })
      .eq('user_id', userId)
      .eq('todoist_id', taskId);

    return res.status(200).json({ success: true, task });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ 
      error: 'Failed to update task',
      details: error.message 
    });
  }
}

export default withAuth(updateTaskHandler);

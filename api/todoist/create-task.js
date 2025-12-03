// Todoist Create Task
import { withAuth, getUserIntegration, supabaseAdmin } from '../lib/auth.js';

async function createTaskHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const { content, description, project_id, parent_id, priority, due_date, due_string, labels } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Task content is required' });
  }

  try {
    // Get user's Todoist integration
    const integration = await getUserIntegration(userId, 'todoist');

    if (!integration || !integration.access_token) {
      return res.status(400).json({ error: 'Todoist integration not found' });
    }

    // Create task in Todoist
    const taskData = {
      content,
      description,
      project_id,
      parent_id,
      priority: priority || 1,
      labels,
    };

    if (due_date) {
      taskData.due_date = due_date;
    } else if (due_string) {
      taskData.due_string = due_string;
    }

    const response = await fetch('https://api.todoist.com/rest/v2/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Todoist API error: ${errorData}`);
    }

    const task = await response.json();

    // Save task to database
    await supabaseAdmin
      .from('todoist_tasks')
      .upsert({
        user_id: userId,
        todoist_id: task.id,
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
        is_completed: false,
      });

    return res.status(200).json({ success: true, task });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ 
      error: 'Failed to create task',
      details: error.message 
    });
  }
}

export default withAuth(createTaskHandler);

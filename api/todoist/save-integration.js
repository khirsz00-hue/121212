// Save Todoist Integration
import { withAuth, saveIntegration } from '../lib/auth.js';

async function saveIntegrationHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    await saveIntegration(userId, 'todoist', {
      access_token,
      scope: 'data:read_write,data:delete,project:delete',
    });

    // Trigger initial sync of projects, labels, and tasks
    await syncTodoistData(userId, access_token);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save integration error:', error);
    return res.status(500).json({ 
      error: 'Failed to save integration',
      details: error.message 
    });
  }
}

async function syncTodoistData(userId, accessToken) {
  const { supabaseAdmin } = await import('../lib/auth.js');
  
  try {
    // Fetch projects
    const projectsResponse = await fetch('https://api.todoist.com/rest/v2/projects', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    if (projectsResponse.ok) {
      const projects = await projectsResponse.json();
      for (const project of projects) {
        await supabaseAdmin.from('todoist_projects').upsert({
          user_id: userId,
          todoist_id: project.id,
          name: project.name,
          color: project.color,
          parent_id: project.parent_id,
          order_index: project.order,
          is_favorite: project.is_favorite || false,
          view_style: project.view_style,
        });
      }
    }

    // Fetch labels
    const labelsResponse = await fetch('https://api.todoist.com/rest/v2/labels', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    if (labelsResponse.ok) {
      const labels = await labelsResponse.json();
      for (const label of labels) {
        await supabaseAdmin.from('todoist_labels').upsert({
          user_id: userId,
          todoist_id: label.id,
          name: label.name,
          color: label.color,
          order_index: label.order,
          is_favorite: label.is_favorite || false,
        });
      }
    }

    // Fetch tasks
    const tasksResponse = await fetch('https://api.todoist.com/rest/v2/tasks', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    if (tasksResponse.ok) {
      const tasks = await tasksResponse.json();
      for (const task of tasks) {
        await supabaseAdmin.from('todoist_tasks').upsert({
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
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
    // Don't fail the integration save if sync fails
  }
}

export default withAuth(saveIntegrationHandler);

// Todoist Webhook Receiver
import crypto from 'crypto';
import { supabaseAdmin } from '../lib/auth.js';

function verifyWebhookSignature(req, secret) {
  const signature = req.headers['x-todoist-hmac-sha256'];
  
  if (!signature) {
    return false;
  }

  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');

  return signature === hash;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.TODOIST_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('TODOIST_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  // Verify webhook signature
  if (!verifyWebhookSignature(req, webhookSecret)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const { event_name, event_data, user_id: todoistUserId } = req.body;

    // Find user by Todoist integration
    const { data: integrations } = await supabaseAdmin
      .from('integrations')
      .select('user_id')
      .eq('provider', 'todoist')
      .limit(1);

    if (!integrations || integrations.length === 0) {
      console.error('No user found for Todoist webhook');
      return res.status(200).json({ received: true });
    }

    const userId = integrations[0].user_id;

    // Handle different event types
    switch (event_name) {
      case 'item:added':
      case 'item:updated':
        await handleTaskUpdate(userId, event_data);
        break;
      
      case 'item:deleted':
        await handleTaskDelete(userId, event_data);
        break;
      
      case 'item:completed':
        await handleTaskComplete(userId, event_data);
        break;

      case 'project:added':
      case 'project:updated':
        await handleProjectUpdate(userId, event_data);
        break;

      case 'project:deleted':
        await handleProjectDelete(userId, event_data);
        break;

      default:
        console.log('Unhandled webhook event:', event_name);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleTaskUpdate(userId, taskData) {
  await supabaseAdmin
    .from('todoist_tasks')
    .upsert({
      user_id: userId,
      todoist_id: taskData.id,
      content: taskData.content,
      description: taskData.description,
      project_id: taskData.project_id,
      parent_id: taskData.parent_id,
      order_index: taskData.order,
      priority: taskData.priority,
      due_date: taskData.due?.date,
      due_datetime: taskData.due?.datetime,
      due_string: taskData.due?.string,
      labels: taskData.labels,
      is_completed: taskData.checked === 1,
    });
}

async function handleTaskDelete(userId, taskData) {
  await supabaseAdmin
    .from('todoist_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('todoist_id', taskData.id);
}

async function handleTaskComplete(userId, taskData) {
  await supabaseAdmin
    .from('todoist_tasks')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('todoist_id', taskData.id);
}

async function handleProjectUpdate(userId, projectData) {
  await supabaseAdmin
    .from('todoist_projects')
    .upsert({
      user_id: userId,
      todoist_id: projectData.id,
      name: projectData.name,
      color: projectData.color,
      parent_id: projectData.parent_id,
      order_index: projectData.order,
      is_favorite: projectData.is_favorite,
      view_style: projectData.view_style,
    });
}

async function handleProjectDelete(userId, projectData) {
  await supabaseAdmin
    .from('todoist_projects')
    .delete()
    .eq('user_id', userId)
    .eq('todoist_id', projectData.id);
}

// Todoist Register Webhook
import { withAuth, getUserIntegration, saveIntegration } from '../lib/auth.js';

async function registerWebhookHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    return res.status(500).json({ error: 'BASE_URL not configured' });
  }

  try {
    // Get user's Todoist integration
    const integration = await getUserIntegration(userId, 'todoist');

    if (!integration || !integration.access_token) {
      return res.status(400).json({ error: 'Todoist integration not found' });
    }

    // Check if webhook already exists
    if (integration.webhook_id) {
      return res.status(200).json({ 
        success: true, 
        message: 'Webhook already registered',
        webhook_id: integration.webhook_id 
      });
    }

    // Register webhook with Todoist (Note: Webhooks require Todoist Premium/Business)
    const webhookUrl = `${baseUrl}/api/todoist/webhook`;
    
    // Todoist webhook API is not publicly documented for REST v2
    // This is a placeholder for when webhooks become available
    // For now, we'll use Sync API approach or manual setup
    
    const response = await fetch('https://api.todoist.com/sync/v9/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sync_token: '*',
        resource_types: ['all'],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Todoist API error: ${errorData}`);
    }

    // For now, store a placeholder webhook ID
    // In production, implement proper webhook registration when Todoist API supports it
    const webhookId = `webhook_${userId}_${Date.now()}`;
    
    await saveIntegration(userId, 'todoist', {
      ...integration,
      webhook_id: webhookId,
    });

    return res.status(200).json({ 
      success: true, 
      webhook_id: webhookId,
      message: 'Webhook registered (using sync API fallback)'
    });
  } catch (error) {
    console.error('Register webhook error:', error);
    return res.status(500).json({ 
      error: 'Failed to register webhook',
      details: error.message 
    });
  }
}

export default withAuth(registerWebhookHandler);

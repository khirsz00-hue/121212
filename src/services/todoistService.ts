// Todoist Service - Frontend wrapper for API calls

async function getAuthHeaders(): Promise<HeadersInit> {
  // Get Supabase session token
  const { supabase } = await import('../lib/supabaseClient');
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export const todoistService = {
  async createTask(taskData: {
    content: string;
    description?: string;
    project_id?: string;
    parent_id?: string;
    priority?: number;
    due_date?: string;
    due_string?: string;
    labels?: string[];
  }) {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/todoist/create-task', {
      method: 'POST',
      headers,
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create task');
    }

    return response.json();
  },

  async updateTask(taskId: string, updates: {
    content?: string;
    description?: string;
    project_id?: string;
    parent_id?: string;
    priority?: number;
    due_date?: string;
    due_string?: string;
    labels?: string[];
  }) {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/todoist/update-task', {
      method: 'POST',
      headers,
      body: JSON.stringify({ taskId, ...updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update task');
    }

    return response.json();
  },

  async deleteTask(taskId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/todoist/delete-task', {
      method: 'POST',
      headers,
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete task');
    }

    return response.json();
  },

  async completeTask(taskId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/todoist/update-task', {
      method: 'POST',
      headers,
      body: JSON.stringify({ taskId, is_completed: true }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete task');
    }

    return response.json();
  },

  async addComment(taskId: string, content: string) {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/todoist/add-comment', {
      method: 'POST',
      headers,
      body: JSON.stringify({ taskId, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add comment');
    }

    return response.json();
  },

  startOAuth() {
    window.location.href = '/api/todoist/oauth-start';
  },
};

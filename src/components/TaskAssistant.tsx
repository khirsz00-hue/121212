import React, { useState } from 'react';
import { todoistService } from '../services/todoistService';
import './TaskAssistant.css';

interface TaskAssistantProps {
  tasks: any[];
  projects: any[];
  labels: any[];
  hasIntegration: boolean;
}

const TaskAssistant: React.FC<TaskAssistantProps> = ({ tasks, projects, labels, hasIntegration }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAIAssist = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Call OpenAI proxy to get AI assistance
      const { supabase } = await import('../lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const aiResponse = await fetch('/api/openai/proxy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an ADHD-friendly task management assistant. Help users break down tasks, set priorities, and organize their work. Current tasks: ${tasks.length}, Projects: ${projects.length}`,
            },
            {
              role: 'user',
              content: input,
            },
          ],
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('AI request failed');
      }

      const data = await aiResponse.json();
      setResponse(data.choices[0]?.message?.content || 'No response');
    } catch (err: any) {
      setError(err.message || 'Failed to get AI assistance');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskContent: string) => {
    try {
      await todoistService.createTask({ content: taskContent });
      alert('Task created successfully!');
    } catch (err: any) {
      alert(`Failed to create task: ${err.message}`);
    }
  };

  if (!hasIntegration) {
    return (
      <div className="task-assistant">
        <div className="no-integration">
          <h2>Connect Todoist</h2>
          <p>To use the Task Assistant, please connect your Todoist account in the Integrations tab.</p>
          <button onClick={() => todoistService.startOAuth()} className="connect-button">
            Connect Todoist
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-assistant">
      <h2>📝 Task Assistant</h2>
      
      <div className="task-stats">
        <div className="stat-card">
          <span className="stat-number">{tasks.filter(t => !t.is_completed).length}</span>
          <span className="stat-label">Active Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{projects.length}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{labels.length}</span>
          <span className="stat-label">Labels</span>
        </div>
      </div>

      <div className="ai-chat">
        <div className="chat-input-group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your tasks... e.g., 'Help me prioritize my tasks' or 'Create a task to finish the report'"
            rows={4}
          />
          <button 
            onClick={handleAIAssist}
            disabled={loading || !input.trim()}
            className="ai-button"
          >
            {loading ? 'Thinking...' : '✨ Ask AI Assistant'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        
        {response && (
          <div className="ai-response">
            <h3>AI Assistant:</h3>
            <p>{response}</p>
          </div>
        )}
      </div>

      <div className="tasks-list">
        <h3>Your Tasks</h3>
        {tasks.length === 0 ? (
          <p className="empty-state">No tasks yet. Create your first task using the AI assistant!</p>
        ) : (
          <div className="task-items">
            {tasks.slice(0, 10).map((task) => (
              <div key={task.id} className={`task-item ${task.is_completed ? 'completed' : ''}`}>
                <div className="task-content">
                  <h4>{task.content}</h4>
                  {task.description && <p className="task-description">{task.description}</p>}
                  {task.due_date && (
                    <span className="task-due">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="task-actions">
                  <span className={`priority priority-${task.priority}`}>P{task.priority}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAssistant;

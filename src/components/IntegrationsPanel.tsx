import React from 'react';
import { todoistService } from '../services/todoistService';
import { googleService } from '../services/googleService';
import './IntegrationsPanel.css';

interface IntegrationsPanelProps {
  integrations: any[];
}

const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ integrations }) => {
  const todoistIntegration = integrations.find(i => i.provider === 'todoist');
  const googleIntegration = integrations.find(i => i.provider === 'google');

  return (
    <div className="integrations-panel">
      <h2>🔗 Integrations</h2>
      <p className="panel-description">
        Connect your favorite tools to enhance your productivity workflow.
      </p>

      <div className="integration-cards">
        <div className="integration-card">
          <div className="integration-header">
            <div className="integration-icon todoist-icon">✓</div>
            <div className="integration-info">
              <h3>Todoist</h3>
              <p>Task management and organization</p>
            </div>
          </div>

          {todoistIntegration ? (
            <div className="integration-status connected">
              <span className="status-indicator">●</span>
              <span>Connected</span>
            </div>
          ) : (
            <div className="integration-actions">
              <button 
                onClick={() => todoistService.startOAuth()}
                className="connect-button"
              >
                Connect Todoist
              </button>
            </div>
          )}

          <div className="integration-features">
            <h4>Features:</h4>
            <ul>
              <li>Create and manage tasks</li>
              <li>Organize with projects and labels</li>
              <li>Set priorities and due dates</li>
              <li>Add comments and subtasks</li>
              <li>Real-time sync with webhooks</li>
            </ul>
          </div>
        </div>

        <div className="integration-card">
          <div className="integration-header">
            <div className="integration-icon google-icon">📅</div>
            <div className="integration-info">
              <h3>Google Calendar</h3>
              <p>Schedule and time management</p>
            </div>
          </div>

          {googleIntegration ? (
            <div className="integration-status connected">
              <span className="status-indicator">●</span>
              <span>Connected</span>
            </div>
          ) : (
            <div className="integration-actions">
              <button 
                onClick={() => googleService.startOAuth()}
                className="connect-button"
              >
                Connect Google Calendar
              </button>
            </div>
          )}

          <div className="integration-features">
            <h4>Features:</h4>
            <ul>
              <li>Create calendar events</li>
              <li>View upcoming events</li>
              <li>Set reminders and notifications</li>
              <li>Manage multiple calendars</li>
              <li>Automatic token refresh</li>
            </ul>
          </div>
        </div>

        <div className="integration-card">
          <div className="integration-header">
            <div className="integration-icon openai-icon">✨</div>
            <div className="integration-info">
              <h3>OpenAI Assistant</h3>
              <p>AI-powered productivity help</p>
            </div>
          </div>

          <div className="integration-status connected">
            <span className="status-indicator">●</span>
            <span>Always Active</span>
          </div>

          <div className="integration-features">
            <h4>Features:</h4>
            <ul>
              <li>Natural language task creation</li>
              <li>Smart scheduling suggestions</li>
              <li>Task prioritization help</li>
              <li>ADHD-friendly advice</li>
              <li>Context-aware responses</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="setup-instructions">
        <h3>⚙️ Setup Instructions</h3>
        <div className="instruction-card">
          <h4>First Time Setup:</h4>
          <ol>
            <li>
              <strong>Database Setup:</strong> Run the setup endpoint to initialize the database:
              <code>GET /api/setup?secret=YOUR_SETUP_SECRET</code>
            </li>
            <li>
              <strong>Environment Variables:</strong> Make sure all required environment variables are set in your Vercel project or .env file.
            </li>
            <li>
              <strong>Connect Integrations:</strong> Use the buttons above to connect Todoist and Google Calendar.
            </li>
            <li>
              <strong>Start Using:</strong> Once connected, you can use the AI assistants to manage tasks and calendar events.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPanel;

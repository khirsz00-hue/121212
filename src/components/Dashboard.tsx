import React, { useState } from 'react';
import { useUser } from '../hooks/useUser';
import { useTodoistTasks } from '../hooks/useTodoistTasks';
import { useGoogleEvents } from '../hooks/useGoogleEvents';
import TaskAssistant from './TaskAssistant';
import CalendarAssistant from './CalendarAssistant';
import IntegrationsPanel from './IntegrationsPanel';
import './Dashboard.css';

interface DashboardProps {
  integrations: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ integrations }) => {
  const { user, signOut } = useUser();
  const { tasks, projects, labels } = useTodoistTasks();
  const { events } = useGoogleEvents();
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar' | 'integrations'>('tasks');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>ADHD Buddy</h1>
          <div className="header-actions">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleSignOut} className="sign-out-button">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className="dashboard-nav">
          <button
            className={`nav-button ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📝 Tasks
          </button>
          <button
            className={`nav-button ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            📅 Calendar
          </button>
          <button
            className={`nav-button ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrations')}
          >
            🔗 Integrations
          </button>
        </nav>

        <main className="dashboard-main">
          {activeTab === 'tasks' && (
            <TaskAssistant 
              tasks={tasks}
              projects={projects}
              labels={labels}
              hasIntegration={integrations.some(i => i.provider === 'todoist')}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarAssistant 
              events={events}
              hasIntegration={integrations.some(i => i.provider === 'google')}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsPanel integrations={integrations} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

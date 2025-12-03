-- ADHD Buddy Database Schema
-- This migration creates all necessary tables for the application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: integrations
-- Stores OAuth tokens and integration settings for each user
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'todoist', 'google'
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  scope TEXT,
  webhook_id TEXT, -- for Todoist webhook ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);

-- Table: todoist_projects
-- Caches Todoist projects for faster access
CREATE TABLE IF NOT EXISTS todoist_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  todoist_id VARCHAR(100) NOT NULL,
  name TEXT NOT NULL,
  color VARCHAR(50),
  parent_id VARCHAR(100),
  order_index INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  view_style VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, todoist_id)
);

CREATE INDEX IF NOT EXISTS idx_todoist_projects_user_id ON todoist_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_todoist_projects_todoist_id ON todoist_projects(todoist_id);

-- Table: todoist_labels
-- Caches Todoist labels
CREATE TABLE IF NOT EXISTS todoist_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  todoist_id VARCHAR(100) NOT NULL,
  name TEXT NOT NULL,
  color VARCHAR(50),
  order_index INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, todoist_id)
);

CREATE INDEX IF NOT EXISTS idx_todoist_labels_user_id ON todoist_labels(user_id);
CREATE INDEX IF NOT EXISTS idx_todoist_labels_todoist_id ON todoist_labels(todoist_id);

-- Table: todoist_tasks
-- Caches Todoist tasks with full details
CREATE TABLE IF NOT EXISTS todoist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  todoist_id VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  project_id VARCHAR(100),
  parent_id VARCHAR(100), -- for subtasks
  order_index INTEGER,
  priority INTEGER DEFAULT 1,
  due_date DATE,
  due_datetime TIMESTAMPTZ,
  due_string TEXT,
  labels TEXT[], -- array of label IDs
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, todoist_id)
);

CREATE INDEX IF NOT EXISTS idx_todoist_tasks_user_id ON todoist_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_todoist_tasks_todoist_id ON todoist_tasks(todoist_id);
CREATE INDEX IF NOT EXISTS idx_todoist_tasks_project_id ON todoist_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_todoist_tasks_parent_id ON todoist_tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_todoist_tasks_is_completed ON todoist_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_todoist_tasks_due_date ON todoist_tasks(due_date);

-- Table: calendar_events
-- Stores Google Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_event_id VARCHAR(255) NOT NULL,
  calendar_id VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(100),
  is_all_day BOOLEAN DEFAULT FALSE,
  recurrence TEXT[], -- array of recurrence rules
  attendees JSONB, -- array of attendee objects
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, google_event_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id ON calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_id ON calendar_events(calendar_id);

-- Table: user_profile
-- Optional: Extended user profile information
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  timezone VARCHAR(100) DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todoist_projects_updated_at BEFORE UPDATE ON todoist_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todoist_labels_updated_at BEFORE UPDATE ON todoist_labels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todoist_tasks_updated_at BEFORE UPDATE ON todoist_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profile_updated_at BEFORE UPDATE ON user_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your Supabase setup)
-- Note: These might need to be adjusted based on your Supabase RLS policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE todoist_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE todoist_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE todoist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own integrations" ON integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" ON integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" ON integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" ON integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Todoist projects policies
CREATE POLICY "Users can view own todoist_projects" ON todoist_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todoist_projects" ON todoist_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todoist_projects" ON todoist_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todoist_projects" ON todoist_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Todoist labels policies
CREATE POLICY "Users can view own todoist_labels" ON todoist_labels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todoist_labels" ON todoist_labels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todoist_labels" ON todoist_labels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todoist_labels" ON todoist_labels
  FOR DELETE USING (auth.uid() = user_id);

-- Todoist tasks policies
CREATE POLICY "Users can view own todoist_tasks" ON todoist_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todoist_tasks" ON todoist_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todoist_tasks" ON todoist_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todoist_tasks" ON todoist_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can view own calendar_events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar_events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar_events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar_events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- User profile policies
CREATE POLICY "Users can view own user_profile" ON user_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_profile" ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_profile" ON user_profile
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_profile" ON user_profile
  FOR DELETE USING (auth.uid() = user_id);

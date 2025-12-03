import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface TodoistTask {
  id: string;
  user_id: string;
  todoist_id: string;
  content: string;
  description?: string;
  project_id?: string;
  parent_id?: string;
  order_index?: number;
  priority: number;
  due_date?: string;
  due_datetime?: string;
  due_string?: string;
  labels?: string[];
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface TodoistProject {
  id: string;
  user_id: string;
  todoist_id: string;
  name: string;
  color?: string;
  parent_id?: string;
  order_index?: number;
  is_favorite: boolean;
  view_style?: string;
  created_at: string;
  updated_at: string;
}

interface TodoistLabel {
  id: string;
  user_id: string;
  todoist_id: string;
  name: string;
  color?: string;
  order_index?: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export function useTodoistTasks() {
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [projects, setProjects] = useState<TodoistProject[]>([]);
  const [labels, setLabels] = useState<TodoistLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [tasksResult, projectsResult, labelsResult] = await Promise.all([
        supabase.from('todoist_tasks').select('*').order('order_index'),
        supabase.from('todoist_projects').select('*').order('order_index'),
        supabase.from('todoist_labels').select('*').order('order_index'),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (projectsResult.error) throw projectsResult.error;
      if (labelsResult.error) throw labelsResult.error;

      setTasks(tasksResult.data || []);
      setProjects(projectsResult.data || []);
      setLabels(labelsResult.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Todoist data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates
    const tasksSubscription = supabase
      .channel('todoist_tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todoist_tasks' }, fetchData)
      .subscribe();

    const projectsSubscription = supabase
      .channel('todoist_projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todoist_projects' }, fetchData)
      .subscribe();

    const labelsSubscription = supabase
      .channel('todoist_labels_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todoist_labels' }, fetchData)
      .subscribe();

    return () => {
      tasksSubscription.unsubscribe();
      projectsSubscription.unsubscribe();
      labelsSubscription.unsubscribe();
    };
  }, []);

  return {
    tasks,
    projects,
    labels,
    loading,
    error,
    refetch: fetchData,
  };
}

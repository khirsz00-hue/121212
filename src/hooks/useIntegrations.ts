import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Integration {
  id: string;
  user_id: string;
  provider: string;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: string;
  scope?: string;
  webhook_id?: string;
  created_at: string;
  updated_at: string;
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integrations')
        .select('*');
      
      if (error) throw error;
      setIntegrations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const getIntegration = (provider: string): Integration | null => {
    return integrations.find(i => i.provider === provider) || null;
  };

  const hasIntegration = (provider: string): boolean => {
    return integrations.some(i => i.provider === provider);
  };

  return {
    integrations,
    loading,
    error,
    refetch: fetchIntegrations,
    getIntegration,
    hasIntegration,
  };
}

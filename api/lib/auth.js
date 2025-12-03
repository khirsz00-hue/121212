// API Middleware Helper - JWT Verification for Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase server environment variables');
}

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verify JWT token and return user
 */
export async function verifyAuth(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }

    return user;
  } catch (error) {
    throw new Error('Authentication failed');
  }
}

/**
 * Middleware wrapper for API endpoints
 */
export function withAuth(handler) {
  return async (req, res) => {
    try {
      const user = await verifyAuth(req);
      req.user = user;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: error.message || 'Unauthorized' });
    }
  };
}

/**
 * Get integration for user
 */
export async function getUserIntegration(userId, provider) {
  const { data, error } = await supabaseAdmin
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error) {
    throw new Error(`Integration not found: ${error.message}`);
  }

  return data;
}

/**
 * Save or update integration
 */
export async function saveIntegration(userId, provider, integrationData) {
  const { data, error } = await supabaseAdmin
    .from('integrations')
    .upsert({
      user_id: userId,
      provider,
      ...integrationData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save integration: ${error.message}`);
  }

  return data;
}

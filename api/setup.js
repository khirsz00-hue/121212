// Setup endpoint - Run database migrations
// SECURITY: This endpoint should be disabled after initial setup
// Either remove it entirely or use a time-based token that expires
import { readFileSync } from 'fs';
import { join } from 'path';
import { supabaseAdmin } from './lib/auth.js';

export default async function handler(req, res) {
  // Verify setup secret
  const setupSecret = req.headers['x-setup-secret'] || req.query.secret;
  
  if (!setupSecret || setupSecret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Invalid setup secret' });
  }

  // SECURITY WARNING: Comment out or delete this endpoint after initial setup
  // to prevent unauthorized database modifications
  
  if (req.method === 'GET') {
    // Return SQL for manual execution
    try {
      const sqlPath = join(process.cwd(), 'migrations', 'init.sql');
      const sql = readFileSync(sqlPath, 'utf-8');
      
      return res.status(200).json({
        message: 'Migration SQL retrieved successfully',
        sql,
        instructions: 'Execute this SQL in your Supabase SQL editor'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to read migration file',
        details: error.message 
      });
    }
  }

  if (req.method === 'POST') {
    // Attempt to execute migrations (may not work with all Supabase plans)
    try {
      const sqlPath = join(process.cwd(), 'migrations', 'init.sql');
      const sql = readFileSync(sqlPath, 'utf-8');
      
      // Note: Direct SQL execution may not be available in all Supabase configurations
      // This is a best-effort attempt
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        return res.status(500).json({
          error: 'Failed to execute migrations',
          details: error.message,
          suggestion: 'Try using GET method to retrieve SQL and execute manually in Supabase SQL editor'
        });
      }

      return res.status(200).json({
        message: 'Migrations executed successfully',
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to execute migrations',
        details: error.message,
        suggestion: 'Use GET method to retrieve SQL and execute manually in Supabase SQL editor'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

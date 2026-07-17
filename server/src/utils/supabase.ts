import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase URL or Service Key. Backend RBAC may fail.');
}

// Service role client bypasses RLS, used only on backend for admin tasks
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

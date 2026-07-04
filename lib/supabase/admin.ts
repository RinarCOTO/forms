import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

interface SupabaseAdminClientOptions {
  allowAnonFallback?: boolean;
  schema?: string;
}

export function createSupabaseAdminClient({
  allowAnonFallback = false,
  schema = 'public',
}: SupabaseAdminClientOptions = {}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (allowAnonFallback ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase admin client environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema },
  });
}

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Module-level singleton — one connection reused across all requests
// Safe because the service-role client is stateless (no session/cookie state)
let _client: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } }
    )
  }
  return _client
}

import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

function getAdminClient() {
  return createSupabaseAdminClient()
}

export async function getCurrentUserContext(): Promise<{ userId: string; municipality: string | null; isAdmin: boolean; role: string } | null> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const admin = getAdminClient()
    const { data: profile } = await admin
      .from('users')
      .select('role, municipality')
      .eq('id', authUser.id)
      .single()

    if (!profile) return null

    const isAdmin = ['admin', 'super_admin'].includes(profile.role)
    return { userId: authUser.id, municipality: profile.municipality ?? null, isAdmin, role: profile.role }
  } catch {
    return null
  }
}

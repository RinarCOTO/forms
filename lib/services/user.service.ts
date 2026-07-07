import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getLaooAssignmentsForUser, getPrimaryMunicipality } from '@/lib/laoo-assignments'

function getAdminClient() {
  return createSupabaseAdminClient()
}

export async function getCurrentUserContext(): Promise<{
  userId: string;
  municipality: string | null;
  municipalities: string[];
  isAdmin: boolean;
  role: string;
} | null> {
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

    const municipalities =
      profile.role === 'laoo'
        ? await getLaooAssignmentsForUser(admin, authUser.id, profile.municipality)
        : profile.municipality
          ? [profile.municipality]
          : []
    const isAdmin = ['admin', 'super_admin'].includes(profile.role)
    return {
      userId: authUser.id,
      municipality: getPrimaryMunicipality(municipalities) ?? profile.municipality ?? null,
      municipalities,
      isAdmin,
      role: profile.role,
    }
  } catch {
    return null
  }
}

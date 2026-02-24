import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getCurrentUserMunicipality(): Promise<{ municipality: string | null; isAdmin: boolean } | null> {
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
    return { municipality: profile.municipality ?? null, isAdmin }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userCtx = await getCurrentUserMunicipality()
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    const filterByMunicipality = !userCtx.isAdmin && userCtx.municipality

    const buildingQuery = admin.from('building_structures').select('id', { count: 'exact', head: true })
    const landQuery     = admin.from('land_improvements').select('id', { count: 'exact', head: true })
    const machineryQuery = admin.from('machinery').select('id', { count: 'exact', head: true })
    const notesQuery    = admin.from('notes').select('id', { count: 'exact', head: true })

    const [buildingCount, landCount, machineryCount, notesCount] = await Promise.all([
      filterByMunicipality
        ? buildingQuery.eq('municipality', userCtx.municipality!)
        : buildingQuery,
      filterByMunicipality
        ? landQuery.eq('municipality', userCtx.municipality!)
        : landQuery,
      filterByMunicipality
        ? machineryQuery.eq('municipality', userCtx.municipality!)
        : machineryQuery,
      notesQuery, // notes are not municipality-scoped
    ])

    return NextResponse.json({
      'building-structure': buildingCount.count || 0,
      'land-improvements':  landCount.count || 0,
      'machinery':          machineryCount.count || 0,
      'notes':              notesCount.count || 0,
    })
  } catch (error) {
    console.error('Error fetching form counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

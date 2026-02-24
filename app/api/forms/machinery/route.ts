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
    let query = admin
      .from('machinery')
      .select('id, owner_name, updated_at, status, municipality')
      .order('updated_at', { ascending: false })

    if (!userCtx.isAdmin && userCtx.municipality) {
      query = query.eq('municipality', userCtx.municipality)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching machinery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

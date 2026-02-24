import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } }
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
      .from('building_structures')
      .select('id, owner_name, updated_at, status, municipality, location_municipality')
      .order('updated_at', { ascending: false })

    // Restrict to municipality if user is not admin and has a municipality assigned
    if (!userCtx.isAdmin && userCtx.municipality) {
      query = query.eq('municipality', userCtx.municipality)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userCtx = await getCurrentUserMunicipality()
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    const body = await request.json()

    // Stamp municipality from the user's profile (non-admins cannot override)
    if (!userCtx.isAdmin && userCtx.municipality) {
      body.municipality = userCtx.municipality
    }

    const { data, error } = await admin
      .from('building_structures')
      .insert([body])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    revalidateTag('building-structures', 'max')
    revalidateTag('form-counts', 'max')

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userCtx = await getCurrentUserMunicipality()
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('building_structures')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidateTag('building-structures', 'max')

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

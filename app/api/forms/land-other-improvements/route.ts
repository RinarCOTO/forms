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
      .from('land_improvements')
      .select('id, owner_name, updated_at, status, municipality')
      .order('updated_at', { ascending: false })

    if (!userCtx.isAdmin && userCtx.municipality) {
      query = query.eq('municipality', userCtx.municipality)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch land improvements', details: error.message },
      { status: 500 }
    )
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

    // Clean the data: remove undefined, null, and empty string values
    const cleanedData = Object.entries(body).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
        if (['area', 'market_value', 'assessment_level', 'assessed_value'].includes(key)) {
          const numValue = parseFloat(value as string)
          if (!isNaN(numValue)) {
            acc[key] = numValue
          }
        } else {
          acc[key] = value
        }
      }
      return acc
    }, {} as any)

    // Stamp municipality from user profile
    if (!userCtx.isAdmin && userCtx.municipality) {
      cleanedData.municipality = userCtx.municipality
    }

    const { data, error } = await admin
      .from('land_improvements')
      .insert([cleanedData])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    revalidateTag('land-improvements')
    revalidateTag('form-counts')

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 })
  }
}

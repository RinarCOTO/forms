import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'
import { getCurrentUserContext } from '@/lib/services/user.service'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } }
  )
}

export async function GET(request: NextRequest) {
  try {
    const userCtx = await getCurrentUserContext()
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    const { searchParams } = new URL(request.url)

    // Single-record lookup by ARP No. — used to auto-fill previous TD fields
    const arpNoFilter = searchParams.get('arp_no')
    if (arpNoFilter) {
      let lookupQuery = admin
        .from('building_structures')
        .select('owner_name, estimated_value, market_value, total_floor_area')
        .eq('arp_no', arpNoFilter)
        .eq('status', 'approved')
      // Scope to the user's municipality so a Bauko user only sees Bauko records
      if (!userCtx.isAdmin && userCtx.municipality) {
        lookupQuery = lookupQuery.eq('municipality', userCtx.municipality)
      }
      const { data, error } = await lookupQuery
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data || null)
    }

    // Provincial/LAOO roles see all municipalities — do not scope by municipality.
    // Municipal roles are scoped to their assigned municipality.
    const PROVINCIAL_ROLES = ['laoo', 'assistant_provincial_assessor', 'provincial_assessor'];

    let query = admin
      .from('building_structures')
      .select('id, owner_name, updated_at, status, municipality, location_municipality, location_barangay, submitted_at, td_arp_no, created_by, approved_at, assigned_to')
      .order('updated_at', { ascending: false })

    if (userCtx.role === 'municipal_tax_mapper') {
      // Tax mapper: show forms they created OR are assigned to — no municipality filter needed
      // since assigned forms (e.g. from LAOO) may have null municipality
      query = query.or(`created_by.eq.${userCtx.userId},assigned_to.eq.${userCtx.userId}`)
    } else {
      // All other non-admin roles: scope to their municipality
      if (!userCtx.isAdmin && !PROVINCIAL_ROLES.includes(userCtx.role) && userCtx.municipality) {
        query = query.eq('municipality', userCtx.municipality)
      }

      // Reviewer roles hide drafts and returned forms (those belong to the assigned tax mapper)
      const HIDE_DRAFTS_ROLES = ['municipal_assessor', 'laoo', 'provincial_assessor', 'assistant_provincial_assessor'];
      if (HIDE_DRAFTS_ROLES.includes(userCtx.role)) {
        if (userCtx.role === 'laoo') {
          // LAOO sees all non-draft/non-returned + only their own drafts (to submit)
          query = query.or(`and(status.neq.draft,status.neq.returned),and(status.eq.draft,created_by.eq.${userCtx.userId})`)
        } else {
          // municipal_assessor, provincial: hide drafts and returned entirely
          query = query.not('status', 'in', '("draft","returned")')
        }
      }
    }

    const { data, error } = await query
    if (error) {
      console.error('GET /api/faas/building-structures error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('GET /api/faas/building-structures exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userCtx = await getCurrentUserContext()
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    const raw = await request.json()

    // Stamp municipality and creator from the user's profile (non-admins cannot override)
    if (!userCtx.isAdmin && userCtx.municipality) {
      raw.municipality = userCtx.municipality
      raw.location_municipality = userCtx.municipality
    }
    raw.created_by = userCtx.userId

    const NUMERIC_COLS = new Set([
      'number_of_storeys', 'total_floor_area', 'building_age',
      'land_area', 'market_value', 'assessment_level', 'estimated_value',
      'cost_of_construction', 'previous_av', 'previous_mv', 'previous_area',
    ])
    const body = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => {
        if (NUMERIC_COLS.has(k)) {
          const n = typeof v === 'string' ? parseFloat(v as string) : v
          return [k, isNaN(n as number) ? null : n]
        }
        if (k === 'floor_areas' && Array.isArray(v)) {
          return [k, (v as (number | string)[]).filter(x => x !== '' && x !== null)]
        }
        return [k, v]
      })
    )

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
    const userCtx = await getCurrentUserContext()
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

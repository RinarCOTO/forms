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
        .from('land_improvements')
        .select('owner_name, assessed_value, market_value, land_area')
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

    const PROVINCIAL_ROLES  = ['laoo', 'assistant_provincial_assessor', 'provincial_assessor'];
    const HIDE_DRAFTS_ROLES = ['municipal_assessor', 'laoo', 'provincial_assessor', 'assistant_provincial_assessor'];

    if (searchParams.get('meta') === '1') {
      let mq = admin
        .from('land_improvements')
        .select('location_municipality, location_barangay')
      if (userCtx.role === 'municipal_tax_mapper') {
        mq = mq.or(`created_by.eq.${userCtx.userId},assigned_to.eq.${userCtx.userId}`)
      } else {
        if (!userCtx.isAdmin && !PROVINCIAL_ROLES.includes(userCtx.role) && userCtx.municipality) {
          mq = mq.eq('municipality', userCtx.municipality)
        }
        if (HIDE_DRAFTS_ROLES.includes(userCtx.role)) {
          if (userCtx.role === 'laoo') {
            mq = mq.or(`and(status.neq.draft,status.neq.returned),and(status.eq.draft,created_by.eq.${userCtx.userId})`)
          } else {
            mq = mq.not('status', 'in', '("draft","returned")')
          }
        }
      }
      const { data: mData } = await mq
      const municipalities = [...new Set(mData?.map(r => r.location_municipality).filter(Boolean))].sort()
      const barangays      = [...new Set(mData?.map(r => r.location_barangay).filter(Boolean))].sort()
      return NextResponse.json({ municipalities, barangays })
    }

    // Pagination + filter params
    const page      = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit     = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '50')), 200)
    const search    = searchParams.get('search')?.trim() || null
    const munis     = searchParams.getAll('municipality').filter(Boolean)
    const barangays = searchParams.getAll('barangay').filter(Boolean)
    const status    = searchParams.get('status')?.trim() || null

    let query = admin
      .from('land_improvements')
      .select('id, owner_name, updated_at, status, municipality, arp_no, location_municipality, location_barangay, created_by, assigned_to, approved_at', { count: 'exact' })
      .order('updated_at', { ascending: false })

    if (userCtx.role === 'municipal_tax_mapper') {
      query = query.or(`created_by.eq.${userCtx.userId},assigned_to.eq.${userCtx.userId}`)
    } else {
      if (!userCtx.isAdmin && !PROVINCIAL_ROLES.includes(userCtx.role) && userCtx.municipality) {
        query = query.eq('municipality', userCtx.municipality)
      }
      if (HIDE_DRAFTS_ROLES.includes(userCtx.role)) {
        if (userCtx.role === 'laoo') {
          query = query.or(`and(status.neq.draft,status.neq.returned),and(status.eq.draft,created_by.eq.${userCtx.userId})`)
        } else {
          query = query.not('status', 'in', '("draft","returned")')
        }
      }
    }

    // Additional client-supplied filters
    if (search)              query = query.ilike('owner_name', `%${search}%`)
    if (status)              query = query.eq('status', status)
    if (munis.length === 1)         query = query.eq('location_municipality', munis[0])
    else if (munis.length > 1)      query = query.in('location_municipality', munis)
    if (barangays.length === 1)     query = query.eq('location_barangay', barangays[0])
    else if (barangays.length > 1)  query = query.in('location_barangay', barangays)

    const from = (page - 1) * limit
    const { data, error, count } = await query.range(from, from + limit - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: data ?? [], total: count ?? 0 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch land improvements', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userCtx = await getCurrentUserContext()
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

    // Stamp municipality and creator from user profile
    if (!userCtx.isAdmin && userCtx.municipality) {
      cleanedData.municipality = userCtx.municipality
    }
    cleanedData.created_by = userCtx.userId

    const { data, error } = await admin
      .from('land_improvements')
      .insert([cleanedData])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    revalidateTag('land-improvements', 'max')
    revalidateTag('form-counts', 'max')

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 })
  }
}

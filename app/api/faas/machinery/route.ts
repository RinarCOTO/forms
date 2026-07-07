import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserContext } from '@/lib/services/user.service'
import { isProvinceWideFaasRole } from '@/lib/faas/workflow'

function getAdminClient() {
  return createSupabaseAdminClient({ allowAnonFallback: true })
}

function getMunicipalityScope(userCtx: { municipality: string | null; municipalities?: string[] }) {
  const municipalities = userCtx.municipalities?.filter(Boolean) ?? []
  if (municipalities.length > 0) return [...new Set(municipalities)]
  return userCtx.municipality ? [userCtx.municipality] : []
}

export async function POST(request: NextRequest) {
  try {
    const userCtx = await getCurrentUserContext()
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    const raw = await request.json()

    if (!userCtx.isAdmin && userCtx.municipality) {
      raw.municipality = userCtx.municipality
    }
    raw.created_by = userCtx.userId

    const body = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== '' && v !== undefined)
    )

    const { data, error } = await admin
      .from('machinery')
      .insert([body])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userCtx = await getCurrentUserContext()
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    const { searchParams } = new URL(request.url)

    if (searchParams.get('meta') === '1') {
      let mq = admin.from('machinery').select('municipality')
      const municipalityScope = getMunicipalityScope(userCtx)
      if (!userCtx.isAdmin && !isProvinceWideFaasRole(userCtx.role) && municipalityScope.length > 0) {
        mq = municipalityScope.length === 1
          ? mq.eq('municipality', municipalityScope[0])
          : mq.in('municipality', municipalityScope)
      }
      const { data: mData } = await mq
      const municipalities = [...new Set(mData?.map(r => r.municipality).filter(Boolean))].sort()
      return NextResponse.json({ municipalities })
    }

    // Pagination + filter params
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit  = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '50')), 200)
    const search = searchParams.get('search')?.trim() || null
    const munis  = searchParams.getAll('municipality').filter(Boolean)
    const status = searchParams.get('status')?.trim() || null

    let query = admin
      .from('machinery')
      .select('id, owner_name, updated_at, approved_at, status, municipality, td_no, arp_no, created_by', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false })

    const municipalityScope = getMunicipalityScope(userCtx)
    if (!userCtx.isAdmin && !isProvinceWideFaasRole(userCtx.role) && municipalityScope.length > 0) {
      query = municipalityScope.length === 1
        ? query.eq('municipality', municipalityScope[0])
        : query.in('municipality', municipalityScope)
    }

    // Additional client-supplied filters
    if (search)             query = query.ilike('owner_name', `%${search}%`)
    if (status)             query = query.eq('status', status)
    if (munis.length === 1)        query = query.eq('municipality', munis[0])
    else if (munis.length > 1)     query = query.in('municipality', munis)

    const from = (page - 1) * limit
    const { data, error, count } = await query.range(from, from + limit - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: data ?? [], total: count ?? 0 })
  } catch (error) {
    console.error('Error fetching machinery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

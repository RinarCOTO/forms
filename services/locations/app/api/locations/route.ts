import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '../../../lib/auth'

/**
 * GET /api/locations?type=province
 * GET /api/locations?type=municipality&parent=1404400000
 * GET /api/locations?type=barangay&parent=1404401000
 *
 * Public endpoint — no auth required for location lookups.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const parent = searchParams.get('parent')

    if (!type || !['province', 'municipality', 'barangay'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type must be province, municipality, or barangay' },
        { status: 400 }
      )
    }

    const admin = getAdminClient()
    let query = admin
      .from('locations')
      .select('psgc_code, name, parent_code')
      .eq('type', type)
      .order('name')

    if (parent) {
      query = query.eq('parent_code', parent)
    }

    const { data, error } = await query

    if (error) {
      console.error('[locations-service] GET error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (err) {
    console.error('[locations-service] unexpected error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

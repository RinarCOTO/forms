import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient, getUserContext } from '../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userCtx = await getUserContext(user.id)
    if (!userCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

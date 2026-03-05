import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../../lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = req.nextUrl.searchParams.get('role')
    if (!role) return NextResponse.json({ error: 'role param required' }, { status: 400 })

    const municipality = req.nextUrl.searchParams.get('municipality')
    const admin = getAdminClient()

    let query = admin.from('users').select('id, full_name, role, municipality').eq('role', role)
    if (municipality) query = query.ilike('municipality', municipality)

    const { data: users, error } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    return NextResponse.json({ users })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

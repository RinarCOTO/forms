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
    return NextResponse.json({ error: 'Failed to fetch land improvements', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userCtx = await getUserContext(user.id)
    if (!userCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const body = await request.json()

    const cleanedData = Object.entries(body).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
        if (['area', 'market_value', 'assessment_level', 'assessed_value'].includes(key)) {
          const numValue = parseFloat(value as string)
          if (!isNaN(numValue)) acc[key] = numValue
        } else {
          acc[key] = value
        }
      }
      return acc
    }, {} as any)

    if (!userCtx.isAdmin && userCtx.municipality) {
      cleanedData.municipality = userCtx.municipality
    }

    const { data, error } = await admin
      .from('land_improvements')
      .insert([cleanedData])
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 })
  }
}

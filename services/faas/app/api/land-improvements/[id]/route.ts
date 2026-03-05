import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../../lib/auth'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const admin = getAdminClient()

    const { data, error } = await admin
      .from('land_improvements')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Land improvement not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const body = await req.json()
    const { id: _bodyId, ...updateData } = body

    const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
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

    const admin = getAdminClient()
    const { data, error } = await admin
      .from('land_improvements')
      .update(cleanedData)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Failed to update land improvement', details: error?.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const admin = getAdminClient()

    const { error } = await admin.from('land_improvements').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to delete land improvement', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Land improvement deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

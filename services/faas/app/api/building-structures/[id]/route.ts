import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../../lib/auth'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params)
    const id = params.id

    if (!id) return NextResponse.json({ success: false, message: 'No ID provided' }, { status: 400 })

    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: draft, error } = await admin
      .from('building_structures')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !draft) {
      return NextResponse.json({ success: false, message: 'Draft not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: draft })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params)
    const id = params.id

    if (!id) return NextResponse.json({ success: false, message: 'No ID provided' }, { status: 400 })

    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const admin = getAdminClient()

    const { data: updatedRecord, error } = await admin
      .from('building_structures')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, message: 'Failed to update draft' }, { status: 500 })
    if (!updatedRecord) return NextResponse.json({ success: false, message: 'Record not found or not updated' }, { status: 404 })

    return NextResponse.json({ success: true, data: updatedRecord })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params)
    const id = params.id

    if (!id) return NextResponse.json({ success: false, message: 'No ID provided' }, { status: 400 })

    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()

    const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const { data: deletedRecord, error } = await admin
      .from('building_structures')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, message: 'Failed to delete record' }, { status: 500 })
    if (!deletedRecord) return NextResponse.json({ success: false, message: 'Record not found or already deleted' }, { status: 404 })

    return NextResponse.json({ success: true, message: 'Record deleted successfully', data: deletedRecord })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

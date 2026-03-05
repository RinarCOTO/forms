import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../../lib/auth'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: currentUser } = await admin.from('users').select('role').eq('id', user.id).single()
    if (!currentUser || (!['admin', 'super_admin'].includes(currentUser.role) && user.id !== userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: target, error } = await admin.from('users').select('*').eq('id', userId).single()
    if (error) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ user: target }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: currentUser } = await admin.from('users').select('role').eq('id', user.id).single()
    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { full_name, role, municipality, department, position, phone, is_active } = body

    const { data: updatedUser, error: updateError } = await admin
      .from('users')
      .update({ full_name, role, municipality: municipality ?? null, department, position, phone, is_active, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    return NextResponse.json({ user: updatedUser }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: currentUser } = await admin.from('users').select('role').eq('id', user.id).single()
    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    if (user.id === userId) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

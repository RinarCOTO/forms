import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../../lib/auth'

const ALLOWED_ROLES = ['super_admin', 'admin', 'tax_mapper', 'municipal_tax_mapper', 'accountant', 'user']

export async function POST(req: NextRequest) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: callerProfile } = await admin.from('users').select('role').eq('id', user.id).single()
    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: super_admin role required' }, { status: 403 })
    }

    const { userId, role } = await req.json() as { userId?: string; role?: string }

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: `role must be one of: ${ALLOWED_ROLES.join(', ')}` }, { status: 400 })
    }

    const { data: updatedUser, error } = await admin
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, role')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })

    return NextResponse.json(
      { success: true, message: 'Role updated successfully', user: updatedUser, timestamp: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

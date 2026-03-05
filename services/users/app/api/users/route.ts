import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: currentUser } = await admin.from('users').select('role').eq('id', user.id).single()
    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { data: users, error } = await admin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    return NextResponse.json({ users }, { status: 200 })
  } catch (err) {
    console.error('[users-service] GET /users error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: currentUser } = await admin.from('users').select('role').eq('id', user.id).single()
    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { email, password, full_name, role, municipality, department, position, phone } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const { data: newAuthUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || email },
    })

    if (createError || !newAuthUser.user) {
      return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 })
    }

    if (role || municipality || department || position || phone || full_name) {
      await admin
        .from('users')
        .update({ role: role || 'user', municipality: municipality || null, department, position, phone, full_name })
        .eq('id', newAuthUser.user.id)
    }

    const { data: userProfile } = await admin.from('users').select('*').eq('id', newAuthUser.user.id).single()
    return NextResponse.json({ user: userProfile }, { status: 201 })
  } catch (err) {
    console.error('[users-service] POST /users error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

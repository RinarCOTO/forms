import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../../lib/auth'

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  super_admin: {
    'building_structures.view': true, 'building_structures.create': true,
    'building_structures.edit': true, 'building_structures.delete': true,
    'land_improvements.view': true, 'land_improvements.create': true,
    'land_improvements.edit': true, 'land_improvements.delete': true,
    'machinery.view': true, 'machinery.create': true,
    'machinery.edit': true, 'machinery.delete': true,
    'accounting.view': true,
    'user_management.view': true, 'user_management.create': true,
    'user_management.edit': true, 'user_management.delete': true,
    'role_management.view': true, 'role_management.edit': true,
    'dashboard.view': true,
    'forms.submit': true, 'review.laoo': true, 'review.sign': true,
  },
  admin: {
    'building_structures.view': true, 'building_structures.create': true,
    'building_structures.edit': true, 'building_structures.delete': true,
    'land_improvements.view': true, 'land_improvements.create': true,
    'land_improvements.edit': true, 'land_improvements.delete': true,
    'machinery.view': true, 'machinery.create': true,
    'machinery.edit': true, 'machinery.delete': true,
    'accounting.view': true,
    'user_management.view': true, 'user_management.create': true,
    'user_management.edit': true, 'user_management.delete': true,
    'role_management.view': false, 'role_management.edit': false,
    'dashboard.view': true, 'forms.submit': true, 'review.laoo': false, 'review.sign': false,
  },
  municipal_tax_mapper: {
    'building_structures.view': true, 'building_structures.create': true,
    'building_structures.edit': true, 'building_structures.delete': false,
    'land_improvements.view': true, 'land_improvements.create': true,
    'land_improvements.edit': true, 'land_improvements.delete': false,
    'machinery.view': true, 'machinery.create': true,
    'machinery.edit': true, 'machinery.delete': false,
    'accounting.view': false,
    'user_management.view': false, 'user_management.create': false,
    'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false,
    'dashboard.view': true, 'forms.submit': true, 'review.laoo': false, 'review.sign': false,
  },
  municipal_assessor: {
    'building_structures.view': true, 'building_structures.create': true,
    'building_structures.edit': true, 'building_structures.delete': false,
    'land_improvements.view': true, 'land_improvements.create': true,
    'land_improvements.edit': true, 'land_improvements.delete': false,
    'machinery.view': true, 'machinery.create': true,
    'machinery.edit': true, 'machinery.delete': false,
    'accounting.view': false,
    'user_management.view': false, 'user_management.create': false,
    'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false,
    'dashboard.view': true, 'forms.submit': true, 'review.laoo': false, 'review.sign': true,
  },
  laoo: {
    'building_structures.view': true, 'building_structures.create': false,
    'building_structures.edit': false, 'building_structures.delete': false,
    'land_improvements.view': true, 'land_improvements.create': false,
    'land_improvements.edit': false, 'land_improvements.delete': false,
    'machinery.view': true, 'machinery.create': false,
    'machinery.edit': false, 'machinery.delete': false,
    'accounting.view': false,
    'user_management.view': false, 'user_management.create': false,
    'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false,
    'dashboard.view': true, 'forms.submit': false, 'review.laoo': true, 'review.sign': false,
  },
  assistant_provincial_assessor: {
    'building_structures.view': true, 'building_structures.create': false,
    'building_structures.edit': false, 'building_structures.delete': false,
    'land_improvements.view': true, 'land_improvements.create': false,
    'land_improvements.edit': false, 'land_improvements.delete': false,
    'machinery.view': true, 'machinery.create': false,
    'machinery.edit': false, 'machinery.delete': false,
    'accounting.view': false,
    'user_management.view': false, 'user_management.create': false,
    'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false,
    'dashboard.view': true, 'forms.submit': false, 'review.laoo': false, 'review.sign': true,
  },
  provincial_assessor: {
    'building_structures.view': true, 'building_structures.create': false,
    'building_structures.edit': false, 'building_structures.delete': false,
    'land_improvements.view': true, 'land_improvements.create': false,
    'land_improvements.edit': false, 'land_improvements.delete': false,
    'machinery.view': true, 'machinery.create': false,
    'machinery.edit': false, 'machinery.delete': false,
    'accounting.view': false,
    'user_management.view': false, 'user_management.create': false,
    'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false,
    'dashboard.view': true, 'forms.submit': false, 'review.laoo': false, 'review.sign': true,
  },
  accountant: {
    'building_structures.view': false, 'building_structures.create': false,
    'building_structures.edit': false, 'building_structures.delete': false,
    'land_improvements.view': false, 'land_improvements.create': false,
    'land_improvements.edit': false, 'land_improvements.delete': false,
    'machinery.view': false, 'machinery.create': false,
    'machinery.edit': false, 'machinery.delete': false,
    'accounting.view': true,
    'user_management.view': false, 'user_management.create': false,
    'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false,
    'dashboard.view': true, 'forms.submit': false, 'review.laoo': false, 'review.sign': false,
  },
  user: {
    'building_structures.view': false, 'building_structures.create': false,
    'building_structures.edit': false, 'building_structures.delete': false,
    'land_improvements.view': false, 'land_improvements.create': false,
    'land_improvements.edit': false, 'land_improvements.delete': false,
    'machinery.view': false, 'machinery.create': false,
    'machinery.edit': false, 'machinery.delete': false,
    'accounting.view': false,
    'user_management.view': false, 'user_management.create': false,
    'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false,
    'dashboard.view': true, 'forms.submit': false, 'review.laoo': false, 'review.sign': false,
  },
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
    const role: string = profile?.role ?? 'user'

    if (role === 'super_admin') {
      return NextResponse.json({ role, permissions: DEFAULT_PERMISSIONS['super_admin'] })
    }

    const { data: rows, error } = await admin
      .from('role_permissions')
      .select('feature, allowed')
      .eq('role', role)

    if (error || !rows || rows.length === 0) {
      return NextResponse.json({ role, permissions: DEFAULT_PERMISSIONS[role] ?? {} })
    }

    const permissions: Record<string, boolean> = { ...(DEFAULT_PERMISSIONS[role] ?? {}) }
    for (const row of rows) {
      permissions[row.feature] = row.allowed
    }

    return NextResponse.json({ role, permissions }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    })
  } catch (err) {
    console.error('[users-service] GET /permissions error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

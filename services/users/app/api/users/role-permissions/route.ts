import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../../lib/auth'

const ALL_ROLES = ['super_admin', 'admin', 'tax_mapper', 'municipal_tax_mapper', 'accountant', 'user'] as const
const ALL_FEATURES = [
  'building_structures.view', 'building_structures.create', 'building_structures.edit', 'building_structures.delete',
  'land_improvements.view', 'land_improvements.create', 'land_improvements.edit', 'land_improvements.delete',
  'machinery.view', 'machinery.create', 'machinery.edit', 'machinery.delete',
  'accounting.view',
  'user_management.view', 'user_management.create', 'user_management.edit', 'user_management.delete',
  'role_management.view', 'role_management.edit',
  'dashboard.view',
] as const

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  super_admin: Object.fromEntries(ALL_FEATURES.map((f) => [f, true])),
  admin: {
    'building_structures.view': true, 'building_structures.create': true, 'building_structures.edit': true, 'building_structures.delete': true,
    'land_improvements.view': true, 'land_improvements.create': true, 'land_improvements.edit': true, 'land_improvements.delete': true,
    'machinery.view': true, 'machinery.create': true, 'machinery.edit': true, 'machinery.delete': true,
    'accounting.view': true,
    'user_management.view': true, 'user_management.create': true, 'user_management.edit': true, 'user_management.delete': true,
    'role_management.view': false, 'role_management.edit': false, 'dashboard.view': true,
  },
  tax_mapper: {
    'building_structures.view': true, 'building_structures.create': true, 'building_structures.edit': true, 'building_structures.delete': false,
    'land_improvements.view': true, 'land_improvements.create': true, 'land_improvements.edit': true, 'land_improvements.delete': false,
    'machinery.view': true, 'machinery.create': true, 'machinery.edit': true, 'machinery.delete': false,
    'accounting.view': false,
    'user_management.view': false, 'user_management.create': false, 'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false, 'dashboard.view': true,
  },
  municipal_tax_mapper: {
    'building_structures.view': true, 'building_structures.create': true, 'building_structures.edit': true, 'building_structures.delete': false,
    'land_improvements.view': true, 'land_improvements.create': true, 'land_improvements.edit': true, 'land_improvements.delete': false,
    'machinery.view': true, 'machinery.create': true, 'machinery.edit': true, 'machinery.delete': false,
    'accounting.view': false,
    'user_management.view': false, 'user_management.create': false, 'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false, 'dashboard.view': true,
  },
  accountant: {
    'building_structures.view': false, 'building_structures.create': false, 'building_structures.edit': false, 'building_structures.delete': false,
    'land_improvements.view': false, 'land_improvements.create': false, 'land_improvements.edit': false, 'land_improvements.delete': false,
    'machinery.view': false, 'machinery.create': false, 'machinery.edit': false, 'machinery.delete': false,
    'accounting.view': true,
    'user_management.view': false, 'user_management.create': false, 'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false, 'dashboard.view': true,
  },
  user: {
    'building_structures.view': false, 'building_structures.create': false, 'building_structures.edit': false, 'building_structures.delete': false,
    'land_improvements.view': false, 'land_improvements.create': false, 'land_improvements.edit': false, 'land_improvements.delete': false,
    'machinery.view': false, 'machinery.create': false, 'machinery.edit': false, 'machinery.delete': false,
    'accounting.view': false,
    'user_management.view': false, 'user_management.create': false, 'user_management.edit': false, 'user_management.delete': false,
    'role_management.view': false, 'role_management.edit': false, 'dashboard.view': true,
  },
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: currentUser } = await admin.from('users').select('role').eq('id', user.id).single()
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    const { data: rows, error } = await admin.from('role_permissions').select('role, feature, allowed')
    if (error) return NextResponse.json({ permissions: DEFAULT_PERMISSIONS })

    const permissions: Record<string, Record<string, boolean>> = {}
    for (const role of ALL_ROLES) {
      permissions[role] = { ...(DEFAULT_PERMISSIONS[role] ?? {}) }
    }
    for (const row of rows ?? []) {
      if (!permissions[row.role]) permissions[row.role] = {}
      permissions[row.role][row.feature] = row.allowed
    }
    for (const feature of ALL_FEATURES) {
      permissions['super_admin'][feature] = true
    }

    return NextResponse.json({ permissions })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: currentUser } = await admin.from('users').select('role').eq('id', user.id).single()
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const incoming: Record<string, Record<string, boolean>> = body.permissions ?? {}
    const now = new Date().toISOString()
    const editableRoles = ALL_ROLES.filter((r) => r !== 'super_admin')

    const insertRows = editableRoles.flatMap((role) => {
      const featureMap = incoming[role] ?? {}
      return ALL_FEATURES.map((feature) => ({ role, feature, allowed: featureMap[feature] ?? false, updated_at: now }))
    })

    const { error: deleteError } = await admin.from('role_permissions').delete().in('role', editableRoles as unknown as string[])
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    const { error: insertError } = await admin.from('role_permissions').insert(insertRows)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

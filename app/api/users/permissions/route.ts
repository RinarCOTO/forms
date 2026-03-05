import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Hard-coded defaults — used when the role_permissions table is empty or missing rows.
// Mirrors the seed data in role_permissions_migration.sql + review workflow migration.
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
    'dashboard.view': true,
    'forms.submit': true, 'review.laoo': false, 'review.sign': false,
  },
  tax_mapper: {
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
    'dashboard.view': true,
    'forms.submit': true, 'review.laoo': false, 'review.sign': false,
  },
  // Municipal-level overseer. Can create/submit forms and sign FAAS + Tax Declarations.
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
    'dashboard.view': true,
    'forms.submit': true, 'review.laoo': false, 'review.sign': true,
  },
  // Provincial-level reviewer. Views all municipalities, comments, approves FAAS.
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
    'dashboard.view': true,
    'forms.submit': false, 'review.laoo': true, 'review.sign': false,
  },
  // Provincial-level signer. Views all municipalities, signs Tax Declarations.
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
    'dashboard.view': true,
    'forms.submit': false, 'review.laoo': false, 'review.sign': true,
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
    'dashboard.view': true,
    'forms.submit': false, 'review.laoo': false, 'review.sign': true,
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
    'dashboard.view': true,
    'forms.submit': false, 'review.laoo': false, 'review.sign': false,
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
    'dashboard.view': true,
    'forms.submit': false, 'review.laoo': false, 'review.sign': false,
  },
};

// GET /api/my-permissions
// Returns the flat permission map for the currently authenticated user's role.
// { permissions: { [feature]: boolean }, role: string }

// Cached DB lookup — keyed per user ID, revalidated every 60 s.
// Trip 1 (auth.getUser) still runs each request to verify the session;
// trips 2 + 3 (role lookup + role_permissions lookup) are served from cache.
function getCachedPermissions(userId: string) {
  return unstable_cache(
    async () => {
      const admin = getAdminClient();

      const { data: profile } = await admin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      const role: string = profile?.role ?? 'user';

      if (role === 'super_admin') {
        return { role, permissions: DEFAULT_PERMISSIONS['super_admin'] };
      }

      const { data: rows, error: dbError } = await admin
        .from('role_permissions')
        .select('feature, allowed')
        .eq('role', role);

      if (dbError || !rows || rows.length === 0) {
        return { role, permissions: DEFAULT_PERMISSIONS[role] ?? {} };
      }

      const permissions: Record<string, boolean> = { ...(DEFAULT_PERMISSIONS[role] ?? {}) };
      for (const row of rows) {
        permissions[row.feature] = row.allowed;
      }

      return { role, permissions };
    },
    [`permissions-${userId}`],
    { revalidate: 60, tags: [`permissions-${userId}`, 'permissions'] }
  )();
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getCachedPermissions(authUser.id);

    return NextResponse.json(result, {
      headers: {
        // Let the browser cache the response for 30 s (private = per-user, not shared CDN)
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('GET my-permissions error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

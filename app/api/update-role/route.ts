import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * PATCH /api/update-role
 * Body: { userId: string; role: string }
 * Requires the caller to already be a super_admin.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the caller is authenticated
    const supabase = await createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify the caller is already a super_admin
    const admin = getAdminClient();
    const { data: callerProfile } = await admin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: super_admin role required' },
        { status: 403 }
      );
    }

    // 3. Parse and validate the request body
    const body = await request.json();
    const { userId, role } = body as { userId?: string; role?: string };

    const ALLOWED_ROLES = ['super_admin', 'admin', 'tax_mapper', 'municipal_tax_mapper', 'accountant', 'user'];

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${ALLOWED_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // 4. Apply the role update
    const { data: updatedUser, error: updateError } = await admin
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, role')
      .single();

    if (updateError) {
      console.error('Update role error:', updateError);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    revalidateTag(`permissions-${userId}`, 'max');

    return NextResponse.json(
      { success: true, message: 'Role updated successfully', user: updatedUser, timestamp: Date.now() },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
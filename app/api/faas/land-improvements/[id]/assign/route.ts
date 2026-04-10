import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const ASSIGN_ALLOWED_ROLES = ['municipal_tax_mapper', 'municipal_assessor', 'admin', 'super_admin'];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;

    const sessionClient = await createClient();
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdmin();

    const { data: profile } = await admin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (!profile || !ASSIGN_ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { assigned_to } = await req.json();

    const { data, error } = await admin
      .from('land_improvements')
      .update({
        assigned_to: assigned_to ?? null,
        appraised_by: assigned_to ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, assigned_to, appraised_by')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

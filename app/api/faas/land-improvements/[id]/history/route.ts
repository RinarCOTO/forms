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

const ALLOWED_ROLES = [
  'provincial_assessor',
  'assistant_provincial_assessor',
  'admin',
  'super_admin',
];

const STATUS_LABELS: Record<string, string> = {
  draft:                 'Draft',
  submitted:             'Submitted',
  returned:              'Returned to Tax Mapper',
  returned_to_municipal: 'Returned to Municipal',
  municipal_signed:      'Municipal Signed',
  laoo_approved:         'LAOO Approved',
  approved:              'Approved',
};

const ROLE_LABELS: Record<string, string> = {
  tax_mapper:                    'Tax Mapper',
  municipal_tax_mapper:          'Municipal Tax Mapper',
  laoo:                          'LAOO',
  provincial_assessor:           'Provincial Assessor',
  assistant_provincial_assessor: 'Assistant Provincial Assessor',
  admin:                         'Admin',
  super_admin:                   'Super Admin',
};

// GET /api/faas/land-improvements/[id]/history
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const sessionClient = await createClient();
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdmin();

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (!ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const params = await Promise.resolve(context.params);
    const { id } = params;

    // Fetch history entries
    const { data: entries, error: historyError } = await admin
      .from('form_review_history')
      .select('id, from_status, to_status, actor_id, actor_role, note, created_at')
      .eq('form_type', 'land_improvements')
      .eq('form_id', parseInt(id, 10))
      .order('created_at', { ascending: true });

    if (historyError) {
      return NextResponse.json({ success: false, error: historyError.message }, { status: 500 });
    }

    // Enrich with actor names
    const actorIds = [...new Set((entries ?? []).map(e => e.actor_id).filter(Boolean))];
    let nameMap: Record<string, string> = {};
    if (actorIds.length > 0) {
      const { data: users } = await admin
        .from('users')
        .select('id, full_name')
        .in('id', actorIds);
      for (const u of users ?? []) {
        nameMap[u.id] = u.full_name;
      }
    }

    const enriched = (entries ?? []).map(e => ({
      id:            e.id,
      from_status:   e.from_status,
      from_label:    STATUS_LABELS[e.from_status] ?? e.from_status,
      to_status:     e.to_status,
      to_label:      STATUS_LABELS[e.to_status] ?? e.to_status,
      actor_id:      e.actor_id,
      actor_name:    nameMap[e.actor_id] ?? 'Unknown',
      actor_role:    e.actor_role,
      actor_role_label: ROLE_LABELS[e.actor_role] ?? e.actor_role,
      note:          e.note ?? null,
      created_at:    e.created_at,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[land-history GET] error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

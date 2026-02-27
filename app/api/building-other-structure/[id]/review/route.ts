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

const REVIEW_ROLES = ['laoo', 'assistant_provincial_assessor', 'provincial_assessor', 'admin', 'super_admin'];

// Valid transitions from current status
const TRANSITIONS: Record<string, string[]> = {
  submitted:    ['under_review'],
  under_review: ['returned', 'approved'],
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;

    // ── Auth ──────────────────────────────────────────────────────────────────
    const sessionClient = await createClient();
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdmin();

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('role, municipality')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile || !REVIEW_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Body ─────────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { action, note } = body as { action: 'claim' | 'return' | 'approve'; note?: string };

    if (!action || !['claim', 'return', 'approve'].includes(action)) {
      return NextResponse.json({ error: 'action must be claim | return | approve' }, { status: 400 });
    }

    // ── Fetch current record ──────────────────────────────────────────────────
    const { data: record, error: fetchError } = await admin
      .from('building_structures')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const fromStatus = record.status as string;
    const toStatus = action === 'claim' ? 'under_review' : action === 'return' ? 'returned' : 'approved';

    const allowed = TRANSITIONS[fromStatus] ?? [];
    if (!allowed.includes(toStatus)) {
      return NextResponse.json(
        { error: `Cannot ${action} a form with status "${fromStatus}"` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // ── Build update payload ───────────────────────────────────────────────────
    const updatePayload: Record<string, unknown> = {
      status: toStatus,
      updated_at: now,
    };

    if (action === 'claim') {
      updatePayload.laoo_reviewer_id = authUser.id;
    }

    if (action === 'approve') {
      updatePayload.laoo_reviewer_id = authUser.id;
      updatePayload.laoo_approved_at = now;
    }

    // ── Update ────────────────────────────────────────────────────────────────
    const { data: updated, error: updateError } = await admin
      .from('building_structures')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Failed to update form', detail: updateError?.message },
        { status: 500 }
      );
    }

    // ── Audit log (non-blocking) ───────────────────────────────────────────────
    try {
      await admin.from('form_review_history').insert({
        form_type: 'building_structures',
        form_id: parseInt(id),
        form_stage: 'faas',
        from_status: fromStatus,
        to_status: toStatus,
        actor_id: authUser.id,
        actor_role: profile.role,
        note: note ?? null,
      });
    } catch (histErr) {
      console.warn('form_review_history insert failed:', histErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('POST /review error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

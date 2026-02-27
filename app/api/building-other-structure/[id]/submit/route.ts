import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Roles allowed to submit a FAAS form for LAOO review
const SUBMIT_ALLOWED_ROLES = ['tax_mapper', 'municipal_tax_mapper', 'admin', 'super_admin'];

// Only these statuses can transition to 'submitted'
const SUBMITTABLE_STATUSES = ['draft', 'returned'];

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;

    if (!id) {
      return NextResponse.json({ success: false, message: 'No ID provided' }, { status: 400 });
    }

    // ── Authenticate ─────────────────────────────────────────────────────────
    const sessionClient = await createClient();
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdminClient();

    // ── Get user role ─────────────────────────────────────────────────────────
    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('role, municipality')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, message: 'User profile not found' }, { status: 401 });
    }

    if (!SUBMIT_ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json(
        { success: false, message: 'Your role is not allowed to submit forms' },
        { status: 403 }
      );
    }

    // ── Fetch current record status ───────────────────────────────────────────
    const { data: record, error: fetchError } = await admin
      .from('building_structures')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ success: false, message: 'Form not found' }, { status: 404 });
    }

    if (!SUBMITTABLE_STATUSES.includes(record.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Form cannot be submitted from its current status: "${record.status}". Only draft or returned forms can be submitted.`,
        },
        { status: 409 }
      );
    }

    const fromStatus = record.status;
    const now = new Date().toISOString();

    // ── Status transition only ────────────────────────────────────────────────
    // Form data is saved separately via PUT before this endpoint is called.
    const { data: updated, error: updateError } = await admin
      .from('building_structures')
      .update({
        status: 'submitted',
        submitted_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { success: false, message: 'Failed to update record', error: updateError?.message },
        { status: 500 }
      );
    }

    // ── Write audit entry (non-blocking — table may not exist yet) ─────────────
    try {
      await admin.from('form_review_history').insert({
        form_type: 'building_structures',
        form_id: parseInt(id),
        form_stage: 'faas',
        from_status: fromStatus,
        to_status: 'submitted',
        actor_id: authUser.id,
        actor_role: profile.role,
        note: fromStatus === 'returned'
          ? 'Re-submitted after addressing LAOO review comments'
          : 'Initial submission for LAOO review',
      });
    } catch (historyErr) {
      // Audit entry failure is non-fatal; log but don't block the response
      console.warn('form_review_history insert failed (migration may not be applied):', historyErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('POST /submit error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}

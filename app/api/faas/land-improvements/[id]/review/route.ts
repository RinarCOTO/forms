import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { notifyFaasStatusChange } from '@/lib/faas/notification-rules';
import { canAccessFaasRecord, parsePositiveIntegerId } from '@/lib/faas/access-control';
import {
  type FaasReviewAction,
  getFaasReviewActionConfig,
  getFaasRealtimeTopic,
} from '@/lib/faas/workflow';

function getAdmin() {
  return createSupabaseAdminClient();
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    const recordId = parsePositiveIntegerId(id);
    if (!recordId) return NextResponse.json({ error: 'Invalid ID provided' }, { status: 400 });

    const sessionClient = await createClient();
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getAdmin();
    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('role, municipality, signature_path')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { action, note } = body as { action: FaasReviewAction; note?: string };

    const config = getFaasReviewActionConfig(action);
    if (!config) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    if (!config.roles.includes(profile.role)) return NextResponse.json({ error: 'Forbidden for your role' }, { status: 403 });
    if (config.requiresNote && !note?.trim()) return NextResponse.json({ error: 'A note is required for this action' }, { status: 422 });

    const { data: record, error: fetchError } = await admin
      .from('land_improvements')
      .select('id, status, previous_td_no, created_by, assigned_to, appraised_by, laoo_reviewer_id, municipality, location_municipality')
      .eq('id', recordId)
      .single();

    if (fetchError || !record) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    const userCtx = {
      userId: authUser.id,
      role: profile.role,
      municipality: profile.municipality ?? null,
      isAdmin: ['admin', 'super_admin'].includes(profile.role),
    };

    if (!canAccessFaasRecord(userCtx, record)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!config.fromStatuses.includes(record.status)) {
      return NextResponse.json({ error: `Cannot perform "${action}" on a form with status "${record.status}"` }, { status: 409 });
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = { status: config.toStatus, updated_at: now };

    if (action === 'sign_forward') {
      updatePayload.municipal_reviewer_id    = authUser.id;
      updatePayload.municipal_signed_at      = now;
      updatePayload.municipal_signature_path = profile.signature_path ?? null;
    }
    if (action === 'sign_approve') {
      updatePayload.provincial_reviewer_id    = authUser.id;
      updatePayload.provincial_signed_at      = now;
      updatePayload.provincial_signature_path = profile.signature_path ?? null;
    }

    const { data: updated, error: updateError } = await admin
      .from('land_improvements')
      .update(updatePayload)
      .eq('id', recordId)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: 'Failed to update form', detail: updateError?.message }, { status: 500 });
    }

    // Cancel previous TD when approved (non-blocking)
    if (config.toStatus === 'approved' && record.previous_td_no) {
      try {
        await admin
          .from('land_improvements')
          .update({ status: 'cancelled', updated_at: now })
          .eq('arp_no', record.previous_td_no)
          .neq('id', recordId)
          .neq('status', 'cancelled');
      } catch (cancelErr) {
        console.warn('Previous TD cancellation failed:', cancelErr);
      }
    }

    // Audit log (non-blocking)
    try {
      await admin.from('form_review_history').insert({
        form_type: 'land_improvements',
        form_id: recordId,
        form_stage: 'faas',
        from_status: record.status,
        to_status: config.toStatus,
        actor_id: authUser.id,
        actor_role: profile.role,
        note: note ?? null,
      });
    } catch (histErr) {
      console.warn('form_review_history insert failed:', histErr);
    }

    try {
      await notifyFaasStatusChange({
        formType: 'land_improvements',
        record: updated,
        fromStatus: record.status,
        toStatus: config.toStatus,
        actorId: authUser.id,
      });
    } catch (notificationErr) {
      console.warn('Notification creation failed:', notificationErr);
    }

    // ── Broadcast status change for live dashboard/queue updates ─────────────
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        },
        body: JSON.stringify({
          messages: [{
            topic: getFaasRealtimeTopic('land_improvements'),
            event: 'status_change',
            payload: { id: updated.id, status: config.toStatus, updated_at: updated.updated_at, submitted_at: updated.submitted_at, owner_name: updated.owner_name, location_municipality: updated.location_municipality, location_barangay: updated.location_barangay, created_by: updated.created_by, form_type: 'land', form_label: 'Land & Other Improvements' },
          }],
        }),
      });
    } catch (broadcastErr) {
      console.warn('Broadcast failed (non-fatal):', broadcastErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('POST /land-improvements review error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

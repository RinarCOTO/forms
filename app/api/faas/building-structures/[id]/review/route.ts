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

// Role groups
const MUNICIPAL_ROLES  = ['municipal_tax_mapper', 'municipal_assessor', 'admin', 'super_admin'];
const LAOO_ROLES       = ['laoo', 'admin', 'super_admin'];
const PROVINCIAL_ROLES = ['assistant_provincial_assessor', 'provincial_assessor', 'admin', 'super_admin'];

type ReviewAction = 'sign_forward' | 'return_to_mapper' | 'laoo_approve' | 'laoo_return' | 'sign_approve' | 'provincial_return';

const ACTION_CONFIG: Record<ReviewAction, {
  roles: string[];
  fromStatuses: string[];
  toStatus: string;
  requiresNote?: boolean;
  requiresSignature?: boolean;
}> = {
  sign_forward:      { roles: MUNICIPAL_ROLES,  fromStatuses: ['submitted', 'returned_to_municipal'], toStatus: 'municipal_signed', requiresSignature: true },
  return_to_mapper:  { roles: MUNICIPAL_ROLES,  fromStatuses: ['submitted', 'returned_to_municipal'], toStatus: 'returned',         requiresNote: true },
  laoo_approve:      { roles: LAOO_ROLES,       fromStatuses: ['municipal_signed'],                   toStatus: 'laoo_approved' },
  laoo_return:       { roles: LAOO_ROLES,       fromStatuses: ['municipal_signed'],                   toStatus: 'returned_to_municipal', requiresNote: true },
  sign_approve:      { roles: PROVINCIAL_ROLES, fromStatuses: ['laoo_approved'],                      toStatus: 'approved',         requiresSignature: true },
  provincial_return: { roles: PROVINCIAL_ROLES, fromStatuses: ['laoo_approved'],                      toStatus: 'returned_to_municipal', requiresNote: true },
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;

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
    const { action, note } = body as { action: ReviewAction; note?: string };

    const config = ACTION_CONFIG[action];
    if (!config) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    if (!config.roles.includes(profile.role)) return NextResponse.json({ error: 'Forbidden for your role' }, { status: 403 });
    if (config.requiresNote && !note?.trim()) return NextResponse.json({ error: 'A note is required for this action' }, { status: 422 });
    if (config.requiresSignature && !profile.signature_path) return NextResponse.json({ error: 'You must upload a signature before signing' }, { status: 422 });

    const { data: record, error: fetchError } = await admin
      .from('building_structures')
      .select('id, status, previous_td_no')
      .eq('id', id)
      .single();

    if (fetchError || !record) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    if (!config.fromStatuses.includes(record.status)) {
      return NextResponse.json({ error: `Cannot perform "${action}" on a form with status "${record.status}"` }, { status: 409 });
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = { status: config.toStatus, updated_at: now };

    if (action === 'sign_forward') {
      updatePayload.municipal_reviewer_id    = authUser.id;
      updatePayload.municipal_signed_at      = now;
      updatePayload.municipal_signature_path = profile.signature_path;
    }
    if (action === 'sign_approve') {
      updatePayload.provincial_reviewer_id    = authUser.id;
      updatePayload.provincial_signed_at      = now;
      updatePayload.provincial_signature_path = profile.signature_path;
      updatePayload.approved_at               = now;
    }

    const { data: updated, error: updateError } = await admin
      .from('building_structures')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: 'Failed to update form', detail: updateError?.message }, { status: 500 });
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
            topic: 'building-structures-updates',
            event: 'status_change',
            payload: {
              id: updated.id,
              status: config.toStatus,
              updated_at: updated.updated_at,
              submitted_at: updated.submitted_at,
              owner_name: updated.owner_name,
              location_municipality: updated.location_municipality,
              location_barangay: updated.location_barangay,
              created_by: updated.created_by,
              form_type: 'building',
              form_label: 'Building & Structures',
            },
          }],
        }),
      });
    } catch (broadcastErr) {
      console.warn('Broadcast failed (non-fatal):', broadcastErr);
    }

    // Cancel previous TD when approved (non-blocking)
    if (action === 'sign_approve' && record.previous_td_no) {
      try {
        await admin
          .from('building_structures')
          .update({ status: 'cancelled', updated_at: now })
          .eq('arp_no', record.previous_td_no)
          .neq('id', parseInt(id))
          .neq('status', 'cancelled');
      } catch (cancelErr) {
        console.warn('Previous TD cancellation failed:', cancelErr);
      }
    }

    // ── Generate Tax Declaration when provincial approves ────────────────────
    if (action === 'sign_approve') {
      try {
        // Fetch the full approved record for the property snapshot
        const { data: fullRecord } = await admin
          .from('building_structures')
          .select('*')
          .eq('id', id)
          .single();

        // Generate sequential tax declaration number: TD-YYYY-NNNNN
        const year = new Date().getFullYear();
        const { count } = await admin
          .from('tax_declarations')
          .select('id', { count: 'exact', head: true })
          .like('tax_declaration_no', `TD-${year}-%`);
        const seq = String((count ?? 0) + 1).padStart(5, '0');
        const taxDeclarationNo = `TD-${year}-${seq}`;

        const { data: td, error: tdError } = await admin
          .from('tax_declarations')
          .insert({
            form_type: 'building_structures',
            form_id: parseInt(id),
            tax_declaration_no: taxDeclarationNo,
            property_snapshot: fullRecord ?? null,
            status: 'unlocked',
          })
          .select()
          .single();

        if (!tdError && td) {
          await admin
            .from('building_structures')
            .update({ tax_declaration_id: td.id, updated_at: now })
            .eq('id', id);
        } else {
          console.warn('Tax declaration insert failed:', tdError?.message);
        }
      } catch (tdErr) {
        console.warn('Tax declaration generation error:', tdErr);
      }
    }

    // Audit log (non-blocking)
    try {
      await admin.from('form_review_history').insert({
        form_type: 'building_structures',
        form_id: parseInt(id),
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

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('POST /building-structures review error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

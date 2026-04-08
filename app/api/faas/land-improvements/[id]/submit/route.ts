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

const SUBMIT_ALLOWED_ROLES = [
  'tax_mapper',
  'municipal_tax_mapper',
  'laoo',
  'provincial_assessor',
  'assistant_provincial_assessor',
  'admin',
  'super_admin',
];
const SUBMITTABLE_STATUSES = ['draft', 'returned', 'returned_to_municipal'];

// Higher-level roles bypass lower approval steps when they create/submit forms themselves
function getBypassStatus(role: string): string {
  switch (role) {
    case 'municipal_tax_mapper':
      return 'municipal_signed'; // they are the municipal reviewer
    case 'laoo':
      return 'laoo_approved';    // they clear municipal + laoo
    case 'provincial_assessor':
    case 'assistant_provincial_assessor':
    case 'admin':
    case 'super_admin':
      return 'approved';         // they clear all stages
    default:
      return 'submitted';        // normal flow for tax_mapper
  }
}

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

    const sessionClient = await createClient();
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdminClient();

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('role, municipality, signature_path')
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

    const { data: record, error: fetchError } = await admin
      .from('land_improvements')
      .select('id, status, previous_td_no')
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
    const targetStatus = getBypassStatus(profile.role);

    // If re-submitting from 'returned', generate change-tracking response comments
    let fullRecord: Record<string, unknown> | null = null;
    let laooComments: Array<{ id: string; field_name: string | null; comment_text: string }> = [];

    if (fromStatus === 'returned') {
      const [formRes, commentsRes] = await Promise.all([
        admin.from('land_improvements').select('*').eq('id', id).single(),
        admin.from('form_comments')
          .select('id, field_name, comment_text, parent_id, author_role')
          .eq('form_type', 'land_improvements')
          .eq('form_id', parseInt(id))
          .is('parent_id', null)
          .neq('author_role', 'tax_mapper')
          .order('created_at', { ascending: true }),
      ]);
      fullRecord = formRes.data ?? null;
      laooComments = (commentsRes.data ?? []) as typeof laooComments;
    }

    const updatePayload: Record<string, unknown> = {
      status: targetStatus,
      submitted_at: now,
      updated_at: now,
      submitted_signature_path: profile.signature_path ?? null,
    };

    // Stamp reviewer fields for bypassed stages
    if (targetStatus === 'municipal_signed' || targetStatus === 'laoo_approved' || targetStatus === 'approved') {
      updatePayload.municipal_reviewer_id = authUser.id;
      updatePayload.municipal_signed_at   = now;
    }
    if (targetStatus === 'laoo_approved' || targetStatus === 'approved') {
      updatePayload.laoo_reviewer_id  = authUser.id;
      updatePayload.laoo_approved_at  = now;
    }
    if (targetStatus === 'approved') {
      updatePayload.provincial_reviewer_id = authUser.id;
      updatePayload.provincial_signed_at   = now;
    }

    const { data: updated, error: updateError } = await admin
      .from('land_improvements')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { success: false, message: 'Failed to update record', error: updateError?.message },
        { status: 500 }
      );
    }

    // Cancel previous TD when approved (non-blocking)
    if (targetStatus === 'approved' && record.previous_td_no) {
      try {
        await admin
          .from('land_improvements')
          .update({ status: 'cancelled', updated_at: now })
          .eq('arp_no', record.previous_td_no)
          .neq('id', parseInt(id))
          .neq('status', 'cancelled');
      } catch (cancelErr) {
        console.warn('Previous TD cancellation failed:', cancelErr);
      }
    }

    if (fromStatus === 'returned' && fullRecord && laooComments.length > 0) {
      const fieldValueMap: Record<string, string> = {
        owner_name:            String(fullRecord.owner_name ?? ''),
        admin_care_of:         String(fullRecord.admin_care_of ?? ''),
        owner_address:         String(fullRecord.owner_address ?? ''),
        arp_no:                String(fullRecord.arp_no ?? ''),
        pin:                   String(fullRecord.pin ?? ''),
        oct_tct_cloa_no:       String(fullRecord.oct_tct_cloa_no ?? ''),
        survey_no:             String(fullRecord.survey_no ?? ''),
        lot_no:                String(fullRecord.lot_no ?? ''),
        location_municipality: String(fullRecord.location_municipality ?? ''),
        location_barangay:     String(fullRecord.location_barangay ?? ''),
        north_property:        String(fullRecord.north_property ?? ''),
        south_property:        String(fullRecord.south_property ?? ''),
        east_property:         String(fullRecord.east_property ?? ''),
        west_property:         String(fullRecord.west_property ?? ''),
        classification:        String(fullRecord.classification ?? ''),
        sub_classification:    String(fullRecord.sub_classification ?? ''),
        land_area:             String(fullRecord.land_area ?? ''),
        market_value:          String(fullRecord.market_value ?? ''),
        assessment_level:      String(fullRecord.assessment_level ?? ''),
        assessed_value:        String(fullRecord.assessed_value ?? ''),
        actual_use:            String(fullRecord.actual_use ?? ''),
        amount_in_words:       String(fullRecord.amount_in_words ?? ''),
      };

      const responseInserts = laooComments
        .map((c) => {
          const fields = (c.field_name ?? '').split(',').map((f) => f.trim()).filter(Boolean);
          if (fields.length === 0) return null;
          const valueParts = fields
            .map((f) => { const v = fieldValueMap[f]; return v ? `${f}: ${v}` : null; })
            .filter(Boolean);
          if (valueParts.length === 0) return null;
          return {
            form_type: 'land_improvements',
            form_id: parseInt(id),
            field_name: c.field_name,
            comment_text: `Tax mapper updated values — ${valueParts.join(' | ')}`,
            author_id: authUser.id,
            author_role: profile.role,
            parent_id: c.id,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (responseInserts.length > 0) {
        try {
          await admin.from('form_comments').insert(responseInserts);
        } catch (insertErr) {
          console.warn('Change-tracking comment insert failed:', insertErr);
        }
      }
    }

    try {
      await admin.from('form_review_history').insert({
        form_type: 'land_improvements',
        form_id: parseInt(id),
        form_stage: 'faas',
        from_status: fromStatus,
        to_status: targetStatus,
        actor_id: authUser.id,
        actor_role: profile.role,
        note: targetStatus === 'submitted'
          ? (fromStatus === 'returned' ? 'Re-submitted after addressing review comments' : 'Initial submission for LAOO review')
          : `Auto-approved by ${profile.role} (creator bypass — stages up to "${targetStatus}" cleared)`,
      });
    } catch (historyErr) {
      console.warn('form_review_history insert failed:', historyErr);
    }

    // ── Broadcast status change for live dashboard updates ────────────────────
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
            payload: { id: updated.id, status: targetStatus, updated_at: updated.updated_at, submitted_at: updated.submitted_at, owner_name: updated.owner_name, location_municipality: updated.location_municipality, location_barangay: updated.location_barangay, created_by: updated.created_by, form_type: 'land', form_label: 'Land & Other Improvements' },
          }],
        }),
      });
    } catch (broadcastErr) {
      console.warn('Broadcast failed (non-fatal):', broadcastErr);
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

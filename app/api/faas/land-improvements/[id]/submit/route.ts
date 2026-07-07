import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  canSubmitFaasRole,
  getFaasRealtimeTopic,
  getLandSubmitTargetStatus,
  getSubmitHistoryNote,
  isFaasSubmittableStatus,
  shouldStampLaooReview,
  shouldStampMunicipalReview,
  shouldStampProvincialReview,
} from '@/lib/faas/workflow';
import { notifyFaasStatusChange } from '@/lib/faas/notification-rules';
import { canAccessFaasRecord, parsePositiveIntegerId } from '@/lib/faas/access-control';
import { getLaooAssignmentsForUser, getPrimaryMunicipality } from '@/lib/laoo-assignments';

function getAdminClient() {
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

    if (!recordId) {
      return NextResponse.json({ success: false, message: 'Invalid ID provided' }, { status: 400 });
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

    if (!canSubmitFaasRole(profile.role)) {
      return NextResponse.json(
        { success: false, message: 'Your role is not allowed to submit forms' },
        { status: 403 }
      );
    }

    const { data: record, error: fetchError } = await admin
      .from('land_improvements')
      .select('id, status, previous_td_no, appraised_by, created_by, assigned_to, laoo_reviewer_id, municipality, location_municipality')
      .eq('id', recordId)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ success: false, message: 'Form not found' }, { status: 404 });
    }

    const municipalities =
      profile.role === 'laoo'
        ? await getLaooAssignmentsForUser(admin, authUser.id, profile.municipality)
        : profile.municipality
          ? [profile.municipality]
          : [];
    const userCtx = {
      userId: authUser.id,
      role: profile.role,
      municipality: getPrimaryMunicipality(municipalities) ?? profile.municipality ?? null,
      municipalities,
      isAdmin: ['admin', 'super_admin'].includes(profile.role),
    };

    if (!canAccessFaasRecord(userCtx, record)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (!isFaasSubmittableStatus(record.status)) {
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
    const targetStatus = getLandSubmitTargetStatus(profile.role);

    // If re-submitting from 'returned', generate change-tracking response comments
    let fullRecord: Record<string, unknown> | null = null;
    let laooComments: Array<{ id: string; field_name: string | null; comment_text: string }> = [];

    if (fromStatus === 'returned') {
      const [formRes, commentsRes] = await Promise.all([
        admin.from('land_improvements').select('*').eq('id', recordId).single(),
        admin.from('form_comments')
          .select('id, field_name, comment_text, parent_id, author_role')
          .eq('form_type', 'land_improvements')
          .eq('form_id', recordId)
          .is('parent_id', null)
          .neq('author_role', 'municipal_tax_mapper')
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
    if (!record.appraised_by) {
      updatePayload.appraised_by = authUser.id;
    }

    // Stamp reviewer fields for bypassed stages
    if (shouldStampMunicipalReview(targetStatus)) {
      updatePayload.municipal_reviewer_id = authUser.id;
      updatePayload.municipal_signed_at   = now;
    }
    if (shouldStampLaooReview(targetStatus)) {
      updatePayload.laoo_reviewer_id  = authUser.id;
      updatePayload.laoo_approved_at  = now;
    }
    if (shouldStampProvincialReview(targetStatus)) {
      updatePayload.provincial_reviewer_id = authUser.id;
      updatePayload.provincial_signed_at   = now;
    }

    const { data: updated, error: updateError } = await admin
      .from('land_improvements')
      .update(updatePayload)
      .eq('id', recordId)
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
          .neq('id', recordId)
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
            form_id: recordId,
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
        form_id: recordId,
        form_stage: 'faas',
        from_status: fromStatus,
        to_status: targetStatus,
        actor_id: authUser.id,
        actor_role: profile.role,
        note: getSubmitHistoryNote({
          formType: 'land_improvements',
          fromStatus,
          targetStatus,
          role: profile.role,
        }),
      });
    } catch (historyErr) {
      console.warn('form_review_history insert failed:', historyErr);
    }

    try {
      await notifyFaasStatusChange({
        formType: 'land_improvements',
        record: updated,
        fromStatus,
        toStatus: targetStatus,
        actorId: authUser.id,
      });
    } catch (notificationErr) {
      console.warn('Notification creation failed:', notificationErr);
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
            topic: getFaasRealtimeTopic('land_improvements'),
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

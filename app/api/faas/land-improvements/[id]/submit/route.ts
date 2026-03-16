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

const SUBMIT_ALLOWED_ROLES = ['tax_mapper', 'municipal_tax_mapper', 'admin', 'super_admin'];
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

    const sessionClient = await createClient();
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdminClient();

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

    const { data: record, error: fetchError } = await admin
      .from('land_improvements')
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

    const { data: updated, error: updateError } = await admin
      .from('land_improvements')
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
        to_status: 'submitted',
        actor_id: authUser.id,
        actor_role: profile.role,
        note: fromStatus === 'returned'
          ? 'Re-submitted after addressing LAOO review comments'
          : 'Initial submission for LAOO review',
      });
    } catch (historyErr) {
      console.warn('form_review_history insert failed:', historyErr);
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

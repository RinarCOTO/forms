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

    // ── If re-submitting from 'returned', fetch full form data + LAOO comments
    //    to generate change-tracking response comments ─────────────────────────
    let fullRecord: Record<string, unknown> | null = null;
    let laooComments: Array<{ id: string; field_name: string | null; comment_text: string }> = [];

    if (fromStatus === 'returned') {
      const [formRes, commentsRes] = await Promise.all([
        admin.from('building_structures').select('*').eq('id', id).single(),
        admin.from('form_comments')
          .select('id, field_name, comment_text, parent_id, author_role')
          .eq('form_type', 'building_structures')
          .eq('form_id', parseInt(id))
          .is('parent_id', null)
          .neq('author_role', 'tax_mapper')
          .order('created_at', { ascending: true }),
      ]);
      fullRecord = formRes.data ?? null;
      laooComments = (commentsRes.data ?? []) as typeof laooComments;
    }

    // ── Status transition ─────────────────────────────────────────────────────
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

    // ── Generate change-tracking response comments (non-blocking) ─────────────
    if (fromStatus === 'returned' && fullRecord && laooComments.length > 0) {
      // Map field_name keys to DB column values
      const fieldValueMap: Record<string, string> = {
        owner_name: String(fullRecord.owner_name ?? ''),
        admin_care_of: String(fullRecord.admin_care_of ?? ''),
        owner_address: [fullRecord.owner_address_province, fullRecord.owner_address_municipality, fullRecord.owner_address_barangay].filter(Boolean).join(', ') || String(fullRecord.owner_address ?? ''),
        location_province: String(fullRecord.location_province ?? ''),
        location_municipality: String(fullRecord.location_municipality ?? ''),
        location_barangay: String(fullRecord.location_barangay ?? ''),
        type_of_building: String(fullRecord.type_of_building ?? ''),
        structure_type: String(fullRecord.structure_type ?? ''),
        building_permit_no: String(fullRecord.building_permit_no ?? ''),
        cct: String(fullRecord.cct ?? ''),
        completion_issued_on: String(fullRecord.completion_issued_on ?? '').substring(0, 4),
        date_constructed: String(fullRecord.date_constructed ?? '').substring(0, 4),
        date_occupied: String(fullRecord.date_occupied ?? '').substring(0, 4),
        building_age: String(fullRecord.building_age ?? ''),
        number_of_storeys: String(fullRecord.number_of_storeys ?? ''),
        total_floor_area: String(fullRecord.total_floor_area ?? ''),
        unit_cost: String(fullRecord.cost_of_construction ?? ''),
        land_owner: String(fullRecord.land_owner ?? ''),
        td_arp_no: String(fullRecord.td_arp_no ?? ''),
        land_area: String(fullRecord.land_area ?? ''),
        roofing_material: (() => { try { const v = typeof fullRecord.roofing_material === 'string' ? JSON.parse(fullRecord.roofing_material) : fullRecord.roofing_material; return v?.summary ?? JSON.stringify(v) ?? ''; } catch { return ''; } })(),
        flooring_material: (() => { try { const v = typeof fullRecord.flooring_material === 'string' ? JSON.parse(fullRecord.flooring_material) : fullRecord.flooring_material; return v?.summary ?? JSON.stringify(v) ?? ''; } catch { return ''; } })(),
        wall_material: (() => { try { const v = typeof fullRecord.wall_material === 'string' ? JSON.parse(fullRecord.wall_material) : fullRecord.wall_material; return v?.summary ?? JSON.stringify(v) ?? ''; } catch { return ''; } })(),
        selected_deductions: Array.isArray(fullRecord.selected_deductions) ? (fullRecord.selected_deductions as string[]).join(', ') : String(fullRecord.selected_deductions ?? ''),
        market_value: String(fullRecord.market_value ?? ''),
        actual_use: String(fullRecord.actual_use ?? ''),
        assessment_level: String(fullRecord.assessment_level ?? ''),
        assessed_value: String(fullRecord.estimated_value ?? ''),
        amount_in_words: String(fullRecord.amount_in_words ?? ''),
      };

      const responseInserts = laooComments
        .map((c) => {
          const fields = (c.field_name ?? '').split(',').map((f) => f.trim()).filter(Boolean);
          if (fields.length === 0) return null;
          const valueParts = fields
            .map((f) => {
              const v = fieldValueMap[f];
              return v ? `${f}: ${v}` : null;
            })
            .filter(Boolean);
          if (valueParts.length === 0) return null;
          return {
            form_type: 'building_structures',
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

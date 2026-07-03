import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { notifyFaasAssignment } from '@/lib/faas/notification-rules';
import {
  canAssignFaasRecord,
  canAssignUserToFaasRecord,
  FAAS_ASSIGN_SELECT,
  parsePositiveIntegerId,
} from '@/lib/faas/access-control';

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
    const recordId = parsePositiveIntegerId(id);
    if (!recordId) {
      return NextResponse.json({ error: 'Invalid ID provided' }, { status: 400 });
    }

    const sessionClient = await createClient();
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdmin();

    const { data: profile } = await admin
      .from('users')
      .select('role, municipality')
      .eq('id', authUser.id)
      .single();

    if (!profile || !ASSIGN_ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { assigned_to } = await req.json();
    const assignedToId = typeof assigned_to === 'string' && assigned_to.trim() ? assigned_to.trim() : null;

    const { data: record, error: recordError } = await admin
      .from('land_improvements')
      .select(FAAS_ASSIGN_SELECT)
      .eq('id', recordId)
      .single();

    if (recordError || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const userCtx = {
      userId: authUser.id,
      role: profile.role,
      municipality: profile.municipality ?? null,
      isAdmin: ['admin', 'super_admin'].includes(profile.role),
    };

    if (!canAssignFaasRecord(userCtx, record)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let assignedUser: { id?: string | null; role?: string | null; municipality?: string | null } | null = null;
    if (assignedToId) {
      const { data: targetUser, error: targetError } = await admin
        .from('users')
        .select('id, role, municipality')
        .eq('id', assignedToId)
        .single();

      if (targetError || !targetUser) {
        return NextResponse.json({ error: 'Assigned user not found' }, { status: 404 });
      }
      assignedUser = targetUser;
    }

    if (!canAssignUserToFaasRecord(userCtx, record, assignedUser)) {
      return NextResponse.json({ error: 'Assigned user is not allowed for this record' }, { status: 403 });
    }

    const { data, error } = await admin
      .from('land_improvements')
      .update({
        assigned_to: assignedToId,
        appraised_by: assignedToId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .select('id, assigned_to, appraised_by, created_by, owner_name, location_municipality, municipality')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    try {
      await notifyFaasAssignment({
        formType: 'land_improvements',
        record: data,
        assignedTo: assignedToId,
        actorId: authUser.id,
      });
    } catch (notificationErr) {
      console.warn('Notification creation failed:', notificationErr);
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

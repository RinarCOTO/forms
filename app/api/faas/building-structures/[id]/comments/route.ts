import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { canAccessFaasRecord, FAAS_ACCESS_SELECT, parsePositiveIntegerId } from '@/lib/faas/access-control';

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    const recordId = parsePositiveIntegerId(id);
    if (!recordId) return NextResponse.json({ error: 'Invalid ID provided' }, { status: 400 });

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

    const { data: record } = await admin
      .from('building_structures')
      .select(FAAS_ACCESS_SELECT)
      .eq('id', recordId)
      .single();

    if (!profile || !record || !canAccessFaasRecord({
      userId: authUser.id,
      role: profile.role,
      municipality: profile.municipality ?? null,
      isAdmin: ['admin', 'super_admin'].includes(profile.role),
    }, record)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await admin
      .from('form_comments')
      .select(`
        id,
        field_name,
        comment_text,
        suggested_value,
        author_id,
        author_role,
        parent_id,
        is_resolved,
        created_at,
        updated_at
      `)
      .eq('form_type', 'building_structures')
      .eq('form_id', recordId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('GET comments error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with author display name
    const authorIds = [...new Set((data ?? []).map(c => c.author_id))];
    let authorMap: Record<string, string> = {};
    if (authorIds.length > 0) {
      const { data: users } = await admin
        .from('users')
        .select('id, full_name, email')
        .in('id', authorIds);
      if (users) {
        authorMap = Object.fromEntries(users.map(u => [u.id, u.full_name ?? u.email ?? u.id]));
      }
    }

    const enriched = (data ?? []).map(c => ({
      ...c,
      author_name: authorMap[c.author_id] ?? c.author_id,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (err) {
    console.error('GET /comments unexpected:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
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
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdmin();

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('role, municipality')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 401 });
    }

    const { data: record } = await admin
      .from('building_structures')
      .select(FAAS_ACCESS_SELECT)
      .eq('id', recordId)
      .single();

    if (!record || !canAccessFaasRecord({
      userId: authUser.id,
      role: profile.role,
      municipality: profile.municipality ?? null,
      isAdmin: ['admin', 'super_admin'].includes(profile.role),
    }, record)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { field_name, comment_text, suggested_value, parent_id } = body as {
      field_name?: string;
      comment_text: string;
      suggested_value?: string;
      parent_id?: string;
    };

    if (!comment_text?.trim()) {
      return NextResponse.json({ error: 'comment_text is required' }, { status: 400 });
    }

    // Normalise role — municipal_assessor used to be municipal_assessor in old constraint
    const COMMENT_ROLES = ['laoo', 'municipal_tax_mapper', 'municipal_assessor', 'admin', 'super_admin',
      'assistant_provincial_assessor', 'provincial_assessor'];
    const authorRole = COMMENT_ROLES.includes(profile.role) ? profile.role : 'admin';

    const { data: inserted, error: insertError } = await admin
      .from('form_comments')
      .insert({
        form_type: 'building_structures',
        form_id: recordId,
        field_name: field_name ?? null,
        comment_text: comment_text.trim(),
        suggested_value: suggested_value ?? null,
        author_id: authUser.id,
        author_role: authorRole,
        parent_id: parent_id ?? null,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error('POST comment insert error:', insertError?.message);
      return NextResponse.json({ error: insertError?.message ?? 'Insert failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: inserted }, { status: 201 });
  } catch (err) {
    console.error('POST /comments unexpected:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { comment_id } = body as { comment_id?: string };
    if (!comment_id) {
      return NextResponse.json({ error: 'comment_id is required' }, { status: 400 });
    }

    const admin = getAdmin();

    const { data: profile } = await admin
      .from('users')
      .select('role, municipality')
      .eq('id', authUser.id)
      .single();

    const { data: record } = await admin
      .from('building_structures')
      .select(FAAS_ACCESS_SELECT)
      .eq('id', recordId)
      .single();

    if (!profile || !record || !canAccessFaasRecord({
      userId: authUser.id,
      role: profile.role,
      municipality: profile.municipality ?? null,
      isAdmin: ['admin', 'super_admin'].includes(profile.role),
    }, record)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: existing, error: fetchError } = await admin
      .from('form_comments')
      .select('id, author_id')
      .eq('id', comment_id)
      .eq('form_type', 'building_structures')
      .eq('form_id', recordId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existing.author_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await admin
      .from('form_comments')
      .delete()
      .eq('id', comment_id);

    if (deleteError) {
      console.error('DELETE comment error:', deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /comments unexpected:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

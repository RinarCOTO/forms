import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const LOCK_DURATION_SECONDS = 120; // 2 minutes — heartbeat must fire every 30s

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getAuthUser() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return null;
  return user;
}

// GET /api/form-locks?form_type=building_structures&form_id=123
// Check if a form is locked
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const form_type    = searchParams.get('form_type');
  const raw_form_id  = searchParams.get('form_id');
  if (!form_type || !raw_form_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const form_id = parseInt(raw_form_id, 10);
  if (isNaN(form_id)) return NextResponse.json({ error: 'Invalid form_id' }, { status: 400 });

  const admin = getAdmin();

  // Clean expired locks first
  await admin.from('form_locks').delete().lt('expires_at', new Date().toISOString());

  const { data } = await admin
    .from('form_locks')
    .select('locked_by, locked_name, expires_at')
    .eq('form_type', form_type)
    .eq('form_id', form_id)
    .maybeSingle();

  if (!data) return NextResponse.json({ locked: false });

  // If the lock belongs to the current user, treat as unlocked (they can edit)
  if (data.locked_by === user.id) return NextResponse.json({ locked: false, own: true });

  return NextResponse.json({ locked: true, locked_name: data.locked_name });
}

// POST /api/form-locks — acquire lock
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { form_type, form_id: raw_form_id } = await req.json();
  if (!form_type || !raw_form_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const form_id = parseInt(String(raw_form_id), 10);
  if (isNaN(form_id)) return NextResponse.json({ error: 'Invalid form_id' }, { status: 400 });

  const admin = getAdmin();

  // Get user's display name
  const { data: profile } = await admin
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const locked_name = profile?.full_name || user.email || 'Another user';

  // Clean expired locks first
  await admin.from('form_locks').delete().lt('expires_at', new Date().toISOString());

  const expires_at = new Date(Date.now() + LOCK_DURATION_SECONDS * 1000).toISOString();

  // Atomic INSERT — only one concurrent caller can win for the same (form_type, form_id).
  // If the row already exists, we get error code 23505 (unique/PK violation).
  const { error: insertError } = await admin.from('form_locks').insert({
    form_type,
    form_id,
    locked_by: user.id,
    locked_name,
    expires_at,
  });

  if (!insertError) {
    return NextResponse.json({ locked: false, own: true });
  }

  if (insertError.code !== '23505') {
    console.error('form_locks insert error:', insertError.code, insertError.message);
    return NextResponse.json({ locked: false, own: true });
  }

  // A lock row exists — find out who owns it
  const { data: existing } = await admin
    .from('form_locks')
    .select('locked_by, locked_name')
    .eq('form_type', form_type)
    .eq('form_id', form_id)
    .maybeSingle();

  if (!existing || existing.locked_by === user.id) {
    // We already hold this lock — refresh expiry
    await admin.from('form_locks')
      .update({ expires_at, locked_name })
      .eq('form_type', form_type)
      .eq('form_id', form_id)
      .eq('locked_by', user.id);
    return NextResponse.json({ locked: false, own: true });
  }

  return NextResponse.json({ locked: true, locked_name: existing.locked_name }, { status: 409 });
}

// PATCH /api/form-locks — heartbeat (extend expiry)
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { form_type, form_id: raw_form_id } = await req.json();
  if (!form_type || !raw_form_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const form_id = parseInt(String(raw_form_id), 10);
  if (isNaN(form_id)) return NextResponse.json({ error: 'Invalid form_id' }, { status: 400 });

  const admin = getAdmin();
  const expires_at = new Date(Date.now() + LOCK_DURATION_SECONDS * 1000).toISOString();

  await admin
    .from('form_locks')
    .update({ expires_at })
    .eq('form_type', form_type)
    .eq('form_id', form_id)
    .eq('locked_by', user.id);

  return NextResponse.json({ ok: true });
}

// DELETE /api/form-locks — release lock
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const form_type    = searchParams.get('form_type');
  const raw_form_id  = searchParams.get('form_id');
  if (!form_type || !raw_form_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const form_id = parseInt(raw_form_id, 10);
  if (isNaN(form_id)) return NextResponse.json({ error: 'Invalid form_id' }, { status: 400 });

  const admin = getAdmin();
  await admin
    .from('form_locks')
    .delete()
    .eq('form_type', form_type)
    .eq('form_id', form_id)
    .eq('locked_by', user.id);

  return NextResponse.json({ ok: true });
}

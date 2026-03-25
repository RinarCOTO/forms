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

const BUCKET = 'user-signatures';
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// GET — return a signed URL for the current user's signature
export async function GET() {
  try {
    const sessionClient = await createClient();
    const { data: { user }, error } = await sessionClient.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getAdmin();
    const { data: profile } = await admin.from('users').select('signature_path').eq('id', user.id).single();
    if (!profile?.signature_path) return NextResponse.json({ success: true, data: null });

    const { data: signed, error: signErr } = await admin.storage
      .from(BUCKET).createSignedUrl(profile.signature_path, 3600);
    if (signErr) return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });

    return NextResponse.json({ success: true, data: { signedUrl: signed.signedUrl } });
  } catch (err) {
    console.error('GET /api/auth/user/signature:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — upload or replace signature
export async function POST(req: NextRequest) {
  try {
    const sessionClient = await createClient();
    const { data: { user }, error } = await sessionClient.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const form = await req.formData();
    const file = form.get('signature') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'File must be PNG, JPEG, or WebP' }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File must be under 2 MB' }, { status: 400 });

    const admin = getAdmin();

    // Delete old signature if exists
    const { data: profile } = await admin.from('users').select('signature_path').eq('id', user.id).single();
    if (profile?.signature_path) {
      await admin.storage.from(BUCKET).remove([profile.signature_path]);
    }

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${user.id}/signature.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    });
    if (uploadErr) return NextResponse.json({ error: 'Upload failed', detail: uploadErr.message }, { status: 500 });

    await admin.from('users').update({ signature_path: path }).eq('id', user.id);

    return NextResponse.json({ success: true, data: { path } });
  } catch (err) {
    console.error('POST /api/auth/user/signature:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — remove signature
export async function DELETE() {
  try {
    const sessionClient = await createClient();
    const { data: { user }, error } = await sessionClient.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getAdmin();
    const { data: profile } = await admin.from('users').select('signature_path').eq('id', user.id).single();
    if (profile?.signature_path) {
      await admin.storage.from(BUCKET).remove([profile.signature_path]);
      await admin.from('users').update({ signature_path: null }).eq('id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/auth/user/signature:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PAUSED — Digital signature module. Do not use or import until the auth
// question is resolved. See project memory: project_digital_signatures.md
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

const ALLOWED_ROLES = ['super_admin', 'admin', 'laoo', 'municipal_assessor', 'assistant_provincial_assessor', 'provincial_assessor'];
const BUCKET = 'user-signatures';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const targetId = params.id;

    const sessionClient = await createClient();
    const { data: { user }, error } = await sessionClient.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getAdmin();
    const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single();

    const isSelf = user.id === targetId;
    const hasAccess = isSelf || (profile && ALLOWED_ROLES.includes(profile.role));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: target } = await admin.from('users').select('signature_path').eq('id', targetId).single();
    if (!target?.signature_path) return NextResponse.json({ success: true, data: null });

    const { data: signed, error: signErr } = await admin.storage
      .from(BUCKET).createSignedUrl(target.signature_path, 3600);
    if (signErr) return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });

    return NextResponse.json({ success: true, data: { signedUrl: signed.signedUrl } }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('GET /api/users/[id]/signature:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

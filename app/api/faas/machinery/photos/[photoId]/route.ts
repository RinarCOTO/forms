import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'machinery-photos';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// DELETE /api/faas/machinery/photos/[photoId]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ photoId: string }> | { photoId: string } }
) {
  try {
    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { photoId } = params;

    if (!photoId) {
      return NextResponse.json({ success: false, error: 'Missing photoId' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Fetch the photo record
    const { data: photo, error: fetchError } = await admin
      .from('machinery_photos')
      .select('id, storage_path, uploaded_by')
      .eq('id', photoId)
      .maybeSingle();

    if (fetchError || !photo) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 });
    }

    // Authorisation: uploader or admin
    if (photo.uploaded_by !== user.id) {
      const { data: userProfile } = await admin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    // Remove file from Storage
    const { error: storageError } = await admin.storage
      .from(BUCKET)
      .remove([photo.storage_path]);

    if (storageError) {
      return NextResponse.json({ success: false, error: storageError.message }, { status: 500 });
    }

    // Remove DB pointer
    const { error: dbError } = await admin
      .from('machinery_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

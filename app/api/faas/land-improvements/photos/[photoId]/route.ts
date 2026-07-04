import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'land-improvement-photos';

function getAdminClient() {
  return createSupabaseAdminClient();
}

// PATCH /api/faas/land-improvements/photos/[photoId]
// Updates the note field for a photo record.
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ photoId: string }> | { photoId: string } }
) {
  try {
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

    const body = await req.json();
    const { note } = body;

    const admin = getAdminClient();

    const { data: photo, error: fetchError } = await admin
      .from('land_improvement_photos')
      .select('id, uploaded_by')
      .eq('id', photoId)
      .maybeSingle();

    if (fetchError || !photo) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 });
    }

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

    const { data: updated, error: updateError } = await admin
      .from('land_improvement_photos')
      .update({ note: note ?? null })
      .eq('id', photoId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// DELETE /api/faas/land-improvements/photos/[photoId]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ photoId: string }> | { photoId: string } }
) {
  try {
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

    const { data: photo, error: fetchError } = await admin
      .from('land_improvement_photos')
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

    const { error: storageError } = await admin.storage
      .from(BUCKET)
      .remove([photo.storage_path]);

    if (storageError) {
      return NextResponse.json({ success: false, error: storageError.message }, { status: 500 });
    }

    const { error: dbError } = await admin
      .from('land_improvement_photos')
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'machinery-photos';

const VALID_PHOTO_TYPES = [
  'machinery_photo',
  'nameplate',
  'purchase_receipt',
  'other_document',
] as const;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } }
  );
}

// POST /api/faas/machinery/photos
export async function POST(req: NextRequest) {
  console.log('=== POST /api/faas/machinery/photos ===');
  try {
    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('[POST photos] user:', user?.id, '| userError:', userError?.message);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const machineryId = formData.get('machineryId') as string | null;
    const photoType = formData.get('photoType') as string | null;
    console.log('[POST photos] file:', file?.name, file?.type, file?.size, '| machineryId:', machineryId, '| photoType:', photoType);

    if (!file || !machineryId || !photoType) {
      return NextResponse.json(
        { success: false, error: 'file, machineryId, and photoType are required' },
        { status: 400 }
      );
    }

    if (!(VALID_PHOTO_TYPES as readonly string[]).includes(photoType)) {
      return NextResponse.json(
        { success: false, error: `Invalid photoType. Must be one of: ${VALID_PHOTO_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // Build unique storage path
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const photoId = crypto.randomUUID();
    const storagePath = `${user.id}/${machineryId}/${photoType}/${photoId}.${ext}`;
    console.log('[POST photos] storagePath:', storagePath);

    // Upload to private Storage bucket
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    console.log('[POST photos] uploadError:', uploadError ? JSON.stringify(uploadError) : 'none');
    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    // Remove previous photo of same type if it exists
    const { data: existingPhoto, error: existingErr } = await admin
      .from('machinery_photos')
      .select('id, storage_path')
      .eq('machinery_id', parseInt(machineryId, 10))
      .eq('photo_type', photoType)
      .maybeSingle();

    console.log('[POST photos] existingPhoto:', existingPhoto?.id, '| existingErr:', existingErr?.message);
    if (existingErr) console.warn('[POST photos] existing photo lookup error:', existingErr);

    if (existingPhoto) {
      await admin.storage.from(BUCKET).remove([existingPhoto.storage_path]);
      await admin.from('machinery_photos').delete().eq('id', existingPhoto.id);
    }

    // Insert DB pointer record
    const { data: photoRecord, error: dbError } = await admin
      .from('machinery_photos')
      .insert({
        machinery_id: parseInt(machineryId, 10),
        photo_type: photoType,
        storage_path: storagePath,
        original_name: file.name,
        uploaded_by: user.id,
      })
      .select()
      .single();

    console.log('[POST photos] dbError:', dbError ? JSON.stringify(dbError) : 'none');
    if (dbError) {
      await admin.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    console.log('[POST photos] success, photoRecord id:', photoRecord?.id);
    return NextResponse.json({ success: true, data: photoRecord });
  } catch (error) {
    console.error('[POST photos] caught exception:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// GET /api/faas/machinery/photos?machineryId={id}
export async function GET(req: NextRequest) {
  console.log('=== GET /api/faas/machinery/photos ===');
  try {
    const { searchParams } = new URL(req.url);
    const machineryId = searchParams.get('machineryId');
    console.log('[GET photos] machineryId:', machineryId);

    if (!machineryId) {
      return NextResponse.json(
        { success: false, error: 'machineryId query param is required' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    const { data: photos, error: dbError } = await admin
      .from('machinery_photos')
      .select('*')
      .eq('machinery_id', parseInt(machineryId, 10))
      .order('created_at', { ascending: true });

    console.log('[GET photos] dbError:', dbError ? JSON.stringify(dbError) : 'none');
    console.log('[GET photos] photos found:', photos?.length ?? 0);

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    // Generate signed URLs (1 hour expiry)
    const photosWithUrls = await Promise.all(
      (photos ?? []).map(async (photo) => {
        const { data: signed, error: signErr } = await admin.storage
          .from(BUCKET)
          .createSignedUrl(photo.storage_path, 3600);
        if (signErr) console.warn('[GET photos] signedUrl error for', photo.id, ':', signErr.message);
        return {
          ...photo,
          signedUrl: signErr ? null : (signed?.signedUrl ?? null),
        };
      })
    );

    console.log('[GET photos] success, returning', photosWithUrls.length, 'photos');
    return NextResponse.json({ success: true, data: photosWithUrls });
  } catch (error) {
    console.error('[GET photos] caught exception:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

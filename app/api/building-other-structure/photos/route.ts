import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'building-structure-photos';

const VALID_PHOTO_TYPES = [
  'sketch_plan',
  'perspective_view',
  'barangay_certificate',
  'other_certificate',
] as const;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/building-other-structure/photos
export async function POST(req: NextRequest) {
  try {
    console.log('[photos POST] start');

    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('[photos POST] auth result:', { userId: user?.id, userError });

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const buildingStructureId = formData.get('buildingStructureId') as string | null;
    const photoType = formData.get('photoType') as string | null;
    console.log('[photos POST] form fields:', { fileName: file?.name, buildingStructureId, photoType });

    if (!file || !buildingStructureId || !photoType) {
      return NextResponse.json(
        { success: false, error: 'file, buildingStructureId, and photoType are required' },
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
    console.log('[photos POST] env check:', {
      urlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    // Build unique storage path
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const photoId = crypto.randomUUID();
    const storagePath = `${user.id}/${buildingStructureId}/${photoType}/${photoId}.${ext}`;
    console.log('[photos POST] uploading to storage path:', storagePath);

    // Upload to private Storage bucket
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('[photos POST] storage upload error:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    console.log('[photos POST] storage upload success');

    // Remove previous photo of same type if it exists
    const { data: existingPhoto, error: existingErr } = await admin
      .from('building_structure_photos')
      .select('id, storage_path')
      .eq('building_structure_id', parseInt(buildingStructureId, 10))
      .eq('photo_type', photoType)
      .maybeSingle();

    if (existingErr) console.warn('[photos POST] existing photo lookup error:', existingErr);

    if (existingPhoto) {
      console.log('[photos POST] removing previous photo:', existingPhoto.id);
      await admin.storage.from(BUCKET).remove([existingPhoto.storage_path]);
      await admin.from('building_structure_photos').delete().eq('id', existingPhoto.id);
    }

    // Insert DB pointer record
    const { data: photoRecord, error: dbError } = await admin
      .from('building_structure_photos')
      .insert({
        building_structure_id: parseInt(buildingStructureId, 10),
        photo_type: photoType,
        storage_path: storagePath,
        original_name: file.name,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[photos POST] db insert error:', dbError);
      await admin.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    console.log('[photos POST] done, record id:', photoRecord.id);
    return NextResponse.json({ success: true, data: photoRecord });
  } catch (error) {
    console.error('[photos POST] unexpected error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// GET /api/building-other-structure/photos?buildingStructureId={id}
export async function GET(req: NextRequest) {
  try {
    console.log('[photos GET] start');

    const { searchParams } = new URL(req.url);
    const buildingStructureId = searchParams.get('buildingStructureId');
    console.log('[photos GET] buildingStructureId:', buildingStructureId);

    if (!buildingStructureId) {
      return NextResponse.json(
        { success: false, error: 'buildingStructureId query param is required' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    console.log('[photos GET] env check:', {
      urlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    const { data: photos, error: dbError } = await admin
      .from('building_structure_photos')
      .select('*')
      .eq('building_structure_id', parseInt(buildingStructureId, 10))
      .order('created_at', { ascending: true });

    if (dbError) {
      console.error('[photos GET] db query error:', dbError);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    console.log('[photos GET] fetched', photos?.length ?? 0, 'photos');

    // Generate signed URLs
    const photosWithUrls = await Promise.all(
      (photos ?? []).map(async (photo) => {
        const { data: signed, error: signErr } = await admin.storage
          .from(BUCKET)
          .createSignedUrl(photo.storage_path, 3600);
        if (signErr) console.warn('[photos GET] signed URL error for', photo.id, ':', signErr);
        return {
          ...photo,
          signedUrl: signErr ? null : (signed?.signedUrl ?? null),
        };
      })
    );

    return NextResponse.json({ success: true, data: photosWithUrls });
  } catch (error) {
    console.error('[photos GET] unexpected error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

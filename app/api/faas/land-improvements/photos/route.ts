import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'land-improvement-photos';

const VALID_PHOTO_TYPES = [
  'barangay_certificate',
  'ncip_certificate',
  'sketch_plan',
  'affidavit_of_ownership',
  'endorsement_of_assessor',
  'tax_declaration',
  'survey_plan',
  'letter_request',
  'deed_of_sale',
  'deed_of_donation',
  'extra_judicial_settlement',
  'bir_certificate',
  'inspection_report',
] as const;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/faas/land-improvements/photos
export async function POST(req: NextRequest) {
  try {
    console.log('[land-photos POST] start');

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('[land-photos POST] auth:', { userId: user?.id, userError });

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const landImprovementId = formData.get('landImprovementId') as string | null;
    const photoType = formData.get('photoType') as string | null;
    console.log('[land-photos POST] fields:', { fileName: file?.name, landImprovementId, photoType });

    if (!file || !landImprovementId || !photoType) {
      return NextResponse.json(
        { success: false, error: 'file, landImprovementId, and photoType are required' },
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

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const photoId = crypto.randomUUID();
    const storagePath = `${user.id}/${landImprovementId}/${photoType}/${photoId}.${ext}`;
    console.log('[land-photos POST] uploading to:', storagePath);

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    console.log('[land-photos POST] storage upload result:', { uploadError });

    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    // Remove previous photo of same type if it exists
    const { data: existingPhoto } = await admin
      .from('land_improvement_photos')
      .select('id, storage_path')
      .eq('land_improvement_id', parseInt(landImprovementId, 10))
      .eq('photo_type', photoType)
      .maybeSingle();

    if (existingPhoto) {
      await admin.storage.from(BUCKET).remove([existingPhoto.storage_path]);
      await admin.from('land_improvement_photos').delete().eq('id', existingPhoto.id);
    }

    const { data: photoRecord, error: dbError } = await admin
      .from('land_improvement_photos')
      .insert({
        land_improvement_id: parseInt(landImprovementId, 10),
        photo_type: photoType,
        storage_path: storagePath,
        original_name: file.name,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      await admin.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: photoRecord });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// GET /api/faas/land-improvements/photos?landImprovementId={id}
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const landImprovementId = searchParams.get('landImprovementId');
    console.log('[land-photos GET] landImprovementId:', landImprovementId);

    if (!landImprovementId) {
      return NextResponse.json(
        { success: false, error: 'landImprovementId query param is required' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    console.log('[land-photos GET] env check:', {
      urlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    const { data: photos, error: dbError } = await admin
      .from('land_improvement_photos')
      .select('*')
      .eq('land_improvement_id', parseInt(landImprovementId, 10))
      .order('created_at', { ascending: true });

    console.log('[land-photos GET] db result:', { count: photos?.length, dbError });

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    const photosWithUrls = await Promise.all(
      (photos ?? []).map(async (photo) => {
        const { data: signed, error: signErr } = await admin.storage
          .from(BUCKET)
          .createSignedUrl(photo.storage_path, 3600);
        return {
          ...photo,
          signedUrl: signErr ? null : (signed?.signedUrl ?? null),
        };
      })
    );

    return NextResponse.json({ success: true, data: photosWithUrls });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

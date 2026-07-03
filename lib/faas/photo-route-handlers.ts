import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canAccessFaasRecord, parsePositiveIntegerId, type FaasAccessRecord } from '@/lib/faas/access-control';
import { getCurrentUserContext } from '@/lib/services/user.service';

const MAX_STORED_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const FILE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

interface FaasPhotoRouteConfig {
  bucket: string;
  table: string;
  parentTable: string;
  parentAccessSelect: string;
  parentIdFormField: string;
  parentIdQueryParam: string;
  parentIdColumn: string;
  validPhotoTypes: readonly string[];
}

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } }
  );
}

function requiredFieldsMessage(parentIdField: string) {
  return `file, ${parentIdField}, and photoType are required`;
}

function hasSignature(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

function isAllowedFileSignature(bytes: Uint8Array, contentType: string) {
  switch (contentType) {
    case 'image/jpeg':
      return hasSignature(bytes, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return hasSignature(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/webp':
      return hasSignature(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        hasSignature(bytes, [0x57, 0x45, 0x42, 0x50], 8);
    case 'application/pdf':
      return hasSignature(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    default:
      return false;
  }
}

export function createFaasPhotoRouteHandlers(config: FaasPhotoRouteConfig) {
  async function POST(req: NextRequest) {
    try {
      const supabase = await createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const parentId = formData.get(config.parentIdFormField) as string | null;
      const parentRecordId = parsePositiveIntegerId(parentId);
      const photoType = formData.get('photoType') as string | null;

      if (!file || !parentRecordId || !photoType) {
        return NextResponse.json(
          { success: false, error: requiredFieldsMessage(config.parentIdFormField) },
          { status: 400 }
        );
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Only JPG, PNG, WebP, or PDF files are allowed.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_STORED_UPLOAD_BYTES) {
        return NextResponse.json(
          { success: false, error: 'File must be under 10 MB after compression.' },
          { status: 400 }
        );
      }

      if (!config.validPhotoTypes.includes(photoType)) {
        return NextResponse.json(
          { success: false, error: `Invalid photoType. Must be one of: ${config.validPhotoTypes.join(', ')}` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);
      if (!isAllowedFileSignature(fileBytes, file.type)) {
        return NextResponse.json(
          { success: false, error: 'File contents do not match the declared file type.' },
          { status: 400 }
        );
      }

      const admin = getAdminClient();
      const userCtx = await getCurrentUserContext();
      if (!userCtx) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { data: parentRecord, error: parentError } = await admin
        .from(config.parentTable)
        .select(config.parentAccessSelect)
        .eq('id', parentRecordId)
        .single();

      if (parentError || !parentRecord) {
        return NextResponse.json({ success: false, error: 'Parent record not found' }, { status: 404 });
      }

      if (!canAccessFaasRecord(userCtx, parentRecord as unknown as FaasAccessRecord)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const ext = FILE_EXTENSIONS[file.type] ?? 'bin';
      const photoId = crypto.randomUUID();
      const storagePath = `${user.id}/${parentRecordId}/${photoType}/${photoId}.${ext}`;

      const { error: uploadError } = await admin.storage
        .from(config.bucket)
        .upload(storagePath, Buffer.from(arrayBuffer), {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error('[photos POST] storage upload error:', uploadError);
        return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
      }

      const { data: existingPhoto, error: existingErr } = await admin
        .from(config.table)
        .select('id, storage_path')
        .eq(config.parentIdColumn, parentRecordId)
        .eq('photo_type', photoType)
        .maybeSingle();

      if (existingErr) console.warn('[photos POST] existing photo lookup error:', existingErr);

      if (existingPhoto) {
        await admin.storage.from(config.bucket).remove([existingPhoto.storage_path]);
        await admin.from(config.table).delete().eq('id', existingPhoto.id);
      }

      const { data: photoRecord, error: dbError } = await admin
        .from(config.table)
        .insert({
          [config.parentIdColumn]: parentRecordId,
          photo_type: photoType,
          storage_path: storagePath,
          original_name: file.name,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (dbError) {
        console.error('[photos POST] db insert error:', dbError);
        await admin.storage.from(config.bucket).remove([storagePath]);
        return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: photoRecord });
    } catch (error) {
      console.error('[photos POST] unexpected error:', error);
      return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
  }

  async function GET(req: NextRequest) {
    try {
      const userCtx = await getCurrentUserContext();
      if (!userCtx) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const parentId = searchParams.get(config.parentIdQueryParam);
      const parentRecordId = parsePositiveIntegerId(parentId);

      if (!parentRecordId) {
        return NextResponse.json(
          { success: false, error: `${config.parentIdQueryParam} must be a positive integer` },
          { status: 400 }
        );
      }

      const admin = getAdminClient();
      const { data: parentRecord, error: parentError } = await admin
        .from(config.parentTable)
        .select(config.parentAccessSelect)
        .eq('id', parentRecordId)
        .single();

      if (parentError || !parentRecord) {
        return NextResponse.json({ success: false, error: 'Parent record not found' }, { status: 404 });
      }

      if (!canAccessFaasRecord(userCtx, parentRecord as unknown as FaasAccessRecord)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const { data: photos, error: dbError } = await admin
        .from(config.table)
        .select('*')
        .eq(config.parentIdColumn, parentRecordId)
        .order('created_at', { ascending: true });

      if (dbError) {
        console.error('[photos GET] db query error:', dbError);
        return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
      }

      const photosWithUrls = await Promise.all(
        (photos ?? []).map(async (photo) => {
          const { data: signed, error: signErr } = await admin.storage
            .from(config.bucket)
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

  return { POST, GET };
}

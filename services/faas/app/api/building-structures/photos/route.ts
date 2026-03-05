import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../../lib/auth'

const BUCKET = 'building-structure-photos'

const VALID_PHOTO_TYPES = [
  'sketch_plan',
  'perspective_view',
  'barangay_certificate',
  'other_certificate',
] as const

export async function POST(req: NextRequest) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const buildingStructureId = formData.get('buildingStructureId') as string | null
    const photoType = formData.get('photoType') as string | null

    if (!file || !buildingStructureId || !photoType) {
      return NextResponse.json(
        { success: false, error: 'file, buildingStructureId, and photoType are required' },
        { status: 400 }
      )
    }

    if (!(VALID_PHOTO_TYPES as readonly string[]).includes(photoType)) {
      return NextResponse.json(
        { success: false, error: `Invalid photoType. Must be one of: ${VALID_PHOTO_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const admin = getAdminClient()

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    const photoId = crypto.randomUUID()
    const storagePath = `${user.id}/${buildingStructureId}/${photoType}/${photoId}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
    }

    const { data: existingPhoto } = await admin
      .from('building_structure_photos')
      .select('id, storage_path')
      .eq('building_structure_id', parseInt(buildingStructureId, 10))
      .eq('photo_type', photoType)
      .maybeSingle()

    if (existingPhoto) {
      await admin.storage.from(BUCKET).remove([existingPhoto.storage_path])
      await admin.from('building_structure_photos').delete().eq('id', existingPhoto.id)
    }

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
      .single()

    if (dbError) {
      await admin.storage.from(BUCKET).remove([storagePath])
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: photoRecord })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const buildingStructureId = searchParams.get('buildingStructureId')

    if (!buildingStructureId) {
      return NextResponse.json(
        { success: false, error: 'buildingStructureId query param is required' },
        { status: 400 }
      )
    }

    const admin = getAdminClient()

    const { data: photos, error: dbError } = await admin
      .from('building_structure_photos')
      .select('*')
      .eq('building_structure_id', parseInt(buildingStructureId, 10))
      .order('created_at', { ascending: true })

    if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

    const photosWithUrls = await Promise.all(
      (photos ?? []).map(async (photo) => {
        const { data: signed, error: signErr } = await admin.storage
          .from(BUCKET)
          .createSignedUrl(photo.storage_path, 3600)
        return { ...photo, signedUrl: signErr ? null : (signed?.signedUrl ?? null) }
      })
    )

    return NextResponse.json({ success: true, data: photosWithUrls })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

import { createFaasPhotoRouteHandlers } from '@/lib/faas/photo-route-handlers';

const VALID_PHOTO_TYPES = [
  'sketch_plan',
  'perspective_view',
  'barangay_certificate',
  'other_certificate',
] as const;

const handlers = createFaasPhotoRouteHandlers({
  bucket: 'building-structure-photos',
  table: 'building_structure_photos',
  parentIdFormField: 'buildingStructureId',
  parentIdQueryParam: 'buildingStructureId',
  parentIdColumn: 'building_structure_id',
  validPhotoTypes: VALID_PHOTO_TYPES,
});

export const POST = handlers.POST;
export const GET = handlers.GET;

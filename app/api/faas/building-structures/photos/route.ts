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
  parentTable: 'building_structures',
  parentAccessSelect: 'id, created_by, assigned_to, appraised_by, laoo_reviewer_id, municipality, location_municipality',
  parentIdFormField: 'buildingStructureId',
  parentIdQueryParam: 'buildingStructureId',
  parentIdColumn: 'building_structure_id',
  validPhotoTypes: VALID_PHOTO_TYPES,
});

export const POST = handlers.POST;
export const GET = handlers.GET;

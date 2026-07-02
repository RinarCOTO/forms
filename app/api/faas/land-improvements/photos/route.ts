import { createFaasPhotoRouteHandlers } from '@/lib/faas/photo-route-handlers';

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

const handlers = createFaasPhotoRouteHandlers({
  bucket: 'land-improvement-photos',
  table: 'land_improvement_photos',
  parentTable: 'land_improvements',
  parentAccessSelect: 'id, created_by, assigned_to, appraised_by, laoo_reviewer_id, municipality, location_municipality',
  parentIdFormField: 'landImprovementId',
  parentIdQueryParam: 'landImprovementId',
  parentIdColumn: 'land_improvement_id',
  validPhotoTypes: VALID_PHOTO_TYPES,
});

export const POST = handlers.POST;
export const GET = handlers.GET;

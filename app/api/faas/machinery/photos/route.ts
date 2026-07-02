import { createFaasPhotoRouteHandlers } from '@/lib/faas/photo-route-handlers';

const VALID_PHOTO_TYPES = [
  'machinery_photo',
  'nameplate',
  'purchase_receipt',
  'other_document',
] as const;

const handlers = createFaasPhotoRouteHandlers({
  bucket: 'machinery-photos',
  table: 'machinery_photos',
  parentIdFormField: 'machineryId',
  parentIdQueryParam: 'machineryId',
  parentIdColumn: 'machinery_id',
  validPhotoTypes: VALID_PHOTO_TYPES,
});

export const POST = handlers.POST;
export const GET = handlers.GET;

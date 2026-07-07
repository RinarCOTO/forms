import { normalizeMunicipality } from '@/lib/faas/municipality';
import { isProvincialFaasRole } from '@/lib/faas/workflow';

export interface FaasUserContext {
  userId: string;
  municipality: string | null;
  municipalities?: string[];
  isAdmin: boolean;
  role: string;
}

export interface FaasAccessRecord {
  id?: number | string;
  created_by?: string | null;
  assigned_to?: string | null;
  appraised_by?: string | null;
  laoo_reviewer_id?: string | null;
  municipality?: string | null;
  location_municipality?: string | null;
}

const ASSIGNABLE_ROLES = new Set([
  'municipal_tax_mapper',
  'municipal_assessor',
]);

export const FAAS_ACCESS_SELECT =
  'id, status, created_by, assigned_to, appraised_by, laoo_reviewer_id, municipality, location_municipality';

export const FAAS_ASSIGN_SELECT =
  'id, status, assigned_to, appraised_by, created_by, owner_name, location_municipality, municipality, laoo_reviewer_id';

function matchesUser(userId: string, value: string | null | undefined) {
  return value === userId;
}

export function canAccessFaasRecord(userCtx: FaasUserContext, record: FaasAccessRecord) {
  if (userCtx.isAdmin || isProvincialFaasRole(userCtx.role)) {
    return true;
  }

  if (
    matchesUser(userCtx.userId, record.created_by) ||
    matchesUser(userCtx.userId, record.assigned_to) ||
    matchesUser(userCtx.userId, record.appraised_by) ||
    matchesUser(userCtx.userId, record.laoo_reviewer_id)
  ) {
    return true;
  }

  const userMunicipalities = [
    ...(userCtx.municipalities ?? []),
    userCtx.municipality,
  ]
    .map(normalizeMunicipality)
    .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);

  if (userMunicipalities.length === 0) {
    return false;
  }

  return [record.municipality, record.location_municipality]
    .map(normalizeMunicipality)
    .some((recordMunicipality) => !!recordMunicipality && userMunicipalities.includes(recordMunicipality));
}

export function getFaasRecordMunicipality(record: FaasAccessRecord) {
  return normalizeMunicipality(record.location_municipality) ?? normalizeMunicipality(record.municipality);
}

export function canAssignFaasRecord(userCtx: FaasUserContext, record: FaasAccessRecord) {
  return canAccessFaasRecord(userCtx, record);
}

export function canAssignUserToFaasRecord(
  userCtx: FaasUserContext,
  record: FaasAccessRecord,
  assignedUser: { id?: string | null; role?: string | null; municipality?: string | null } | null,
) {
  if (!assignedUser?.id) {
    return true;
  }

  if (!ASSIGNABLE_ROLES.has(assignedUser.role ?? '')) {
    return false;
  }

  if (userCtx.isAdmin || isProvincialFaasRole(userCtx.role)) {
    return true;
  }

  const recordMunicipality = getFaasRecordMunicipality(record);
  const assignedMunicipality = normalizeMunicipality(assignedUser.municipality);

  return !!recordMunicipality && recordMunicipality === assignedMunicipality;
}

export function parsePositiveIntegerId(value: string | null | undefined) {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  return Number(value);
}

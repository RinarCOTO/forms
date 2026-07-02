export interface FaasUserContext {
  userId: string;
  municipality: string | null;
  isAdmin: boolean;
  role: string;
}

export interface FaasAccessRecord {
  created_by?: string | null;
  assigned_to?: string | null;
  appraised_by?: string | null;
  laoo_reviewer_id?: string | null;
  municipality?: string | null;
  location_municipality?: string | null;
}

const PROVINCIAL_ROLES = new Set([
  'laoo',
  'assistant_provincial_assessor',
  'provincial_assessor',
]);

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? null;
}

function matchesUser(userId: string, value: string | null | undefined) {
  return value === userId;
}

export function canAccessFaasRecord(userCtx: FaasUserContext, record: FaasAccessRecord) {
  if (userCtx.isAdmin || PROVINCIAL_ROLES.has(userCtx.role)) {
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

  const userMunicipality = normalize(userCtx.municipality);
  if (!userMunicipality) {
    return false;
  }

  return [record.municipality, record.location_municipality]
    .map(normalize)
    .some((recordMunicipality) => recordMunicipality === userMunicipality);
}

export function parsePositiveIntegerId(value: string | null | undefined) {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  return Number(value);
}

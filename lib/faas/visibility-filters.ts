import { isMunicipalFaasRole, isProvinceWideFaasRole } from '@/lib/faas/workflow';
import { getMunicipalityComparisonValues } from '@/lib/faas/municipality';

export interface FaasVisibilityUser {
  userId: string;
  role: string;
  municipality: string | null;
  municipalities?: string[];
  isAdmin: boolean;
}

export const BUILDING_HIDE_DRAFTS_ROLES = [
  'municipal_assessor',
  'laoo',
  'provincial_assessor',
  'assistant_provincial_assessor',
] as const;

export const LAND_HIDE_DRAFTS_ROLES = [
  'laoo',
  'provincial_assessor',
  'assistant_provincial_assessor',
] as const;

const LAND_OWN_WORK_STATUSES = ['draft', 'returned', 'returned_to_municipal'];
const LAND_HIDDEN_REVIEW_STATUSES = ['draft', 'returned'];

export function isBuildingOwnWorkOnlyRole(role: string) {
  return role === 'municipal_tax_mapper';
}

export function shouldScopeBuildingToMunicipality(user: FaasVisibilityUser) {
  return !user.isAdmin && !isProvinceWideFaasRole(user.role) && getAssignedMunicipalities(user).length > 0;
}

export function shouldScopeLandToMunicipality(user: FaasVisibilityUser) {
  return !user.isAdmin && !isProvinceWideFaasRole(user.role) && getAssignedMunicipalities(user).length > 0;
}

export function shouldHideBuildingDrafts(role: string) {
  return BUILDING_HIDE_DRAFTS_ROLES.includes(role as typeof BUILDING_HIDE_DRAFTS_ROLES[number]);
}

export function shouldHideLandDrafts(role: string) {
  return LAND_HIDE_DRAFTS_ROLES.includes(role as typeof LAND_HIDE_DRAFTS_ROLES[number]);
}

export function getOwnOrAssignedFilter(user: FaasVisibilityUser) {
  return `created_by.eq.${user.userId},assigned_to.eq.${user.userId}`;
}

function getAssignedMunicipalities(user: FaasVisibilityUser) {
  const municipalities = user.municipalities?.filter(Boolean) ?? [];
  if (municipalities.length > 0) return [...new Set(municipalities)];
  return user.municipality ? [user.municipality] : [];
}

function getMunicipalityFilterParts(user: FaasVisibilityUser) {
  return getAssignedMunicipalities(user)
    .flatMap((municipality) => getMunicipalityComparisonValues(municipality))
    .filter((value, index, values) => values.indexOf(value) === index)
    .flatMap((value) => [
      `municipality.eq.${value}`,
      `location_municipality.eq.${value}`,
    ]);
}

export function getBuildingMunicipalityVisibilityFilter(user: FaasVisibilityUser) {
  return getMunicipalityFilterParts(user).join(',');
}

export function getBuildingMunicipalVisibilityFilter(user: FaasVisibilityUser) {
  const municipalityParts = getMunicipalityFilterParts(user);
  if (municipalityParts.length === 0) return getOwnOrAssignedFilter(user);

  return [
    ...municipalityParts,
    `created_by.eq.${user.userId}`,
    `assigned_to.eq.${user.userId}`,
  ].join(',');
}

export function getBuildingLaooDraftVisibilityFilter(user: FaasVisibilityUser) {
  return `and(status.neq.draft,status.neq.returned),and(status.eq.draft,created_by.eq.${user.userId})`;
}

export function getHiddenDraftStatusList() {
  return '("draft","returned")';
}

export function getLandMunicipalVisibilityFilter(user: FaasVisibilityUser) {
  const municipalityParts = getMunicipalityFilterParts(user);
  if (municipalityParts.length === 0) return getOwnOrAssignedFilter(user);

  return [
    ...municipalityParts,
    `created_by.eq.${user.userId}`,
    `assigned_to.eq.${user.userId}`,
  ].join(',');
}

export function getLandMunicipalityVisibilityFilter(user: FaasVisibilityUser) {
  return getMunicipalityFilterParts(user).join(',');
}

export function getLandOwnWorkVisibilityFilter(user: FaasVisibilityUser) {
  return [
    `status.not.in.(${LAND_HIDDEN_REVIEW_STATUSES.join(',')})`,
    `and(status.in.(${LAND_OWN_WORK_STATUSES.join(',')}),created_by.eq.${user.userId})`,
  ].join(',');
}

export function isLandMunicipalDashboardRole(role: string) {
  return isMunicipalFaasRole(role);
}

export function isBuildingMunicipalDashboardRole(role: string) {
  return isMunicipalFaasRole(role);
}

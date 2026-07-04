import { isMunicipalFaasRole, isProvinceWideFaasRole } from '@/lib/faas/workflow';

export interface FaasVisibilityUser {
  userId: string;
  role: string;
  municipality: string | null;
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
  return !user.isAdmin && !isProvinceWideFaasRole(user.role) && !!user.municipality;
}

export function shouldScopeLandToMunicipality(user: FaasVisibilityUser) {
  return !user.isAdmin && !isProvinceWideFaasRole(user.role) && !!user.municipality;
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

export function getBuildingLaooDraftVisibilityFilter(user: FaasVisibilityUser) {
  return `and(status.neq.draft,status.neq.returned),and(status.eq.draft,created_by.eq.${user.userId})`;
}

export function getHiddenDraftStatusList() {
  return '("draft","returned")';
}

export function getLandMunicipalVisibilityFilter(user: FaasVisibilityUser) {
  if (!user.municipality) return getOwnOrAssignedFilter(user);

  return [
    `municipality.eq.${user.municipality}`,
    `location_municipality.ilike.${user.municipality}`,
    `created_by.eq.${user.userId}`,
    `assigned_to.eq.${user.userId}`,
  ].join(',');
}

export function getLandMunicipalityVisibilityFilter(user: FaasVisibilityUser) {
  if (!user.municipality) return '';

  return [
    `municipality.eq.${user.municipality}`,
    `location_municipality.ilike.${user.municipality}`,
  ].join(',');
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

export type FaasRole =
  | 'municipal_tax_mapper'
  | 'municipal_assessor'
  | 'laoo'
  | 'assistant_provincial_assessor'
  | 'provincial_assessor'
  | 'admin'
  | 'super_admin';

export type FaasSubmitStatus = 'draft' | 'returned' | 'returned_to_municipal';
export type FaasWorkflowStatus =
  | FaasSubmitStatus
  | 'submitted'
  | 'municipal_signed'
  | 'laoo_approved'
  | 'approved';

export type FaasSubmitFormType = 'building_structures' | 'land_improvements';
export type FaasRealtimeFormType = FaasSubmitFormType;

export const FAAS_ADMIN_ROLES = ['admin', 'super_admin'] as const;

export const FAAS_MUNICIPAL_REVIEW_ROLES = [
  'municipal_tax_mapper',
  'municipal_assessor',
  'admin',
  'super_admin',
] as const;

export const FAAS_LAOO_REVIEW_ROLES = [
  'laoo',
  'admin',
  'super_admin',
] as const;

export const FAAS_PROVINCIAL_REVIEW_ROLES = [
  'assistant_provincial_assessor',
  'provincial_assessor',
  'admin',
  'super_admin',
] as const;

export const FAAS_REALTIME_TOPICS: Record<FaasRealtimeFormType, string> = {
  building_structures: 'building-structures-updates',
  land_improvements: 'land-improvements-updates',
};

export const FAAS_SUBMIT_ALLOWED_ROLES = [
  'municipal_tax_mapper',
  'municipal_assessor',
  'laoo',
  'assistant_provincial_assessor',
  'provincial_assessor',
  'admin',
  'super_admin',
] as const;

export const FAAS_SUBMITTABLE_STATUSES = [
  'draft',
  'returned',
  'returned_to_municipal',
] as const;

export function canSubmitFaasRole(role: string): role is FaasRole {
  return FAAS_SUBMIT_ALLOWED_ROLES.includes(role as FaasRole);
}

export function isFaasSubmittableStatus(status: string): status is FaasSubmitStatus {
  return FAAS_SUBMITTABLE_STATUSES.includes(status as FaasSubmitStatus);
}

export function getFaasRealtimeTopic(formType: FaasRealtimeFormType) {
  return FAAS_REALTIME_TOPICS[formType];
}

export function getLandSubmitTargetStatus(role: string): FaasWorkflowStatus {
  switch (role) {
    case 'municipal_assessor':
      return 'municipal_signed';
    case 'laoo':
      return 'laoo_approved';
    case 'provincial_assessor':
    case 'assistant_provincial_assessor':
    case 'admin':
    case 'super_admin':
      return 'approved';
    default:
      return 'submitted';
  }
}

export function getBuildingSubmitTargetStatus({
  role,
}: {
  fromStatus: string;
  role: string;
}): FaasWorkflowStatus {
  if (role === 'municipal_assessor') {
    return 'municipal_signed';
  }
  return 'submitted';
}

export function shouldStampMunicipalReview(targetStatus: string): boolean {
  return targetStatus === 'municipal_signed' || targetStatus === 'laoo_approved' || targetStatus === 'approved';
}

export function shouldStampLaooReview(targetStatus: string): boolean {
  return targetStatus === 'laoo_approved' || targetStatus === 'approved';
}

export function shouldStampProvincialReview(targetStatus: string): boolean {
  return targetStatus === 'approved';
}

export function getSubmitHistoryNote({
  formType,
  fromStatus,
  targetStatus,
  role,
}: {
  formType: FaasSubmitFormType;
  fromStatus: string;
  targetStatus: string;
  role: string;
}): string {
  if (formType === 'building_structures') {
    if (fromStatus === 'returned_to_municipal' && targetStatus === 'municipal_signed') {
      return 'Re-signed and forwarded to LAOO after municipal return';
    }
    if (fromStatus === 'returned') {
      return 'Re-submitted after addressing LAOO review comments';
    }
    return 'Initial submission for LAOO review';
  }

  if (targetStatus === 'submitted') {
    return fromStatus === 'returned'
      ? 'Re-submitted after addressing review comments'
      : 'Initial submission for LAOO review';
  }

  return `Auto-approved by ${role} (creator bypass — stages up to "${targetStatus}" cleared)`;
}

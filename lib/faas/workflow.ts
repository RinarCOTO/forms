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
export type FaasReviewAction =
  | 'sign_forward'
  | 'return_to_mapper'
  | 'laoo_approve'
  | 'laoo_return'
  | 'sign_approve'
  | 'provincial_return';

export interface FaasReviewActionConfig {
  roles: readonly string[];
  fromStatuses: readonly string[];
  toStatus: FaasWorkflowStatus;
  requiresNote?: boolean;
}

export const FAAS_ADMIN_ROLES = ['admin', 'super_admin'] as const;

export const FAAS_MUNICIPAL_ROLES = [
  'municipal_tax_mapper',
  'municipal_assessor',
] as const;

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

export const FAAS_PROVINCIAL_ROLES = [
  'assistant_provincial_assessor',
  'provincial_assessor',
] as const;

export const FAAS_PROVINCE_WIDE_ROLES = [
  'laoo',
  'assistant_provincial_assessor',
  'provincial_assessor',
] as const;

export const FAAS_REALTIME_TOPICS: Record<FaasRealtimeFormType, string> = {
  building_structures: 'building-structures-updates',
  land_improvements: 'land-improvements-updates',
};

export const FAAS_ALL_REVIEW_STATUSES = [
  'submitted',
  'municipal_signed',
  'laoo_approved',
  'approved',
  'returned',
  'returned_to_municipal',
] as const;

export const FAAS_ACTIVE_REVIEW_STATUSES = [
  'submitted',
  'municipal_signed',
  'laoo_approved',
  'returned_to_municipal',
] as const;

export const FAAS_REVIEW_ROLES = [
  'municipal_tax_mapper',
  'municipal_assessor',
  'laoo',
  'assistant_provincial_assessor',
  'provincial_assessor',
  'admin',
  'super_admin',
] as const;

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

const FAAS_SUBMIT_TARGET_BY_FORM_ROLE: Record<
  FaasSubmitFormType,
  {
    default: FaasWorkflowStatus;
    roles: Partial<Record<FaasRole, FaasWorkflowStatus>>;
  }
> = {
  building_structures: {
    default: 'submitted',
    roles: {
      municipal_assessor: 'municipal_signed',
    },
  },
  land_improvements: {
    default: 'submitted',
    roles: {
      municipal_assessor: 'municipal_signed',
      laoo: 'laoo_approved',
      assistant_provincial_assessor: 'approved',
      provincial_assessor: 'approved',
      admin: 'approved',
      super_admin: 'approved',
    },
  },
};

export function getFaasSubmitTargetStatus({
  formType,
  role,
}: {
  formType: FaasSubmitFormType;
  fromStatus: string;
  role: string;
}): FaasWorkflowStatus {
  const config = FAAS_SUBMIT_TARGET_BY_FORM_ROLE[formType];
  return config.roles[role as FaasRole] ?? config.default;
}

export function canReviewFaasRole(role: string): role is FaasRole {
  return FAAS_REVIEW_ROLES.includes(role as FaasRole);
}

export function isAdminFaasRole(role: string) {
  return FAAS_ADMIN_ROLES.includes(role as typeof FAAS_ADMIN_ROLES[number]);
}

export function isMunicipalFaasRole(role: string) {
  return FAAS_MUNICIPAL_ROLES.includes(role as typeof FAAS_MUNICIPAL_ROLES[number]);
}

export function isProvinceWideFaasRole(role: string) {
  return FAAS_PROVINCE_WIDE_ROLES.includes(role as typeof FAAS_PROVINCE_WIDE_ROLES[number]);
}

export function isProvincialFaasRole(role: string) {
  return FAAS_PROVINCIAL_ROLES.includes(role as typeof FAAS_PROVINCIAL_ROLES[number]);
}

export function getActiveReviewStatusesForRole(role: string | null): string[] {
  if (!role) return [];
  if (isAdminFaasRole(role)) return [...FAAS_ACTIVE_REVIEW_STATUSES];
  if (isMunicipalFaasRole(role)) return ['submitted', 'returned_to_municipal'];
  if (role === 'laoo') return ['municipal_signed'];
  if (['assistant_provincial_assessor', 'provincial_assessor'].includes(role)) return ['laoo_approved'];
  return [];
}

export function getSelectableReviewStatusesForRole(role: string | null): string[] {
  if (!role) return [];
  if (isAdminFaasRole(role)) return [...FAAS_ALL_REVIEW_STATUSES];
  return getActiveReviewStatusesForRole(role);
}

export const FAAS_REVIEW_ACTION_CONFIG: Record<FaasReviewAction, FaasReviewActionConfig> = {
  sign_forward: {
    roles: FAAS_MUNICIPAL_REVIEW_ROLES,
    fromStatuses: ['submitted', 'returned_to_municipal'],
    toStatus: 'municipal_signed',
  },
  return_to_mapper: {
    roles: FAAS_MUNICIPAL_REVIEW_ROLES,
    fromStatuses: ['submitted', 'returned_to_municipal'],
    toStatus: 'returned',
    requiresNote: true,
  },
  laoo_approve: {
    roles: FAAS_LAOO_REVIEW_ROLES,
    fromStatuses: ['municipal_signed'],
    toStatus: 'laoo_approved',
  },
  laoo_return: {
    roles: FAAS_LAOO_REVIEW_ROLES,
    fromStatuses: ['municipal_signed'],
    toStatus: 'returned_to_municipal',
    requiresNote: true,
  },
  sign_approve: {
    roles: FAAS_PROVINCIAL_REVIEW_ROLES,
    fromStatuses: ['laoo_approved'],
    toStatus: 'approved',
  },
  provincial_return: {
    roles: FAAS_PROVINCIAL_REVIEW_ROLES,
    fromStatuses: ['laoo_approved'],
    toStatus: 'returned_to_municipal',
    requiresNote: true,
  },
};

export function getFaasReviewActionConfig(action: string | null | undefined) {
  return action ? FAAS_REVIEW_ACTION_CONFIG[action as FaasReviewAction] ?? null : null;
}

export function getFaasReviewActionsForRoleAndStatus({
  role,
  status,
}: {
  role: string | null;
  status: string;
}): FaasReviewAction[] {
  if (!role) return [];
  return (Object.entries(FAAS_REVIEW_ACTION_CONFIG) as [FaasReviewAction, FaasReviewActionConfig][])
    .filter(([, config]) => config.roles.includes(role) && config.fromStatuses.includes(status))
    .map(([action]) => action);
}

export function getReviewReturnAction({
  canMunicipalAct,
  canLaooAct,
}: {
  canMunicipalAct: boolean;
  canLaooAct: boolean;
}): FaasReviewAction {
  if (canMunicipalAct) return 'return_to_mapper';
  if (canLaooAct) return 'laoo_return';
  return 'provincial_return';
}

// Machinery currently uses direct draft/submitted updates and does not have the
// building/land assign-review-submit workflow routes.
export const FAAS_MACHINERY_WORKFLOW_SCOPE = 'direct-submit-only';

export function getLandSubmitTargetStatus(role: string): FaasWorkflowStatus {
  return getFaasSubmitTargetStatus({
    formType: 'land_improvements',
    fromStatus: '',
    role,
  });
}

export function getBuildingSubmitTargetStatus({
  fromStatus,
  role,
}: {
  fromStatus: string;
  role: string;
}): FaasWorkflowStatus {
  return getFaasSubmitTargetStatus({
    formType: 'building_structures',
    fromStatus,
    role,
  });
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

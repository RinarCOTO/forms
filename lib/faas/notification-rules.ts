import {
  createNotification,
  createNotifications,
  getUserIdsByRoles,
  type NotificationType,
} from "@/lib/notifications";

type FaasFormType = "building_structures" | "land_improvements";

interface FaasNotificationRecord {
  id: number | string;
  owner_name?: string | null;
  created_by?: string | null;
  assigned_to?: string | null;
  location_municipality?: string | null;
  municipality?: string | null;
}

interface NotifyStatusChangeInput {
  formType: FaasFormType;
  record: FaasNotificationRecord;
  fromStatus?: string | null;
  toStatus: string;
  actorId: string;
}

interface NotifyAssignmentInput {
  formType: FaasFormType;
  record: FaasNotificationRecord;
  assignedTo: string | null;
  actorId: string;
}

const MUNICIPAL_REVIEW_ROLES = ["municipal_assessor"];
const MUNICIPAL_COMPLETION_ROLES = ["municipal_assessor", "municipal_tax_mapper"];
const LAOO_REVIEW_ROLES = ["laoo"];
const PROVINCIAL_REVIEW_ROLES = [
  "assistant_provincial_assessor",
  "provincial_assessor",
];

function getFormLabel(formType: FaasFormType) {
  return formType === "building_structures"
    ? "Building & Structures"
    : "Land & Other Improvements";
}

function getShortFormType(formType: FaasFormType) {
  return formType === "building_structures" ? "building" : "land";
}

function getFormLink(formType: FaasFormType, formId: string | number) {
  return `/review-queue/${formId}?type=${getShortFormType(formType)}`;
}

function getOwnerLabel(record: FaasNotificationRecord) {
  return record.owner_name ? ` for ${record.owner_name}` : "";
}

function getMunicipality(record: FaasNotificationRecord) {
  return record.location_municipality ?? record.municipality ?? null;
}

function getReviewRolesForStatus(status: string) {
  if (status === "submitted") return MUNICIPAL_REVIEW_ROLES;
  if (status === "municipal_signed") return LAOO_REVIEW_ROLES;
  if (status === "laoo_approved") return PROVINCIAL_REVIEW_ROLES;
  return [];
}

function getNotificationType(status: string): NotificationType {
  if (status === "approved") return "form_approved";
  if (status === "returned" || status === "returned_to_municipal") return "form_returned";
  return "form_submitted";
}

export async function notifyFaasStatusChange({
  formType,
  record,
  fromStatus,
  toStatus,
  actorId,
}: NotifyStatusChangeInput) {
  const formLabel = getFormLabel(formType);
  const formId = Number(record.id);
  const linkUrl = getFormLink(formType, record.id);
  const ownerLabel = getOwnerLabel(record);

  if (toStatus === "returned" && record.created_by) {
    await createNotification({
      recipientId: record.created_by,
      actorId,
      title: `${formLabel} returned`,
      message: `Your ${formLabel.toLowerCase()} form${ownerLabel} was returned for updates.`,
      type: "form_returned",
      relatedFormType: formType,
      relatedFormId: formId,
      linkUrl,
    });
    return;
  }

  if (toStatus === "returned_to_municipal") {
    const recipientIds = [
      record.assigned_to,
      ...(await getUserIdsByRoles(MUNICIPAL_REVIEW_ROLES, getMunicipality(record))),
    ].filter((id): id is string => Boolean(id));

    await createNotifications({
      recipientIds,
      skipUserId: actorId,
      actorId,
      title: `${formLabel} returned to municipal review`,
      message: `${formLabel} form${ownerLabel} needs municipal review again.`,
      type: "form_returned",
      relatedFormType: formType,
      relatedFormId: formId,
      linkUrl,
    });
    return;
  }

  if (toStatus === "approved") {
    const recipientIds = [
      record.created_by,
      ...(await getUserIdsByRoles(MUNICIPAL_COMPLETION_ROLES, getMunicipality(record))),
    ].filter((id): id is string => Boolean(id));

    await createNotifications({
      recipientIds,
      skipUserId: actorId,
      actorId,
      title: `${formLabel} approved`,
      message: `${formLabel} form${ownerLabel} was approved.`,
      type: "form_approved",
      relatedFormType: formType,
      relatedFormId: formId,
      linkUrl,
    });
    return;
  }

  const reviewRoles = getReviewRolesForStatus(toStatus);
  if (reviewRoles.length === 0) return;

  const recipientIds = await getUserIdsByRoles(reviewRoles, getMunicipality(record));
  const wasReturned = fromStatus === "returned" || fromStatus === "returned_to_municipal";

  await createNotifications({
    recipientIds,
    skipUserId: actorId,
    actorId,
    title: wasReturned ? `${formLabel} resubmitted` : `${formLabel} ready for review`,
    message: `${formLabel} form${ownerLabel} is now ready for your review.`,
    type: getNotificationType(toStatus),
    relatedFormType: formType,
    relatedFormId: formId,
    linkUrl,
  });
}

export async function notifyFaasAssignment({
  formType,
  record,
  assignedTo,
  actorId,
}: NotifyAssignmentInput) {
  if (!assignedTo || assignedTo === actorId) return;

  const formLabel = getFormLabel(formType);

  await createNotification({
    recipientId: assignedTo,
    actorId,
    title: `${formLabel} assigned to you`,
    message: `You were assigned a ${formLabel.toLowerCase()} form${getOwnerLabel(record)}.`,
    type: "form_assigned",
    relatedFormType: formType,
    relatedFormId: Number(record.id),
    linkUrl: getFormLink(formType, record.id),
  });
}

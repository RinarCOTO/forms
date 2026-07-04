import { createClient } from "@supabase/supabase-js";
import { normalizeMunicipality } from "@/lib/faas/municipality";

export type NotificationType =
  | "form_submitted"
  | "form_assigned"
  | "form_returned"
  | "form_approved"
  | "form_rejected"
  | "system";

export interface AppNotification {
  id: number;
  recipient_id: string;
  actor_id: string | null;
  title: string;
  message: string;
  type: NotificationType | string;
  related_form_type: string | null;
  related_form_id: number | null;
  link_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface CreateNotificationInput {
  recipientId: string;
  actorId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  relatedFormType?: string | null;
  relatedFormId?: number | null;
  linkUrl?: string | null;
}

interface CreateNotificationsInput extends Omit<CreateNotificationInput, "recipientId"> {
  recipientIds: string[];
  skipUserId?: string | null;
}

function getNotificationDedupeKey(notification: Pick<AppNotification, "recipient_id" | "title" | "message" | "type" | "related_form_type" | "related_form_id" | "link_url">) {
  return [
    notification.recipient_id,
    notification.type,
    notification.related_form_type ?? "",
    notification.related_form_id ?? "",
    notification.link_url ?? "",
    notification.title,
    notification.message,
  ].join("|");
}

function dedupeNotifications(notifications: AppNotification[]) {
  const byKey = new Map<string, AppNotification>();

  for (const notification of notifications) {
    const key = getNotificationDedupeKey(notification);
    const existing = byKey.get(key);

    if (
      !existing ||
      (!notification.is_read && existing.is_read) ||
      (notification.is_read === existing.is_read &&
        new Date(notification.created_at).getTime() > new Date(existing.created_at).getTime())
    ) {
      byKey.set(key, notification);
    }
  }

  return [...byKey.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function getNotificationClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: "public" } }
  );
}

export async function createNotification(input: CreateNotificationInput) {
  const supabase = getNotificationClient();

  const existing = await findExistingNotification(supabase, {
    recipientId: input.recipientId,
    title: input.title,
    message: input.message,
    type: input.type,
    relatedFormType: input.relatedFormType ?? null,
    relatedFormId: input.relatedFormId ?? null,
    linkUrl: input.linkUrl ?? null,
  });
  if (existing) {
    const refreshed = await refreshExistingNotifications(supabase, {
      recipientIds: [input.recipientId],
      actorId: input.actorId ?? null,
      title: input.title,
      message: input.message,
      type: input.type,
      relatedFormType: input.relatedFormType ?? null,
      relatedFormId: input.relatedFormId ?? null,
      linkUrl: input.linkUrl ?? null,
    });
    return refreshed[0] ?? existing;
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      recipient_id: input.recipientId,
      actor_id: input.actorId ?? null,
      title: input.title,
      message: input.message,
      type: input.type,
      related_form_type: input.relatedFormType ?? null,
      related_form_id: input.relatedFormId ?? null,
      link_url: input.linkUrl ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as AppNotification;
}

export async function createNotifications(input: CreateNotificationsInput) {
  const recipientIds = [...new Set(input.recipientIds)]
    .filter(Boolean)
    .filter((id) => id !== input.skipUserId);

  if (recipientIds.length === 0) return [];

  const supabase = getNotificationClient();
  const existing = await findExistingNotifications(supabase, {
    recipientIds,
    title: input.title,
    message: input.message,
    type: input.type,
    relatedFormType: input.relatedFormType ?? null,
    relatedFormId: input.relatedFormId ?? null,
    linkUrl: input.linkUrl ?? null,
  });
  const existingRecipientIds = new Set(existing.map((notification) => notification.recipient_id));
  const refreshed = existingRecipientIds.size > 0
    ? await refreshExistingNotifications(supabase, {
        recipientIds: [...existingRecipientIds],
        actorId: input.actorId ?? null,
        title: input.title,
        message: input.message,
        type: input.type,
        relatedFormType: input.relatedFormType ?? null,
        relatedFormId: input.relatedFormId ?? null,
        linkUrl: input.linkUrl ?? null,
      })
    : [];
  const newRecipientIds = recipientIds.filter((recipientId) => !existingRecipientIds.has(recipientId));
  if (newRecipientIds.length === 0) return refreshed.length > 0 ? refreshed : existing;

  const nowRows = newRecipientIds.map((recipientId) => ({
    recipient_id: recipientId,
    actor_id: input.actorId ?? null,
    title: input.title,
    message: input.message,
    type: input.type,
    related_form_type: input.relatedFormType ?? null,
    related_form_id: input.relatedFormId ?? null,
    link_url: input.linkUrl ?? null,
  }));

  const { data, error } = await supabase
    .from("notifications")
    .insert(nowRows)
    .select();

  if (error) throw new Error(error.message);
  return [...refreshed, ...((data ?? []) as AppNotification[])];
}

async function findExistingNotification(
  supabase: ReturnType<typeof getNotificationClient>,
  input: Omit<CreateNotificationInput, "actorId">
) {
  const existing = await findExistingNotifications(supabase, {
    ...input,
    recipientIds: [input.recipientId],
  });
  return existing[0] ?? null;
}

async function findExistingNotifications(
  supabase: ReturnType<typeof getNotificationClient>,
  input: Omit<CreateNotificationsInput, "actorId" | "skipUserId">
) {
  let query = supabase
    .from("notifications")
    .select("*")
    .in("recipient_id", input.recipientIds)
    .eq("title", input.title)
    .eq("message", input.message)
    .eq("type", input.type);

  query = input.relatedFormType == null
    ? query.is("related_form_type", null)
    : query.eq("related_form_type", input.relatedFormType);
  query = input.relatedFormId == null
    ? query.is("related_form_id", null)
    : query.eq("related_form_id", input.relatedFormId);
  query = input.linkUrl == null
    ? query.is("link_url", null)
    : query.eq("link_url", input.linkUrl);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as AppNotification[];
}

async function refreshExistingNotifications(
  supabase: ReturnType<typeof getNotificationClient>,
  input: Omit<CreateNotificationsInput, "skipUserId">
) {
  let query = supabase
    .from("notifications")
    .update({
      actor_id: input.actorId ?? null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    })
    .in("recipient_id", input.recipientIds)
    .eq("title", input.title)
    .eq("message", input.message)
    .eq("type", input.type);

  query = input.relatedFormType == null
    ? query.is("related_form_type", null)
    : query.eq("related_form_type", input.relatedFormType);
  query = input.relatedFormId == null
    ? query.is("related_form_id", null)
    : query.eq("related_form_id", input.relatedFormId);
  query = input.linkUrl == null
    ? query.is("link_url", null)
    : query.eq("link_url", input.linkUrl);

  const { data, error } = await query.select();
  if (error) throw new Error(error.message);
  return (data ?? []) as AppNotification[];
}

export async function getUserIdsByRoles(roles: string[], municipality?: string | null) {
  if (roles.length === 0) return [];
  const municipalitySlug = normalizeMunicipality(municipality);

  const supabase = getNotificationClient();
  let query = supabase
    .from("users")
    .select("id, role, municipality")
    .in("role", roles)
    .eq("is_active", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((user) => {
      if (!municipalitySlug) return true;
      const userMunicipality = normalizeMunicipality(user.municipality);
      if (user.role === "laoo" || user.role === "municipal_assessor" || user.role === "municipal_tax_mapper") {
        return userMunicipality === municipalitySlug;
      }
      return userMunicipality === null || userMunicipality === municipalitySlug;
    })
    .map((user) => user.id as string);
}

export async function getNotificationsForUser(userId: string, limit = 10) {
  const supabase = getNotificationClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit * 3);

  if (error) throw new Error(error.message);
  return dedupeNotifications((data ?? []) as AppNotification[]).slice(0, limit);
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = getNotificationClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
  return dedupeNotifications((data ?? []) as AppNotification[]).length;
}

export async function markNotificationAsRead(userId: string, notificationId: number) {
  const supabase = getNotificationClient();

  const { data: notification, error: fetchError } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", notificationId)
    .eq("recipient_id", userId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  let updateQuery = supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("title", notification.title)
    .eq("message", notification.message)
    .eq("type", notification.type);

  updateQuery = notification.related_form_type == null
    ? updateQuery.is("related_form_type", null)
    : updateQuery.eq("related_form_type", notification.related_form_type);
  updateQuery = notification.related_form_id == null
    ? updateQuery.is("related_form_id", null)
    : updateQuery.eq("related_form_id", notification.related_form_id);
  updateQuery = notification.link_url == null
    ? updateQuery.is("link_url", null)
    : updateQuery.eq("link_url", notification.link_url);

  const { data, error } = await updateQuery
    .select()
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error(error.message);
  return data as AppNotification;
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = getNotificationClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
}

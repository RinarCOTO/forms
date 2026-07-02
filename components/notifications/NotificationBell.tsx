"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AppNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface NotificationResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

const FALLBACK_POLL_INTERVAL_MS = 90_000;
const MIN_REFRESH_GAP_MS = 5_000;
const NOTIFICATION_CHANGE_REFRESH_DELAYS_MS = [250, 1_500];
const WORKFLOW_BROADCAST_REFRESH_DELAYS_MS = [250, 1_500, 3_500];

function formatNotificationDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

const OWNER_NAME_MESSAGE_PATTERNS = [
  /^(.+ form for )(.+?)( is now ready for your review\.)$/,
  /^(.+ form for )(.+?)( needs municipal review again\.)$/,
  /^(.+ form for )(.+?)( was approved\.)$/,
  /^(Your .+ form for )(.+?)( was returned for updates\.)$/,
  /^(Your .+ form for )(.+?)( was approved\.)$/,
  /^(You were assigned a .+ form for )(.+?)(\.)$/,
];

function renderNotificationMessage(message: string) {
  for (const pattern of OWNER_NAME_MESSAGE_PATTERNS) {
    const match = message.match(pattern);
    if (!match) continue;

    return (
      <>
        {match[1]}
        <span className="font-semibold uppercase text-foreground">
          {match[2]}
        </span>
        {match[3]}
      </>
    );
  }

  return message;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedAtRef = useRef(0);
  const inFlightRef = useRef(false);
  const realtimeRefreshTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const badgeText = useMemo(() => {
    if (unreadCount <= 0) return "";
    return unreadCount > 99 ? "99+" : String(unreadCount);
  }, [unreadCount]);

  const loadNotifications = useCallback(async (options: { force?: boolean; silent?: boolean } = {}) => {
    const now = Date.now();
    if (inFlightRef.current) return;
    if (!options.force && now - lastLoadedAtRef.current < MIN_REFRESH_GAP_MS) return;

    inFlightRef.current = true;
    if (!options.silent) setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications?limit=8");
      if (!response.ok) throw new Error("Failed to load notifications");
      const data = (await response.json()) as NotificationResponse;
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      lastLoadedAtRef.current = Date.now();
    } catch {
      setError("Notifications unavailable");
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications({ force: true });
  }, [loadNotifications]);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;
    let isMounted = true;
    const channels: RealtimeChannel[] = [];

    const clearRealtimeRefreshTimers = () => {
      realtimeRefreshTimersRef.current.forEach((timer) => clearTimeout(timer));
      realtimeRefreshTimersRef.current = [];
    };

    const scheduleRealtimeRefresh = (delayMsList = NOTIFICATION_CHANGE_REFRESH_DELAYS_MS) => {
      if (document.visibilityState === "hidden") return;
      clearRealtimeRefreshTimers();

      realtimeRefreshTimersRef.current = delayMsList.map((delayMs) =>
        setTimeout(() => {
          loadNotifications({ force: true, silent: true });
        }, delayMs)
      );
    };

    const subscribe = async () => {
      try {
        supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!isMounted || !userId) return;

        const notificationChannel = supabase
          .channel(`notifications:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${userId}`,
            },
            () => scheduleRealtimeRefresh()
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${userId}`,
            },
            () => scheduleRealtimeRefresh()
          )
          .subscribe();
        channels.push(notificationChannel);

        const workflowChannel = supabase
          .channel("building-structures-updates")
          .on("broadcast", { event: "status_change" }, () => {
            scheduleRealtimeRefresh(WORKFLOW_BROADCAST_REFRESH_DELAYS_MS);
          })
          .subscribe();
        channels.push(workflowChannel);
      } catch {
        // Realtime is an enhancement only. The API fetch and fallback refresh still work.
      }
    };

    subscribe();

    return () => {
      isMounted = false;
      clearRealtimeRefreshTimers();
      if (supabase) {
        channels.forEach((channel) => {
          supabase?.removeChannel(channel);
        });
      }
    };
  }, [loadNotifications]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        loadNotifications({ silent: true });
      }
    };

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadNotifications({ silent: true });
      }
    }, FALLBACK_POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    window.addEventListener("online", refreshIfVisible);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
      window.removeEventListener("online", refreshIfVisible);
    };
  }, [loadNotifications]);

  const markOneRead = useCallback(async (notification: AppNotification) => {
    if (!notification.is_read) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true, read_at: new Date().toISOString() }
            : item
        )
      );
      setUnreadCount((count) => Math.max(count - 1, 0));

      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: "PATCH",
        });
      } catch {
        loadNotifications({ force: true });
      }
    }

    if (notification.link_url) {
      router.push(notification.link_url);
    }
  }, [loadNotifications, router]);

  const markAllRead = useCallback(async () => {
    setIsUpdating(true);
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
        read_at: item.read_at ?? new Date().toISOString(),
      }))
    );
    setUnreadCount(0);

    try {
      await fetch("/api/notifications", { method: "PATCH" });
    } catch {
      loadNotifications({ force: true });
    } finally {
      setIsUpdating(false);
    }
  }, [loadNotifications]);

  return (
    <Popover onOpenChange={(open) => {
      if (open) loadNotifications({ force: true });
    }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {badgeText && (
            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
              {badgeText}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" side="right" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0 || isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Read
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading
            </div>
          ) : error ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {error}
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => markOneRead(notification)}
                className={cn(
                  "w-full border-b px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/60",
                  !notification.is_read && "bg-primary/5"
                )}
              >
                <div className="flex items-start gap-2">
                  {!notification.is_read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {notification.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatNotificationDate(notification.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {renderNotificationMessage(notification.message)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, RefreshCw, Save, UserCheck, X } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Municipality } from "@/app/types/user";
import { MUNICIPALITIES, MUNICIPALITY_LABELS } from "@/app/types/user";
import { cn } from "@/lib/utils";

const ASSIGNMENT_ROLES = [
  "super_admin",
  "admin",
  "provincial_assessor",
  "assistant_provincial_assessor",
];

type LaooUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: "laoo";
  municipality: Municipality | null;
  municipalities: Municipality[];
  laoo_level: number | null;
  is_active: boolean;
  updated_at: string | null;
};

type DraftAssignment = {
  municipalities: Municipality[];
  laoo_level: number | null;
};

const selectClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring";

function getDisplayName(user: LaooUser) {
  return user.full_name?.trim() || user.email;
}

function areMunicipalityListsEqual(a: Municipality[], b: Municipality[]) {
  if (a.length !== b.length) return false;
  return a.every((municipality) => b.includes(municipality));
}

function sortMunicipalities(municipalities: Municipality[]) {
  return MUNICIPALITIES.filter((municipality) => municipalities.includes(municipality));
}

function getMunicipalitySummary(municipalities: Municipality[]) {
  if (municipalities.length === 0) return "Unassigned";
  if (municipalities.length <= 2) {
    return municipalities.map((municipality) => MUNICIPALITY_LABELS[municipality]).join(", ");
  }
  return `${municipalities.length} municipalities`;
}

function toggleMunicipalitySelection(
  municipalities: Municipality[],
  municipality: Municipality,
) {
  return municipalities.includes(municipality)
    ? municipalities.filter((item) => item !== municipality)
    : sortMunicipalities([...municipalities, municipality]);
}

function MunicipalityAssignmentPicker({
  value,
  onChange,
}: {
  value: Municipality[];
  onChange: (municipalities: Municipality[]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-[300px] space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-full justify-between bg-background"
          >
            <span className="truncate">
              {value.length > 0 ? `${value.length} selected` : "Select municipalities"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search municipality..." />
            <div className="flex items-center justify-between border-b px-2 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onChange([...MUNICIPALITIES])}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onChange([])}
                disabled={value.length === 0}
              >
                Clear
              </Button>
            </div>
            <CommandList>
              <CommandEmpty>No municipality found.</CommandEmpty>
              <CommandGroup>
                {MUNICIPALITIES.map((municipality) => {
                  const selected = value.includes(municipality);
                  return (
                    <CommandItem
                      key={municipality}
                      value={MUNICIPALITY_LABELS[municipality]}
                      onSelect={() => onChange(toggleMunicipalitySelection(value, municipality))}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {MUNICIPALITY_LABELS[municipality]}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 ? (
        <div className="flex max-w-[300px] flex-wrap gap-1.5">
          {value.map((municipality) => (
            <Badge
              key={municipality}
              variant="secondary"
              className="max-w-[140px] gap-1 rounded-md px-2 py-1 font-normal"
            >
              <span className="truncate">{MUNICIPALITY_LABELS[municipality]}</span>
              <button
                type="button"
                className="rounded-sm opacity-70 hover:opacity-100"
                onClick={() => onChange(value.filter((item) => item !== municipality))}
                aria-label={`Remove ${MUNICIPALITY_LABELS[municipality]}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">No municipalities assigned</div>
      )}
    </div>
  );
}

function AssignmentRow({
  user,
  draft,
  onDraftChange,
  onSave,
  saving,
}: {
  user: LaooUser;
  draft: DraftAssignment;
  onDraftChange: (id: string, draft: DraftAssignment) => void;
  onSave: (user: LaooUser) => void;
  saving: boolean;
}) {
  const hasChanges =
    !areMunicipalityListsEqual(draft.municipalities, user.municipalities ?? []) ||
    draft.laoo_level !== (user.laoo_level ?? null);

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="align-top pt-6">
        <div className="font-medium">{getDisplayName(user)}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </TableCell>
      <TableCell className="align-top pt-6">
        <select
          className={selectClassName}
          value={draft.laoo_level ?? ""}
          onChange={(event) => {
            const value = event.target.value ? Number(event.target.value) : null;
            onDraftChange(user.id, { ...draft, laoo_level: value });
          }}
        >
          <option value="">Not set</option>
          <option value="1">LAOO 1</option>
          <option value="2">LAOO 2</option>
          <option value="3">LAOO 3</option>
          <option value="4">LAOO 4</option>
        </select>
      </TableCell>
      <TableCell className="align-top pt-6">
        <MunicipalityAssignmentPicker
          value={draft.municipalities}
          onChange={(municipalities) => {
            onDraftChange(user.id, {
              ...draft,
              municipalities,
            });
          }}
        />
      </TableCell>
      <TableCell className="align-top pt-6">
        <Badge variant={user.is_active ? "secondary" : "outline"}>
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right align-top pt-6">
        <Button
          size="sm"
          variant={hasChanges ? "default" : "outline"}
          className="min-w-24"
          onClick={() => onSave(user)}
          disabled={!hasChanges || saving}
          title={hasChanges ? "Save LAOO assignment changes" : "No changes to save"}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Saving" : "Save"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function AssignLaooPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [users, setUsers] = useState<LaooUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftAssignment>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const assignedCount = useMemo(
    () => users.filter((user) => (user.municipalities ?? []).length > 0).length,
    [users]
  );

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/laoo-assignments");
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to load assignments");
      }

      const data = await response.json();
      const nextUsers = (data.users ?? []) as LaooUser[];
      setUsers(nextUsers);
      setDrafts(
        Object.fromEntries(
          nextUsers.map((user) => [
            user.id,
            {
              municipalities: user.municipalities ?? [],
              laoo_level: user.laoo_level ?? null,
            },
          ])
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/user")
      .then((response) => response.json())
      .then((data) => {
        const role = data.user?.role;
        if (!role || !ASSIGNMENT_ROLES.includes(role)) {
          router.replace("/dashboard");
          return;
        }
        setAllowed(true);
      })
      .catch(() => router.replace("/dashboard"))
      .finally(() => setAuthLoading(false));
  }, [router]);

  useEffect(() => {
    if (allowed) loadAssignments();
  }, [allowed, loadAssignments]);

  const handleDraftChange = useCallback((id: string, draft: DraftAssignment) => {
    setDrafts((current) => ({ ...current, [id]: draft }));
  }, []);

  const handleSave = useCallback(
    async (user: LaooUser) => {
      const draft = drafts[user.id];
      if (!draft) return;

      setSavingId(user.id);
      try {
        const response = await fetch("/api/admin/laoo-assignments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            municipalities: draft.municipalities,
            laoo_level: draft.laoo_level,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error ?? "Failed to save assignment");
        }

        const data = await response.json();
        const updatedUser = data.user as LaooUser;
        setUsers((current) =>
          current.map((item) => (item.id === updatedUser.id ? updatedUser : item))
        );
        setDrafts((current) => ({
          ...current,
          [updatedUser.id]: {
            municipalities: updatedUser.municipalities ?? [],
            laoo_level: updatedUser.laoo_level ?? null,
          },
        }));
        toast.success(`${getDisplayName(updatedUser)} assigned to ${getMunicipalitySummary(updatedUser.municipalities ?? [])}.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save assignment.");
      } finally {
        setSavingId(null);
      }
    },
    [drafts]
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Assign LAOO</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-7 w-7 text-muted-foreground" />
                <div>
                  <h1 className="text-2xl font-semibold">Assign LAOO to Municipality</h1>
                  <p className="text-sm text-muted-foreground">
                    Control which municipal submissions each LAOO receives for review.
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={loadAssignments} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total LAOO</CardDescription>
                  <CardTitle>{users.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Assigned</CardDescription>
                  <CardTitle>{assignedCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Unassigned</CardDescription>
                  <CardTitle>{users.length - assignedCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>LAOO Assignments</CardTitle>
                <CardDescription>
                  LAOO users without assigned municipalities will not receive LAOO review queue items.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading assignments
                  </div>
                ) : users.length === 0 ? (
                  <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No LAOO users found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>LAOO</TableHead>
                          <TableHead className="min-w-36">Level</TableHead>
                          <TableHead className="min-w-80">Assigned Municipalities</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="[&_tr:nth-child(even)]:bg-transparent">
                        {users.map((user) => (
                          <AssignmentRow
                            key={user.id}
                            user={user}
                            draft={drafts[user.id] ?? { municipalities: [], laoo_level: null }}
                            onDraftChange={handleDraftChange}
                            onSave={handleSave}
                            saving={savingId === user.id}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

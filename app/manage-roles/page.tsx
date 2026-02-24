"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ShieldCheck,
  Lock,
  Check,
  X,
  Save,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "super_admin" | "admin" | "tax_mapper" | "municipal_tax_mapper" | "accountant" | "user";
type PermissionMap = Record<string, Record<string, boolean>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES: { key: UserRole; label: string; short: string }[] = [
  { key: "super_admin",         label: "Super Admin",           short: "SA"  },
  { key: "admin",               label: "Admin",                 short: "Ad"  },
  { key: "tax_mapper",          label: "Tax Mapper",            short: "TM"  },
  { key: "municipal_tax_mapper",label: "Municipal Tax Mapper",  short: "MTM" },
  { key: "accountant",          label: "Accountant",            short: "Acc" },
  { key: "user",                label: "User",                  short: "Usr" },
];

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  super_admin:          "bg-red-900/40 text-red-300 border-red-700",
  admin:                "bg-blue-900/40 text-blue-300 border-blue-700",
  tax_mapper:           "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  municipal_tax_mapper: "bg-teal-900/40 text-teal-300 border-teal-700",
  accountant:           "bg-purple-900/40 text-purple-300 border-purple-700",
  user:                 "bg-zinc-800 text-zinc-400 border-zinc-600",
};

interface Feature {
  key: string;
  label: string;
  description: string;
}

interface Module {
  label: string;
  color: string;
  features: Feature[];
}

const MODULES: Module[] = [
  {
    label: "Building & Structures",
    color: "bg-sky-900/30 border-sky-700/40 text-sky-300",
    features: [
      { key: "building_structures.view",   label: "View / List", description: "Browse and search building structure records" },
      { key: "building_structures.create", label: "Create",      description: "Submit new building structure entries" },
      { key: "building_structures.edit",   label: "Edit",        description: "Modify existing building structure records" },
      { key: "building_structures.delete", label: "Delete",      description: "Permanently remove building structure records" },
    ],
  },
  {
    label: "Land & Improvements",
    color: "bg-green-900/30 border-green-700/40 text-green-300",
    features: [
      { key: "land_improvements.view",   label: "View / List", description: "Browse and search land improvement records" },
      { key: "land_improvements.create", label: "Create",      description: "Submit new land improvement entries" },
      { key: "land_improvements.edit",   label: "Edit",        description: "Modify existing land improvement records" },
      { key: "land_improvements.delete", label: "Delete",      description: "Permanently remove land improvement records" },
    ],
  },
  {
    label: "Machinery",
    color: "bg-orange-900/30 border-orange-700/40 text-orange-300",
    features: [
      { key: "machinery.view",   label: "View / List", description: "Browse and search machinery records" },
      { key: "machinery.create", label: "Create",      description: "Submit new machinery entries" },
      { key: "machinery.edit",   label: "Edit",        description: "Modify existing machinery records" },
      { key: "machinery.delete", label: "Delete",      description: "Permanently remove machinery records" },
    ],
  },
  {
    label: "Accounting",
    color: "bg-violet-900/30 border-violet-700/40 text-violet-300",
    features: [
      { key: "accounting.view", label: "View", description: "Access the accounting module" },
    ],
  },
  {
    label: "User Management",
    color: "bg-yellow-900/30 border-yellow-700/40 text-yellow-300",
    features: [
      { key: "user_management.view",   label: "View Users",   description: "Browse the user list" },
      { key: "user_management.create", label: "Create Users", description: "Invite and create new user accounts" },
      { key: "user_management.edit",   label: "Edit Users",   description: "Modify user profiles and roles" },
      { key: "user_management.delete", label: "Delete Users", description: "Remove user accounts" },
    ],
  },
  {
    label: "Role Management",
    color: "bg-rose-900/30 border-rose-700/40 text-rose-300",
    features: [
      { key: "role_management.view", label: "View Permissions", description: "See the role permission matrix" },
      { key: "role_management.edit", label: "Edit Permissions", description: "Modify role permission settings" },
    ],
  },
  {
    label: "Dashboard",
    color: "bg-zinc-800/60 border-zinc-600/40 text-zinc-300",
    features: [
      { key: "dashboard.view", label: "View Dashboard", description: "Access the main dashboard and statistics" },
    ],
  },
];

// ─── Toggle Cell ──────────────────────────────────────────────────────────────

function ToggleCell({
  value,
  locked,
  onChange,
}: {
  value: boolean;
  locked: boolean;
  onChange: (v: boolean) => void;
}) {
  if (locked) {
    return (
      <div className="flex items-center justify-center">
        <span
          title="Super Admin always has full access"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-900/30 border border-red-700/50 text-red-400"
        >
          <Lock className="w-3.5 h-3.5" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={[
          "inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors",
          value
            ? "bg-emerald-900/40 border-emerald-600 text-emerald-400 hover:bg-emerald-900/60"
            : "bg-zinc-800 border-zinc-600 text-zinc-600 hover:border-zinc-400 hover:text-zinc-400",
        ].join(" ")}
        title={value ? "Revoke access" : "Grant access"}
      >
        {value ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManageRolesPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [saved, setSaved] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDirty = JSON.stringify(permissions) !== JSON.stringify(saved);

  // Auth guard
  useEffect(() => {
    fetch("/api/auth/user")
      .then((r) => r.json())
      .then((data) => {
        const user = data.user;
        if (!user || user.role !== "super_admin") {
          router.replace("/dashboard");
        } else {
          setCurrentUser(user);
        }
      })
      .catch(() => router.replace("/dashboard"))
      .finally(() => setAuthLoading(false));
  }, [router]);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/role-permissions");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions ?? {});
        setSaved(data.permissions ?? {});
      } else {
        toast.error("Failed to load permissions.");
      }
    } catch {
      toast.error("Error loading permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchPermissions();
  }, [currentUser, fetchPermissions]);

  const toggle = useCallback((role: string, feature: string, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] ?? {}),
        [feature]: value,
      },
    }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/role-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });
      if (res.ok) {
        setSaved(JSON.parse(JSON.stringify(permissions)));
        toast.success("Permissions saved successfully.");
      } else {
        const err = await res.json();
        const detail = err.hint ? `${err.error} — ${err.hint}` : (err.error ?? "Failed to save permissions.");
        toast.error(detail);
      }
    } catch {
      toast.error("Error saving permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPermissions(JSON.parse(JSON.stringify(saved)));
  };

  // ── Loading / auth states ─────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!currentUser) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="dark">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-800 px-4 bg-zinc-900">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Manage Roles</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-zinc-950 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">

              {/* Page title */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h1 className="text-2xl font-semibold">Role Access Management</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Configure which roles have access to each feature. Changes take effect immediately after saving.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isDirty && (
                    <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
                      Discard
                    </Button>
                  )}
                  <Button size="sm" onClick={handleSave} disabled={saving || !isDirty}>
                    {saving
                      ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>

              {/* Unsaved changes banner */}
              {isDirty && (
                <div className="flex items-center gap-2 rounded-md border border-yellow-700/50 bg-yellow-900/20 px-4 py-2.5 text-sm text-yellow-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  You have unsaved changes. Click <strong className="mx-1">Save Changes</strong> to apply them.
                </div>
              )}

              {/* Info note */}
              <div className="flex items-start gap-2 rounded-md border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200">Super Admin</strong> always has full access to all features and cannot be restricted.
                  The lock icon (<Lock className="inline h-3 w-3 mx-0.5" />) indicates a permission that is permanently enabled.
                </span>
              </div>

              {/* Permission Matrix */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Permission Matrix</CardTitle>
                  <CardDescription>
                    Click a cell to grant (<Check className="inline h-3 w-3 text-emerald-400" />) or revoke (<X className="inline h-3 w-3 text-zinc-500" />) access for that role.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-24">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        {/* Sticky column headers */}
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="text-left px-4 py-3 font-medium text-zinc-400 w-72 min-w-64">
                              Feature
                            </th>
                            {ROLES.map((r) => (
                              <th
                                key={r.key}
                                className="px-2 py-3 text-center font-medium w-24 min-w-20"
                              >
                                <span
                                  className={[
                                    "inline-block px-2 py-0.5 rounded-full text-xs border whitespace-nowrap",
                                    ROLE_BADGE_COLORS[r.key],
                                  ].join(" ")}
                                  title={r.label}
                                >
                                  {r.label}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {MODULES.map((mod) => (
                            <React.Fragment key={mod.label}>
                              {/* Module header row */}
                              <tr className="border-b border-zinc-800/60">
                                <td
                                  colSpan={ROLES.length + 1}
                                  className={[
                                    "px-4 py-2 text-xs font-semibold tracking-wide uppercase border-l-4",
                                    mod.color,
                                  ].join(" ")}
                                >
                                  {mod.label}
                                </td>
                              </tr>

                              {/* Feature rows */}
                              {mod.features.map((feat, fi) => (
                                <tr
                                  key={feat.key}
                                  className={[
                                    "border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors",
                                    fi === mod.features.length - 1 ? "border-b-zinc-800" : "",
                                  ].join(" ")}
                                >
                                  {/* Feature label + description */}
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-zinc-200">{feat.label}</div>
                                    <div className="text-xs text-zinc-500 mt-0.5">{feat.description}</div>
                                  </td>

                                  {/* Toggle cells for each role */}
                                  {ROLES.map((r) => (
                                    <td key={r.key} className="px-2 py-3">
                                      <ToggleCell
                                        value={permissions[r.key]?.[feat.key] ?? false}
                                        locked={r.key === "super_admin"}
                                        onChange={(v) => toggle(r.key, feat.key, v)}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Role summary cards */}
              {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {ROLES.map((r) => {
                    const rolePerms = permissions[r.key] ?? {};
                    const granted = Object.values(rolePerms).filter(Boolean).length;
                    const total = MODULES.reduce((sum, m) => sum + m.features.length, 0);
                    return (
                      <Card key={r.key} className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-3 text-center space-y-1">
                          <span
                            className={[
                              "inline-block px-2 py-0.5 rounded-full text-xs border",
                              ROLE_BADGE_COLORS[r.key],
                            ].join(" ")}
                          >
                            {r.label}
                          </span>
                          <div className="text-xl font-bold text-zinc-100">
                            {r.key === "super_admin" ? total : granted}
                            <span className="text-sm font-normal text-zinc-500">/{total}</span>
                          </div>
                          <div className="text-xs text-zinc-500">
                            {r.key === "super_admin" ? "All access" : "permissions"}
                          </div>
                          {r.key !== "super_admin" && (
                            <div className="w-full bg-zinc-800 rounded-full h-1 mt-1">
                              <div
                                className="bg-emerald-500 h-1 rounded-full transition-all"
                                style={{ width: `${Math.round((granted / total) * 100)}%` }}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

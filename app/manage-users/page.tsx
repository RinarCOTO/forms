"use client";

import { useState, useEffect, useCallback } from "react";
import "./manage-users-invert.css";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2, Users, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { User, UserRole, Municipality, CreateUserData, UpdateUserData } from "@/app/types/user";
import { MUNICIPALITIES, MUNICIPALITY_LABELS } from "@/app/types/user";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  tax_mapper: "Tax Mapper",
  municipal_tax_mapper: "Municipal Tax Mapper",
  accountant: "Accountant",
  user: "User",
};

const ROLE_OPTIONS: UserRole[] = [
  "super_admin",
  "admin",
  "tax_mapper",
  "municipal_tax_mapper",
  "accountant",
  "user",
];

function getRoleBadgeVariant(role: UserRole) {
  switch (role) {
    case "super_admin":
      return "destructive";
    case "admin":
      return "default";
    default:
      return "secondary";
  }
}

// ─── Edit User Dialog ──────────────────────────────────────────────────────────

interface EditDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateUserData) => Promise<void>;
}

function MunicipalitySelect({
  value,
  onChange,
}: {
  value: Municipality | null | undefined;
  onChange: (v: Municipality | null) => void;
}) {
  return (
    <select
      className="w-full border border-zinc-700 rounded-md px-3 py-2 text-sm bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
      value={value ?? ""}
      onChange={(e) => onChange((e.target.value as Municipality) || null)}
    >
      <option value="">— No municipality —</option>
      {MUNICIPALITIES.map((m) => (
        <option key={m} value={m}>
          {MUNICIPALITY_LABELS[m]}
        </option>
      ))}
    </select>
  );
}

function EditUserDialog({ user, open, onClose, onSave }: EditDialogProps) {
  const [form, setForm] = useState<UpdateUserData>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name ?? "",
        role: user.role,
        municipality: user.municipality ?? null,
        department: user.department ?? "",
        position: user.position ?? "",
        phone: user.phone ?? "",
        is_active: user.is_active,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await onSave(user.id, form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="dark sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input
              value={form.full_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <select
              className="w-full border border-zinc-700 rounded-md px-3 py-2 text-sm bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              value={form.role ?? "user"}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Municipality</Label>
            <MunicipalitySelect
              value={form.municipality}
              onChange={(v) => setForm((f) => ({ ...f, municipality: v }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Department</Label>
            <Input
              value={form.department ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              placeholder="Department"
            />
          </div>
          <div className="space-y-1">
            <Label>Position</Label>
            <Input
              value={form.position ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              placeholder="Position"
            />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input
              value={form.phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone number"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active ?? true}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active">Active account</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create User Dialog ────────────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateUserData) => Promise<void>;
}

function CreateUserDialog({ open, onClose, onCreate }: CreateDialogProps) {
  const [form, setForm] = useState<CreateUserData & { confirmPassword: string }>({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    role: "user",
    municipality: null,
    department: "",
    position: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setError("");
    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      const { confirmPassword, ...data } = form;
      await onCreate(data);
      onClose();
      setForm({ email: "", password: "", confirmPassword: "", full_name: "", role: "user", municipality: null, department: "", position: "", phone: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="dark sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input
              value={form.full_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1">
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label>Password *</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1">
            <Label>Confirm Password *</Label>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <select
              className="w-full border border-zinc-700 rounded-md px-3 py-2 text-sm bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              value={form.role ?? "user"}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Municipality</Label>
            <MunicipalitySelect
              value={form.municipality}
              onChange={(v) => setForm((f) => ({ ...f, municipality: v }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Department</Label>
              <Input
                value={form.department ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="Department"
              />
            </div>
            <div className="space-y-1">
              <Label>Position</Label>
              <Input
                value={form.position ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                placeholder="Position"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input
              value={form.phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone number"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ManageUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
      } else {
        toast.error("Failed to load users.");
      }
    } catch {
      toast.error("Error loading users.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchUsers();
  }, [currentUser, fetchUsers]);

  const handleSave = useCallback(async (id: string, data: UpdateUserData) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to update user.");
      throw new Error(err.error);
    }
    toast.success("User updated successfully.");
    await fetchUsers();
  }, [fetchUsers]);

  const handleCreate = useCallback(async (data: CreateUserData) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to create user.");
      throw new Error(err.error);
    }
    toast.success("User created successfully.");
    await fetchUsers();
  }, [fetchUsers]);

  const handleDelete = useCallback(async (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted.");
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Failed to delete user.");
      }
    } catch {
      toast.error("Error deleting user.");
    } finally {
      setDeletingId(null);
    }
  }, []);

  if (authLoading) {
    return (
      <div className="dark manage-users-dark min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="dark manage-users-dark">
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
                <BreadcrumbPage>Manage Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-zinc-950">
          <div className="max-w-6xl mx-auto">
            {/* Page title + action */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-muted-foreground" />
                <div>
                  <h1 className="text-2xl font-semibold">Manage Users</h1>
                  <p className="text-sm text-muted-foreground">
                    View and manage all system accounts
                  </p>
                </div>
              </div>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>User Accounts</CardTitle>
                </div>
                <CardDescription>
                  {users.length} user{users.length !== 1 ? "s" : ""} registered in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No users found</h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by creating the first user account.
                    </p>
                    <Button onClick={() => setCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Municipality</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">
                              {u.full_name ?? <span className="text-muted-foreground italic">—</span>}
                            </TableCell>
                            <TableCell className="text-sm">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(u.role)}>
                                {ROLE_LABELS[u.role]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {u.municipality
                                ? <Badge variant="outline">{MUNICIPALITY_LABELS[u.municipality]}</Badge>
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-sm">
                              {u.department ?? <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-sm">
                              {u.position ?? <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.is_active ? "default" : "secondary"}>
                                {u.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(u.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditTarget(u)}
                                  disabled={deletingId === u.id}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                {currentUser.id !== u.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(u.id, u.full_name ?? u.email)}
                                    disabled={deletingId === u.id}
                                  >
                                    {deletingId === u.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 mr-1" />
                                    )}
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Dialogs */}
      <EditUserDialog
        user={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
      />
      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </SidebarProvider>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ─── Realtime toggle ────────────────────────────────────────────────────────
// Set to `true` when the app goes to production to enable live updates.
// Keep `false` during development to avoid unnecessary Supabase connections.
const REALTIME_ENABLED = false;
// ────────────────────────────────────────────────────────────────────────────

type FormType = "building" | "land";

interface ReviewItem {
  id: number;
  owner_name?: string | null;
  status: string;
  municipality?: string | null;
  location_municipality?: string | null;
  location_barangay?: string | null;
  updated_at: string;
  submitted_at?: string | null;
  form_type: FormType;
  form_label: string;
  review_comment?: string | null;
}

const STATUS_FILTERS = [
  { value: "pending", label: "Pending Review", statuses: ["submitted", "under_review"] },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "returned", label: "Returned for Review" },
] as const;

const FORM_TYPE_FILTERS = [
  { value: "all", label: "All Form Types" },
  { value: "building", label: "Building & Structure" },
  { value: "land", label: "Land Improvement" },
] as const;

const PAGE_SIZE = 12;

function getStatusVariant(status: string) {
  switch (status) {
    case "approved":    return "success" as const;
    case "submitted":   return "warning" as const;
    case "under_review":return "default" as const;
    case "returned":    return "destructive" as const;
    default:            return "secondary" as const;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "under_review": return "Under Review";
    case "returned":     return "Returned for Review";
    case "submitted":    return "Submitted";
    case "approved":     return "Approved";
    case "draft":        return "Draft";
    default:             return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReviewQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [formTypeFilter, setFormTypeFilter] = useState<string>("all");
  const [municipalityFilter, setMunicipalityFilter] = useState<string>("all");

  // Review action dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "return" | "review" | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (formTypeFilter !== "all") params.set("form_type", formTypeFilter);
      // For "pending" we let the API return submitted + under_review (its default)
      if (statusFilter !== "pending") params.set("status", statusFilter);

      const res = await fetch(`/api/review-queue?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to load review queue.");
        setItems([]);
        return;
      }
      const json = await res.json();
      setItems(json.data ?? []);
      setCurrentPage(1);
    } catch {
      toast.error("Error loading review queue.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [formTypeFilter, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── Supabase Realtime ── (disabled until REALTIME_ENABLED = true)
  useEffect(() => {
    if (!REALTIME_ENABLED) return;

    const supabase = createSupabaseClient();
    const channel = supabase
      .channel("review-queue-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "building_structures" },
        () => { fetchItems(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "land_improvements" },
        () => { fetchItems(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchItems]);

  // Unique municipalities for filter
  const uniqueMunicipalities = [
    ...new Set(
      items
        .map((i) => i.location_municipality || i.municipality)
        .filter(Boolean) as string[]
    ),
  ].sort();

  const filteredItems = items.filter((item) => {
    if (municipalityFilter === "all") return true;
    const muni = item.location_municipality || item.municipality;
    return muni === municipalityFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginated = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openDialog = (action: "approve" | "return" | "review", item: ReviewItem) => {
    setDialogAction(action);
    setSelectedItem(item);
    setReviewComment(item.review_comment || "");
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedItem || !dialogAction) return;
    setActionLoading(true);

    const actionMap = { approve: "approve", return: "return", review: "claim" } as const;
    const action = actionMap[dialogAction];

    try {
      // Save return reason as a general comment first
      if (dialogAction === "return" && reviewComment.trim()) {
        if (selectedItem.form_type === "building") {
          await fetch(`/api/building-other-structure/${selectedItem.id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment_text: reviewComment.trim() }),
          });
        }
      }

      // Status transition
      const apiBase =
        selectedItem.form_type === "building"
          ? `/api/building-other-structure/${selectedItem.id}/review`
          : `/api/building-other-structure/${selectedItem.id}/review`; // TODO: land route

      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: reviewComment || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Action failed.");
        return;
      }

      const labels = { approve: "Approved", return: "Returned for Review", review: "Under Review" };
      toast.success(`Form marked as "${labels[dialogAction]}" successfully.`);
      setDialogOpen(false);
      setSelectedItem(null);
      setReviewComment("");
      await fetchItems();
    } catch {
      toast.error("Error performing action.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleView = (item: ReviewItem) => {
    router.push(`/review-queue/${item.id}?type=${item.form_type}`);
  };

  const pendingCount = items.filter((i) =>
    ["submitted", "under_review"].includes(i.status)
  ).length;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Review Queue</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Page body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* Summary card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Review</CardDescription>
                <CardTitle className="text-3xl">{pendingCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Forms awaiting LAOO action</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Loaded</CardDescription>
                <CardTitle className="text-3xl">{filteredItems.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">After applying current filters</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Municipalities</CardDescription>
                <CardTitle className="text-3xl">{uniqueMunicipalities.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Represented in this view</p>
              </CardContent>
            </Card>
          </div>

          {/* Main table card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Review Queue
                  </CardTitle>
                  <CardDescription>
                    Review submitted RPFAAS forms, set them under review, approve or return them.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 pt-2">
                {/* Status filter */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v: string) => { setStatusFilter(v); setCurrentPage(1); }}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FILTERS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Form type filter */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Form Type</Label>
                  <Select
                    value={formTypeFilter}
                    onValueChange={(v: string) => { setFormTypeFilter(v); setCurrentPage(1); }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORM_TYPE_FILTERS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Municipality filter */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Municipality</Label>
                  <Select
                    value={municipalityFilter}
                    onValueChange={(v: string) => { setMunicipalityFilter(v); setCurrentPage(1); }}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Municipalities</SelectItem>
                      {uniqueMunicipalities.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading…</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <ClipboardList className="h-12 w-12 opacity-30" />
                  <p className="text-sm">No forms match the current filters.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Owner / Title</TableHead>
                        <TableHead>Form Type</TableHead>
                        <TableHead>Municipality</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((item) => {
                        const muni = item.location_municipality || item.municipality;
                        return (
                          <TableRow key={`${item.form_type}-${item.id}`}>
                            <TableCell className="font-medium">
                              {item.owner_name || <span className="text-muted-foreground italic">No owner</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.form_label}</Badge>
                            </TableCell>
                            <TableCell>
                              {muni
                                ? muni.charAt(0).toUpperCase() + muni.slice(1)
                                : <span className="text-muted-foreground">—</span>
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(item.status)}>
                                {getStatusLabel(item.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(item.submitted_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleView(item)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Form
                                  </DropdownMenuItem>
                                  {item.status === "submitted" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openDialog("review", item)}
                                        className="text-blue-600 focus:text-blue-600"
                                      >
                                        <ClipboardList className="mr-2 h-4 w-4" />
                                        Mark as Under Review
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {["submitted", "under_review"].includes(item.status) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openDialog("approve", item)}
                                        className="text-green-600 focus:text-green-600"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => openDialog("return", item)}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Return for Revision
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} &nbsp;·&nbsp; {filteredItems.length} records
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogAction === "approve"
                  ? "Approve Form"
                  : dialogAction === "return"
                  ? "Return for Revision"
                  : "Mark as Under Review"}
              </DialogTitle>
              <DialogDescription>
                {dialogAction === "approve"
                  ? "Approving this form will mark it as officially reviewed and approved."
                  : dialogAction === "return"
                  ? "Returning this form will notify the encoder to make corrections."
                  : "Marking this form as 'Under Review' signals you have started your evaluation."}
              </DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-4 py-2">
                <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                  <p>
                    <span className="font-medium">Owner: </span>
                    {selectedItem.owner_name || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Type: </span>
                    {selectedItem.form_label}
                  </p>
                  <p>
                    <span className="font-medium">Status: </span>
                    <Badge variant={getStatusVariant(selectedItem.status)} className="ml-1">
                      {getStatusLabel(selectedItem.status)}
                    </Badge>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-comment">
                    {dialogAction === "return" ? "Return Reason (required)" : "Comment (optional)"}
                  </Label>
                  <Textarea
                    id="review-comment"
                    placeholder={
                      dialogAction === "return"
                        ? "Explain what needs to be corrected…"
                        : "Add an optional note…"
                    }
                    value={reviewComment}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewComment(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={dialogAction === "approve" ? "default" : dialogAction === "return" ? "destructive" : "secondary"}
                onClick={handleAction}
                disabled={
                  actionLoading ||
                  (dialogAction === "return" && !reviewComment.trim())
                }
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                {dialogAction === "approve"
                  ? "Approve"
                  : dialogAction === "return"
                  ? "Return"
                  : "Mark as Under Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

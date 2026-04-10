"use client";

import { useState, useEffect, useCallback, use, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, ArrowLeft, CheckCircle, RotateCcw,
  MessageSquare, Send, User, Clock, UserCheck,
} from "lucide-react";
import ReviewFormInline from "./ReviewFormInline";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FormRecord {
  id: number;
  status: string;
  submitted_at?: string | null;
  [key: string]: unknown;
}

interface Comment {
  id: string;
  field_name?: string | null;
  comment_text: string;
  suggested_value?: string | null;
  author_id: string;
  author_name: string;
  author_role: string;
  parent_id?: string | null;
  is_resolved: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_STYLE: Record<string, string> = {
  submitted:             "bg-yellow-100 text-yellow-800 border-yellow-300",
  under_review:          "bg-blue-100 text-blue-800 border-blue-300",
  municipal_signed:      "bg-blue-100 text-blue-800 border-blue-300",
  laoo_approved:         "bg-indigo-100 text-indigo-800 border-indigo-300",
  returned:              "bg-orange-100 text-orange-800 border-orange-300",
  returned_to_municipal: "bg-orange-100 text-orange-800 border-orange-300",
  approved:              "bg-green-100 text-green-800 border-green-300",
};
const STATUS_LABEL: Record<string, string> = {
  submitted:             "Submitted — Awaiting Municipal Review",
  under_review:          "Under Review",
  municipal_signed:      "Municipal Signed — Awaiting LAOO Review",
  laoo_approved:         "LAOO Approved — Awaiting Provincial Sign",
  returned:              "Returned to Tax Mapper",
  returned_to_municipal: "Returned to Municipal Assessor",
  approved:              "Approved",
};

const LAOO_TIER = new Set(["laoo", "assistant_provincial_assessor", "provincial_assessor"]);
const MUNICIPAL_AUTHOR_ROLES = new Set(["municipal_tax_mapper", "municipal_assessor"]);

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function dayKey(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function fmtDayHeader(key: string) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Field options for comment targeting
// ---------------------------------------------------------------------------
const FIELD_OPTIONS = [
  { value: "arp_no",                label: "ARP No.",                 group: "Property Identification" },
  { value: "oct_tct_cloa_no",       label: "OCT/TCT/CLOA No.",        group: "Property Identification" },
  { value: "survey_no",             label: "Survey No.",              group: "Property Identification" },
  { value: "pin",                   label: "PIN",                     group: "Property Identification" },
  { value: "lot_no",                label: "Lot No.",                 group: "Property Identification" },
  { value: "owner_name",            label: "Owner Name",              group: "Owner & Location" },
  { value: "admin_care_of",         label: "Admin / Care Of",         group: "Owner & Location" },
  { value: "owner_address",         label: "Owner Address",           group: "Owner & Location" },
  { value: "location_province",     label: "Province",                group: "Owner & Location" },
  { value: "location_municipality", label: "Municipality",            group: "Owner & Location" },
  { value: "location_barangay",     label: "Barangay",                group: "Owner & Location" },
  { value: "type_of_building",      label: "Type of Building",        group: "Building Details" },
  { value: "structure_type",        label: "Structure Type",          group: "Building Details" },
  { value: "building_permit_no",    label: "Building Permit No",      group: "Building Details" },
  { value: "cct",                   label: "CCT",                     group: "Building Details" },
  { value: "completion_issued_on",  label: "Completion Date",         group: "Building Details" },
  { value: "date_constructed",      label: "Date Constructed",        group: "Building Details" },
  { value: "date_occupied",         label: "Date Occupied",           group: "Building Details" },
  { value: "building_age",          label: "Building Age",            group: "Building Details" },
  { value: "number_of_storeys",     label: "No. of Storeys",          group: "Building Details" },
  { value: "total_floor_area",      label: "Total Floor Area",        group: "Building Details" },
  { value: "unit_cost",             label: "Unit Cost",               group: "Building Details" },
  { value: "land_owner",            label: "Land Owner",              group: "Building Details" },
  { value: "td_arp_no",             label: "Land TD/ARP No.",         group: "Building Details" },
  { value: "land_area",             label: "Land Area",               group: "Building Details" },
  { value: "roofing_material",      label: "Roofing Material",        group: "Structural Materials" },
  { value: "flooring_material",     label: "Flooring Material",       group: "Structural Materials" },
  { value: "wall_material",         label: "Wall Material",           group: "Structural Materials" },
  { value: "selected_deductions",   label: "Standard Deductions",     group: "Deductions & Financial" },
  { value: "market_value",          label: "Market Value",            group: "Deductions & Financial" },
  { value: "actual_use",            label: "Actual Use",              group: "Assessment" },
  { value: "assessment_level",      label: "Assessment Level",        group: "Assessment" },
  { value: "assessed_value",        label: "Assessed Value",          group: "Assessment" },
  { value: "amount_in_words",       label: "Amount in Words",         group: "Assessment" },
] as const;

function fieldLabel(value: string): string {
  return (FIELD_OPTIONS as readonly { value: string; label: string }[]).find(f => f.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// Inner page
// ---------------------------------------------------------------------------
function ReviewDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formType = (searchParams.get("type") ?? "building") as "building" | "land";

  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; municipality?: string } | null>(null);
  const [record, setRecord] = useState<FormRecord | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Tax mapper assignment
  const [taxMappers, setTaxMappers] = useState<{ id: string; full_name: string }[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Comment form
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const commentPanelRef = useRef<HTMLDivElement>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth — use permissions endpoint for real app role
  useEffect(() => {
    fetch("/api/users/permissions")
      .then(r => r.json())
      .then(data => {
        const allowed = ["municipal_tax_mapper", "municipal_assessor", "laoo", "assistant_provincial_assessor", "provincial_assessor", "admin", "super_admin"];
        if (!data?.role || !allowed.includes(data.role)) router.replace("/dashboard");
        else setCurrentUser({ id: data.id ?? "", role: data.role, municipality: data.municipality ?? undefined });
      })
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  const apiBase = formType === "building"
    ? `/api/faas/building-structures/${id}`
    : `/api/faas/land-improvements/${id}`;

  // Load form status + comments
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [formRes, commentRes] = await Promise.all([
        fetch(apiBase),
        fetch(`${apiBase}/comments`),
      ]);
      if (formRes.ok) {
        const json = await formRes.json();
        setRecord(json.data ?? null);
        setAssignedTo(json.data?.assigned_to ?? "");
      } else {
        toast.error("Could not load form.");
      }
      if (commentRes.ok) {
        const json = await commentRes.json();
        setComments(json.data ?? []);
      }
    } catch {
      toast.error("Error loading data.");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    if (currentUser) loadData();
  }, [currentUser, loadData]);

  // Load tax mappers for assignment (only for municipal-tier reviewers)
  useEffect(() => {
    if (!currentUser) return;
    const MUNICIPAL_REVIEWER_ROLES = ['municipal_tax_mapper', 'municipal_assessor', 'admin', 'super_admin'];
    if (!MUNICIPAL_REVIEWER_ROLES.includes(currentUser.role)) return;
    const municipality = (record as any)?.location_municipality;
    const params = municipality ? `&municipality=${encodeURIComponent(municipality)}` : '';
    const url = `/api/users/by-role?role=municipal_tax_mapper,municipal_assessor${params}`;

    fetch(url)
      .then(r => r.json())
      .then(d => setTaxMappers(d.users ?? []))
      .catch(() => {});
  }, [currentUser, record]);

  const handleAssign = useCallback(async (userId: string) => {
    setAssignLoading(true);
    try {
      const res = await fetch(`${apiBase}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: userId || null }),
      });
      if (!res.ok) throw new Error();
      setAssignedTo(userId);
      toast.success(userId ? "Tax mapper assigned." : "Assignment cleared.");
    } catch {
      toast.error("Failed to update assignment.");
    } finally {
      setAssignLoading(false);
    }
  }, [apiBase]);

  // ── Review actions ──────────────────────────────────────────────────────────
  type ReviewAction = 'sign_forward' | 'return_to_mapper' | 'laoo_approve' | 'laoo_return' | 'sign_approve' | 'provincial_return';

  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnNote, setReturnNote] = useState("");

  const doAction = useCallback(async (action: ReviewAction) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiBase}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Action failed.");
        return;
      }
      toast.success("Action completed successfully.");
      await loadData();
    } catch {
      toast.error("Error performing action.");
    } finally {
      setActionLoading(false);
    }
  }, [apiBase, loadData]);

  const handleReturn = useCallback(async (action: ReviewAction) => {
    if (!returnNote.trim()) { toast.error("A reason is required."); return; }
    setActionLoading(true);
    try {
      await fetch(`${apiBase}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_text: returnNote.trim() }),
      });
      const res = await fetch(`${apiBase}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: returnNote.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Action failed.");
        return;
      }
      toast.success("Form returned successfully.");
      setReturnDialogOpen(false);
      setReturnNote("");
      await loadData();
    } catch {
      toast.error("Error performing action.");
    } finally {
      setActionLoading(false);
    }
  }, [apiBase, returnNote, loadData]);

  // ── Submit comment ──────────────────────────────────────────────────────────
  const submitComment = useCallback(async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`${apiBase}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_name: selectedFields.length > 0 ? selectedFields.join(",") : null,
          comment_text: commentText.trim(),
          suggested_value: suggestedValue.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Comment posted.");
      setCommentText("");
      setSuggestedValue("");
      setSelectedFields([]);
      await loadData();
    } catch {
      toast.error("Error posting comment.");
    } finally {
      setSubmittingComment(false);
    }
  }, [apiBase, selectedFields, commentText, suggestedValue, loadData]);

  // Called when a section's comment button is clicked in ReviewFormInline
  const onCommentSection = useCallback((fields: string[]) => {
    setSelectedFields(fields);
    setShowFieldPicker(false); // keep picker closed; fields are pre-selected
    // Scroll comment panel into view and focus the textarea
    setTimeout(() => {
      commentPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      commentTextareaRef.current?.focus();
    }, 50);
  }, []);

  // Click a comment in the sidebar → highlight the matching field in the inline form
  const focusField = useCallback((comment: Comment) => {
    setActiveCommentId(comment.id);
    const fields = comment.field_name
      ? comment.field_name.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    if (!fields.length) return;
    const el = document.querySelector(`[data-comment-field="${fields[0]}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("laoo-field-focused");
    setTimeout(() => el.classList.remove("laoo-field-focused"), 2000);
  }, []);

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Form not found.</p>
      </div>
    );
  }

  const userRole = currentUser.role;
  const isReviewer = ["municipal_tax_mapper", "municipal_assessor", "laoo", "assistant_provincial_assessor", "provincial_assessor", "admin", "super_admin"]
    .includes(userRole);

  const MUNICIPAL_ROLES_LOCAL  = ['municipal_tax_mapper', 'municipal_assessor', 'admin', 'super_admin'];
  const LAOO_ROLES_LOCAL       = ['laoo', 'admin', 'super_admin'];
  const PROVINCIAL_ROLES_LOCAL = ['assistant_provincial_assessor', 'provincial_assessor', 'admin', 'super_admin'];

  const canMunicipalAct  = MUNICIPAL_ROLES_LOCAL.includes(userRole) && ['submitted', 'returned_to_municipal'].includes(record.status);
  const canLaooAct       = LAOO_ROLES_LOCAL.includes(userRole) && record.status === 'municipal_signed';
  const canProvincialAct = PROVINCIAL_ROLES_LOCAL.includes(userRole) && record.status === 'laoo_approved';

  const returnAction: ReviewAction = canMunicipalAct ? 'return_to_mapper' : canLaooAct ? 'laoo_return' : 'provincial_return';

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/review-queue">Review Queue</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Form #{id}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Top bar: back + actions + status */}
          <div className="px-6 pt-4 pb-3 border-b space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/review-queue")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Queue
              </Button>
              <div className="flex gap-2 flex-wrap">
                {canMunicipalAct && (
                  <>
                    <Button onClick={() => doAction('sign_forward')} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Approve & Forward to LAOO
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setReturnDialogOpen(true)}
                      disabled={actionLoading || !assignedTo}
                      title={!assignedTo ? "Select an appraiser first" : undefined}
                      className="text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-40"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {assignedTo
                        ? `Return to ${taxMappers.find(u => u.id === assignedTo)?.full_name ?? "Mapper"}`
                        : "Return to Mapper"}
                    </Button>
                  </>
                )}
                {canLaooAct && (
                  <>
                    <Button onClick={() => doAction('laoo_approve')} disabled={actionLoading} className="bg-green-600 hover:bg-green-700 text-white">
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Approve & Forward
                    </Button>
                    <Button variant="outline" onClick={() => setReturnDialogOpen(true)} disabled={actionLoading} className="text-red-600 border-red-300 hover:bg-red-50">
                      <RotateCcw className="h-4 w-4 mr-1" /> Return to Municipal
                    </Button>
                  </>
                )}
                {canProvincialAct && (
                  <>
                    <Button onClick={() => doAction('sign_approve')} disabled={actionLoading} className="bg-green-600 hover:bg-green-700 text-white">
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => setReturnDialogOpen(true)} disabled={actionLoading} className="text-red-600 border-red-300 hover:bg-red-50">
                      <RotateCcw className="h-4 w-4 mr-1" /> Return to Municipal
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${STATUS_STYLE[record.status] ?? "bg-muted"}`}>
              <span>{STATUS_LABEL[record.status] ?? record.status}</span>
              {record.submitted_at && (
                <span className="ml-auto text-xs font-normal opacity-70">
                  Submitted {fmtDate(record.submitted_at)}
                </span>
              )}
            </div>

            {/* Appraised/Assessed By — only shown to municipal-tier reviewers */}
            {canMunicipalAct && taxMappers.length > 0 && (
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground shrink-0">Appraised / Assessed By:</span>
                <Select
                  value={assignedTo || "none"}
                  onValueChange={v => handleAssign(v === "none" ? "" : v)}
                  disabled={assignLoading}
                >
                  <SelectTrigger className="w-56 h-8 text-sm">
                    <SelectValue placeholder="Select tax mapper…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Not selected —</SelectItem>
                    {taxMappers.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!assignedTo && (
                  <span className="text-xs text-amber-600">Required before returning</span>
                )}
              </div>
            )}
          </div>

          {/* Main: form iframe + comments sidebar */}
          <div className="flex flex-1 overflow-hidden">

            {/* Inline form view */}
            <div className="flex-1 overflow-auto bg-[#f3f4f6]">
              {record && (
                <ReviewFormInline
                  serverData={record as Record<string, any>}
                  comments={comments.filter(c => {
                    if (!currentUser) return true;
                    if (LAOO_TIER.has(currentUser.role) && c.author_role && MUNICIPAL_AUTHOR_ROLES.has(c.author_role)) return false;
                    return true;
                  })}
                  onCommentSection={onCommentSection}
                />
              )}
            </div>

            {/* Comments sidebar */}
            <div className="w-80 shrink-0 border-l overflow-y-auto bg-white" ref={commentPanelRef}>
              <div className="p-4 space-y-4">

                {/* Comment list */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments
                      {comments.length > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">({comments.length})</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                    ) : (() => {
                      const responseMap = new Map<string, Comment[]>();
                      comments.filter(c => c.parent_id).forEach(c => {
                        if (!responseMap.has(c.parent_id!)) responseMap.set(c.parent_id!, []);
                        responseMap.get(c.parent_id!)!.push(c);
                      });
                      const topLevel = comments
                        .filter(c => {
                          if (c.parent_id) return false;
                          if (currentUser && LAOO_TIER.has(currentUser.role) && c.author_role && MUNICIPAL_AUTHOR_ROLES.has(c.author_role)) return false;
                          return true;
                        })
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                      // Group by day
                      const grouped: { day: string; items: Comment[] }[] = [];
                      for (const c of topLevel) {
                        const key = dayKey(c.created_at);
                        const last = grouped[grouped.length - 1];
                        if (last?.day === key) last.items.push(c);
                        else grouped.push({ day: key, items: [c] });
                      }

                      return (
                        <div className="space-y-1">
                          {grouped.map(({ day, items }) => (
                            <div key={day}>
                              <div className="sticky top-0 z-10 bg-white py-1 mb-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                                  {fmtDayHeader(day)}
                                </p>
                              </div>
                              <div className="space-y-3">
                                {items.map(c => {
                                  const fields = c.field_name
                                    ? c.field_name.split(",").map(s => s.trim()).filter(Boolean)
                                    : [];
                                  const responses = responseMap.get(c.id) ?? [];
                                  const isActive = activeCommentId === c.id;
                                  return (
                                    <div
                                      key={c.id}
                                      onClick={() => focusField(c)}
                                      className={`rounded-lg border p-3 text-sm space-y-1 cursor-pointer transition-colors
                                        ${isActive ? "border-amber-400 bg-amber-50" : "bg-muted/40 hover:bg-muted/70"}`}
                                    >
                                      {fields.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {fields.map(f => (
                                            <span key={f} className="text-xs font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                                              {fieldLabel(f)}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <p>{c.comment_text}</p>
                                      {c.suggested_value && (
                                        <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                                          Suggested: {c.suggested_value}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                        <User className="h-3 w-3" />
                                        <span>{c.author_name}</span>
                                        <Clock className="h-3 w-3 ml-1" />
                                        <span>{fmtDate(c.created_at)}</span>
                                      </div>
                                      {responses.map(r => (
                                        <div key={r.id} className="mt-2 ml-2 border-l-2 border-green-400 pl-2 space-y-0.5 bg-green-50/60 rounded-r py-1">
                                          <p className="text-xs font-semibold text-green-700">Tax Mapper Response</p>
                                          <p className="text-xs text-foreground">{r.comment_text}</p>
                                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            <span>{r.author_name}</span>
                                            <Clock className="h-3 w-3 ml-1" />
                                            <span>{fmtDate(r.created_at)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Add comment */}
                {isReviewer && ["submitted", "municipal_signed", "laoo_approved", "returned_to_municipal"].includes(record.status) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Add Comment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedFields.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedFields.map(f => (
                            <span key={f} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                              {fieldLabel(f)}
                              <button type="button" className="hover:text-blue-900 font-bold" onClick={() => setSelectedFields(prev => prev.filter(x => x !== f))}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline hover:text-foreground"
                          onClick={() => setShowFieldPicker(p => !p)}
                        >
                          {showFieldPicker ? "Hide field picker" : `${selectedFields.length === 0 ? "Tag a field" : "Change fields"} (optional)`}
                        </button>
                        {showFieldPicker && (
                          <div className="mt-2 border rounded-md p-2 max-h-48 overflow-y-auto space-y-0.5 bg-background">
                            {(["Property Identification", "Owner & Location", "Building Details", "Structural Materials", "Deductions & Financial", "Assessment"] as const).map(group => {
                              const groupFields = FIELD_OPTIONS.filter(f => f.group === group);
                              return (
                                <div key={group}>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2 pb-1 px-1">{group}</p>
                                  {groupFields.map(f => (
                                    <label key={f.value} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted cursor-pointer text-xs">
                                      <input
                                        type="checkbox"
                                        className="accent-primary"
                                        checked={selectedFields.includes(f.value)}
                                        onChange={e => setSelectedFields(prev => e.target.checked ? [...prev, f.value] : prev.filter(x => x !== f.value))}
                                      />
                                      {f.label}
                                    </label>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Comment <span className="text-red-500">*</span></Label>
                        <Textarea
                          ref={commentTextareaRef}
                          rows={3}
                          placeholder="Describe the issue or correction needed…"
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Suggested Value (optional)</Label>
                        <Input
                          placeholder="What it should be…"
                          value={suggestedValue}
                          onChange={e => setSuggestedValue(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" size="sm" onClick={submitComment} disabled={submittingComment || !commentText.trim()}>
                        {submittingComment ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                        Post Comment
                      </Button>
                    </CardContent>
                  </Card>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Return dialog */}
        {returnDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
              <h2 className="text-base font-semibold">Return Form</h2>
              <p className="text-sm text-muted-foreground">Please provide a reason. It will be posted as a comment.</p>
              <textarea
                className="w-full border rounded-md p-2 text-sm min-h-20 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Explain what needs to be corrected…"
                value={returnNote}
                onChange={e => setReturnNote(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setReturnDialogOpen(false); setReturnNote(""); }} disabled={actionLoading}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleReturn(returnAction)} disabled={actionLoading || !returnNote.trim()}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Confirm Return
                </Button>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export default function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ReviewDetailInner id={id} />
    </Suspense>
  );
}

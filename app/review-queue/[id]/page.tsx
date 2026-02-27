"use client";

import { useState, useEffect, useCallback, use, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Loader2, ArrowLeft, CheckCircle, RotateCcw, ClipboardList,
  MessageSquare, Send, User, Clock,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MaterialField { summary?: string; }

interface FormRecord {
  id: number;
  // Step 1 — Owner & Location
  owner_name?: string | null;
  admin_care_of?: string | null;
  property_address?: string | null;
  owner_address?: string | null;
  location_municipality?: string | null;
  location_barangay?: string | null;
  location_province?: string | null;
  // Step 2 — Building Details
  type_of_building?: string | null;
  structure_type?: string | null;
  building_permit_no?: string | null;
  cct?: string | null;
  completion_issued_on?: string | null;
  date_constructed?: string | null;
  date_occupied?: string | null;
  building_age?: string | null;
  number_of_storeys?: string | null;
  total_floor_area?: string | null;
  unit_cost?: string | number | null;
  land_owner?: string | null;
  land_area?: string | null;
  td_arp_no?: string | null;
  // Step 3 — Structural Materials
  roofing_material?: MaterialField | string | null;
  flooring_material?: MaterialField | string | null;
  wall_material?: MaterialField | string | null;
  // Step 4 — Deductions & Financial
  selected_deductions?: string[] | null;
  overall_comments?: string | null;
  additional_percentage_choice?: string | null;
  additional_flat_rate_choice?: string | null;
  market_value?: string | number | null;
  // Step 5/6 — Assessment
  assessment_level?: string | null;
  assessed_value?: string | number | null;
  amount_in_words?: string | null;
  actual_use?: string | null;
  // Workflow
  status: string;
  submitted_at?: string | null;
  laoo_reviewer_id?: string | null;
  laoo_approved_at?: string | null;
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
  submitted:    "bg-yellow-100 text-yellow-800 border-yellow-300",
  under_review: "bg-blue-100 text-blue-800 border-blue-300",
  returned:     "bg-orange-100 text-orange-800 border-orange-300",
  approved:     "bg-green-100 text-green-800 border-green-300",
};
const STATUS_LABEL: Record<string, string> = {
  submitted:    "Submitted — Awaiting Review",
  under_review: "Under Review",
  returned:     "Returned for Revision",
  approved:     "Approved",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function FieldRow({
  label, value, fieldKey, commentCount = 0, isActive = false, onComment,
}: {
  label: string;
  value?: string | null;
  fieldKey?: string;
  commentCount?: number;
  isActive?: boolean;
  onComment?: (fieldKey: string) => void;
}) {
  return (
    <div
      className={`group flex items-baseline gap-1 py-2 border-b last:border-0 transition-colors ${
        isActive ? "bg-blue-50 -mx-4 px-4 rounded" : ""
      }`}
    >
      <span className="text-xs text-muted-foreground w-44 shrink-0">{label}</span>
      <span className="text-sm font-medium flex-1 min-w-0 break-words">
        {value || <span className="text-muted-foreground italic">—</span>}
      </span>
      {fieldKey && onComment && (
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {commentCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 font-semibold leading-none">
              {commentCount}
            </span>
          )}
          <button
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-1 rounded hover:bg-muted"
            onClick={() => onComment(fieldKey)}
            title={`Add comment on "${label}"`}
            type="button"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function getMaterialSummary(field: MaterialField | string | null | undefined): string | null {
  if (!field) return null;
  if (typeof field === "string") {
    try { return (JSON.parse(field) as MaterialField).summary ?? null; } catch { return field || null; }
  }
  return field.summary ?? null;
}

function fmtCurrency(v: string | number | null | undefined): string | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// LAOO field list for comment targeting
// ---------------------------------------------------------------------------
const FIELD_OPTIONS = [
  // Owner & Location
  { value: "owner_name",            label: "Owner Name",              group: "Owner & Location" },
  { value: "admin_care_of",         label: "Admin / Care Of",         group: "Owner & Location" },
  { value: "owner_address",         label: "Owner Address",           group: "Owner & Location" },
  { value: "location_province",     label: "Province",                group: "Owner & Location" },
  { value: "location_municipality", label: "Municipality",            group: "Owner & Location" },
  { value: "location_barangay",     label: "Barangay",                group: "Owner & Location" },
  // Building Details
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
  // Structural Materials
  { value: "roofing_material",      label: "Roofing Material",        group: "Structural Materials" },
  { value: "flooring_material",     label: "Flooring Material",       group: "Structural Materials" },
  { value: "wall_material",         label: "Wall Material",           group: "Structural Materials" },
  // Deductions & Financial
  { value: "selected_deductions",   label: "Standard Deductions",     group: "Deductions & Financial" },
  { value: "additional_percentage_choice", label: "Additional (%) Items", group: "Deductions & Financial" },
  { value: "additional_flat_rate_choice",  label: "Additional (Flat) Items", group: "Deductions & Financial" },
  { value: "overall_comments",      label: "Overall Comments",        group: "Deductions & Financial" },
  { value: "market_value",          label: "Market Value",            group: "Deductions & Financial" },
  // Assessment
  { value: "actual_use",            label: "Actual Use",              group: "Assessment" },
  { value: "assessment_level",      label: "Assessment Level",        group: "Assessment" },
  { value: "assessed_value",        label: "Assessed Value",          group: "Assessment" },
  { value: "amount_in_words",       label: "Amount in Words",         group: "Assessment" },
] as const;

function fieldLabel(value: string): string {
  return (FIELD_OPTIONS as readonly { value: string; label: string }[]).find(f => f.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// Inner page (needs useSearchParams — wrapped in Suspense below)
// ---------------------------------------------------------------------------
function ReviewDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formType = (searchParams.get("type") ?? "building") as "building" | "land";

  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [record, setRecord] = useState<FormRecord | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // New comment form
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const commentPanelRef = useRef<HTMLDivElement>(null);

  // Per-field comment counts (field_name may be comma-separated for multi-field)
  const commentsPerField = useMemo(() => {
    const map: Record<string, number> = {};
    comments.forEach(c => {
      if (c.field_name) {
        c.field_name.split(",").forEach(f => {
          const k = f.trim();
          if (k) map[k] = (map[k] || 0) + 1;
        });
      }
    });
    return map;
  }, [comments]);

  // Click the "+" on a FieldRow → pre-select that field and scroll to comment form
  const handleFieldComment = useCallback((fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey) ? prev : [...prev, fieldKey]
    );
    setFocusedField(fieldKey);
    setShowFieldPicker(true);
    setTimeout(() => {
      commentPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        const ta = commentPanelRef.current?.querySelector("textarea");
        if (ta) ta.focus();
      }, 350);
    }, 50);
  }, []);

  // Auth
  useEffect(() => {
    fetch("/api/auth/user")
      .then(r => r.json())
      .then(data => {
        const u = data.user;
        const allowed = ["laoo", "assistant_provincial_assessor", "provincial_assessor", "admin", "super_admin"];
        if (!u || !allowed.includes(u.role)) router.replace("/dashboard");
        else setCurrentUser(u);
      })
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  const apiBase = formType === "building"
    ? `/api/building-other-structure/${id}`
    : `/api/building-other-structure/${id}`; // TODO: land endpoint

  // Load form + comments
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

  // ── Review actions ──────────────────────────────────────────────────────────
  const doAction = useCallback(async (action: "claim" | "return" | "approve") => {
    if (action === "return" && comments.length === 0 && !commentText.trim()) {
      toast.error("Please add at least one comment before returning the form.");
      return;
    }
    if (!confirm(
      action === "approve"
        ? "Approve this form? This will unlock the Tax Declaration."
        : action === "return"
        ? "Return this form to the tax mapper for revision?"
        : "Claim this form and start your review?"
    )) return;

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

      const labels = { claim: "Under Review", return: "Returned", approve: "Approved" };
      toast.success(`Form marked as "${labels[action]}".`);
      await loadData();
    } catch {
      toast.error("Error performing action.");
    } finally {
      setActionLoading(false);
    }
  }, [apiBase, comments.length, commentText, loadData]);

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

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to post comment.");
        return;
      }

      toast.success("Comment posted.");
      setCommentText("");
      setSuggestedValue("");
      setSelectedFields([]);
      setFocusedField(null);
      await loadData();
    } catch {
      toast.error("Error posting comment.");
    } finally {
      setSubmittingComment(false);
    }
  }, [apiBase, selectedFields, commentText, suggestedValue, loadData]);

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

  const isReviewer = ["laoo", "assistant_provincial_assessor", "provincial_assessor", "admin", "super_admin"]
    .includes(currentUser.role);
  const canClaim   = record.status === "submitted" && isReviewer;
  const canAct     = record.status === "under_review" && isReviewer;

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

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Back + actions row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/review-queue")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Queue
              </Button>

              <div className="flex gap-2">
                {canClaim && (
                  <Button
                    onClick={() => doAction("claim")}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ClipboardList className="h-4 w-4 mr-1" />}
                    Start Review
                  </Button>
                )}
                {canAct && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => doAction("return")}
                      disabled={actionLoading}
                      className="border-orange-400 text-orange-600 hover:bg-orange-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RotateCcw className="h-4 w-4 mr-1" />}
                      Return for Revision
                    </Button>
                    <Button
                      onClick={() => doAction("approve")}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Status banner */}
            <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${STATUS_STYLE[record.status] ?? "bg-muted"}`}>
              <span>{STATUS_LABEL[record.status] ?? record.status}</span>
              {record.submitted_at && (
                <span className="ml-auto text-xs font-normal opacity-70">
                  Submitted {fmtDate(record.submitted_at)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Form Data ─────────────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-4">

                {/* Owner & Location */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Owner &amp; Location</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Owner Name"       value={record.owner_name}                             fieldKey="owner_name"            commentCount={commentsPerField["owner_name"]}            isActive={focusedField === "owner_name"}            onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Admin / Care Of"  value={record.admin_care_of}                          fieldKey="admin_care_of"         commentCount={commentsPerField["admin_care_of"]}         isActive={focusedField === "admin_care_of"}         onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Owner Address"    value={record.owner_address ?? record.property_address} fieldKey="owner_address"       commentCount={commentsPerField["owner_address"]}         isActive={focusedField === "owner_address"}         onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Province"         value={record.location_province}                      fieldKey="location_province"     commentCount={commentsPerField["location_province"]}     isActive={focusedField === "location_province"}     onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Municipality"     value={record.location_municipality}                  fieldKey="location_municipality" commentCount={commentsPerField["location_municipality"]} isActive={focusedField === "location_municipality"} onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Barangay"         value={record.location_barangay}                      fieldKey="location_barangay"     commentCount={commentsPerField["location_barangay"]}     isActive={focusedField === "location_barangay"}     onComment={isReviewer ? handleFieldComment : undefined} />
                  </CardContent>
                </Card>

                {/* Building Details */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Building Details</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Type of Building"   value={record.type_of_building}    fieldKey="type_of_building"     commentCount={commentsPerField["type_of_building"]}     isActive={focusedField === "type_of_building"}     onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Structure Type"     value={record.structure_type}       fieldKey="structure_type"       commentCount={commentsPerField["structure_type"]}       isActive={focusedField === "structure_type"}       onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Building Permit No" value={record.building_permit_no}   fieldKey="building_permit_no"   commentCount={commentsPerField["building_permit_no"]}   isActive={focusedField === "building_permit_no"}   onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="CCT"                value={record.cct}                  fieldKey="cct"                  commentCount={commentsPerField["cct"]}                  isActive={focusedField === "cct"}                  onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Completion Date"    value={record.completion_issued_on} fieldKey="completion_issued_on" commentCount={commentsPerField["completion_issued_on"]} isActive={focusedField === "completion_issued_on"} onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Date Constructed"   value={record.date_constructed}     fieldKey="date_constructed"     commentCount={commentsPerField["date_constructed"]}     isActive={focusedField === "date_constructed"}     onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Date Occupied"      value={record.date_occupied}        fieldKey="date_occupied"        commentCount={commentsPerField["date_occupied"]}        isActive={focusedField === "date_occupied"}        onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Building Age"       value={record.building_age}         fieldKey="building_age"         commentCount={commentsPerField["building_age"]}         isActive={focusedField === "building_age"}         onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="No. of Storeys"     value={record.number_of_storeys}    fieldKey="number_of_storeys"    commentCount={commentsPerField["number_of_storeys"]}    isActive={focusedField === "number_of_storeys"}    onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Total Floor Area"   value={record.total_floor_area ? `${record.total_floor_area} sqm` : null} fieldKey="total_floor_area" commentCount={commentsPerField["total_floor_area"]} isActive={focusedField === "total_floor_area"} onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Unit Cost"          value={fmtCurrency(record.unit_cost)} fieldKey="unit_cost"          commentCount={commentsPerField["unit_cost"]}            isActive={focusedField === "unit_cost"}            onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Land Owner"         value={record.land_owner}           fieldKey="land_owner"           commentCount={commentsPerField["land_owner"]}           isActive={focusedField === "land_owner"}           onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Land TD/ARP No."    value={record.td_arp_no}            fieldKey="td_arp_no"            commentCount={commentsPerField["td_arp_no"]}            isActive={focusedField === "td_arp_no"}            onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Land Area"          value={record.land_area}            fieldKey="land_area"            commentCount={commentsPerField["land_area"]}            isActive={focusedField === "land_area"}            onComment={isReviewer ? handleFieldComment : undefined} />
                  </CardContent>
                </Card>

                {/* Structural Materials */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Structural Materials</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Roofing Material"  value={getMaterialSummary(record.roofing_material)}  fieldKey="roofing_material"  commentCount={commentsPerField["roofing_material"]}  isActive={focusedField === "roofing_material"}  onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Flooring Material" value={getMaterialSummary(record.flooring_material)} fieldKey="flooring_material" commentCount={commentsPerField["flooring_material"]} isActive={focusedField === "flooring_material"} onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Wall Material"     value={getMaterialSummary(record.wall_material)}     fieldKey="wall_material"     commentCount={commentsPerField["wall_material"]}     isActive={focusedField === "wall_material"}     onComment={isReviewer ? handleFieldComment : undefined} />
                  </CardContent>
                </Card>

                {/* Deductions & Financial */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Deductions &amp; Financial Summary</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Standard Deductions"    value={Array.isArray(record.selected_deductions) && record.selected_deductions.length > 0 ? record.selected_deductions.join(", ") : null} fieldKey="selected_deductions"          commentCount={commentsPerField["selected_deductions"]}          isActive={focusedField === "selected_deductions"}          onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Additional (%) Items"   value={record.additional_percentage_choice ?? null} fieldKey="additional_percentage_choice" commentCount={commentsPerField["additional_percentage_choice"]} isActive={focusedField === "additional_percentage_choice"} onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Additional (Flat) Items" value={record.additional_flat_rate_choice ?? null}  fieldKey="additional_flat_rate_choice"  commentCount={commentsPerField["additional_flat_rate_choice"]}  isActive={focusedField === "additional_flat_rate_choice"}  onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Overall Comments"       value={record.overall_comments}                    fieldKey="overall_comments"             commentCount={commentsPerField["overall_comments"]}             isActive={focusedField === "overall_comments"}             onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Market Value"           value={fmtCurrency(record.market_value)}           fieldKey="market_value"                 commentCount={commentsPerField["market_value"]}                 isActive={focusedField === "market_value"}                 onComment={isReviewer ? handleFieldComment : undefined} />
                  </CardContent>
                </Card>

                {/* Assessment */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Assessment</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Actual Use"       value={record.actual_use}              fieldKey="actual_use"       commentCount={commentsPerField["actual_use"]}       isActive={focusedField === "actual_use"}       onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Assessment Level" value={record.assessment_level}        fieldKey="assessment_level" commentCount={commentsPerField["assessment_level"]} isActive={focusedField === "assessment_level"} onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Assessed Value"   value={fmtCurrency(record.assessed_value)} fieldKey="assessed_value" commentCount={commentsPerField["assessed_value"]} isActive={focusedField === "assessed_value"} onComment={isReviewer ? handleFieldComment : undefined} />
                    <FieldRow label="Amount in Words"  value={record.amount_in_words}         fieldKey="amount_in_words"  commentCount={commentsPerField["amount_in_words"]}  isActive={focusedField === "amount_in_words"}  onComment={isReviewer ? handleFieldComment : undefined} />
                  </CardContent>
                </Card>

              </div>

              {/* ── Comments ──────────────────────────────────────────────── */}
              <div className="space-y-4" ref={commentPanelRef}>

                {/* Comment list card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Comments
                        {comments.length > 0 && (
                          <span className="text-xs font-normal text-muted-foreground">({comments.length})</span>
                        )}
                      </CardTitle>
                      {focusedField && (
                        <button
                          className="text-xs text-muted-foreground underline hover:text-foreground"
                          onClick={() => setFocusedField(null)}
                          type="button"
                        >
                          Show all
                        </button>
                      )}
                    </div>
                    {focusedField && (
                      <p className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 mt-1">
                        Filtering: <strong>{fieldLabel(focusedField)}</strong>
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const visible = focusedField
                        ? comments.filter(c =>
                            c.field_name
                              ? c.field_name.split(",").map(s => s.trim()).includes(focusedField)
                              : false
                          )
                        : comments;
                      if (visible.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {focusedField ? "No comments for this field." : "No comments yet."}
                          </p>
                        );
                      }
                      return (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {visible.map(c => {
                            const fields = c.field_name
                              ? c.field_name.split(",").map(s => s.trim()).filter(Boolean)
                              : [];
                            return (
                              <div
                                key={c.id}
                                className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1 cursor-pointer hover:border-blue-300 transition-colors"
                                onClick={() => fields[0] && setFocusedField(fields[0])}
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
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Add comment card — reviewers only when form can be commented on */}
                {isReviewer && ["under_review", "submitted"].includes(record.status) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Add Comment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">

                      {/* Selected field chips */}
                      {selectedFields.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedFields.map(f => (
                            <span
                              key={f}
                              className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5"
                            >
                              {fieldLabel(f)}
                              <button
                                type="button"
                                className="hover:text-blue-900 font-bold"
                                onClick={() => setSelectedFields(prev => prev.filter(x => x !== f))}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Field picker toggle */}
                      <div>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline hover:text-foreground"
                          onClick={() => setShowFieldPicker(p => !p)}
                        >
                          {showFieldPicker ? "Hide field picker" : `${selectedFields.length === 0 ? "Select fields" : "Change fields"} (optional)`}
                        </button>

                        {showFieldPicker && (
                          <div className="mt-2 border rounded-md p-2 max-h-52 overflow-y-auto space-y-0.5 bg-background">
                            {/* Group headers */}
                            {(["Owner & Location", "Building Details", "Structural Materials", "Deductions & Financial", "Assessment"] as const).map(group => {
                              const groupFields = FIELD_OPTIONS.filter(f => f.group === group);
                              return (
                                <div key={group}>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2 pb-1 px-1">{group}</p>
                                  {groupFields.map(f => (
                                    <label
                                      key={f.value}
                                      className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted cursor-pointer text-sm"
                                    >
                                      <input
                                        type="checkbox"
                                        className="accent-primary"
                                        checked={selectedFields.includes(f.value)}
                                        onChange={e => {
                                          setSelectedFields(prev =>
                                            e.target.checked
                                              ? [...prev, f.value]
                                              : prev.filter(x => x !== f.value)
                                          );
                                        }}
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

                      <Button
                        className="w-full"
                        size="sm"
                        onClick={submitComment}
                        disabled={submittingComment || !commentText.trim()}
                      >
                        {submittingComment
                          ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          : <Send className="h-4 w-4 mr-1" />}
                        Post Comment
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ---------------------------------------------------------------------------
// Export — wrap in Suspense for useSearchParams
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

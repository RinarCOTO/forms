"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import "@/app/styles/forms-fill.css";
import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Save, Send, Printer, Lock, AlertTriangle, RotateCcw, MessageSquare, User, Clock } from "lucide-react";
import BuildingStructureForm from "@/app/components/forms/RPFAAS/building_structure_form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoType =
  | "sketch_plan"
  | "perspective_view"
  | "barangay_certificate"
  | "other_certificate";

interface PhotoRecord {
  id: string;
  photo_type: PhotoType;
  storage_path: string;
  original_name: string;
  signedUrl: string | null;
}

interface ReviewComment {
  id: string;
  field_name?: string | null;
  comment_text: string;
  suggested_value?: string | null;
  author_name: string;
  created_at: string;
}

const FIELD_LABELS: Record<string, string> = {
  owner_name: "Owner Name", admin_care_of: "Admin / Care Of", owner_address: "Owner Address",
  location_province: "Province", location_municipality: "Municipality", location_barangay: "Barangay",
  type_of_building: "Type of Building", structure_type: "Structure Type",
  building_permit_no: "Building Permit No", cct: "CCT",
  completion_issued_on: "Completion Date", date_constructed: "Date Constructed",
  date_occupied: "Date Occupied", building_age: "Building Age",
  number_of_storeys: "No. of Storeys", total_floor_area: "Total Floor Area",
  unit_cost: "Unit Cost", land_owner: "Land Owner", td_arp_no: "Land TD/ARP No.", land_area: "Land Area",
  roofing_material: "Roofing Material", flooring_material: "Flooring Material", wall_material: "Wall Material",
  selected_deductions: "Standard Deductions", market_value: "Market Value",
  actual_use: "Actual Use", assessment_level: "Assessment Level",
  assessed_value: "Assessed Value", amount_in_words: "Amount in Words",
};

function fmtCommentDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

const PHOTO_LABELS: Record<PhotoType, string> = {
  sketch_plan: "Sketch Plan",
  perspective_view: "Perspective View",
  barangay_certificate: "Barangay Certificate",
  other_certificate: "Another Certificate",
};

const PHOTO_ORDER: PhotoType[] = [
  "sketch_plan",
  "perspective_view",
  "barangay_certificate",
  "other_certificate",
];

// Converts a Supabase signed object URL to a low-res render URL for fast screen preview.
// Full-res URL is used as-is for print.
// Original:  /storage/v1/object/sign/bucket/path?token=...
// Rendered:  /storage/v1/render/image/sign/bucket/path?token=...&width=480&quality=40
function toPreviewUrl(signedUrl: string): string {
  try {
    const url = new URL(signedUrl);
    url.pathname = url.pathname.replace(
      "/storage/v1/object/sign/",
      "/storage/v1/render/image/sign/"
    );
    url.searchParams.set("width", "480");
    url.searchParams.set("quality", "40");
    return url.toString();
  } catch {
    return signedUrl;
  }
}

// ---------------------------------------------------------------------------
// Collect form fields from localStorage (non-photo data)
// ---------------------------------------------------------------------------

// Keys that are auto-managed by the DB or are not valid columns
const SKIP_KEYS = new Set(["id", "created_at", "updated_at", "unit_cost"]);

function collectFormData() {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key.includes("_p1") ||
      key.includes("_p2") ||
      key.includes("_p3") ||
      key.includes("_p4") ||
      key.includes("_p5") ||
      key.includes("_p6")
    ) {
      const value = localStorage.getItem(key);
      if (!value) continue;

      // Skip useFormPersistence blobs — whole-step state stored as JSON objects
      if (value.trimStart().startsWith("{")) continue;

      const cleanKey = key.replace(/_p[0-9]$/, "");

      // Skip auto-managed or non-column keys
      if (SKIP_KEYS.has(cleanKey)) continue;

      if (
        cleanKey.includes("flooring_material") ||
        cleanKey.includes("wall_material")
      ) {
        try {
          data[cleanKey] = JSON.parse(value);
        } catch {
          data[cleanKey] = value;
        }
      } else {
        data[cleanKey] = value;
      }
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// SupportingDocuments
// ---------------------------------------------------------------------------

function SupportingDocuments({ photos }: { photos: PhotoRecord[] }) {
  const validPhotos = PHOTO_ORDER.filter((type) => {
    const photo = photos.find((p) => p.photo_type === type);
    return photo?.signedUrl;
  });

  if (validPhotos.length === 0) return null;

  return (
    <section className="mt-8">
      {/* ── Screen: 2-column grid ── */}
      <div className="print:hidden">
        <h2 className="text-base font-semibold mb-4 border-b pb-2">
          Supporting Documents
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PHOTO_ORDER.map((type) => {
            const photo = photos.find((p) => p.photo_type === type);
            if (!photo?.signedUrl) return null;
            return (
              <div key={type} className="space-y-2">
                <p className="text-sm font-medium">{PHOTO_LABELS[type]}</p>
                <div className="border rounded-md overflow-hidden bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={toPreviewUrl(photo.signedUrl)}
                    alt={PHOTO_LABELS[type]}
                    className="w-full max-h-64 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {photo.original_name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Print: one photo per page ── */}
      <div className="print-only">
        {PHOTO_ORDER.map((type) => {
          const photo = photos.find((p) => p.photo_type === type);
          if (!photo?.signedUrl) return null;
          return (
            <div key={type} className="photo-page">
              <p className="photo-page-title">{PHOTO_LABELS[type]}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.signedUrl} alt={PHOTO_LABELS[type]} />
              <p className="photo-page-filename">{photo.original_name}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function PreviewFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // draftId: from URL param or localStorage
  const urlId = searchParams.get("id");
  const [draftId, setDraftId] = useState<string | null>(urlId);
  // When loaded inside the print-preview iframe, suppress the comments panel
  const isPrintMode = searchParams.get("print") === "1";

  useEffect(() => {
    if (!urlId) {
      const stored = localStorage.getItem("draft_id");
      if (stored) setDraftId(stored);
    }
  }, [urlId]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current form status from DB
  const [formStatus, setFormStatus] = useState<string>("draft");
  const [statusLoading, setStatusLoading] = useState(false);
  // Controls rendering of BuildingStructureForm — wait until DB data is seeded to localStorage
  const [formDataReady, setFormDataReady] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // LAOO revision comments
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  // Which comment is active (clicked) — drives field highlight + inline annotation
  const [activeComment, setActiveComment] = useState<ReviewComment | null>(null);

  // Highlight the matching form field and inject inline comment when activeComment changes
  useEffect(() => {
    // Clear previous state
    document.querySelectorAll('.faas-field-highlight').forEach(el => el.classList.remove('faas-field-highlight'));
    document.getElementById('faas-inline-comment')?.remove();

    if (!activeComment?.field_name) return;

    const fields = activeComment.field_name.split(',').map(f => f.trim()).filter(Boolean);
    let firstEl: Element | null = null;

    fields.forEach(field => {
      document.querySelectorAll(`[data-field~="${field}"]`).forEach(el => {
        el.classList.add('faas-field-highlight');
        if (!firstEl) firstEl = el;
      });
    });

    const anchorEl = firstEl as Element | null;
    if (anchorEl) {
      anchorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Build the inline comment row
      const noteRow = document.createElement('tr');
      noteRow.id = 'faas-inline-comment';
      noteRow.className = 'faas-inline-comment-row';
      const td = document.createElement('td');
      td.colSpan = 10;
      const fieldLabel = FIELD_LABELS[fields[0]] ?? fields[0];
      td.innerHTML =
        `💬 <strong>${fieldLabel}:</strong> ${activeComment.comment_text}` +
        (activeComment.suggested_value ? ` &nbsp;→ <em>Suggested: ${activeComment.suggested_value}</em>` : '') +
        ` &nbsp;<span style="opacity:0.6">— ${activeComment.author_name}</span>`;
      noteRow.appendChild(td);
      anchorEl.insertAdjacentElement('afterend', noteRow);
    }
  }, [activeComment]);

  // Permission: only roles allowed by the submit API can save/submit
  const SUBMIT_ALLOWED_ROLES = ["tax_mapper", "municipal_tax_mapper", "admin", "super_admin"];
  const [canSubmit, setCanSubmit] = useState(false);
  useEffect(() => {
    fetch("/api/auth/user")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.role && SUBMIT_ALLOWED_ROLES.includes(data.user.role)) {
          setCanSubmit(true);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Statuses where the tax mapper cannot edit or re-submit
  const LOCKED_STATUSES = ["submitted", "under_review", "approved"];
  const isLocked = LOCKED_STATUSES.includes(formStatus);

  // Load current form status from DB and seed localStorage
  // In print mode: always overwrite from DB so print-preview always shows correct data.
  // In normal mode: only seed keys that are not already set (preserve active edit session).
  useEffect(() => {
    if (!draftId) {
      setFormDataReady(true);
      return;
    }
    setStatusLoading(true);
    fetch(`/api/building-other-structure/${draftId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) {
          const d = result.data;
          if (d.status) setFormStatus(d.status);

          const set = (key: string, val: string | null | undefined) => {
            if (val == null || val === "") return;
            if (isPrintMode || !localStorage.getItem(key)) localStorage.setItem(key, val);
          };

          // ── Step 1: owner / location individual keys ──────────────────
          set("rpfaas_owner_name",                       d.owner_name);
          set("rpfaas_admin_careof",                     d.admin_care_of);
          set("rpfaas_location_street",                  d.property_address);
          set("rpfaas_owner_address_province_code",      d.owner_province_code);
          set("rpfaas_owner_address_municipality_code",  d.owner_municipality_code);
          set("rpfaas_owner_address_barangay_code",      d.owner_barangay_code);
          set("rpfaas_admin_province_code",              d.admin_province_code);
          set("rpfaas_admin_municipality_code",          d.admin_municipality_code);
          set("rpfaas_admin_barangay_code",              d.admin_barangay_code);
          set("rpfaas_location_province_code",           d.property_province_code);
          set("rpfaas_location_municipality_code",       d.property_municipality_code);
          set("rpfaas_location_barangay_code",           d.property_barangay_code);

          // ── Step 2: p2 JSON blob ──────────────────────────────────────
          if (isPrintMode || !localStorage.getItem("p2")) {
            localStorage.setItem("p2", JSON.stringify({
              type_of_building:    d.type_of_building    || "",
              structure_type:      d.structure_type      || "",
              building_permit_no:  d.building_permit_no  || "",
              cct:                 d.cct                 || "",
              completion_issued_on:d.completion_issued_on|| "",
              date_constructed:    d.date_constructed    || "",
              date_occupied:       d.date_occupied       || "",
              building_age:        d.building_age        || "",
              number_of_storeys:   d.number_of_storeys   || "",
              floor_areas:         d.floor_areas         || [],
              total_floor_area:    d.total_floor_area    || "",
              land_owner:          d.land_owner          || "",
              td_arp_no:           d.td_arp_no           || "",
              land_area:           d.land_area           || "",
            }));
          }
          if (d.unit_cost != null) set("unit_cost_p2", String(d.unit_cost));

          // ── Step 3: p3 JSON blob (materials stored as nested JSON) ────
          if (isPrintMode || !localStorage.getItem("p3")) {
            const rm = d.roofing_material  || {};
            const fm = d.flooring_material || {};
            const wm = d.wall_material     || {};
            localStorage.setItem("p3", JSON.stringify({
              roof_materials:           rm.data    || {},
              roof_materials_other_text:rm.otherText|| "",
              flooring_grid:            fm.grid    || [],
              walls_grid:               wm.grid    || [],
            }));
          }

          // ── Step 4: p4 JSON blob ──────────────────────────────────────
          if (isPrintMode || !localStorage.getItem("p4")) {
            localStorage.setItem("p4", JSON.stringify({
              selected_deductions:        d.selected_deductions        || [],
              overall_comments:           d.overall_comments           || "",
              additional_percentage_choice:d.additional_percentage_choice|| "",
              additional_percentage_areas: d.additional_percentage_areas || [],
              additional_flat_rate_choice: d.additional_flat_rate_choice || "",
              additional_flat_rate_areas:  d.additional_flat_rate_areas  || [],
              market_value:               d.market_value,
            }));
          }
          if (d.market_value != null) set("market_value_p4", String(d.market_value));

          // ── Step 5/6 fields ───────────────────────────────────────────
          set("amount_in_words_p5",   d.amount_in_words);
          set("assessment_level_p5",  d.assessment_level);
          if (d.assessed_value != null) set("assessed_value_p5", String(d.assessed_value));
          set("actual_use_p5",        d.actual_use);
        }
      })
      .catch(() => {})
      .finally(() => {
        setStatusLoading(false);
        setFormDataReady(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, isPrintMode]);

  // Load photos from the API
  useEffect(() => {
    if (!draftId) return;
    setPhotosLoading(true);
    fetch(`/api/building-other-structure/photos?buildingStructureId=${draftId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setPhotos(result.data as PhotoRecord[]);
      })
      .catch(() => {/* non-fatal */})
      .finally(() => setPhotosLoading(false));
  }, [draftId]);

  // Load LAOO comments (always — so tax mapper can see them on "returned" status)
  useEffect(() => {
    if (!draftId) return;
    setCommentsLoading(true);
    fetch(`/api/building-other-structure/${draftId}/comments`)
      .then((r) => r.json())
      .then((result) => {
        if (result.data) setComments(result.data as ReviewComment[]);
      })
      .catch(() => {/* non-fatal */})
      .finally(() => setCommentsLoading(false));
  }, [draftId]);

  // ── Print: preload all signed-URL images first so they render in print ──
  const handlePrint = useCallback(async () => {
    const urls = photos.map((p) => p.signedUrl).filter(Boolean) as string[];
    if (urls.length > 0) {
      await Promise.all(
        urls.map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = src;
            })
        )
      );
    }
    window.print();
  }, [photos]);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData();
      formData.status = "draft";
      const currentDraftId = draftId ?? localStorage.getItem("draft_id");
      let response;
      if (currentDraftId) {
        response = await fetch(`/api/building-other-structure/${currentDraftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch("/api/building-other-structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      if (response.ok) {
        const result = await response.json();
        alert(
          `Draft ${currentDraftId ? "updated" : "saved"} successfully! ID: ` +
            result.data?.id
        );
        localStorage.clear();
        router.push("/building-other-structure/dashboard");
      } else {
        const error = await response.json();
        alert("Failed to save draft: " + (error.message ?? "Unknown error"));
      }
    } catch {
      alert("Error saving draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [draftId, router]);

  const handleSubmit = useCallback(async () => {
    const currentDraftId = draftId ?? localStorage.getItem("draft_id");
    if (!currentDraftId) {
      alert("No form ID found. Please save as draft first.");
      return;
    }
    if (!confirm("Submit this form for LAOO review? You will not be able to edit it until the LAOO returns it.")) return;

    setIsSubmitting(true);
    try {
      const submitResponse = await fetch(
        `/api/building-other-structure/${currentDraftId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (submitResponse.ok) {
        localStorage.clear();
        router.push("/building-other-structure/dashboard");
      } else {
        const error = await submitResponse.json();
        alert("Failed to submit: " + (error.message ?? "Unknown error"));
      }
    } catch {
      alert("Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [draftId, router]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* ── Header ── */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 print:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/building-other-structure">
                  Building &amp; Other Structures
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Preview &amp; Submit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* ── Body ── */}
        <div className="flex-1 p-6 overflow-y-auto print:p-0">
          <div className={`rpfaas-fill mx-auto ${!isPrintMode && comments.length > 0 ? "max-w-7xl" : "max-w-5xl"}`}>
          <div className={`${!isPrintMode && comments.length > 0 ? "flex gap-6 items-start" : ""}`}>
          <div className={`${!isPrintMode && comments.length > 0 ? "flex-1 min-w-0" : ""}`}>
            {/* Page title row — hidden when rendered inside the print-preview iframe */}
            {!isPrintMode && (
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6 print:hidden">
              <div>
                <h1 className="rpfaas-fill-title">Preview &amp; Submit</h1>
                <p className="text-sm text-muted-foreground">
                  Review your form and supporting documents before submitting.
                </p>
              </div>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="hidden sm:flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </header>
            )}

            {/* ── Form preview (iframe) ── */}
            <div className="bg-white shadow-sm border p-6 mb-6" id="print-area">
              <div className="preview-container">
              <div className="border p-2 bg-white overflow-x-auto">
                  {formDataReady ? (
                    <BuildingStructureForm />
                  ) : (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2 print:hidden">
                    Review all information before submitting.
                  </p>
                </div>

                {/* ── Supporting Documents ── */}
                {photosLoading ? (
                  <div className="flex justify-center py-8 print:hidden">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <SupportingDocuments photos={photos} />
                )}
              </div>
            </div>

            {/* ── Status banners ── */}
            {!statusLoading && !isPrintMode && (
              <div className="print:hidden mb-4 space-y-2">
                {formStatus === "submitted" && (
                  <div className="flex items-center gap-2 rounded-md border border-yellow-400/50 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>Awaiting LAOO Review.</strong> This form has been submitted and is locked for editing until the LAOO returns it.
                    </span>
                  </div>
                )}
                {formStatus === "under_review" && (
                  <div className="flex items-center gap-2 rounded-md border border-blue-400/50 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>Under LAOO Review.</strong> A LAOO officer is currently reviewing this form.
                    </span>
                  </div>
                )}
                {formStatus === "returned" && (
                  <div className="flex items-center gap-2 rounded-md border border-orange-400/50 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>Returned for Review.</strong> The LAOO has reviewed this form and left comments. Please address all comments before resubmitting.
                    </span>
                  </div>
                )}
                {formStatus === "approved" && (
                  <div className="flex items-center gap-2 rounded-md border border-green-400/50 bg-green-50 px-4 py-3 text-sm text-green-800">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>Approved.</strong> This form has been approved by the LAOO. The Tax Declaration has been unlocked.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Action buttons — hidden inside print-preview iframe ── */}
            {!isPrintMode && (
              <>
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
                  <Button
                    onClick={() =>
                      router.push(
                        `/building-other-structure/fill/step-1${draftId ? `?id=${draftId}` : ""}`
                      )
                    }
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={isLocked}
                  >
                    Back to Edit
                  </Button>

                  {!isLocked && canSubmit && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        onClick={handleSaveDraft}
                        variant="outline"
                        disabled={isSaving || isSubmitting}
                        className="w-full sm:w-auto"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save as Draft
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleSubmit}
                        disabled={isSaving || isSubmitting}
                        className="w-full sm:w-auto rpfaas-fill-button-primary"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting…
                          </>
                        ) : (
                          <>
                            {formStatus === "returned" ? (
                              <RotateCcw className="mr-2 h-4 w-4" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            {formStatus === "returned" ? "Resubmit for Review" : "Submit for Review"}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {!isLocked && canSubmit && (
                  <div className="mt-4 text-sm text-muted-foreground text-center print:hidden">
                    <p>
                      <strong>Save as Draft:</strong> Save your progress and continue editing later.
                    </p>
                    <p>
                      <strong>{formStatus === "returned" ? "Resubmit for Review" : "Submit for Review"}:</strong>{" "}
                      {formStatus === "returned"
                        ? "Send your revised form back to the LAOO."
                        : "Send to LAOO for review. The form will be locked until they respond."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>{/* end form column */}

          {/* ── LAOO Comments Panel ── */}
          {!isPrintMode && comments.length > 0 && (
            <div className="w-80 shrink-0 print:hidden">
              <Card className="sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-orange-500" />
                    Reviewer Comments
                    <span className="ml-auto text-xs font-normal bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">
                      {comments.length}
                    </span>
                  </CardTitle>
                  {formStatus === "returned" && (
                    <p className="text-xs text-orange-600 mt-1">
                      Address all comments before resubmitting.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {commentsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="divide-y max-h-[calc(100vh-12rem)] overflow-y-auto">
                      {comments.map((c) => {
                        const fields = c.field_name
                          ? c.field_name.split(",").map((f) => f.trim()).filter(Boolean)
                          : [];
                        const isActive = activeComment?.id === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setActiveComment(isActive ? null : c)}
                            className={`px-4 py-3 space-y-1.5 cursor-pointer transition-colors ${
                              isActive
                                ? "bg-amber-50 border-l-2 border-amber-400"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            {fields.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {fields.map((f) => (
                                  <span
                                    key={f}
                                    className={`text-xs font-semibold rounded px-1.5 py-0.5 border ${
                                      isActive
                                        ? "bg-amber-100 text-amber-800 border-amber-300"
                                        : "bg-orange-50 text-orange-700 border-orange-200"
                                    }`}
                                  >
                                    {FIELD_LABELS[f] ?? f}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-sm text-foreground">{c.comment_text}</p>
                            {c.suggested_value && (
                              <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                                Suggested: {c.suggested_value}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{c.author_name}</span>
                              <Clock className="h-3 w-3 ml-1" />
                              <span>{fmtCommentDate(c.created_at)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          </div>{/* end flex row */}
          </div>{/* end max-w wrapper */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Suspense wrapper required for useSearchParams
export default function PreviewFormPageWrapper() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <PreviewFormPage />
    </Suspense>
  );
}

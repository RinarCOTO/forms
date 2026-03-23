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
import {
  Loader2, Save, Send, Printer, Lock, AlertTriangle, RotateCcw,
  MessageSquare, User, Clock, FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LandImprovementForm from "@/app/components/forms/RPFAAS/land_improvement_form";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewComment {
  id: string;
  field_name?: string | null;
  comment_text: string;
  suggested_value?: string | null;
  author_name: string;
  created_at: string;
}

interface LandImprovementData {
  id: number;
  status: string;
  // Step 1 — identification & owner
  transaction_code?: string;
  arp_no?: string;
  oct_tct_cloa_no?: string;
  pin?: string;
  survey_no?: string;
  lot_no?: string;
  blk?: string;
  owner_name?: string;
  admin_care_of?: string;
  owner_address?: string;
  admin_address?: string;
  // Step 1 — property location
  property_address?: string;
  location_province?: string;
  location_municipality?: string;
  location_barangay?: string;
  // Step 2 — boundaries
  north_property?: string;
  south_property?: string;
  east_property?: string;
  west_property?: string;
  // Step 3 — land appraisal
  classification?: string;
  sub_classification?: string;
  land_class?: string;
  unit_value?: string | number;
  land_area?: string | number;
  base_market_value?: string | number;
  // Step 4 — adjustments
  additional_flat_rate_choice?: string;
  market_value?: string | number;
  // Step 5 — assessment
  actual_use?: string;
  assessment_level?: string | number;
  assessed_value?: string | number;
  amount_in_words?: string;
  effectivity_of_assessment?: string;
}

// ---------------------------------------------------------------------------
// Field labels (for comments panel)
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  owner_name:              "Owner",
  admin_care_of:           "Admin / Care Of",
  owner_address:           "Owner Address",
  arp_no:                  "ARP No.",
  pin:                     "PIN",
  oct_tct_cloa_no:         "OCT/TCT/CLOA No.",
  survey_no:               "Survey No.",
  lot_no:                  "Lot No.",
  blk:                     "BLK",
  transaction_code:        "Transaction Code",
  location_municipality:   "Municipality",
  location_barangay:       "Barangay",
  north_property:          "North",
  south_property:          "South",
  east_property:           "East",
  west_property:           "West",
  classification:          "Classification",
  sub_classification:      "Sub-Classification",
  land_class:              "Land Class",
  unit_value:              "Unit Value",
  land_area:               "Land Area",
  base_market_value:       "Base Market Value",
  market_value:            "Market Value",
  actual_use:              "Actual Use",
  assessment_level:        "Assessment Level",
  assessed_value:          "Assessed Value",
  amount_in_words:         "Amount in Words",
  effectivity_of_assessment: "Effectivity of Assessment",
};

function fmtCommentDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
}


// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function PreviewFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlId = searchParams.get("id");
  const [draftId, setDraftId] = useState<string | null>(urlId);
  const isPrintMode = searchParams.get("print") === "1";

  useEffect(() => {
    if (!urlId) {
      const stored = localStorage.getItem("land_draft_id");
      if (stored) setDraftId(stored);
    }
  }, [urlId]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<string>("draft");
  const [statusLoading, setStatusLoading] = useState(false);
  const [data, setData] = useState<LandImprovementData | null>(null);

  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [activeComment, setActiveComment] = useState<ReviewComment | null>(null);

  const SUBMIT_ALLOWED_ROLES = ["tax_mapper", "municipal_tax_mapper", "admin", "super_admin"];
  const [canSubmit, setCanSubmit] = useState(false);
  useEffect(() => {
    fetch("/api/auth/user")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.role && SUBMIT_ALLOWED_ROLES.includes(d.user.role)) {
          setCanSubmit(true);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const LOCKED_STATUSES = ["submitted", "under_review", "approved"];
  const isLocked = LOCKED_STATUSES.includes(formStatus);

  // Load form data from API
  useEffect(() => {
    if (!draftId) return;
    setStatusLoading(true);
    fetch(`/api/faas/land-improvements/${draftId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) {
          setData(result.data);
          if (result.data.status) setFormStatus(result.data.status);
        }
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, [draftId]);

  // Load comments
  useEffect(() => {
    if (!draftId) return;
    setCommentsLoading(true);
    fetch(`/api/faas/land-improvements/${draftId}/comments`)
      .then((r) => r.json())
      .then((result) => {
        if (result.data) setComments(result.data as ReviewComment[]);
      })
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [draftId]);

  // Field highlight when a comment is active
  useEffect(() => {
    document.querySelectorAll(".faas-field-highlight").forEach((el) =>
      el.classList.remove("faas-field-highlight")
    );
    document.getElementById("faas-inline-comment")?.remove();

    if (!activeComment?.field_name) return;

    const fields = activeComment.field_name.split(",").map((f) => f.trim()).filter(Boolean);
    let firstEl: Element | null = null;

    fields.forEach((field) => {
      document.querySelectorAll(`[data-field~="${field}"]`).forEach((el) => {
        el.classList.add("faas-field-highlight");
        if (!firstEl) firstEl = el;
      });
    });

    if (firstEl) {
      (firstEl as Element).scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeComment]);

  const handleSaveDraft = useCallback(async () => {
    if (!draftId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/faas/land-improvements/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (response.ok) {
        alert("Draft saved successfully!");
        localStorage.clear();
        router.push("/land-other-improvements/dashboard");
      } else {
        const error = await response.json();
        alert("Failed to save: " + (error.message ?? "Unknown error"));
      }
    } catch {
      alert("Error saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [draftId, router]);

  const handleSubmit = useCallback(async () => {
    if (!draftId) {
      alert("No form ID found. Please go back and save first.");
      return;
    }
    if (!confirm("Submit this form for LAOO review? You will not be able to edit it until the LAOO returns it.")) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/faas/land-improvements/${draftId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        localStorage.clear();
        router.push("/land-other-improvements/dashboard");
      } else {
        const error = await response.json();
        alert("Failed to submit: " + (error.message ?? "Unknown error"));
      }
    } catch {
      alert("Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [draftId, router]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 print:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/land-other-improvements">
                  Land &amp; Other Improvements
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Preview &amp; Submit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto print:p-0">
          <div className={`rpfaas-fill mx-auto ${!isPrintMode && comments.length > 0 ? "max-w-7xl" : "max-w-4xl"}`}>
            <div className={`${!isPrintMode && comments.length > 0 ? "flex gap-6 items-start" : ""}`}>
              <div className={`${!isPrintMode && comments.length > 0 ? "flex-1 min-w-0" : ""}`}>

                {/* Page title — hidden inside print-preview iframe */}
                {!isPrintMode && (
                  <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6 print:hidden">
                    <div>
                      <h1 className="rpfaas-fill-title">Preview &amp; Submit</h1>
                      <p className="text-sm text-muted-foreground">
                        Review your form before submitting.
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

                {/* Form preview */}
                <div className="bg-white shadow-sm border p-6 mb-6" id="print-area">
                  {statusLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : data ? (
                    <LandImprovementForm data={data} />
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      No data found.
                    </p>
                  )}
                </div>

                {/* Status banners */}
                {!statusLoading && !isPrintMode && (
                  <div className="print:hidden mb-4 space-y-2">
                    {formStatus === "submitted" && (
                      <div className="flex items-center gap-2 rounded-md border border-yellow-400/50 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                        <Lock className="h-4 w-4 shrink-0" />
                        <span>
                          <strong>Awaiting LAOO Review.</strong> This form has been submitted and is locked until the LAOO returns it.
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
                          <strong>Returned for Review.</strong> The LAOO has left comments. Please address all comments before resubmitting.
                        </span>
                      </div>
                    )}
                    {formStatus === "approved" && (
                      <div className="flex items-center gap-2 rounded-md border border-green-400/50 bg-green-50 px-4 py-3 text-sm text-green-800">
                        <Lock className="h-4 w-4 shrink-0" />
                        <span>
                          <strong>Approved.</strong> This form has been approved by the LAOO.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tax Declaration button — approved forms only */}
                {!isPrintMode && formStatus === "approved" && draftId && (
                  <div className="print:hidden mb-4">
                    <Button
                      onClick={() => router.push(`/land-other-improvements/tax-declaration?id=${draftId}`)}
                      className="w-full sm:w-auto gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Print Tax Declaration
                    </Button>
                  </div>
                )}

                {/* Action buttons */}
                {!isPrintMode && (
                  <>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
                      <Button
                        onClick={() =>
                          router.push(
                            `/land-other-improvements/fill/step-1${draftId ? `?id=${draftId}` : ""}`
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
              </div>

              {/* LAOO Comments Panel */}
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
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function PreviewFormPageWrapper() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <PreviewFormPage />
    </Suspense>
  );
}

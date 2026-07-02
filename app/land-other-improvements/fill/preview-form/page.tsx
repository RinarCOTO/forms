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
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, Save, Send, RotateCcw,
  MessageSquare, User, Clock, FileText, History, ArrowRight,
} from "lucide-react";
import { FormStatusBanner } from "@/components/ui/form-status-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LandImprovementForm from "@/app/components/forms/RPFAAS/land_improvement_form";
import { FaasCommentHighlightScope } from "@/hooks/useFaasCommentHighlight";
import { type FaasReviewComment, useFaasReviewComments } from "@/hooks/useFaasReviewComments";
import { useFaasUserPermissions } from "@/hooks/useFaasUserPermissions";
import { useLandImprovementPreviewActions } from "@/hooks/useLandImprovementPreviewActions";
import { useLandImprovementPreviewData } from "@/hooks/useLandImprovementPreviewData";
import { usePrintBlocker } from "@/hooks/usePrintBlocker";
import { getStoredFaasDraftId } from "@/utils/form-draft-storage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReviewComment = FaasReviewComment;

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
  east_property:           "East",
  south_property:          "South",
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
  const isPrintMode = searchParams.get("print") === "1";
  const isEmbedMode = searchParams.get("embed") === "1";

  const [localDraftId, setLocalDraftId] = useState<string | null>(null);
  const draftId = urlId || localDraftId;

  useEffect(() => {
    if (!urlId) {
      const stored = getStoredFaasDraftId(localStorage, "land");
      if (stored) setLocalDraftId(stored);
    }
  }, [urlId]);

  const { handleSaveDraft, handleSubmit, isSaving, isSubmitting } =
    useLandImprovementPreviewActions(draftId);
  const { data, formStatus, statusLoading } = useLandImprovementPreviewData({ draftId });

  const { comments, commentsLoading } = useFaasReviewComments({
    draftId,
    apiBasePath: "/api/faas/land-improvements",
  });
  const [activeComment, setActiveComment] = useState<ReviewComment | null>(null);

  const SUBMIT_ALLOWED_ROLES = ["municipal_tax_mapper", "municipal_assessor", "laoo", "assistant_provincial_assessor", "provincial_assessor", "admin", "super_admin"];
  const HISTORY_ALLOWED_ROLES = ["provincial_assessor", "assistant_provincial_assessor", "admin", "super_admin"];
  const PRINT_ALLOWED_ROLES = ["provincial_assessor", "assistant_provincial_assessor"];
  const { canSubmit, canPrint, canViewHistory } = useFaasUserPermissions({
    submitRoles: SUBMIT_ALLOWED_ROLES,
    printRoles: PRINT_ALLOWED_ROLES,
    historyRoles: HISTORY_ALLOWED_ROLES,
    logErrors: true,
  });
  usePrintBlocker(canPrint);

  // Activity log — only fetched for roles that can view it
  interface HistoryEntry {
    id: string;
    from_label: string;
    to_label: string;
    actor_name: string;
    actor_role_label: string;
    note: string | null;
    created_at: string;
  }
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  useEffect(() => {
    if (!draftId || !canViewHistory) return;
    setHistoryLoading(true);
    fetch(`/api/faas/land-improvements/${draftId}/history`)
      .then(r => r.json())
      .then(result => {
        if (result.success) setHistory(result.data);
      })
      .catch((e) => console.error('[preview] history fetch failed:', e))
      .finally(() => setHistoryLoading(false));
  }, [draftId, canViewHistory]);

  const LOCKED_STATUSES = ["submitted", "under_review", "approved"];
  const isLocked = LOCKED_STATUSES.includes(formStatus);

  return (
    <SidebarProvider>
      {!isEmbedMode && <AppSidebar />}

      <SidebarInset>
        {/* Header */}
        {!isEmbedMode && (
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
        )}

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto print:p-0">
          <div className={`rpfaas-fill mx-auto ${!isPrintMode && (comments.length > 0 || canViewHistory) ? "max-w-7xl" : "max-w-4xl"}`}>
            <div className={`${!isPrintMode && (comments.length > 0 || canViewHistory) ? "flex gap-6 items-start" : ""}`}>
              <div className={`${!isPrintMode && (comments.length > 0 || canViewHistory) ? "flex-1 min-w-0" : ""}`}>

                {/* Page title — hidden inside print-preview iframe */}
                {!isPrintMode && (
                  <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6 print:hidden">
                    <div>
                      <h1 className="rpfaas-fill-title">Preview &amp; Submit</h1>
                      <p className="text-sm text-muted-foreground">
                        Review your form before submitting.
                      </p>
                    </div>
                  </header>
                )}

                {/* Form preview */}
                <div className="bg-white shadow-sm border p-6 mb-6" id="print-area">
                  {statusLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : data ? (
                    <FaasCommentHighlightScope activeComment={activeComment}>
                      <LandImprovementForm data={data} />
                    </FaasCommentHighlightScope>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      No data found.
                    </p>
                  )}
                </div>

                {/* Status banners */}
                {/* ── Status banners ── */}
                <FormStatusBanner
                  status={formStatus}
                  statusLoading={statusLoading}
                  isPrintMode={isPrintMode}
                  messages={{
                    submitted: { title: "Awaiting LAOO Review.", message: "This form has been submitted and is locked until the LAOO returns it." },
                    under_review: { title: "Under LAOO Review.", message: "A LAOO officer is currently reviewing this form." },
                    returned: { title: "Returned for Review.", message: "The LAOO has left comments. Please address all comments before resubmitting." },
                    approved: { title: "Approved.", message: "This form has been approved by the LAOO." },
                  }}
                />

                {/* Tax Declaration button — approved forms only */}
                {!isPrintMode && formStatus === "approved" && draftId && (
                  <div className="print:hidden mb-4">
                    <Button
                      onClick={() => router.push(`/tax-declaration/land?id=${draftId}`)}
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
                                {formStatus === "returned" ? "Resubmit to Municipal Assessor" : "Submit to Municipal Assessor"}
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
                          <strong>{formStatus === "returned" ? "Resubmit to Municipal Assessor" : "Submit to Municipal Assessor"}:</strong>{" "}
                          {formStatus === "returned"
                            ? "Send your revised form back for review."
                            : "Send for review. The form will be locked until it is returned."}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Activity Log Panel — provincial assessor / admin only */}
              {!isPrintMode && canViewHistory && (
                <div className="w-80 shrink-0 print:hidden">
                  <Card className="sticky top-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <History className="h-4 w-4 text-blue-500" />
                        Activity Log
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {historyLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : history.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-4 py-4">No activity recorded yet.</p>
                      ) : (
                        <div className="divide-y max-h-[calc(100vh-12rem)] overflow-y-auto">
                          {history.map((entry) => (
                            <div key={entry.id} className="px-4 py-3 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-medium">
                                <span className="text-muted-foreground">{entry.from_label}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-foreground">{entry.to_label}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <User className="h-3 w-3 shrink-0" />
                                <span>{entry.actor_name}</span>
                                <span className="text-xs bg-muted rounded px-1">{entry.actor_role_label}</span>
                              </div>
                              {entry.note && (
                                <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                                  {entry.note}
                                </p>
                              )}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(entry.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

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

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
import { SuccessModal } from "@/components/ui/success-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Save, Send, RotateCcw, MessageSquare, User, Clock, FileText } from "lucide-react";
import { FormStatusBanner } from "@/components/ui/form-status-banner";
import { FaasPhotoImage } from "@/components/faas/FaasPhotoImage";
import BuildingStructureForm from "@/app/components/forms/RPFAAS/building_structure_form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBuildingStructurePreviewActions } from "@/hooks/useBuildingStructurePreviewActions";
import { useBuildingStructurePreviewData } from "@/hooks/useBuildingStructurePreviewData";
import { FaasCommentHighlightScope } from "@/hooks/useFaasCommentHighlight";
import { type FaasPhotoRecord, useFaasPhotos } from "@/hooks/useFaasPhotos";
import { type FaasReviewComment, useFaasReviewComments } from "@/hooks/useFaasReviewComments";
import { useFaasUserPermissions } from "@/hooks/useFaasUserPermissions";
import { usePrintBlocker } from "@/hooks/usePrintBlocker";
import { getStoredFaasDraftId } from "@/utils/form-draft-storage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoType =
  | "sketch_plan"
  | "perspective_view"
  | "barangay_certificate"
  | "other_certificate";

type PhotoRecord = FaasPhotoRecord<PhotoType>;

type ReviewComment = FaasReviewComment;

const FIELD_LABELS: Record<string, string> = {
  owner_name: "Owner Name", admin_care_of: "Admin / Care Of", owner_address: "Owner Address",
  location_province: "Province", location_municipality: "Municipality", location_barangay: "Barangay",
  type_of_building: "Type of Building", structure_type: "Structure Type",
  building_permit_no: "Building Permit No", cct: "CCT",
  completion_issued_on: "Completion Date", date_constructed: "Date Constructed",
  date_occupied: "Date Occupied", building_age: "Building Age",
  number_of_storeys: "No. of Storeys", total_floor_area: "Total Floor Area",
  unit_cost: "Unit Cost", land_owner: "Land Owner", land_td_no: "Land TD No.", land_arp_no: "Land ARP No.", td_arp_no: "Land TD/ARP No.", land_area: "Land Area",
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

const LANDSCAPE_PLAN_TYPES: PhotoType[] = ["sketch_plan", "perspective_view"];

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
                  <FaasPhotoImage
                    signedUrl={photo.signedUrl}
                    alt={PHOTO_LABELS[type]}
                    mode="preview"
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
          const isLandscapePlan = LANDSCAPE_PLAN_TYPES.includes(type);
          return (
            <div key={type} className={isLandscapePlan ? "photo-page plan-landscape" : "photo-page"}>
              <p className="photo-page-title">{PHOTO_LABELS[type]}</p>
              <FaasPhotoImage signedUrl={photo.signedUrl} alt={PHOTO_LABELS[type]} mode="print" />
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
  // When loaded inside the review queue iframe, suppress AppSidebar/header
  const isEmbedMode = searchParams.get("embed") === "1";

  useEffect(() => {
    if (!urlId) {
      const stored = getStoredFaasDraftId(localStorage, "building");
      if (stored) setDraftId(stored);
    }
  }, [urlId]);

  const {
    confirmSubmitOpen,
    handleConfirmSubmit,
    handleSaveDraft,
    handleSubmit,
    isSaving,
    isSubmitting,
    setConfirmSubmitOpen,
    setSuccessModal,
    successModal,
  } = useBuildingStructurePreviewActions(draftId);

  const { dbRecord, formDataReady, formStatus, statusLoading } =
    useBuildingStructurePreviewData({ draftId, isPrintMode });

  const { photos, photosLoading } = useFaasPhotos<PhotoType>({
    draftId,
    apiPath: "/api/faas/building-structures/photos",
    parentIdQueryParam: "buildingStructureId",
  });

  const { comments, commentsLoading } = useFaasReviewComments({
    draftId,
    apiBasePath: "/api/faas/building-structures",
  });
  // Which comment is active (clicked) — drives field highlight + inline annotation
  const [activeComment, setActiveComment] = useState<ReviewComment | null>(null);

  const SUBMIT_ALLOWED_ROLES = ["municipal_tax_mapper", "municipal_assessor", "laoo", "assistant_provincial_assessor", "provincial_assessor", "admin", "super_admin"];
  const PRINT_ALLOWED_ROLES = ["provincial_assessor", "assistant_provincial_assessor"];
  const { canSubmit, canPrint } = useFaasUserPermissions({
    submitRoles: SUBMIT_ALLOWED_ROLES,
    printRoles: PRINT_ALLOWED_ROLES,
  });
  usePrintBlocker(canPrint);

  // Statuses where the tax mapper cannot edit or re-submit
  const LOCKED_STATUSES = ["submitted", "under_review", "approved"];
  const isLocked = LOCKED_STATUSES.includes(formStatus);

  // ── Server-side PDF print (tamper-proof — opens in browser PDF viewer) ──
  const openPrintPdf = useCallback((includeAttachments: boolean) => {
    if (!draftId) return;
    window.open(
      `/api/print/building-structures/${draftId}${includeAttachments ? "" : "?attachments=0"}`,
      '_blank'
    );
  }, [draftId]);


  return (
    <SidebarProvider>
      {!isEmbedMode && <AppSidebar />}

      <SidebarInset>
        {/* ── Header ── */}
        {!isEmbedMode && (
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
        )}

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
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  onClick={() => openPrintPdf(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Print With Attachments
                </Button>
                <Button
                  onClick={() => openPrintPdf(false)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Print Form Only
                </Button>
              </div>
            </header>
            )}

            {/* ── Form preview (iframe) ── */}
            <div className="bg-white shadow-sm border p-6 mb-6" id="print-area">
              <div className="preview-container">
              <div className="border p-2 bg-white overflow-x-auto">
                  {formDataReady ? (
                    <FaasCommentHighlightScope
                      activeComment={activeComment}
                      fieldLabels={FIELD_LABELS}
                      showInlineComment
                    >
                      <BuildingStructureForm serverData={dbRecord ?? undefined} />
                    </FaasCommentHighlightScope>
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
            <FormStatusBanner
              status={formStatus}
              statusLoading={statusLoading}
              isPrintMode={isPrintMode}
              messages={{
                submitted: { title: "Awaiting Municipal Assessor Review.", message: "This form has been submitted and is locked for editing until it is returned." },
                under_review: { title: "Under Review.", message: "This form is currently being reviewed." },
                returned: { title: "Returned for Review.", message: "This form has been returned with comments. Please address all comments before resubmitting." },
                approved: { title: "Approved.", message: "This form has been fully approved. The Tax Declaration has been unlocked." },
              }}
            />

            {/* Tax Declaration button — approved forms only */}
            {!isPrintMode && formStatus === "approved" && draftId && (
              <div className="print:hidden mb-4">
                <Button
                  onClick={() => router.push(`/tax-declaration/building?id=${draftId}`)}
                  className="w-full sm:w-auto gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Print Tax Declaration
                </Button>
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
                        : "Send to Municipal Assessor for review. The form will be locked until it is returned."}
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

      <SuccessModal
        open={successModal.open}
        title={successModal.title}
        description={successModal.description}
        onConfirm={() => {
          setSuccessModal((prev) => ({ ...prev, open: false }));
          successModal.onConfirm();
        }}
      />

      <ConfirmDialog
        open={confirmSubmitOpen}
        title="Submit for review?"
        description="You will not be able to edit this form until it is returned by the Municipal Assessor."
        confirmLabel="Submit"
        cancelLabel="Cancel"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setConfirmSubmitOpen(false)}
      />
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

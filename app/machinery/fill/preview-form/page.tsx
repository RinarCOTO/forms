"use client";

// React & Next.js
import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Styles
import "@/app/styles/forms-fill.css";

// Third-party
import { Loader2, Save, Send, RotateCcw, MessageSquare, User, Clock, FileText } from "lucide-react";

// UI components
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FaasPhotoImage } from "@/components/faas/FaasPhotoImage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormStatusBanner } from "@/components/ui/form-status-banner";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuccessModal } from "@/components/ui/success-modal";
import { FaasCommentHighlightScope } from "@/hooks/useFaasCommentHighlight";
import { type FaasPhotoRecord, useFaasPhotos } from "@/hooks/useFaasPhotos";
import { useMachineryPreviewActions } from "@/hooks/useMachineryPreviewActions";
import { useFaasUserPermissions } from "@/hooks/useFaasUserPermissions";
import { useMachineryPreviewData } from "@/hooks/useMachineryPreviewData";
import { usePrintBlocker } from "@/hooks/usePrintBlocker";
import { getStoredFaasDraftId } from "@/utils/form-draft-storage";

// RPFAAS components
import MachineryForm from "@/app/components/forms/RPFAAS/machinery";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoType = "machinery_photo" | "nameplate" | "purchase_receipt" | "other_document";

type PhotoRecord = FaasPhotoRecord<PhotoType>;

interface ReviewComment {
  id: string;
  field_name?: string | null;
  comment_text: string;
  suggested_value?: string | null;
  author_name: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PHOTO_LABELS: Record<PhotoType, string> = {
  machinery_photo:  "Photo of Machinery",
  nameplate:        "Nameplate / Specifications",
  purchase_receipt: "Purchase Receipt / Invoice",
  other_document:   "Other Supporting Document",
};

const PHOTO_ORDER: PhotoType[] = [
  "machinery_photo", "nameplate", "purchase_receipt", "other_document",
];

const SUBMIT_ALLOWED_ROLES = [
  "municipal_tax_mapper", "municipal_assessor", "laoo",
  "assistant_provincial_assessor", "provincial_assessor", "admin", "super_admin",
];
const PRINT_ALLOWED_ROLES = ["provincial_assessor", "assistant_provincial_assessor"];
const LOCKED_STATUSES = ["submitted", "under_review", "approved"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtCommentDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Supporting Documents panel
// ---------------------------------------------------------------------------

function SupportingDocuments({ photos }: { photos: PhotoRecord[] }) {
  const validPhotos = PHOTO_ORDER.filter((type) => photos.find((p) => p.photo_type === type)?.signedUrl);
  if (validPhotos.length === 0) return null;

  return (
    <section className="mt-8">
      {/* Screen */}
      <div className="print:hidden">
        <h2 className="text-base font-semibold mb-4 border-b pb-2">Supporting Documents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PHOTO_ORDER.map((type) => {
            const photo = photos.find((p) => p.photo_type === type);
            if (!photo?.signedUrl) return null;
            return (
              <div key={type} className="space-y-2">
                <p className="text-sm font-medium">{PHOTO_LABELS[type]}</p>
                <div className="border rounded-md overflow-hidden bg-muted/20">
                  <FaasPhotoImage signedUrl={photo.signedUrl} alt={PHOTO_LABELS[type]} mode="preview" className="w-full max-h-64 object-contain" />
                </div>
                <p className="text-xs text-muted-foreground truncate">{photo.original_name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Print */}
      <div className="print-only">
        {PHOTO_ORDER.map((type) => {
          const photo = photos.find((p) => p.photo_type === type);
          if (!photo?.signedUrl) return null;
          return (
            <div key={type} className="photo-page">
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
// Main page
// ---------------------------------------------------------------------------

function MachineryPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlId = searchParams.get("id");
  const [draftId, setDraftId] = useState<string | null>(urlId);
  const isPrintMode = searchParams.get("print") === "1";

  useEffect(() => {
    if (!urlId) {
      const stored = getStoredFaasDraftId(localStorage, "machinery");
      if (stored) setDraftId(stored);
    }
  }, [urlId]);

  const { formData, formStatus, statusLoading } = useMachineryPreviewData({ draftId });

  const { photos, photosLoading } = useFaasPhotos<PhotoType>({
    draftId,
    apiPath: "/api/faas/machinery/photos",
    parentIdQueryParam: "machineryId",
  });

  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [activeComment, setActiveComment] = useState<ReviewComment | null>(null);

  const { canSubmit, canPrint } = useFaasUserPermissions({
    submitRoles: SUBMIT_ALLOWED_ROLES,
    printRoles: PRINT_ALLOWED_ROLES,
  });
  usePrintBlocker(canPrint);

  const {
    confirmSubmitOpen,
    handleSaveDraft,
    handleSubmit,
    isSaving,
    isSubmitting,
    setConfirmSubmitOpen,
    successModal,
  } = useMachineryPreviewActions(draftId);

  const isLocked = LOCKED_STATUSES.includes(formStatus);

  // ── PDF print ──
  const openPrintPdf = useCallback((includeAttachments: boolean) => {
    if (!draftId) return;
    window.open(
      `/api/print/machinery/${draftId}${includeAttachments ? "" : "?attachments=0"}`,
      "_blank"
    );
  }, [draftId]);

  // ── Render ──
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b print:hidden">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/machinery/dashboard">Machinery</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Preview &amp; Submit</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex-1 p-6 overflow-y-auto print:p-0">
          <div className={`rpfaas-fill mx-auto ${!isPrintMode && comments.length > 0 ? "max-w-7xl" : "max-w-4xl"}`}>
          <div className={`${!isPrintMode && comments.length > 0 ? "flex gap-6 items-start" : ""}`}>
          <div className={`${!isPrintMode && comments.length > 0 ? "flex-1 min-w-0" : ""}`}>

            {!isPrintMode && (
              <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6 print:hidden">
                <div>
                  <h1 className="rpfaas-fill-title">Preview &amp; Submit</h1>
                  <p className="text-sm text-muted-foreground">
                    Review your form and supporting documents before submitting.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  {canPrint && (
                    <>
                      <Button variant="outline" onClick={() => openPrintPdf(true)} className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Print With Attachments
                      </Button>
                      <Button variant="outline" onClick={() => openPrintPdf(false)} className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Print Form Only
                      </Button>
                    </>
                  )}
                </div>
              </header>
            )}

            {/* ── Form preview ── */}
            <div className="bg-white shadow-sm border p-6 mb-6" id="print-area">
              {statusLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <FaasCommentHighlightScope
                  activeComment={activeComment}
                  scrollToField={false}
                >
                  <MachineryForm data={formData ?? undefined} />
                </FaasCommentHighlightScope>
              )}

              {/* ── Supporting Documents ── */}
              {photosLoading ? (
                <div className="flex justify-center py-8 print:hidden">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <SupportingDocuments photos={photos} />
              )}
            </div>

            {/* ── Status banner ── */}
            <FormStatusBanner
              status={formStatus}
              statusLoading={statusLoading}
              isPrintMode={isPrintMode}
              messages={{
                submitted:    { title: "Awaiting Review.",        message: "This form has been submitted and is locked for editing until it is returned." },
                under_review: { title: "Under Review.",           message: "This form is currently being reviewed." },
                returned:     { title: "Returned for Revision.",  message: "This form was returned with comments. Please address all comments before resubmitting." },
                approved:     { title: "Approved.",               message: "This form has been fully approved." },
              }}
            />

            {/* ── Action buttons ── */}
            <div className="flex flex-wrap gap-2 mt-4 print:hidden">
              {!isLocked && canSubmit && (
                <>
                  <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Save Draft
                  </Button>
                  <Button size="sm" onClick={() => setConfirmSubmitOpen(true)} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                    Submit for Review
                  </Button>
                </>
              )}
              {formStatus === "returned" && (
                <Button variant="outline" size="sm" onClick={() => router.push(`/machinery/fill/step-1?id=${draftId}`)}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Edit Form
                </Button>
              )}
            </div>

          </div>{/* end form column */}

          {/* ── Comments panel ── */}
          {!isPrintMode && comments.length > 0 && (
            <aside className="print:hidden w-80 shrink-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Review Comments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {commentsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />Loading…
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <button
                        key={comment.id}
                        type="button"
                        onClick={() => setActiveComment(prev => prev?.id === comment.id ? null : comment)}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                          activeComment?.id === comment.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        {comment.field_name && (
                          <p className="text-xs font-medium text-primary mb-1 truncate">{comment.field_name}</p>
                        )}
                        <p className="text-foreground">{comment.comment_text}</p>
                        {comment.suggested_value && (
                          <p className="text-xs text-muted-foreground mt-1">Suggested: {comment.suggested_value}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />{comment.author_name}
                          <Clock className="h-3 w-3 ml-1" />{fmtCommentDate(comment.created_at)}
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </aside>
          )}

          </div>{/* end flex row */}
          </div>{/* end rpfaas-fill */}
        </div>{/* end body */}

        {/* Modals */}
        <SuccessModal
          open={successModal.open}
          title={successModal.title}
          description={successModal.description}
          onConfirm={successModal.onConfirm}
        />
        <ConfirmDialog
          open={confirmSubmitOpen}
          title="Submit for Review"
          description="Once submitted, you won't be able to edit this form until the reviewer returns it."
          onConfirm={handleSubmit}
          onCancel={() => setConfirmSubmitOpen(false)}
          confirmLabel="Submit"
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function MachineryPreviewPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <MachineryPreviewContent />
    </Suspense>
  );
}

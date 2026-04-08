"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { StepPagination, LAND_IMPROVEMENT_STEPS } from "@/components/ui/step-pagination";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import "@/app/styles/forms-fill.css";
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
import { Loader2, Upload, X, ImageIcon, AlertTriangle, Info, Lock } from "lucide-react";
import { toast } from "sonner";
import { useFormLock } from "@/hooks/useFormLock";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoType =
  | "barangay_certificate"
  | "ncip_certificate"
  | "sketch_plan"
  | "affidavit_of_ownership"
  | "endorsement_of_assessor"
  | "tax_declaration"
  | "survey_plan"
  | "letter_request"
  | "deed_of_sale"
  | "deed_of_donation"
  | "extra_judicial_settlement"
  | "bir_certificate"
  | "inspection_report";

interface PhotoRecord {
  id: string;
  photo_type: PhotoType;
  storage_path: string;
  original_name: string;
  signedUrl: string | null;
}

// ---------------------------------------------------------------------------
// Photo config per transaction scenario
// ---------------------------------------------------------------------------

type PhotoConfig = { type: PhotoType; label: string; description: string };

const PHOTO_DEFS: Record<PhotoType, PhotoConfig> = {
  barangay_certificate:      { type: "barangay_certificate",      label: "Barangay Certificate",                    description: "Official barangay certificate issued for the property." },
  ncip_certificate:          { type: "ncip_certificate",          label: "NCIP Certificate",                        description: "National Commission on Indigenous Peoples certificate." },
  sketch_plan:               { type: "sketch_plan",               label: "Sketch Plan",                             description: "Survey sketch plan of the land." },
  affidavit_of_ownership:    { type: "affidavit_of_ownership",    label: "Affidavit of Ownership",                  description: "Notarized affidavit attesting to ownership of the property." },
  endorsement_of_assessor:   { type: "endorsement_of_assessor",   label: "Endorsement of Assessor",                 description: "Written endorsement from the municipal assessor." },
  tax_declaration:           { type: "tax_declaration",           label: "Tax Declaration",                         description: "Copy of the existing tax declaration for this property." },
  survey_plan:               { type: "survey_plan",               label: "Survey Plan",                             description: "Approved survey plan of the lot." },
  letter_request:            { type: "letter_request",            label: "Letter Request",                          description: "Formal letter request from the property owner." },
  deed_of_sale:              { type: "deed_of_sale",              label: "Deed of Sale",                            description: "Notarized deed of sale transferring ownership." },
  deed_of_donation:          { type: "deed_of_donation",          label: "Deed of Donation",                        description: "Notarized deed of donation transferring ownership." },
  extra_judicial_settlement: { type: "extra_judicial_settlement", label: "Extra Judicial Settlement",               description: "Notarized extra judicial settlement of estate." },
  bir_certificate:           { type: "bir_certificate",           label: "Certificate of Authorizing Registration (BIR)", description: "BIR certificate confirming payment/clearance for transfer." },
  inspection_report:         { type: "inspection_report",         label: "Inspection Report",                       description: "Field inspection report prepared by the assessor." },
};

function p(...types: PhotoType[]): PhotoConfig[] {
  return types.map(t => PHOTO_DEFS[t]);
}

// ---------------------------------------------------------------------------
// Determine required photos from draft data
// Returns null = no documents required for this transaction code
// ---------------------------------------------------------------------------

function getPhotoConfig(
  transactionCode: string,
  octTctCloaNo: string | null
): PhotoConfig[] | null {
  switch (transactionCode) {
    case "DC": {
      const isTitled = !!octTctCloaNo;
      return isTitled
        ? p("barangay_certificate", "ncip_certificate", "sketch_plan", "affidavit_of_ownership", "endorsement_of_assessor")
        : p("sketch_plan", "tax_declaration");
    }
    case "SD":
      return p("survey_plan", "letter_request");
    case "CS":
      return p("letter_request", "survey_plan");
    case "TR":
      return p("deed_of_sale", "deed_of_donation", "extra_judicial_settlement", "bir_certificate");
    case "PC":
      return p("inspection_report", "sketch_plan", "letter_request");
    case "RC":
      return p("inspection_report", "letter_request", "sketch_plan");
    case "DP":
    case "GR":
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// PhotoUploadCard
// ---------------------------------------------------------------------------

interface PhotoUploadCardProps {
  type: PhotoType;
  label: string;
  description: string;
  photo?: PhotoRecord;
  isUploading: boolean;
  isRemoving: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
  disabled: boolean;
}

function PhotoUploadCard({
  label,
  description,
  photo,
  isUploading,
  isRemoving,
  onFileSelect,
  onRemove,
  inputRef,
  disabled,
}: PhotoUploadCardProps) {
  const localRef = useRef<HTMLInputElement | null>(null);

  const handleInputRef = (el: HTMLInputElement | null) => {
    localRef.current = el;
    inputRef(el);
  };

  const triggerInput = () => {
    if (!disabled && !isUploading) {
      localRef.current?.click();
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div>
        <h3 className="font-medium text-sm">{label}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      {photo?.signedUrl ? (
        /* ── Uploaded state ── */
        <div className="space-y-2">
          <div className="border rounded-md overflow-hidden bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.signedUrl}
              alt={label}
              className="w-full max-h-56 object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate max-w-[60%]">
              {photo.original_name}
            </span>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                ref={handleInputRef}
                disabled={disabled || isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileSelect(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerInput}
                disabled={disabled || isUploading || isRemoving}
              >
                {isUploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                <span className="ml-1">Replace</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRemove}
                disabled={disabled || isUploading || isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                <span className="ml-1">Remove</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Empty state ── */
        <div
          onClick={triggerInput}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled || isUploading
              ? "opacity-50 cursor-not-allowed border-border"
              : "cursor-pointer border-border hover:border-primary hover:bg-muted/20"
          }`}
        >
          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No file uploaded</p>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            ref={handleInputRef}
            disabled={disabled || isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={(e) => {
              e.stopPropagation();
              triggerInput();
            }}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            JPG, PNG, WebP, or PDF — max 10 MB
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function LandImprovementsFormFillPage5() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlId = searchParams.get("id");
  const [draftId, setDraftId] = useState<string | null>(urlId);
  const { checking: lockChecking, locked, lockedBy } = useFormLock('land_improvements', draftId);

  // Draft metadata needed to determine photo requirements
  const [transactionCode, setTransactionCode] = useState<string>("");
  const [octTctCloaNo, setOctTctCloaNo] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(true);

  useEffect(() => {
    if (!urlId) {
      const stored = localStorage.getItem("land_draft_id");
      if (stored) setDraftId(stored);
    }
  }, [urlId]);

  // Load draft to get transaction_code and oct_tct_cloa_no
  useEffect(() => {
    const id = urlId || localStorage.getItem("land_draft_id");
    if (!id) { setDraftLoading(false); return; }
    fetch(`/api/faas/land-improvements/${id}`)
      .then(r => r.json())
      .then(result => {
        if (result.success && result.data) {
          setTransactionCode(result.data.transaction_code ?? "");
          setOctTctCloaNo(result.data.oct_tct_cloa_no ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setDraftLoading(false));
  }, [urlId]);

  const photoConfig = getPhotoConfig(transactionCode, octTctCloaNo);

  const [photos, setPhotos] = useState<Partial<Record<PhotoType, PhotoRecord>>>({});
  const [uploading, setUploading] = useState<Partial<Record<PhotoType, boolean>>>({});
  const [removing, setRemoving] = useState<Partial<Record<PhotoType, boolean>>>({});
  const [photosLoading, setPhotosLoading] = useState(true);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [photoToRemove, setPhotoToRemove] = useState<PhotoType | null>(null);

  const fileInputRefs = useRef<Partial<Record<PhotoType, HTMLInputElement | null>>>({});

  const loadPhotos = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/faas/land-improvements/photos?landImprovementId=${id}`);
      if (!res.ok) return;
      const result = await res.json();
      if (result.success) {
        const map: Partial<Record<PhotoType, PhotoRecord>> = {};
        for (const p of result.data as PhotoRecord[]) {
          map[p.photo_type] = p;
        }
        setPhotos(map);
      }
    } catch {
      // Non-fatal
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (draftId) {
      loadPhotos(draftId);
    } else {
      setPhotosLoading(false);
    }
  }, [draftId, loadPhotos]);

  const handleFileSelect = useCallback(
    async (photoType: PhotoType, file: File) => {
      if (!draftId) {
        toast.error("Please save the form in a previous step before uploading files.");
        return;
      }
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Only JPG, PNG, WebP, or PDF files are allowed.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File must be under 10 MB.');
        return;
      }

      setUploading(prev => ({ ...prev, [photoType]: true }));
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("landImprovementId", draftId);
        formData.append("photoType", photoType);

        const res = await fetch("/api/faas/land-improvements/photos", {
          method: "POST",
          body: formData,
        });
        const result = await res.json();

        if (result.success) {
          toast.success("File uploaded successfully.");
          await loadPhotos(draftId);
        } else {
          toast.error("Upload failed: " + (result.error ?? "Unknown error"));
        }
      } catch {
        toast.error("Error uploading file. Please try again.");
      } finally {
        setUploading(prev => ({ ...prev, [photoType]: false }));
        const input = fileInputRefs.current[photoType];
        if (input) input.value = "";
      }
    },
    [draftId, loadPhotos]
  );

  const handleRemove = useCallback((photoType: PhotoType) => {
    setPhotoToRemove(photoType);
    setRemoveDialogOpen(true);
  }, []);

  const confirmRemove = useCallback(async () => {
    if (!photoToRemove) return;
    const photo = photos[photoToRemove];
    if (!photo) return;

    setRemoving(prev => ({ ...prev, [photoToRemove]: true }));
    setRemoveDialogOpen(false);
    try {
      const res = await fetch(`/api/faas/land-improvements/photos/${photo.id}`, { method: "DELETE" });
      const result = await res.json();

      if (result.success) {
        setPhotos(prev => {
          const next = { ...prev };
          delete next[photoToRemove];
          return next;
        });
        toast.success("File removed.");
      } else {
        toast.error("Failed to remove file: " + (result.error ?? "Unknown error"));
      }
    } catch {
      toast.error("Error removing file. Please try again.");
    } finally {
      setRemoving(prev => ({ ...prev, [photoToRemove]: false }));
      setPhotoToRemove(null);
    }
  }, [photoToRemove, photos]);

  const navParams = draftId ? `?id=${draftId}` : "";

  const isLoading = draftLoading || photosLoading;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/land-other-improvements/dashboard">
                  Land &amp; Other Improvements
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Supporting Documents</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            <header className="rpfaas-fill-header mb-6">
              <h1 className="rpfaas-fill-title">Fill-up Form: Supporting Documents</h1>
              <p className="text-sm text-muted-foreground">
                Upload the required supporting documents for this property assessment.
                Files are stored securely and will be included in the preview and print.
              </p>
            </header>

            {lockChecking && (
              <div className="flex items-center gap-2 mb-4 rounded-md border bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking form availability…
              </div>
            )}
            {!lockChecking && locked && (
              <div className="flex items-center gap-2 mb-4 rounded-md border border-yellow-400/50 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                <Lock className="h-4 w-4 shrink-0" />
                <span><strong>{lockedBy}</strong> is currently editing this form. You can view it but cannot make changes.</span>
              </div>
            )}

            {/* No-draft warning */}
            {!draftId && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  A saved draft is required before you can upload files. Go back to a
                  previous step and save your draft first.
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : photoConfig === null ? (
              /* DP / GR and unknown codes — no documents required */
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  No supporting documents are required for transaction code <strong>{transactionCode || "—"}</strong>.
                  You may proceed to the next step.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {photoConfig.map(({ type, label, description }) => (
                  <PhotoUploadCard
                    key={type}
                    type={type}
                    label={label}
                    description={description}
                    photo={photos[type]}
                    isUploading={!!uploading[type]}
                    isRemoving={!!removing[type]}
                    onFileSelect={(file) => handleFileSelect(type, file)}
                    onRemove={() => handleRemove(type)}
                    inputRef={(el) => { fileInputRefs.current[type] = el; }}
                    disabled={!draftId || locked || lockChecking}
                  />
                ))}
              </div>
            )}

            <StepPagination
              currentStep={5}
              draftId={draftId}
              isDirty={false}
              onNext={() => router.push(`/land-other-improvements/fill/step-6${navParams}`)}
              basePath="land-other-improvements"
              steps={LAND_IMPROVEMENT_STEPS}
              draftStorageKey="land_draft_id"
            />
          </div>
        </div>
      </SidebarInset>
      <ReviewCommentsFloat draftId={draftId} />

      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove File</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default function LandImprovementsFormFillPage5Wrapper() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <LandImprovementsFormFillPage5 />
    </Suspense>
  );
}

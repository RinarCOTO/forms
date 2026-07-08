"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { StepPagination } from "@/components/ui/step-pagination";
import { LAND_STEPS } from "@/app/land-other-improvements/fill/constants";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import "@/app/styles/forms-fill.css";
import { Button } from "@/components/ui/button";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { FormLockBanner } from "@/components/ui/form-lock-banner";
import { Loader2, Upload, X, ImageIcon, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { useFormLock } from "@/hooks/useFormLock";
import {
  formatFileSize,
  prepareSupportingDocumentForUpload,
} from "@/utils/image-compression";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStoredFaasDraftId } from "@/utils/form-draft-storage";
import {
  getAttachmentConfigForTransaction,
  type AttachmentConfig,
  type LandAttachmentType,
} from "@/utils/faas-attachment-rules";
import {
  buildMemorandaFromAttachments,
  mergeAttachmentMemoranda,
} from "@/utils/faas-memoranda";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoType = LandAttachmentType;

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

type PhotoConfig = AttachmentConfig<PhotoType>;

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
            JPG, PNG, WebP, or PDF — images auto-compress, PDF max 10 MB
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
      const stored = getStoredFaasDraftId(localStorage, "land");
      if (stored) setDraftId(stored);
    }
  }, [urlId]);

  // Load draft to get transaction_code and oct_tct_cloa_no
  useEffect(() => {
    const id = urlId || getStoredFaasDraftId(localStorage, "land");
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

  const photoConfig = getAttachmentConfigForTransaction({
    rpfaasType: "land",
    transactionCode,
    octTctCloaNo,
  }) as PhotoConfig[] | null;

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

  const updateMemorandaAfterUpload = useCallback(async (photoType: PhotoType) => {
    if (!draftId || !photoConfig) return;

    const uploadedTypes = photoConfig
      .map((config) => config.type)
      .filter((type) => type === photoType || photos[type]);

    let existingMemoranda = "";
    try {
      existingMemoranda = localStorage.getItem("land_memoranda_p6")?.trim() ?? "";
    } catch {
      existingMemoranda = "";
    }

    let memoTransactionCode = transactionCode;
    try {
      const draftRes = await fetch(`/api/faas/land-improvements/${draftId}`);
      if (draftRes.ok) {
        const draftResult = await draftRes.json();
        const draftData = draftResult?.data;
        existingMemoranda ||= String(draftData?.memoranda ?? "").trim();
        memoTransactionCode ||= draftData?.transaction_code ?? "";
      }
    } catch {
      // A failed read should not block the local draft suggestion.
    }

    const memorandaDraft = buildMemorandaFromAttachments({
      transactionCode: memoTransactionCode,
      attachmentConfigs: photoConfig,
      uploadedTypes,
    });
    const nextMemoranda = mergeAttachmentMemoranda({
      attachmentMemoranda: memorandaDraft,
      existingMemoranda,
    });
    if (!nextMemoranda || nextMemoranda === existingMemoranda) return;

    try {
      localStorage.setItem("land_memoranda_p6", nextMemoranda);
    } catch {
      // Saving to the record below is still enough for direct step navigation.
    }

    try {
      const saveRes = await fetch(`/api/faas/land-improvements/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoranda: nextMemoranda }),
      });
      toast.success(
        saveRes.ok
          ? "Memoranda attachment line updated."
          : "Memoranda draft prepared for step 6."
      );
    } catch {
      toast.info("Memoranda draft prepared for step 6.");
    }
  }, [draftId, photoConfig, photos, transactionCode]);

  const handleFileSelect = useCallback(
    async (photoType: PhotoType, file: File) => {
      if (!draftId) {
        toast.error("Please save the form in a previous step before uploading files.");
        return;
      }
      setUploading(prev => ({ ...prev, [photoType]: true }));
      try {
        const prepared = await prepareSupportingDocumentForUpload(file);
        if (!prepared.ok) {
          toast.error(prepared.error);
          return;
        }

        const formData = new FormData();
        formData.append("file", prepared.file);
        formData.append("landImprovementId", draftId);
        formData.append("photoType", photoType);

        const res = await fetch("/api/faas/land-improvements/photos", {
          method: "POST",
          body: formData,
        });
        const result = await res.json();

        if (result.success) {
          toast.success(
            prepared.compressed
              ? `Image compressed from ${formatFileSize(prepared.originalSize)} to ${formatFileSize(prepared.file.size)} and uploaded.`
              : "File uploaded successfully."
          );
          await updateMemorandaAfterUpload(photoType);
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
    [draftId, loadPhotos, updateMemorandaAfterUpload]
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
    <FormFillLayout
      breadcrumbParent={{ label: "Land & Other Improvements", href: "/land-other-improvements/dashboard" }}
      pageTitle="Supporting Documents"
      sidePanel={<>
        <ErrorBoundary><ReviewCommentsFloat draftId={draftId} formType="land" /></ErrorBoundary>
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
      </>}
    >
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: Supporting Documents</h1>
                <p className="text-sm text-muted-foreground">
                  Upload the required supporting documents for this property assessment.
                  Files are stored securely and will be included in the preview and print.
                </p>
              </div>
            </header>

            <FormLockBanner locked={locked} lockedBy={lockedBy} />

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
              steps={LAND_STEPS}
              draftStorageKey="land_draft_id"
            />
    </FormFillLayout>
  );
}

export default function LandImprovementsFormFillPage5Wrapper() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <LandImprovementsFormFillPage5 />
    </Suspense>
  );
}

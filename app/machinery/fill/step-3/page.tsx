"use client";

// React & Next.js
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Styles
import "@/app/styles/forms-fill.css";

// Third-party
import { Loader2, Upload, X, ImageIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// UI components
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { FormLockBanner } from "@/components/ui/form-lock-banner";
import { StepPagination } from "@/components/ui/step-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Hooks
import { useFormLock } from "@/hooks/useFormLock";

// Constants
import { MACHINERY_STEPS } from "@/app/machinery/fill/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoType =
  | "machinery_photo"
  | "nameplate"
  | "purchase_receipt"
  | "other_document";

interface PhotoRecord {
  id: string;
  photo_type: PhotoType;
  storage_path: string;
  original_name: string;
  signedUrl: string | null;
}

// ---------------------------------------------------------------------------
// Config — defines what upload slots appear on the page
// ---------------------------------------------------------------------------

const PHOTO_CONFIG: { type: PhotoType; label: string; description: string }[] = [
  {
    type: "machinery_photo",
    label: "Photo of Machinery",
    description: "Actual photograph of the machinery unit.",
  },
  {
    type: "nameplate",
    label: "Nameplate / Specifications",
    description: "Photo of the manufacturer's nameplate showing model, serial number, and specs.",
  },
  {
    type: "purchase_receipt",
    label: "Purchase Receipt / Invoice",
    description: "Official receipt or invoice showing the acquisition cost.",
  },
  {
    type: "other_document",
    label: "Other Supporting Document",
    description: "Any other relevant document such as import papers or sworn statement.",
  },
];

// ---------------------------------------------------------------------------
// PhotoUploadCard — renders one upload slot (empty or uploaded)
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
    if (!disabled && !isUploading) localRef.current?.click();
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
            <img src={photo.signedUrl} alt={label} className="w-full max-h-56 object-contain" />
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
                {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                <span className="ml-1">Replace</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRemove}
                disabled={disabled || isUploading || isRemoving}
              >
                {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
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
            onClick={(e) => { e.stopPropagation(); triggerInput(); }}
          >
            {isUploading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading…</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />Choose File</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP, or PDF — max 10 MB</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function MachineryStep3Content() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlId = searchParams.get("id");
  const [draftId, setDraftId] = useState<string | null>(urlId);
  const { checking: lockChecking, locked, lockedBy } = useFormLock("machinery", draftId);

  useEffect(() => {
    if (!urlId) {
      const stored = localStorage.getItem("draft_id");
      if (stored) setDraftId(stored);
    }
  }, [urlId]);

  const [photos, setPhotos] = useState<Partial<Record<PhotoType, PhotoRecord>>>({});
  const [uploading, setUploading] = useState<Partial<Record<PhotoType, boolean>>>({});
  const [removing, setRemoving] = useState<Partial<Record<PhotoType, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [photoToRemove, setPhotoToRemove] = useState<PhotoType | null>(null);

  const fileInputRefs = useRef<Partial<Record<PhotoType, HTMLInputElement | null>>>({});

  // ── Load existing photos ──
  const loadPhotos = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/faas/machinery/photos?machineryId=${id}`);
      if (!res.ok) return;
      const result = await res.json();
      if (result.success) {
        const map: Partial<Record<PhotoType, PhotoRecord>> = {};
        for (const p of result.data as PhotoRecord[]) map[p.photo_type] = p;
        setPhotos(map);
      }
    } catch {
      // Non-fatal — photos simply won't pre-populate
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (draftId) loadPhotos(draftId);
    else setIsLoading(false);
  }, [draftId, loadPhotos]);

  // ── Upload ──
  const handleFileSelect = useCallback(async (photoType: PhotoType, file: File) => {
    if (!draftId) {
      toast.error("Please save the form in a previous step before uploading files.");
      return;
    }
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!ALLOWED.includes(file.type)) { toast.error("Only JPG, PNG, WebP, or PDF files are allowed."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB."); return; }

    setUploading((prev) => ({ ...prev, [photoType]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("machineryId", draftId);
      formData.append("photoType", photoType);

      const res = await fetch("/api/faas/machinery/photos", { method: "POST", body: formData });
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
      setUploading((prev) => ({ ...prev, [photoType]: false }));
      const input = fileInputRefs.current[photoType];
      if (input) input.value = "";
    }
  }, [draftId, loadPhotos]);

  // ── Remove ──
  const handleRemove = useCallback((photoType: PhotoType) => {
    setPhotoToRemove(photoType);
    setRemoveDialogOpen(true);
  }, []);

  const confirmRemove = useCallback(async () => {
    if (!photoToRemove) return;
    const photo = photos[photoToRemove];
    if (!photo) return;

    setRemoving((prev) => ({ ...prev, [photoToRemove]: true }));
    setRemoveDialogOpen(false);
    try {
      const res = await fetch(`/api/faas/machinery/photos/${photo.id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setPhotos((prev) => { const next = { ...prev }; delete next[photoToRemove]; return next; });
        toast.success("File removed.");
      } else {
        toast.error("Failed to remove: " + (result.error ?? "Unknown error"));
      }
    } catch {
      toast.error("Error removing file. Please try again.");
    } finally {
      setRemoving((prev) => ({ ...prev, [photoToRemove]: false }));
      setPhotoToRemove(null);
    }
  }, [photoToRemove, photos]);

  // ── Save draft ──
  const handleSaveDraft = useCallback(async () => {
    if (!draftId) { toast.error("No draft found. Go back and save a previous step first."); return; }
    setIsSavingDraft(true);
    try {
      const res = await fetch(`/api/faas/machinery/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (res.ok) toast.success("Draft saved successfully.");
      else toast.error("Failed to save draft.");
    } catch {
      toast.error("Error saving draft.");
    } finally {
      setIsSavingDraft(false);
    }
  }, [draftId]);

  const navParams = draftId ? `?id=${draftId}` : "";

  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Machinery", href: "#" }}
      pageTitle="Step 3: Supporting Documents"
      sidePanel={
        <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remove File</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this file? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmRemove}>Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="rpfaas-fill-title">Fill-up Form: RPFAAS - Machinery</h1>
          <p className="text-sm text-muted-foreground">
            Upload supporting documents for this machinery. Files are stored securely and included in the print preview.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveDraft}
          disabled={isSavingDraft || !draftId || locked || lockChecking}
          className="shrink-0"
        >
          {isSavingDraft ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Draft"}
        </Button>
      </header>

      <FormLockBanner locked={locked} lockedBy={lockedBy} />

      {/* No-draft warning */}
      {!draftId && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            A saved draft is required before uploading files. Go back to step 1 or 2 and save first.
          </p>
        </div>
      )}

      {/* Upload cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {PHOTO_CONFIG.map(({ type, label, description }) => (
            <ErrorBoundary key={type}>
              <PhotoUploadCard
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
            </ErrorBoundary>
          ))}
        </div>
      )}

      <StepPagination
        currentStep={3}
        draftId={draftId}
        isDirty={false}
        onNext={() => router.push(`/machinery/fill/step-4${navParams}`)}
        basePath="machinery"
        steps={MACHINERY_STEPS}
      />
    </FormFillLayout>
  );
}

export default function MachineryStep3Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <MachineryStep3Content />
    </Suspense>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { StepPagination } from "@/components/ui/step-pagination";
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
import { Loader2, Upload, X, ImageIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

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

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PHOTO_CONFIG: { type: PhotoType; label: string; description: string }[] =
  [
    {
      type: "sketch_plan",
      label: "Sketch Plan",
      description:
        "Architectural or engineering sketch plan of the property.",
    },
    {
      type: "perspective_view",
      label: "Perspective View",
      description:
        "Visual perspective drawing or photograph of the building.",
    },
    {
      type: "barangay_certificate",
      label: "Barangay Certificate",
      description:
        "Official barangay certificate issued for the property.",
    },
    {
      type: "other_certificate",
      label: "Another Certificate",
      description: "Any other supporting certificate or document.",
    },
  ];

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
              {/* Replace: allow swapping to a different file */}
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
          <p className="text-sm text-muted-foreground mb-3">No image uploaded</p>
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

function BuildingStructureFormFillPage5() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resolve draftId from URL param first, then fall back to localStorage
  const urlId = searchParams.get("id");
  const [draftId, setDraftId] = useState<string | null>(urlId);

  useEffect(() => {
    if (!urlId) {
      const stored = localStorage.getItem("draft_id");
      if (stored) setDraftId(stored);
    }
  }, [urlId]);

  const [photos, setPhotos] = useState<
    Partial<Record<PhotoType, PhotoRecord>>
  >({});
  const [uploading, setUploading] = useState<
    Partial<Record<PhotoType, boolean>>
  >({});
  const [removing, setRemoving] = useState<
    Partial<Record<PhotoType, boolean>>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  // Ref bag for each hidden file input
  const fileInputRefs = useRef<Partial<Record<PhotoType, HTMLInputElement | null>>>({});

  // ── Load existing photos when draftId is known ──
  const loadPhotos = useCallback(async (id: string) => {
    try {
      const res = await fetch(
        `/api/building-other-structure/photos?buildingStructureId=${id}`
      );
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
      // Non-fatal: photos simply won't pre-populate
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (draftId) {
      loadPhotos(draftId);
    } else {
      setIsLoading(false);
    }
  }, [draftId, loadPhotos]);

  // ── Upload handler ──
  const handleFileSelect = useCallback(
    async (photoType: PhotoType, file: File) => {
      if (!draftId) {
        toast.error(
          "Please save the form in a previous step before uploading images."
        );
        return;
      }

      setUploading((prev) => ({ ...prev, [photoType]: true }));
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("buildingStructureId", draftId);
        formData.append("photoType", photoType);

        const res = await fetch("/api/building-other-structure/photos", {
          method: "POST",
          body: formData,
        });
        const result = await res.json();

        if (result.success) {
          toast.success("Image uploaded successfully.");
          // Refresh the photo list to get the new signed URL
          await loadPhotos(draftId);
        } else {
          toast.error("Upload failed: " + (result.error ?? "Unknown error"));
        }
      } catch {
        toast.error("Error uploading image. Please try again.");
      } finally {
        setUploading((prev) => ({ ...prev, [photoType]: false }));
        // Reset the file input so the same file can be re-selected if needed
        const input = fileInputRefs.current[photoType];
        if (input) input.value = "";
      }
    },
    [draftId, loadPhotos]
  );

  // ── Remove handler ──
  const handleRemove = useCallback(
    async (photoType: PhotoType) => {
      const photo = photos[photoType];
      if (!photo) return;

      setRemoving((prev) => ({ ...prev, [photoType]: true }));
      try {
        const res = await fetch(
          `/api/building-other-structure/photos/${photo.id}`,
          { method: "DELETE" }
        );
        const result = await res.json();

        if (result.success) {
          setPhotos((prev) => {
            const next = { ...prev };
            delete next[photoType];
            return next;
          });
          toast.success("Image removed.");
        } else {
          toast.error(
            "Failed to remove image: " + (result.error ?? "Unknown error")
          );
        }
      } catch {
        toast.error("Error removing image. Please try again.");
      } finally {
        setRemoving((prev) => ({ ...prev, [photoType]: false }));
      }
    },
    [photos]
  );

  const navParams = draftId ? `?id=${draftId}` : "";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* ── Header ── */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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
                <BreadcrumbPage>Supporting Documents</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* ── Body ── */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            {/* Title */}
            <header className="rpfaas-fill-header mb-6">
              <h1 className="rpfaas-fill-title">
                Fill-up Form: Supporting Documents
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload the required supporting documents for this property
                assessment. Images are stored securely and will be included in
                the preview and print.
              </p>
            </header>

            {/* No-draft warning */}
            {!draftId && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  A saved draft is required before you can upload images. Go
                  back to a previous step and save your draft first.
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
                    inputRef={(el) => {
                      fileInputRefs.current[type] = el;
                    }}
                    disabled={!draftId}
                  />
                ))}
              </div>
            )}

            {/* Footer navigation */}
            <StepPagination
              currentStep={5}
              draftId={draftId}
              isDirty={false}
              onNext={() => router.push(`/building-other-structure/fill/step-6${navParams}`)}
            />
          </div>
        </div>
      </SidebarInset>
      <ReviewCommentsFloat draftId={draftId} />
    </SidebarProvider>
  );
}

// Suspense wrapper is required because useSearchParams needs it
export default function BuildingStructureFormFillPage5Wrapper() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <BuildingStructureFormFillPage5 />
    </Suspense>
  );
}

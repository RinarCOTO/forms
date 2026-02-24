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
import Link from "next/link";
import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Save, Send, Printer } from "lucide-react";

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

// ---------------------------------------------------------------------------
// Collect form fields from localStorage (non-photo data)
// ---------------------------------------------------------------------------

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
      const cleanKey = key.replace(/_p[0-9]$/, "");
      if (
        value &&
        (cleanKey.includes("flooring_material") ||
          cleanKey.includes("wall_material"))
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
  if (photos.length === 0) return null;

  return (
    <section className="mt-8 print:mt-4">
      <h2 className="text-base font-semibold mb-4 border-b pb-2">
        Supporting Documents
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:grid-cols-2">
        {PHOTO_ORDER.map((type) => {
          const photo = photos.find((p) => p.photo_type === type);
          if (!photo?.signedUrl) return null;
          return (
            <div key={type} className="space-y-2">
              <p className="text-sm font-medium">{PHOTO_LABELS[type]}</p>
              <div className="border rounded-md overflow-hidden bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.signedUrl}
                  alt={PHOTO_LABELS[type]}
                  className="w-full max-h-64 object-contain print:max-h-48"
                />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {photo.original_name}
              </p>
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

  useEffect(() => {
    if (!urlId) {
      const stored = localStorage.getItem("draft_id");
      if (stored) setDraftId(stored);
    }
  }, [urlId]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<string | number>("100vh");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

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

  // ── Print: use window.print() so the Supporting Documents section is included ──
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      setTimeout(() => {
        const height = iframe.contentWindow?.document.body.scrollHeight;
        if (height) setIframeHeight(`${height + 50}px`);
      }, 500);
    }
  }, []);

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
    setIsSubmitting(true);
    try {
      const formData = collectFormData();
      formData.status = "pending";
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
        alert("Form submitted successfully! ID: " + result.data?.id);
        localStorage.clear();
        router.push("/building-other-structure/dashboard");
      } else {
        const error = await response.json();
        alert("Failed to submit form: " + (error.message ?? "Unknown error"));
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
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-5xl mx-auto">
            {/* Page title row */}
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

            {/* ── Form preview (iframe) ── */}
            <div className="bg-white shadow-sm border p-6 mb-6" id="print-area">
              <div className="preview-container">
                <div className="mb-2 text-sm text-muted-foreground print:hidden">
                  Preview:{" "}
                  <Link
                    href="/building-other-structure"
                    className="text-blue-600 hover:underline"
                  >
                    /building-other-structure
                  </Link>
                </div>
                <div className="border p-2 bg-white">
                  <iframe
                    ref={iframeRef}
                    src="/building-other-structure"
                    title="Building Structure Preview"
                    className="w-full border"
                    style={{ height: iframeHeight }}
                    onLoad={handleIframeLoad}
                  />
                  <p className="text-sm text-muted-foreground mt-2 print:hidden">
                    The form content is loaded in the iframe above. Review all
                    information before submitting.
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

            {/* ── Action buttons ── */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
              <Button
                onClick={() =>
                  router.push(
                    `/building-other-structure/fill/step-6${draftId ? `?id=${draftId}` : ""}`
                  )
                }
                variant="outline"
                className="w-full sm:w-auto"
              >
                Back to Edit
              </Button>

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
                      <Send className="mr-2 h-4 w-4" />
                      Submit Form
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground text-center print:hidden">
              <p>
                <strong>Save as Draft:</strong> Save your progress and continue
                editing later.
              </p>
              <p>
                <strong>Submit Form:</strong> Submit for review. You won&apos;t
                be able to edit after submission.
              </p>
            </div>
          </div>
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

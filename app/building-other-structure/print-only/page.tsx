"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BuildingStructureForm from "@/app/components/forms/RPFAAS/building_structure_form";
import { FaasPrintPhotoAttachmentPages } from "@/components/faas/FaasPrintPhotoAttachmentPages";
import { type FaasPhotoRecord, useFaasPhotos } from "@/hooks/useFaasPhotos";
import { useFaasPrintFooterReady } from "@/hooks/useFaasPrintFooterReady";
import { usePrintPhotoReadiness } from "@/hooks/usePrintPhotoReadiness";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoType =
  | "sketch_plan"
  | "perspective_view"
  | "barangay_certificate"
  | "other_certificate";

const PHOTO_LABELS: Record<PhotoType, string> = {
  sketch_plan: "Sketch Plan",
  perspective_view: "Perspective View",
  barangay_certificate: "Barangay Certificate",
  other_certificate: "Sworn Statement",
};

const PHOTO_ORDER: PhotoType[] = [
  "sketch_plan",
  "perspective_view",
  "barangay_certificate",
  "other_certificate",
];

const LANDSCAPE_PLAN_TYPES: PhotoType[] = ["sketch_plan", "perspective_view"];

type PhotoRecord = FaasPhotoRecord<PhotoType> & { note?: string | null };

// ---------------------------------------------------------------------------
// Main print-only page
// ---------------------------------------------------------------------------

function PrintOnlyPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const includeAttachments = searchParams.get("attachments") !== "0";

  const [data, setData] = useState<any>(null);
  const footerReady = useFaasPrintFooterReady(Boolean(data));
  const { photos, photosLoading } = useFaasPhotos<PhotoType>({
    draftId: includeAttachments ? id : null,
    apiPath: "/api/faas/building-structures/photos",
    parentIdQueryParam: "buildingStructureId",
  });
  const printablePhotos = (photos as PhotoRecord[]).filter((photo) => photo.signedUrl);
  const { markPhotoReady, photosReady } = usePrintPhotoReadiness({
    photoCount: printablePhotos.length,
    loading: photosLoading,
  });

  useEffect(() => {
    if (!id) return;

    // Fetch form data
    fetch(`/api/faas/building-structures/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) setData(result.data);
      })
      .catch(() => {});

  }, [id]);

  // Signal Puppeteer via body attribute — avoids adding a wrapper div to the document flow
  useEffect(() => {
    if (data && !photosLoading && photosReady && footerReady) {
      document.body.setAttribute("data-all-ready", "true");
    } else {
      document.body.removeAttribute("data-all-ready");
    }
  }, [data, photosLoading, photosReady, footerReady]);

  if (!data) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <>
      <style>{`
        html, body { background: white !important; margin: 0; padding: 0; }
        .photo-attachment-page {
          box-sizing: border-box;
          min-height: 270mm;
          padding: 4mm 8mm 0 8mm;
        }
        .photo-attachment-page.plan-landscape {
          page: plan-landscape-page;
          min-height: 190mm;
          padding: 4mm 8mm 0 8mm;
        }
      `}</style>

      {/* Main RPFAAS form — sets data-print-ready internally */}
      <div style={{ background: "white", padding: "3mm" }}>
        <BuildingStructureForm serverData={data} />
      </div>

      {/* Photo attachment pages */}
      {includeAttachments && (
        <FaasPrintPhotoAttachmentPages
          photos={printablePhotos}
          photoOrder={PHOTO_ORDER}
          photoLabels={PHOTO_LABELS}
          landscapeTypes={LANDSCAPE_PLAN_TYPES}
          onPhotoReady={markPhotoReady}
          variant="building"
          showFilename={false}
          showNote
        />
      )}
    </>
  );
}

export default function PrintOnlyPageWrapper() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <PrintOnlyPage />
    </Suspense>
  );
}

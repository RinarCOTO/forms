"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MachineryForm, { MachineryFormData } from "@/app/components/forms/RPFAAS/machinery";
import { useFaasPhotos } from "@/hooks/useFaasPhotos";
import { useFaasPrintFooterReady } from "@/hooks/useFaasPrintFooterReady";
import { FaasPrintPhotoAttachmentPages } from "@/components/faas/FaasPrintPhotoAttachmentPages";
import { usePrintPhotoReadiness } from "@/hooks/usePrintPhotoReadiness";

type PhotoType = "machinery_photo" | "nameplate" | "purchase_receipt" | "other_document";

const PHOTO_LABELS: Record<PhotoType, string> = {
  machinery_photo: "Photo of Machinery",
  nameplate: "Nameplate / Specifications",
  purchase_receipt: "Purchase Receipt / Invoice",
  other_document: "Other Supporting Document",
};

const PHOTO_ORDER: PhotoType[] = [
  "machinery_photo",
  "nameplate",
  "purchase_receipt",
  "other_document",
];

function PrintOnlyPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const includeAttachments = searchParams.get("attachments") !== "0";
  const [data, setData] = useState<MachineryFormData | null>(null);
  const footerReady = useFaasPrintFooterReady(Boolean(data));

  const { photos, photosLoading } = useFaasPhotos<PhotoType>({
    draftId: includeAttachments ? id : null,
    apiPath: "/api/faas/machinery/photos",
    parentIdQueryParam: "machineryId",
  });

  const printablePhotos = photos.filter((photo) => photo.signedUrl);
  const { markPhotoReady, photosReady } = usePrintPhotoReadiness({
    photoCount: printablePhotos.length,
    loading: photosLoading,
  });

  useEffect(() => {
    if (!id) return;
    fetch(`/api/faas/machinery/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) setData(result.data);
      })
      .catch(() => {});
  }, [id]);

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
      <style>{`html, body { background: white !important; margin: 0; padding: 0; }`}</style>
      <div style={{ background: "white", padding: "3mm" }}>
        <MachineryForm data={data} />
      </div>
      {includeAttachments && (
        <FaasPrintPhotoAttachmentPages
          photos={printablePhotos}
          photoOrder={PHOTO_ORDER}
          photoLabels={PHOTO_LABELS}
          onPhotoReady={markPhotoReady}
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

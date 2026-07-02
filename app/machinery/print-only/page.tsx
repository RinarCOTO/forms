"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MachineryForm, { MachineryFormData } from "@/app/components/forms/RPFAAS/machinery";
import { type FaasPhotoRecord, useFaasPhotos } from "@/hooks/useFaasPhotos";
import { useFaasPrintFooterReady } from "@/hooks/useFaasPrintFooterReady";
import { FaasPhotoImage } from "@/components/faas/FaasPhotoImage";

type PhotoType = "machinery_photo" | "nameplate" | "purchase_receipt" | "other_document";
type PhotoRecord = FaasPhotoRecord<PhotoType>;

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

function PhotoAttachmentPages({
  photos,
  onImageDone,
}: {
  photos: PhotoRecord[];
  onImageDone: () => void;
}) {
  return (
    <>
      {PHOTO_ORDER.map((type) => {
        const photo = photos.find((p) => p.photo_type === type);
        if (!photo?.signedUrl) return null;
        return (
          <div key={photo.id} className="photo-page">
            <p className="photo-page-title">{PHOTO_LABELS[type]}</p>
            <FaasPhotoImage
              signedUrl={photo.signedUrl}
              alt={PHOTO_LABELS[type]}
              mode="print"
              onReady={onImageDone}
            />
            <p className="photo-page-filename">{photo.original_name}</p>
          </div>
        );
      })}
    </>
  );
}

function PrintOnlyPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const includeAttachments = searchParams.get("attachments") !== "0";
  const [data, setData] = useState<MachineryFormData | null>(null);
  const [photosReady, setPhotosReady] = useState(false);
  const loadedRef = useRef(0);
  const footerReady = useFaasPrintFooterReady(Boolean(data));

  const { photos, photosLoading } = useFaasPhotos<PhotoType>({
    draftId: includeAttachments ? id : null,
    apiPath: "/api/faas/machinery/photos",
    parentIdQueryParam: "machineryId",
  });

  const printablePhotos = photos.filter((photo) => photo.signedUrl);

  useEffect(() => {
    loadedRef.current = 0;
    setPhotosReady(!photosLoading && printablePhotos.length === 0);
  }, [photosLoading, printablePhotos.length]);

  const markOneImageDone = useCallback(() => {
    loadedRef.current += 1;
    if (loadedRef.current >= printablePhotos.length) {
      setPhotosReady(true);
    }
  }, [printablePhotos.length]);

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
        <PhotoAttachmentPages photos={printablePhotos} onImageDone={markOneImageDone} />
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

"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BuildingStructureForm from "@/app/components/forms/RPFAAS/building_structure_form";

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

interface PhotoRecord {
  id: string;
  photo_type: PhotoType;
  storage_path: string;
  original_name: string;
  signedUrl: string | null;
  note?: string | null;
}

// ---------------------------------------------------------------------------
// Photo attachment page component (one per photo)
// ---------------------------------------------------------------------------

interface PhotoPageProps {
  photo: PhotoRecord;
  onLoad: () => void;
  onError: () => void;
}

function PhotoAttachmentPage({ photo, onLoad, onError }: PhotoPageProps) {
  const [isLandscape, setIsLandscape] = useState(false);
  const label = PHOTO_LABELS[photo.photo_type] ?? photo.photo_type;

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setIsLandscape(img.naturalWidth > img.naturalHeight);
      onLoad();
    },
    [onLoad]
  );

  return (
    <div
      className={isLandscape ? "photo-attachment-page landscape" : "photo-attachment-page"}
      style={{ pageBreakBefore: "always" }}
    >
      <p style={{ fontFamily: "Arial, sans-serif", fontSize: "11pt", fontWeight: "bold", marginBottom: "6mm" }}>
        {label}
      </p>
      {photo.signedUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.signedUrl}
          alt={label}
          onLoad={handleLoad}
          onError={onError}
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: isLandscape ? "160mm" : "220mm",
            objectFit: "contain",
            margin: "0 auto",
          }}
        />
      )}
      {photo.note && (
        <p
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "10pt",
            marginTop: "5mm",
            fontStyle: "italic",
            color: "#444",
          }}
        >
          {photo.note}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main print-only page
// ---------------------------------------------------------------------------

function PrintOnlyPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [data, setData] = useState<any>(null);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [photosReady, setPhotosReady] = useState(false);

  // Count images that have finished (loaded or errored) so we know when all are done
  const loadedRef = useRef(0);
  const totalRef = useRef(0);

  const markOneImageDone = useCallback(() => {
    loadedRef.current += 1;
    if (loadedRef.current >= totalRef.current) {
      setPhotosReady(true);
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    // Fetch form data
    fetch(`/api/faas/building-structures/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) setData(result.data);
      })
      .catch(() => {});

    // Fetch photos
    fetch(`/api/faas/building-structures/photos?buildingStructureId=${id}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          const withUrl = (result.data as PhotoRecord[]).filter((p) => p.signedUrl);
          totalRef.current = withUrl.length;
          setPhotos(withUrl);
          // If there are no photos, photos are immediately "ready"
          if (withUrl.length === 0) setPhotosReady(true);
        } else {
          setPhotosReady(true);
        }
      })
      .catch(() => setPhotosReady(true));
  }, [id]);

  // Signal Puppeteer via body attribute — avoids adding a wrapper div to the document flow
  useEffect(() => {
    if (data && photosReady) {
      document.body.setAttribute("data-all-ready", "true");
    }
  }, [data, photosReady]);

  if (!data) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <>
      <style>{`
        html, body { background: white !important; margin: 0; padding: 0; }
        @page landscape-page { size: A4 landscape; margin: 4mm 8mm; }
        .photo-attachment-page { padding: 4mm 8mm 0 8mm; }
        .photo-attachment-page.landscape { page: landscape-page; }
      `}</style>

      {/* Main RPFAAS form — sets data-print-ready internally */}
      <div style={{ background: "white", padding: "3mm" }}>
        <BuildingStructureForm serverData={data} />
      </div>

      {/* Photo attachment pages */}
      {photos.map((photo) => (
        <PhotoAttachmentPage
          key={photo.id}
          photo={photo}
          onLoad={markOneImageDone}
          onError={markOneImageDone}
        />
      ))}
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

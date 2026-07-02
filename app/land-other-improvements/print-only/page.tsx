"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LandImprovementForm from "@/app/components/forms/RPFAAS/land_improvement_form";
import { type FaasPhotoRecord, useFaasPhotos } from "@/hooks/useFaasPhotos";
import { useFaasPrintFooterReady } from "@/hooks/useFaasPrintFooterReady";
import { FaasPhotoImage } from "@/components/faas/FaasPhotoImage";

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

type PhotoRecord = FaasPhotoRecord<PhotoType>;

const PHOTO_LABELS: Record<PhotoType, string> = {
  barangay_certificate: "Barangay Certificate",
  ncip_certificate: "NCIP Certificate",
  sketch_plan: "Sketch Plan",
  affidavit_of_ownership: "Affidavit of Ownership",
  endorsement_of_assessor: "Endorsement of Assessor",
  tax_declaration: "Tax Declaration",
  survey_plan: "Survey Plan",
  letter_request: "Letter Request",
  deed_of_sale: "Deed of Sale",
  deed_of_donation: "Deed of Donation",
  extra_judicial_settlement: "Extra Judicial Settlement",
  bir_certificate: "Certificate of Authorizing Registration (BIR)",
  inspection_report: "Inspection Report",
};

const PHOTO_ORDER: PhotoType[] = [
  "barangay_certificate",
  "ncip_certificate",
  "sketch_plan",
  "affidavit_of_ownership",
  "endorsement_of_assessor",
  "tax_declaration",
  "survey_plan",
  "letter_request",
  "deed_of_sale",
  "deed_of_donation",
  "extra_judicial_settlement",
  "bir_certificate",
  "inspection_report",
];

const LANDSCAPE_PLAN_TYPES: PhotoType[] = ["sketch_plan", "survey_plan"];

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
        const isLandscapePlan = LANDSCAPE_PLAN_TYPES.includes(type);
        return (
          <div key={photo.id} className={isLandscapePlan ? "photo-page plan-landscape" : "photo-page"}>
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
  const [data, setData] = useState<any>(null);
  const [photosReady, setPhotosReady] = useState(false);
  const loadedRef = useRef(0);
  const footerReady = useFaasPrintFooterReady(Boolean(data));

  const { photos, photosLoading } = useFaasPhotos<PhotoType>({
    draftId: includeAttachments ? id : null,
    apiPath: "/api/faas/land-improvements/photos",
    parentIdQueryParam: "landImprovementId",
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
    fetch(`/api/faas/land-improvements/${id}`, { cache: "no-store" })
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
        <LandImprovementForm data={data} />
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

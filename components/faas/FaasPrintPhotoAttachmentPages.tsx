"use client";

import { FaasPhotoImage } from "@/components/faas/FaasPhotoImage";

export interface PrintableFaasPhoto<TPhotoType extends string = string> {
  id: string;
  photo_type: TPhotoType;
  original_name: string;
  signedUrl: string | null;
  note?: string | null;
}

interface FaasPrintPhotoAttachmentPagesProps<TPhotoType extends string> {
  photos: PrintableFaasPhoto<TPhotoType>[];
  photoOrder: readonly TPhotoType[];
  photoLabels: Record<TPhotoType, string>;
  landscapeTypes?: readonly TPhotoType[];
  onPhotoReady: () => void;
  variant?: "standard" | "building";
  showFilename?: boolean;
  showNote?: boolean;
}

export function FaasPrintPhotoAttachmentPages<TPhotoType extends string>({
  photos,
  photoOrder,
  photoLabels,
  landscapeTypes = [],
  onPhotoReady,
  variant = "standard",
  showFilename = true,
  showNote = false,
}: FaasPrintPhotoAttachmentPagesProps<TPhotoType>) {
  return (
    <>
      {photoOrder.map((type) => {
        const photo = photos.find((item) => item.photo_type === type);
        if (!photo?.signedUrl) return null;

        const label = photoLabels[type] ?? type;
        const isLandscape = landscapeTypes.includes(type);

        if (variant === "building") {
          return (
            <div
              key={photo.id}
              className={isLandscape ? "photo-attachment-page plan-landscape" : "photo-attachment-page"}
              style={{ pageBreakBefore: "always" }}
            >
              <p style={{ fontFamily: "Arial, sans-serif", fontSize: "11pt", fontWeight: "bold", marginBottom: "6mm" }}>
                {label}
              </p>
              <FaasPhotoImage
                signedUrl={photo.signedUrl}
                alt={label}
                mode="print"
                onReady={onPhotoReady}
                style={{
                  display: "block",
                  width: "auto",
                  height: "auto",
                  maxWidth: isLandscape ? "275mm" : "180mm",
                  maxHeight: isLandscape ? "165mm" : "240mm",
                  objectFit: "contain",
                  margin: "0 auto",
                }}
              />
              {showNote && photo.note && (
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

        return (
          <div key={photo.id} className={isLandscape ? "photo-page plan-landscape" : "photo-page"}>
            <p className="photo-page-title">{label}</p>
            <FaasPhotoImage
              signedUrl={photo.signedUrl}
              alt={label}
              mode="print"
              onReady={onPhotoReady}
            />
            {showFilename && <p className="photo-page-filename">{photo.original_name}</p>}
            {showNote && photo.note && <p className="photo-page-filename">{photo.note}</p>}
          </div>
        );
      })}
    </>
  );
}

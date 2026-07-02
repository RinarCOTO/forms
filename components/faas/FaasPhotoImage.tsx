"use client";

import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { toPreviewImageUrl, toPrintImageUrl } from "@/utils/faas-photo-urls";

type FaasPhotoImageProps = {
  signedUrl: string;
  alt: string;
  mode: "preview" | "print";
  className?: string;
  style?: CSSProperties;
  onReady?: () => void;
};

export function FaasPhotoImage({
  signedUrl,
  alt,
  mode,
  className,
  style,
  onReady,
}: FaasPhotoImageProps) {
  const preferredUrl = mode === "print"
    ? toPrintImageUrl(signedUrl)
    : toPreviewImageUrl(signedUrl);
  const [src, setSrc] = useState(preferredUrl);
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = false;
    setSrc(preferredUrl);
  }, [preferredUrl]);

  const markReady = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    onReady?.();
  }, [onReady]);

  const handleError = useCallback(() => {
    if (src !== signedUrl) {
      setSrc(signedUrl);
      return;
    }
    markReady();
  }, [markReady, signedUrl, src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onLoad={markReady}
      onError={handleError}
    />
  );
}

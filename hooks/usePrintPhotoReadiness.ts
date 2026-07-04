"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function usePrintPhotoReadiness({
  photoCount,
  loading = false,
}: {
  photoCount: number;
  loading?: boolean;
}) {
  const loadedRef = useRef(0);
  const [photosReady, setPhotosReady] = useState(false);

  useEffect(() => {
    loadedRef.current = 0;
    setPhotosReady(!loading && photoCount === 0);
  }, [loading, photoCount]);

  const markPhotoReady = useCallback(() => {
    loadedRef.current += 1;
    if (loadedRef.current >= photoCount) {
      setPhotosReady(true);
    }
  }, [photoCount]);

  return { markPhotoReady, photosReady };
}

"use client";

import { useEffect, useState } from "react";

export interface FaasPhotoRecord<TPhotoType extends string = string> {
  id: string;
  photo_type: TPhotoType;
  storage_path: string;
  original_name: string;
  signedUrl: string | null;
}

interface UseFaasPhotosOptions {
  draftId: string | null | undefined;
  apiPath: string;
  parentIdQueryParam: string;
}

export function useFaasPhotos<TPhotoType extends string = string>({
  draftId,
  apiPath,
  parentIdQueryParam,
}: UseFaasPhotosOptions) {
  const [photos, setPhotos] = useState<FaasPhotoRecord<TPhotoType>[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  useEffect(() => {
    if (!draftId) {
      setPhotos([]);
      return;
    }

    let cancelled = false;
    setPhotosLoading(true);

    const params = new URLSearchParams({ [parentIdQueryParam]: draftId });

    fetch(`${apiPath}?${params.toString()}`)
      .then((response) => response.json())
      .then((result) => {
        if (!cancelled && result.success) {
          setPhotos(result.data as FaasPhotoRecord<TPhotoType>[]);
        }
      })
      .catch(() => {
        if (!cancelled) setPhotos([]);
      })
      .finally(() => {
        if (!cancelled) setPhotosLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiPath, draftId, parentIdQueryParam]);

  return { photos, photosLoading };
}

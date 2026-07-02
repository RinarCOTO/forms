"use client";

import { useEffect, useState } from "react";
import { seedBuildingStructureDraftStorage } from "@/utils/form-draft-storage";

interface UseBuildingStructurePreviewDataOptions {
  draftId: string | null | undefined;
  isPrintMode: boolean;
}

export function useBuildingStructurePreviewData({
  draftId,
  isPrintMode,
}: UseBuildingStructurePreviewDataOptions) {
  const [formStatus, setFormStatus] = useState<string>("draft");
  const [statusLoading, setStatusLoading] = useState(false);
  const [formDataReady, setFormDataReady] = useState(false);
  const [dbRecord, setDbRecord] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!draftId) {
      setFormDataReady(true);
      return;
    }

    let cancelled = false;
    setStatusLoading(true);

    fetch(`/api/faas/building-structures/${draftId}`)
      .then((response) => response.json())
      .then((result) => {
        if (cancelled || !result.success || !result.data) return;

        const record = result.data;
        setDbRecord(record);
        if (record.status) setFormStatus(record.status);

        seedBuildingStructureDraftStorage(localStorage, record, String(draftId));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setStatusLoading(false);
          setFormDataReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draftId, isPrintMode]);

  return {
    dbRecord,
    formDataReady,
    formStatus,
    statusLoading,
  };
}

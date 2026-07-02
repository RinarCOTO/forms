"use client";

import { useEffect, useState } from "react";
import type { MachineryFormData } from "@/app/components/forms/RPFAAS/machinery";

interface UseMachineryPreviewDataOptions {
  draftId: string | null | undefined;
}

export function useMachineryPreviewData({
  draftId,
}: UseMachineryPreviewDataOptions) {
  const [formStatus, setFormStatus] = useState("draft");
  const [statusLoading, setStatusLoading] = useState(false);
  const [formData, setFormData] = useState<MachineryFormData | null>(null);

  useEffect(() => {
    if (!draftId) return;

    let cancelled = false;
    setStatusLoading(true);

    fetch(`/api/faas/machinery/${draftId}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (cancelled || !result.success || !result.data) return;

        setFormData(result.data as MachineryFormData);
        if (result.data.status) setFormStatus(result.data.status);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [draftId]);

  return {
    formData,
    formStatus,
    statusLoading,
  };
}

"use client";

import { useEffect, useState } from "react";
import { mergeLandPreviewStorageFallbacks } from "@/utils/form-draft-storage";

export interface LandImprovementPreviewData {
  id: number;
  status: string;
  transaction_code?: string;
  arp_no?: string;
  oct_tct_cloa_no?: string;
  pin?: string;
  survey_no?: string;
  lot_no?: string;
  blk?: string;
  previous_td_no?: string;
  previous_owner?: string;
  owner_name?: string;
  admin_care_of?: string;
  owner_address?: string;
  admin_address?: string;
  property_address?: string;
  location_province?: string;
  location_municipality?: string;
  location_barangay?: string;
  north_property?: string;
  south_property?: string;
  east_property?: string;
  west_property?: string;
  classification?: string;
  sub_classification?: string;
  land_class?: string;
  unit_value?: string | number;
  land_area?: string | number;
  base_market_value?: string | number;
  additional_flat_rate_choice?: string;
  market_value?: string | number;
  actual_use?: string;
  tax_status?: string;
  assessment_level?: string | number;
  assessed_value?: string | number;
  amount_in_words?: string;
  effectivity_of_assessment?: string;
  appraised_by?: string;
  memoranda?: string;
}

interface UseLandImprovementPreviewDataOptions {
  draftId: string | null | undefined;
}

export function useLandImprovementPreviewData({
  draftId,
}: UseLandImprovementPreviewDataOptions) {
  const [formStatus, setFormStatus] = useState<string>("draft");
  const [statusLoading, setStatusLoading] = useState(false);
  const [data, setData] = useState<LandImprovementPreviewData | null>(null);

  useEffect(() => {
    if (!draftId) return;

    let cancelled = false;
    setStatusLoading(true);

    fetch(`/api/faas/land-improvements/${draftId}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (cancelled || !result.success || !result.data) return;

        const dbData = result.data;
        const merged = mergeLandPreviewStorageFallbacks(dbData, localStorage);
        setData(merged as LandImprovementPreviewData);
        if (dbData.status) setFormStatus(dbData.status);
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
    data,
    formStatus,
    statusLoading,
  };
}

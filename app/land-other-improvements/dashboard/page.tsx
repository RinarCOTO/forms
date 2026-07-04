"use client"

import { FaasDashboard, type FaasDashboardConfig } from "@/components/faas/FaasDashboard";
import { getFaasRealtimeTopic } from "@/lib/faas/workflow";

const config: FaasDashboardConfig = {
  label: "Land & Other Improvements",
  breadcrumbHref: "/land-other-improvements/dashboard",
  apiPath: "/api/faas/land-improvements",
  fillPath: "/land-other-improvements/fill/step-1",
  previewPath: "/land-other-improvements/fill/preview-form",
  printPreviewPath: "/land-other-improvements/print-preview",
  municipalityField: "location_municipality",
  hasBarangay: true,
  hasMunicipalAssessor: false,
  realtimeChannel: getFaasRealtimeTopic("land_improvements"),
  realtimeFormTypeFilter: "land",
  canDeleteStatuses: ['draft', 'returned'],
};

export default function LandOtherImprovementsDashboard() {
  return <FaasDashboard config={config} />;
}

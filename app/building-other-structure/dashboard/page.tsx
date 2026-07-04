"use client"

import { FaasDashboard, type FaasDashboardConfig } from "@/components/faas/FaasDashboard";
import { getFaasRealtimeTopic } from "@/lib/faas/workflow";

const config: FaasDashboardConfig = {
  label: "Building & Structures",
  breadcrumbHref: "/building-other-structure/dashboard",
  apiPath: "/api/faas/building-structures",
  fillPath: "/building-other-structure/fill/step-1",
  previewPath: "/building-other-structure/fill/preview-form",
  printPreviewPath: "/building-other-structure/print-preview",
  printApiPath: "/api/print/building-structures",
  exportFilenamePrefix: "RPFAAS-Building_",
  municipalityField: "location_municipality",
  hasBarangay: true,
  hasMunicipalAssessor: true,
  realtimeChannel: getFaasRealtimeTopic("building_structures"),
  canDeleteStatuses: ['draft', 'returned'],
};

export default function BuildingOtherStructureDashboard() {
  return <FaasDashboard config={config} />;
}

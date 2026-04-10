"use client"

import { FaasDashboard, type FaasDashboardConfig } from "@/components/faas/FaasDashboard";

const config: FaasDashboardConfig = {
  label: "Machinery",
  apiPath: "/api/faas/machinery",
  fillPath: "/machinery/fill/step-1",
  municipalityField: "municipality",
  hasBarangay: false,
  hasMunicipalAssessor: false,
  canDeleteStatuses: ['draft', 'returned'],
};

export default function MachineryDashboard() {
  return <FaasDashboard config={config} />;
}

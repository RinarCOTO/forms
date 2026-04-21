"use client";

import BuildingStructureForm from "@/app/components/forms/RPFAAS/building_structure_form";

interface Props {
  serverData: Record<string, any>;
}

export default function ReviewFaasOverlay({ serverData }: Props) {
  return (
    <div className="relative overflow-auto h-full bg-white" style={{ padding: "12px 16px" }}>
      <BuildingStructureForm serverData={serverData} />
    </div>
  );
}
